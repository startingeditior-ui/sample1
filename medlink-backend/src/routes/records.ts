import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { emitToPatient } from '../services/socket';
import { createAuditLog } from '../services/auditLog';

const router = Router();
const prisma = new PrismaClient();

router.get('/types', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recordTypes = await prisma.medicalRecordType.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ recordTypes });
  } catch (error) {
    console.error('Error fetching record types:', error);
    res.status(500).json({ error: 'Failed to fetch record types' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.patientId!;
    const { typeId, hospitalId, doctorId, search, startDate, endDate, limit = 50, offset = 0 } = req.query;

    const where: any = { patientId };

    if (typeId) {
      where.recordTypeId = typeId as string;
    }
    if (hospitalId) {
      where.hospitalId = hospitalId as string;
    }
    if (doctorId) {
      where.doctorId = doctorId as string;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const records = await prisma.patientRecord.findMany({
      where,
      include: {
        recordType: true,
        hospital: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
      },
      orderBy: { date: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.patientRecord.count({ where });

    res.json({
      records: records.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        fileUrl: r.fileUrl,
        date: r.date.toISOString(),
        hospitalId: r.hospitalId,
        hospitalName: r.hospital?.name,
        doctorId: r.doctorId,
        doctorName: r.doctor?.name,
        doctorSpecialization: r.doctor?.specialization?.name,
        recordType: r.recordType,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = req.patientId!;

    const record = await prisma.patientRecord.findFirst({
      where: { id, patientId },
      include: {
        recordType: true,
        hospital: true,
        doctor: { include: { specialization: true } },
      },
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({
      record: {
        id: record.id,
        title: record.title,
        description: record.description,
        fileUrl: record.fileUrl,
        date: record.date.toISOString(),
        hospitalId: record.hospitalId,
        hospital: record.hospital,
        doctorId: record.doctorId,
        doctor: record.doctor,
        recordType: record.recordType,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

router.post('/', [
  authMiddleware,
  body('recordTypeId').isString(),
  body('title').isString(),
  body('date').isISO8601(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const patientId = req.patientId!;
    const { recordTypeId, title, description, fileUrl, date, hospitalId, doctorId } = req.body;

    const record = await prisma.patientRecord.create({
      data: {
        patientId,
        recordTypeId,
        title,
        description,
        fileUrl,
        date: new Date(date),
        hospitalId,
        doctorId,
      },
      include: {
        recordType: true,
        hospital: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    emitToPatient(patientId, 'record:added', { record });

    await createAuditLog({
      patientId,
      action: 'RECORD_ADDED',
      description: `Added new medical record: ${title}`,
      metadata: { recordId: record.id, recordType: record.recordType.name }
    });

    res.json({
      record: {
        id: record.id,
        title: record.title,
        description: record.description,
        fileUrl: record.fileUrl,
        date: record.date.toISOString(),
        hospitalId: record.hospitalId,
        hospitalName: record.hospital?.name,
        doctorId: record.doctorId,
        doctorName: record.doctor?.name,
        recordType: record.recordType,
        createdAt: record.createdAt.toISOString(),
      },
      message: 'Record added successfully'
    });
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).json({ error: 'Failed to add record' });
  }
});

router.put('/:id', [
  authMiddleware,
  body('title').optional().isString(),
  body('description').optional().isString(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const patientId = req.patientId!;
    const { title, description, fileUrl, date, hospitalId, doctorId, recordTypeId } = req.body;

    const existing = await prisma.patientRecord.findFirst({
      where: { id, patientId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const record = await prisma.patientRecord.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(date && { date: new Date(date) }),
        ...(hospitalId !== undefined && { hospitalId }),
        ...(doctorId !== undefined && { doctorId }),
        ...(recordTypeId && { recordTypeId }),
      },
      include: {
        recordType: true,
        hospital: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    emitToPatient(patientId, 'record:updated', { record });

    await createAuditLog({
      patientId,
      action: 'RECORD_UPDATED',
      description: `Updated medical record: ${title}`,
      metadata: { recordId: record.id }
    });

    res.json({
      record: {
        id: record.id,
        title: record.title,
        description: record.description,
        fileUrl: record.fileUrl,
        date: record.date.toISOString(),
        hospitalId: record.hospitalId,
        hospitalName: record.hospital?.name,
        doctorId: record.doctorId,
        doctorName: record.doctor?.name,
        recordType: record.recordType,
        updatedAt: record.updatedAt.toISOString(),
      },
      message: 'Record updated successfully'
    });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = req.patientId!;

    const existing = await prisma.patientRecord.findFirst({
      where: { id, patientId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await prisma.patientRecord.delete({
      where: { id },
    });

    emitToPatient(patientId, 'record:deleted', { recordId: id });

    await createAuditLog({
      patientId,
      action: 'RECORD_DELETED',
      description: `Deleted medical record: ${existing.title}`,
      metadata: { recordId: id }
    });

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

export default router;
