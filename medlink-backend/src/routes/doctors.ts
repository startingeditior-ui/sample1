import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { specializationId, hospitalId, search, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (specializationId) {
      where.specializationId = specializationId as string;
    }
    if (hospitalId) {
      where.hospitalId = hospitalId as string;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        specialization: true,
        hospital: { select: { id: true, name: true, address: true, phone: true } },
      },
      orderBy: { name: 'asc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.doctor.count({ where });

    res.json({
      doctors: doctors.map(d => ({
        id: d.id,
        name: d.name,
        specializationId: d.specializationId,
        specialization: d.specialization?.name,
        hospitalId: d.hospitalId,
        hospitalName: d.hospital?.name,
        hospitalAddress: d.hospital?.address,
        hospitalPhone: d.hospital?.phone,
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.get('/specializations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const specializations = await prisma.specialization.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
    });

    res.json({
      specializations: specializations.map(s => ({
        id: s.id,
        name: s.name,
        doctorCount: s._count.doctors,
      })),
    });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({ error: 'Failed to fetch specializations' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        specialization: true,
        hospital: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specializationId: doctor.specializationId,
        specialization: doctor.specialization?.name,
        hospitalId: doctor.hospitalId,
        hospital: doctor.hospital,
      }
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

export default router;
