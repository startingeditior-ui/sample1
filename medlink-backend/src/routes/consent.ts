import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { emitToPatient, emitToHospital } from '../services/socket';
import { createAuditLog } from '../services/auditLog';
import { sendOTP } from '../services/sms';

const router = Router();
const prisma = new PrismaClient();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.get('/pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;
    
    const pendingRequests = await prisma.consentRequest.findMany({
      where: {
        patientId: patientId,
        status: 'PENDING'
      },
      include: {
        doctor: {
          include: {
            specialization: true
          }
        },
        hospital: true
      },
      orderBy: { requestTime: 'desc' }
    });

    const formattedRequests = pendingRequests.map(req => ({
      id: req.id,
      patientId: req.patientId,
      doctorId: req.doctorId,
      doctorName: req.doctor.name,
      hospitalName: req.hospital.name,
      specialization: req.doctor.specialization?.name || null,
      requestTime: req.requestTime.toISOString(),
      recordsRequested: JSON.parse(req.recordsRequested),
      status: req.status.toLowerCase(),
      duration: req.duration
    }));

    res.json({ consentRequests: formattedRequests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

router.post('/send-otp', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const otpHash = await bcrypt.hash(otp, 10);

    await prisma.verificationOTP.create({
      data: {
        patientId,
        target: patient.user.phone,
        type: 'PHONE',
        otpHash,
        expiresAt
      }
    });

    const normalizedPhone = patient.user.phone.replace(/\s/g, '');
    await sendOTP(normalizedPhone, otp);

    res.json({ message: 'OTP sent successfully', expiresIn: 300 });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/request', [
  authMiddleware,
  body('patientId').isString(),
  body('doctorId').isString(),
  body('hospitalId').isString(),
  body('recordsRequested').isArray(),
  body('duration').optional().isInt({ min: 1, max: 48 })
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { patientId, doctorId, hospitalId, recordsRequested, duration } = req.body;

    const consentRequest = await prisma.consentRequest.create({
      data: {
        patientId,
        doctorId,
        hospitalId,
        recordsRequested: JSON.stringify(recordsRequested),
        duration: duration || 24,
        status: 'PENDING'
      },
      include: {
        doctor: true,
        hospital: true
      }
    });

    const notification = await prisma.notification.create({
      data: {
        patientId,
        type: 'CONSENT_REQUEST',
        title: 'New Access Request',
        message: `${consentRequest.doctor.name} from ${consentRequest.hospital.name} is requesting access to your medical records.`,
        doctorName: consentRequest.doctor.name,
        hospitalName: consentRequest.hospital.name
      }
    });

    emitToPatient(patientId, 'consent:new-request', {
      request: { ...consentRequest, recordsRequested },
      notification
    });

    emitToHospital(hospitalId, 'consent:request-created', {
      request: consentRequest
    });

    await createAuditLog({
      patientId,
      doctorId,
      hospitalId,
      action: 'CONSENT_REQUESTED',
      description: `Consent request created for patient`,
      metadata: { recordsRequested, duration }
    });

    res.json({ 
      message: 'Access request sent to patient',
      consentRequest: consentRequest
    });
  } catch (error) {
    console.error('Error creating consent request:', error);
    res.status(500).json({ error: 'Failed to create consent request' });
  }
});

router.post('/:requestId/approve', [
  authMiddleware,
  body('otp').isLength({ min: 6, max: 6 }),
  body('duration').optional().isInt({ min: 1, max: 48 })
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { requestId } = req.params;
    const { otp, duration } = req.body;
    const patientId = req.patientId!;

    // Find recent pending OTPs and bcrypt-compare
    const pendingOTPs = await prisma.verificationOTP.findMany({
      where: {
        patientId,
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    let validOTP: any = null;
    for (const record of pendingOTPs) {
      const match = await bcrypt.compare(otp, record.otpHash);
      if (match) {
        validOTP = record;
        break;
      }
    }

    if (!validOTP) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await prisma.verificationOTP.update({
      where: { id: validOTP.id },
      data: { verified: true }
    });

    const consentRequest = await prisma.consentRequest.findUnique({
      where: { id: requestId },
      include: { doctor: { include: { specialization: true } }, hospital: true }
    });

    if (!consentRequest) {
      return res.status(404).json({ error: 'Consent request not found' });
    }

    const requestedDuration = duration || consentRequest.duration;
    const accessDuration = Math.min(requestedDuration, 8);
    const accessStartTime = new Date();
    const accessExpiryTime = new Date(accessStartTime.getTime() + accessDuration * 60 * 60 * 1000);

    await prisma.consentRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        responseTime: new Date()
      }
    });

    const accessRecord = await prisma.accessRecord.create({
      data: {
        patientId,
        doctorId: consentRequest.doctorId,
        hospitalId: consentRequest.hospitalId,
        accessStartTime,
        accessExpiryTime,
        recordsViewed: consentRequest.recordsRequested,
        status: 'ACTIVE'
      }
    });

    const notification = await prisma.notification.create({
      data: {
        patientId,
        type: 'ACCESS_GRANTED',
        title: 'Access Granted',
        message: `You have granted access to ${consentRequest.doctor.name} from ${consentRequest.hospital.name} for ${accessDuration} hours.`,
        doctorName: consentRequest.doctor.name,
        hospitalName: consentRequest.hospital.name,
        accessTime: accessExpiryTime
      }
    });

    emitToPatient(patientId, 'consent:approved', {
      consentRequest,
      accessRecord,
      notification
    });

    emitToHospital(consentRequest.hospitalId, 'consent:approved', {
      consentRequest,
      accessRecord
    });

    await createAuditLog({
      patientId,
      doctorId: consentRequest.doctorId,
      hospitalId: consentRequest.hospitalId,
      action: 'CONSENT_APPROVED',
      description: `Consent request approved for ${accessDuration} hours`,
      metadata: { accessDuration, recordsRequested: consentRequest.recordsRequested }
    });

    res.json({ 
      message: 'Access granted successfully',
      accessDuration,
      accessRecord
    });
  } catch (error) {
    console.error('Error approving consent:', error);
    res.status(500).json({ error: 'Failed to approve consent' });
  }
});

