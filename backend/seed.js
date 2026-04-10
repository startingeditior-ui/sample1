const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting patient portal seed...');

  // ─── 1. Check if patient user already exists ───────────────────────────────
  const existingUser = await prisma.user.findFirst({
    where: { email: 'kavitha.rajan@test.com' },
  });

  if (existingUser) {
    console.log('Seed already exists (email found), updating photo...');
    await prisma.patient.update({
      where: { patientCode: 'MLPR-20262922' },
      data: { photoUrl: '/uploads/profiles/kavitha-rajan.jpg' },
    });
    console.log('Photo updated successfully!');
    return;
  }

  console.log('Creating new patient user...');

  // ─── 2. Create User ─────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('TestPass123', 10);

  const user = await prisma.user.create({
    email: 'kavitha.rajan@test.com',
    phone: '9000000077',
    passwordHash,
    role: 'PATIENT',
    isActive: true,
    isLocked: false,
    failedLoginAttempts: 0,
  });

  console.log(`User created → id: ${user.id}`);

  // ─── 3. Create Patient ───────────────────────────────────────────────────────
  const patient = await prisma.patient.upsert({
    where: { patientCode: 'MLPR-20262922' },
    update: { photoUrl: '/uploads/profiles/kavitha-rajan.jpg' },
    create: {
      userId:            user.id,
      patientCode:       'MLPR-20262922',
      name:              'Kavitha Rajan',
      phone:             '9000000077',
      gender:            'FEMALE',
      dob:               new Date('1992-07-20'),
      bloodGroup:        'A+',
      allergies:         ['Penicillin', 'Shellfish'],
      chronicDiseases:   ['Hypothyroidism'],
      medications:       ['Thyroxine 75mcg daily'],
      surgeries:         ['Appendectomy (2018)'],
      emergencyContact:  '9000000088',
      emergencyContactName:         'Rajan Kumar',
      emergencyContactRelationship: 'Spouse',
      photoUrl:          '/uploads/profiles/kavitha-rajan.jpg',
      address:           '42, Green Park Colony, Anna Nagar, Chennai - 600040',
      guardianName:      'Lakshmi Rajan',
      guardianMobile:    '9000000099',
      guardianLocation:  'Chennai, Tamil Nadu',
      insuranceProvider: 'Star Health Insurance',
      insuranceCustomerId: 'SHI-2024-785432',
      insuranceType:     'Comprehensive',
      insuranceSupportNumber: '1800-123-4567',
    },
  });

  console.log(`Patient created → patientCode: ${patient.patientCode}`);

  // ─── 4. Create MedicalRecordTypes ──────────────────────────────────────────
  const labType = await prisma.medicalRecordType.upsert({
    where:  { id: 'seed-type-lab' },
    update: {},
    create: {
      id:          'seed-type-lab',
      name:        'Lab Report',
      description: 'Laboratory test results',
      icon:        'lab',
    },
  });

  const prescriptionType = await prisma.medicalRecordType.upsert({
    where:  { id: 'seed-type-prescription' },
    update: {},
    create: {
      id:          'seed-type-prescription',
      name:        'Prescription',
      description: 'Doctor prescription',
      icon:        'prescription',
    },
  });

  const imagingType = await prisma.medicalRecordType.upsert({
    where:  { id: 'seed-type-imaging' },
    update: {},
    create: {
      id:          'seed-type-imaging',
      name:        'Imaging / X-Ray',
      description: 'Radiology and imaging reports',
      icon:        'scan',
    },
  });

  const dischargeType = await prisma.medicalRecordType.upsert({
    where:  { id: 'seed-type-discharge' },
    update: {},
    create: {
      id:          'seed-type-discharge',
      name:        'Discharge Summary',
      description: 'Hospital discharge documents',
      icon:        'file-text',
    },
  });

  const vaccinationType = await prisma.medicalRecordType.upsert({
    where:  { id: 'seed-type-vaccination' },
    update: {},
    create: {
      id:          'seed-type-vaccination',
      name:        'Vaccination Record',
      description: 'Vaccination certificates',
      icon:        'syringe',
    },
  });

  const insuranceType = await prisma.medicalRecordType.upsert({
    where:  { id: 'seed-type-insurance' },
    update: {},
    create: {
      id:          'seed-type-insurance',
      name:        'Insurance Document',
      description: 'Insurance claims and documents',
      icon:        'shield',
    },
  });

  console.log('MedicalRecordTypes upserted.');

  // ─── 5. Create PatientRecords (keeping existing + adding more) ──────────────
  const existingRecords = await prisma.patientRecord.count({
    where: { patientId: patient.id }
  });

  if (existingRecords === 0) {
    // Create original 2 records
    await prisma.patientRecord.createMany({
      data: [
        {
          patientId:    patient.id,
          recordTypeId: labType.id,
          title:        'Blood CBC',
          description:  'All values within normal range. Hemoglobin: 14.2 g/dL, WBC: 7,500/mcL, Platelets: 250,000/mcL',
          fileUrl:      'cbc-blood-test.png',
          date:         new Date('2026-03-18'),
        },
        {
          patientId:    patient.id,
          recordTypeId: prescriptionType.id,
          title:        'Paracetamol 500mg',
          description:  'Take twice daily after food for 5 days. Dr. Anand Kumar, Chennai Med Center.',
          fileUrl:      'prescription-paracetamol.png',
          date:         new Date('2026-03-19'),
        },
      ],
    });
    console.log('Original PatientRecords seeded: 2');
  }

  // Check if we have the additional records already
  const recordCount = await prisma.patientRecord.count({
    where: { patientId: patient.id }
  });

  if (recordCount < 10) {
    // Add additional records
    const additionalRecords = [
      {
        patientId:    patient.id,
        recordTypeId: labType.id,
        title:        'Lipid Profile Test',
        description:  'Total Cholesterol: 195 mg/dL, HDL: 55 mg/dL, LDL: 120 mg/dL, Triglycerides: 140 mg/dL. All within normal range.',
        fileUrl:      'lipid-profile.png',
        date:         new Date('2026-02-15'),
      },
      {
        patientId:    patient.id,
        recordTypeId: labType.id,
        title:        'Thyroid Function Test',
        description:  'TSH: 2.5 mIU/L (Normal), T3: 1.2 ng/mL, T4: 8.5 mcg/dL. Thyroid function normal.',
        fileUrl:      'thyroid-test.png',
        date:         new Date('2026-02-10'),
      },
      {
        patientId:    patient.id,
        recordTypeId: labType.id,
        title:        'HbA1c Diabetes Test',
        description:  'HbA1c: 5.4%. Normal glucose tolerance. No signs of diabetes.',
        fileUrl:      'hba1c-test.png',
        date:         new Date('2026-01-20'),
      },
      {
        patientId:    patient.id,
        recordTypeId: imagingType.id,
        title:        'Chest X-Ray Report',
        description:  'AP View Chest X-Ray. Lung fields clear. Heart size normal. No abnormalities detected.',
        fileUrl:      'xray-chest.png',
        date:         new Date('2026-01-15'),
      },
      {
        patientId:    patient.id,
        recordTypeId: imagingType.id,
        title:        'Abdominal Ultrasound',
        description:  'Liver, Gallbladder, Pancreas, Spleen, Kidneys - all normal. No pathological findings.',
        fileUrl:      'ultrasound-abdomen.png',
        date:         new Date('2025-12-10'),
      },
      {
        patientId:    patient.id,
        recordTypeId: prescriptionType.id,
        title:        'Dr. Mehta - Annual Checkup',
        description:  'Thyroxine 75mcg daily. Repeat thyroid test after 3 months. Continue current medications.',
        fileUrl:      'prescription-dr-mehta.png',
        date:         new Date('2026-02-28'),
      },
      {
        patientId:    patient.id,
        recordTypeId: dischargeType.id,
        title:        'Hospital Discharge Summary',
        description:  'Admitted for viral fever, treated for 3 days. IV fluids and symptomatic treatment given. Discharged in stable condition.',
        fileUrl:      'discharge-summary.png',
        date:         new Date('2025-11-15'),
      },
      {
        patientId:    patient.id,
        recordTypeId: vaccinationType.id,
        title:        'COVID-19 Vaccination Certificate',
        description:  'Covishield Dose 2 completed on 15-Aug-2021 at Chennai GH. Vaccination batch: COVISHIELD-2021.',
        fileUrl:      'vaccination-covid.png',
        date:         new Date('2021-08-15'),
      },
    ];

    await prisma.patientRecord.createMany({
      data: additionalRecords,
    });
    console.log('Additional PatientRecords seeded: 8');
  }

  // ─── 6. Create AuditLog Entries ─────────────────────────────────────────────
  const auditCount = await prisma.auditLog.count({
    where: { actorId: patient.id }
  });

  if (auditCount < 8) {
    await prisma.auditLog.createMany({
      data: [
        {
          actorId:     patient.id,
          actorRole:   'PATIENT',
          action:      'PATIENT_REGISTERED',
          targetId:    patient.id,
          targetType:  'PATIENT',
          description: 'Patient registered via registration portal',
          metadata:    { source: 'seed' },
          createdAt:   new Date('2025-01-10 10:30:00'),
        },
        {
          actorId:     patient.id,
          actorRole:   'PATIENT',
          action:      'LOGIN',
          targetId:    patient.id,
          targetType:  'AUTH',
          description: 'Patient logged in via phone OTP verification',
          metadata:    { method: 'phone', ip: '192.168.1.100' },
          createdAt:   new Date('2026-03-20 09:15:00'),
        },
        {
          actorId:     patient.id,
          actorRole:   'PATIENT',
          action:      'PROFILE_VIEWED',
          targetId:    patient.id,
          targetType:  'PATIENT',
          description: 'Patient viewed their complete profile',
          metadata:    { section: 'profile' },
          createdAt:   new Date('2026-03-20 09:16:00'),
        },
        {
          actorId:     patient.id,
          actorRole:   'PATIENT',
          action:      'RECORD_ADDED',
          targetId:    patient.id,
          targetType:  'PATIENT_RECORD',
          description: 'Blood CBC test results uploaded',
          metadata:    { recordType: 'Lab Report', title: 'Blood CBC' },
          createdAt:   new Date('2026-03-18 14:30:00'),
        },
        {
          actorId:     patient.id,
          actorRole:   'PATIENT',
          action:      'RECORD_VIEWED',
          targetId:    patient.id,
          targetType:  'PATIENT_RECORD',
          description: 'Viewed Lipid Profile test results',
          metadata:    { recordType: 'Lab Report', title: 'Lipid Profile Test' },
          createdAt:   new Date('2026-03-19 10:00:00'),
        },
        {
          actorId:     patient.id,
          actorRole:   'PATIENT',
          action:      'INSURANCE_UPDATED',
          targetId:    patient.id,
          targetType:  'PATIENT',
          description: 'Updated insurance information',
          metadata:    { provider: 'Star Health Insurance' },
          createdAt:   new Date('2026-03-15 11:45:00'),
        },
        {
          actorId:     patient.id,
          actorRole:   'PATIENT',
          action:      'PASSWORD_SET',
          targetId:    patient.id,
          targetType:  'AUTH',
          description: 'Patient set account password for secure login',
          metadata:    { method: 'self-service' },
          createdAt:   new Date('2026-03-10 16:20:00'),
        },
        {
          actorId:     patient.id,
          actorRole:   'PATIENT',
          action:      'LOGIN',
          targetId:    patient.id,
          targetType:  'AUTH',
          description: 'Patient logged in via Patient ID',
          metadata:    { method: 'patientId', ip: '192.168.1.105' },
          createdAt:   new Date('2026-03-22 08:30:00'),
        },
      ],
    });
    console.log('AuditLog entries seeded: 8');
  }

  // ─── 7. Create OTPSession ────────────────────────────────────────────────────
  const otpHash = await bcrypt.hash('482910', 10);

  await prisma.oTPSession.upsert({
    where: { id: 'seed-otp-session' },
    update: {},
    create: {
      id:          'seed-otp-session',
      patientId:  patient.id,
      otpHash,
      status:      'PENDING',
      expiresAt:   new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  console.log('OTPSession (PENDING) seeded.');

  // ─── 8. Create Notifications ────────────────────────────────────────────────
  const notifCount = await prisma.notification.count({
    where: { patientId: patient.id }
  });

  if (notifCount < 5) {
    await prisma.notification.createMany({
      data: [
        {
          patientId: patient.id,
          type:      'WELCOME',
          title:     'Welcome to MedLink',
          message:   'Your MedLink patient account is ready. Your Patient ID is MLPR-20262922.',
          read:      true,
          createdAt: new Date('2025-01-10 10:30:00'),
        },
        {
          patientId: patient.id,
          type:      'RECORD_UPLOADED',
          title:     'New Lab Report Available',
          message:   'Your Blood CBC test results from Chennai Med Center are now available in your records.',
          read:      false,
          createdAt: new Date('2026-03-18 15:00:00'),
        },
        {
          patientId: patient.id,
          type:      'APPOINTMENT_REMINDER',
          title:     'Annual Health Checkup Reminder',
          message:   'Your annual health checkup is due. Schedule an appointment with your doctor.',
          read:      false,
          createdAt: new Date('2026-03-15 09:00:00'),
        },
        {
          patientId: patient.id,
          type:      'SECURITY_ALERT',
          title:     'Password Changed',
          message:   'Your account password was successfully changed. If this wasn\'t you, contact support.',
          read:      true,
          createdAt: new Date('2026-03-10 16:25:00'),
        },
        {
          patientId: patient.id,
          type:      'INSURANCE_UPDATE',
          title:     'Insurance Details Updated',
          message:   'Your Star Health Insurance details have been saved successfully.',
          read:      true,
          createdAt: new Date('2026-03-15 12:00:00'),
        },
        {
          patientId: patient.id,
          type:      'RECORD_UPLOADED',
          title:     'Thyroid Test Results',
          message:   'Your Thyroid Function Test results are now available. TSH levels normal.',
          read:      false,
          createdAt: new Date('2026-02-10 11:30:00'),
        },
      ],
    });
    console.log('Notifications seeded: 6');
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  const finalRecordCount = await prisma.patientRecord.count({
    where: { patientId: patient.id }
  });
  const finalAuditCount = await prisma.auditLog.count({
    where: { actorId: patient.id }
  });
  const finalNotifCount = await prisma.notification.count({
    where: { patientId: patient.id }
  });

  console.log('\n========================================');
  console.log('Seed complete');
  console.log(`Patient login  → phone: 9000000077 | password: TestPass123`);
  console.log(`Patient code   → MLPR-20262922`);
  console.log(`Records seeded → ${finalRecordCount}`);
  console.log(`Audit logs     → ${finalAuditCount}`);
  console.log(`Notifications  → ${finalNotifCount}`);
  console.log('========================================\n');
  console.log('Login credentials:');
  console.log('  Phone: 9000000077');
  console.log('  Patient ID: MLPR-20262922');
  console.log('  Password: TestPass123');
  console.log('\nNote: Run `npm run dev` to start the backend server.');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
