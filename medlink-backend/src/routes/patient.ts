import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { emitToPatient } from '../services/socket';
import { createAuditLog } from '../services/auditLog';
import { sendWelcomeEmail } from '../services/email';

const router = Router();
const prisma = new PrismaClient();

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;
    
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        patientCode: true,
        name: true,
        bloodGroup: true,
        allergies: true,
        chronicDiseases: true,
        emergencyContact: true,
        guardianName: true,
        guardianMobile: true,
        guardianLocation: true,
        dob: true,
        gender: true,
        address: true,
        photoUrl: true,
        insuranceProvider: true,
        insuranceCustomerId: true,
        insuranceType: true,
        insuranceSupportNumber: true,
        createdAt: true,
        user: {
          select: {
            phone: true,
            email: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Resolve photo URL:
    // - http/https → use as-is (already a full URL, e.g. Cloudinary)
    // - data:       → use as-is (base64 image stored by registration frontend)
    // - relative    → prefix with backend base URL (e.g. /uploads/photo.jpg)
    // - null/empty  → null (frontend will show fallback avatar)
    const apiBase = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
    const rawPhoto = patient.photoUrl || null;
    const resolvedPhotoUrl = rawPhoto
      ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:')
          ? rawPhoto
          : `${apiBase}${rawPhoto}`)
      : null;

    res.json({ 
      patient: {
        ...patient,
        phone: patient.user?.phone,
        email: patient.user?.email,
        // Normalize field names to frontend conventions
        patientId: patient.patientCode,           // FE uses patientId to display the code
        dateOfBirth: patient.dob ? patient.dob.toISOString().split('T')[0] : null,
        profilePhoto: resolvedPhotoUrl,
        // Keep originals for backward compat but ensure normalized names are present
        dob: patient.dob ? patient.dob.toISOString().split('T')[0] : null,
        photoUrl: resolvedPhotoUrl,
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', [
  authMiddleware,
  body('name').optional().isString(),
  body('bloodGroup').optional().isString(),
  body('allergies').optional().isArray(),
  body('chronicDiseases').optional().isArray(),
  body('emergencyContact').optional().isString(),
  body('guardianName').optional().isString(),
  body('guardianMobile').optional().isString(),
  body('guardianLocation').optional().isString(),
  body('address').optional().isString(),
  body('insuranceProvider').optional().isString(),
  body('insuranceCustomerId').optional().isString(),
  body('insuranceType').optional().isString(),
  body('insuranceSupportNumber').optional().isString()
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const patientId = req.patientId!;
    const updates = req.body;

    // allergies and chronicDiseases are now native String[] — no JSON.stringify needed
    const updateData: any = { ...updates };

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData
    });

    emitToPatient(patientId, 'profile:updated', {
      patient: {
        ...patient
      }
    });

    await createAuditLog({
      patientId,
      action: 'PROFILE_UPDATED',
      description: 'Patient profile updated',
      metadata: { updatedFields: Object.keys(updates) }
    });

    res.json({ 
      patient,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/emergency-data', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;
    
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        bloodGroup: true,
        allergies: true,
        chronicDiseases: true,
        emergencyContact: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,           // already String[]
      chronicDiseases: patient.chronicDiseases, // already String[]
      emergencyContact: patient.emergencyContact
    });
  } catch (error) {
    console.error('Error fetching emergency data:', error);
    res.status(500).json({ error: 'Failed to fetch emergency data' });
  }
});

router.get('/audit-logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;
    const limit = parseInt(req.query.limit as string) || 50;

    // Get the patient's userId to query audit_logs by actorId (cloud schema)
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { userId: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const logs = await prisma.auditLog.findMany({
      where: { actorId: patient.userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      description: log.description ?? null,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString()
    }));

    res.json({ auditLogs: formattedLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.post('/send-welcome-email', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;
    
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        name: true,
        patientCode: true,
        user: { select: { email: true } }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.user?.email) {
      return res.status(400).json({ error: 'Patient email not found' });
    }

    const emailSent = await sendWelcomeEmail(patient.user.email, patient.name, patient.patientCode);

    if (emailSent) {
      await createAuditLog({
        patientId,
        action: 'WELCOME_EMAIL_SENT',
        description: `Welcome email sent to ${patient.user.email}`
      });
      
      res.json({ message: 'Welcome email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send welcome email' });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

router.post('/send-welcome-email-by-id', async (req: AuthRequest, res: Response) => {
  try {
    const { patientId: patientCodeInput } = req.body;
    
    if (!patientCodeInput) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const patient = await prisma.patient.findUnique({
      where: { patientCode: patientCodeInput.toUpperCase() },
      select: {
        id: true,
        name: true,
        patientCode: true,
        user: { select: { email: true } }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.user?.email) {
      return res.status(400).json({ error: 'Patient email not found' });
    }

    const emailSent = await sendWelcomeEmail(patient.user.email, patient.name, patient.patientCode);

    if (emailSent) {
      await createAuditLog({
        patientId: patient.id,
        action: 'WELCOME_EMAIL_SENT',
        description: `Welcome email sent to ${patient.user.email}`
      });
      
      res.json({ message: 'Welcome email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send welcome email' });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

export default router;