router.post('/:requestId/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const patientId = req.patientId!;

    const consentRequest = await prisma.consentRequest.findUnique({
      where: { id: requestId },
      include: { doctor: { include: { specialization: true } }, hospital: true }
    });

    if (!consentRequest) {
      return res.status(404).json({ error: 'Consent request not found' });
    }

    await prisma.consentRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        responseTime: new Date()
      }
    });

    const notification = await prisma.notification.create({
      data: {
        patientId,
        type: 'CONSENT_REJECTED',
        title: 'Access Request Rejected',
        message: `You have rejected the access request from ${consentRequest.doctor.name} from ${consentRequest.hospital.name}.`,
        doctorName: consentRequest.doctor.name,
        hospitalName: consentRequest.hospital.name
      }
    });

    emitToPatient(patientId, 'consent:rejected', {
      consentRequest,
      notification
    });

    emitToHospital(consentRequest.hospitalId, 'consent:rejected', {
      consentRequest
    });

    await createAuditLog({
      patientId,
      doctorId: consentRequest.doctorId,
      hospitalId: consentRequest.hospitalId,
      action: 'CONSENT_REJECTED',
      description: `Consent request rejected`
    });

    res.json({ message: 'Access request rejected' });
  } catch (error) {
    console.error('Error rejecting consent:', error);
    res.status(500).json({ error: 'Failed to reject consent' });
  }
});

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;

    const history = await prisma.consentRequest.findMany({
      where: { patientId },
      include: {
        doctor: true,
        hospital: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ consentRequests: history });
  } catch (error) {
    console.error('Error fetching consent history:', error);
    res.status(500).json({ error: 'Failed to fetch consent history' });
  }
});

export default router;
