import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { hospitalTypeId, search, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (hospitalTypeId) {
      where.hospitalTypeId = hospitalTypeId as string;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const hospitals = await prisma.hospital.findMany({
      where,
      include: {
        hospitalType: true,
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { name: 'asc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.hospital.count({ where });

    res.json({
      hospitals: hospitals.map(h => ({
        id: h.id,
        name: h.name,
        address: h.address,
        phone: h.phone,
        hospitalTypeId: h.hospitalTypeId,
        hospitalType: h.hospitalType?.name,
        doctorCount: h._count.doctors,
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

router.get('/types', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const hospitalTypes = await prisma.hospitalType.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { hospitals: true },
        },
      },
    });

    res.json({
      hospitalTypes: hospitalTypes.map(ht => ({
        id: ht.id,
        name: ht.name,
        hospitalCount: ht._count.hospitals,
      })),
    });
  } catch (error) {
    console.error('Error fetching hospital types:', error);
    res.status(500).json({ error: 'Failed to fetch hospital types' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        hospitalType: true,
        doctors: {
          include: { specialization: true },
        },
      },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json({
      hospital: {
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone,
        hospitalTypeId: hospital.hospitalTypeId,
        hospitalType: hospital.hospitalType?.name,
        doctors: hospital.doctors.map(d => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization?.name,
        })),
      }
    });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ error: 'Failed to fetch hospital' });
  }
});

export default router;
