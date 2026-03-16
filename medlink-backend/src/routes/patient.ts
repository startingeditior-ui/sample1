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
        patientId: true,
        name: true,
        phone: true,
        email: true,
        bloodGroup: true,
        allergies: true,
        chronicDiseases: true,
        emergencyContact: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        profilePhoto: true,
        createdAt: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ 
      patient: {
        ...patient,
        allergies: JSON.parse(patient.allergies || '[]'),
        chronicDiseases: JSON.parse(patient.chronicDiseases || '[]'),
        dateOfBirth: patient.dateOfBirth?.toISOString().split('T')[0]
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
  body('email').optional().isEmail(),
  body('bloodGroup').optional().isString(),
  body('allergies').optional().isArray(),
  body('chronicDiseases').optional().isArray(),
  body('emergencyContact').optional().isString(),
  body('address').optional().isString()
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const patientId = req.patientId!;
    const updates = req.body;

    const updateData: any = { ...updates };
    
    if (updates.allergies) {
      updateData.allergies = JSON.stringify(updates.allergies);
    }
    if (updates.chronicDiseases) {
      updateData.chronicDiseases = JSON.stringify(updates.chronicDiseases);
    }

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData
    });

    emitToPatient(patientId, 'profile:updated', {
      patient: {
        ...patient,
        allergies: JSON.parse(patient.allergies || '[]'),
        chronicDiseases: JSON.parse(patient.chronicDiseases || '[]')
      }
    });

    await createAuditLog({
      patientId,
      action: 'PROFILE_UPDATED',
      description: 'Patient profile updated',
      metadata: { updatedFields: Object.keys(updates) }
    });

    res.json({ 
      patient: {
        ...patient,
        allergies: JSON.parse(patient.allergies || '[]'),
        chronicDiseases: JSON.parse(patient.chronicDiseases || '[]')
      }, 
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
      allergies: JSON.parse(patient.allergies || '[]'),
      chronicDiseases: JSON.parse(patient.chronicDiseases || '[]'),
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

    const logs = await prisma.auditLog.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        doctor: { select: { name: true } },
        hospital: { select: { name: true } }
      }
    });

    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      description: log.description,
      doctorName: log.doctor?.name,
      hospitalName: log.hospital?.name,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
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
        email: true,
        patientId: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.email) {
      return res.status(400).json({ error: 'Patient email not found' });
    }

    const emailSent = await sendWelcomeEmail(patient.email, patient.name, patient.patientId);

    if (emailSent) {
      await createAuditLog({
        patientId,
        action: 'WELCOME_EMAIL_SENT',
        description: `Welcome email sent to ${patient.email}`
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
    const { patientId: patientIdInput } = req.body;
    
    if (!patientIdInput) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const patient = await prisma.patient.findUnique({
      where: { patientId: patientIdInput.toUpperCase() },
      select: {
        id: true,
        name: true,
        email: true,
        patientId: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.email) {
      return res.status(400).json({ error: 'Patient email not found' });
    }

    const emailSent = await sendWelcomeEmail(patient.email, patient.name, patient.patientId);

    if (emailSent) {
      await createAuditLog({
        patientId: patient.id,
        action: 'WELCOME_EMAIL_SENT',
        description: `Welcome email sent to ${patient.email}`
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
