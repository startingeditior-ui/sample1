import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.patientRecord.deleteMany();
  await prisma.medicalRecordType.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.consentRequest.deleteMany();
  await prisma.accessRecord.deleteMany();
  await prisma.blockedHospital.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.hospitalType.deleteMany();
  await prisma.patient.deleteMany();

  // Create hospital types
  const generalHospital = await prisma.hospitalType.create({
    data: { name: 'General Hospital' },
  });

  const specialtyClinic = await prisma.hospitalType.create({
    data: { name: 'Specialty Clinic' },
  });

  const diagnosticCenter = await prisma.hospitalType.create({
    data: { name: 'Diagnostic Center' },
  });

  const multiSpecialty = await prisma.hospitalType.create({
    data: { name: 'Multi-Specialty Hospital' },
  });

  // Create specializations
  const cardiology = await prisma.specialization.create({
    data: { name: 'Cardiology' },
  });

  const neurology = await prisma.specialization.create({
    data: { name: 'Neurology' },
  });

  const orthopedics = await prisma.specialization.create({
    data: { name: 'Orthopedics' },
  });

  const pediatrics = await prisma.specialization.create({
    data: { name: 'Pediatrics' },
  });

  const generalMedicine = await prisma.specialization.create({
    data: { name: 'General Medicine' },
  });

  const dermatology = await prisma.specialization.create({
    data: { name: 'Dermatology' },
  });

  const ophthalmology = await prisma.specialization.create({
    data: { name: 'Ophthalmology' },
  });

  const radiology = await prisma.specialization.create({
    data: { name: 'Radiology' },
  });

  const generalSurgery = await prisma.specialization.create({
    data: { name: 'General Surgery' },
  });

  // Create medical record types
  const labReport = await prisma.medicalRecordType.create({
    data: { name: 'Lab Report', description: 'Laboratory test results', icon: 'flask' },
  });

  const prescription = await prisma.medicalRecordType.create({
    data: { name: 'Prescription', description: 'Prescribed medications', icon: 'pill' },
  });

  const imaging = await prisma.medicalRecordType.create({
    data: { name: 'Imaging', description: 'X-rays, MRI, CT scans', icon: 'scan' },
  });

  const clinicalNote = await prisma.medicalRecordType.create({
    data: { name: 'Clinical Note', description: 'Doctor consultation notes', icon: 'file-text' },
  });

  const bill = await prisma.medicalRecordType.create({
    data: { name: 'Bill', description: 'Medical bills and receipts', icon: 'receipt' },
  });

  const vaccination = await prisma.medicalRecordType.create({
    data: { name: 'Vaccination', description: 'Vaccination records', icon: 'syringe' },
  });

  const dischargeSummary = await prisma.medicalRecordType.create({
    data: { name: 'Discharge Summary', description: 'Hospital discharge documents', icon: 'file-check' },
  });

  const insurance = await prisma.medicalRecordType.create({
    data: { name: 'Insurance', description: 'Insurance documents', icon: 'shield' },
  });

  // Create hospitals
  const apollo = await prisma.hospital.create({
    data: {
      name: 'Apollo Hospital',
      address: '21, Greams Lane, Chennai',
      phone: '+91 44 2829 2222',
      hospitalTypeId: multiSpecialty.id,
    },
  });

  const fortis = await prisma.hospital.create({
    data: {
      name: 'Fortis Healthcare',
      address: 'No. 23, 45th Cross Road, Chennai',
      phone: '+91 44 4722 2222',
      hospitalTypeId: multiSpecialty.id,
    },
  });

  const miot = await prisma.hospital.create({
    data: {
      name: 'MIOT Hospitals',
      address: '1, Mount Road, Chennai',
      phone: '+91 44 4200 4200',
      hospitalTypeId: multiSpecialty.id,
    },
  });

  const narayana = await prisma.hospital.create({
    data: {
      name: 'Narayana Health',
      address: 'No. 65, Chennai',
      phone: '+91 44 6628 6628',
      hospitalTypeId: generalHospital.id,
    },
  });

  // Create doctors
  const drSarah = await prisma.doctor.create({
    data: {
      name: 'Dr. Sarah Chen',
      specializationId: cardiology.id,
      hospitalId: apollo.id,
    },
  });

  const drRajesh = await prisma.doctor.create({
    data: {
      name: 'Dr. Rajesh Kumar',
      specializationId: generalMedicine.id,
      hospitalId: apollo.id,
    },
  });

  const drAmit = await prisma.doctor.create({
    data: {
      name: 'Dr. Amit Patel',
      specializationId: cardiology.id,
      hospitalId: fortis.id,
    },
  });

  const drVenkatesh = await prisma.doctor.create({
    data: {
      name: 'Dr. Venkatesh',
      specializationId: generalSurgery.id,
      hospitalId: miot.id,
    },
  });

  const drPriya = await prisma.doctor.create({
    data: {
      name: 'Dr. Priya Nair',
      specializationId: pediatrics.id,
      hospitalId: narayana.id,
    },
  });

  const drSuresh = await prisma.doctor.create({
    data: {
      name: 'Dr. Suresh Reddy',
      specializationId: neurology.id,
      hospitalId: apollo.id,
    },
  });

  // Create patients
  const hashedPassword = await bcrypt.hash('password123', 10);

  const generatePatientId = (uniqueId: number): string => {
    const year = new Date().getFullYear();
    return `MLPR-${year}${String(uniqueId).padStart(4, '0')}`;
  };

  const patient1 = await prisma.patient.create({
    data: {
      patientId: generatePatientId(1),
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh.kumar@email.com',
      password: hashedPassword,
      bloodGroup: 'B+',
      allergies: JSON.stringify(['Penicillin', 'Peanuts']),
      chronicDiseases: JSON.stringify(['Type 2 Diabetes', 'Hypertension']),
      emergencyContact: '+91 98765 43211',
      guardianName: 'Suresh Kumar',
      guardianMobile: '+91 98765 43211',
      guardianLocation: '42, MG Road, Chennai',
      dateOfBirth: new Date('1985-06-15'),
      gender: 'Male',
      address: '42, MG Road, Chennai, Tamil Nadu 600001',
      profilePhoto: 'https://i.pravatar.cc/150?u=MLPR20260001',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      patientId: generatePatientId(2),
      name: 'Priya Sharma',
      phone: '+91 98765 43267',
      email: 'priya.sharma@email.com',
      password: hashedPassword,
      bloodGroup: 'A+',
      allergies: JSON.stringify([]),
      chronicDiseases: JSON.stringify([]),
      emergencyContact: '+91 98765 43212',
      dateOfBirth: new Date('1990-03-22'),
      gender: 'Female',
      address: '15, LB Road, Chennai, Tamil Nadu 600034',
      profilePhoto: 'https://i.pravatar.cc/150?u=MLPR20260002',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      patientId: generatePatientId(12),
      name: 'Test Patient',
      phone: '+91 93613 25794',
      email: 'test@patient.com',
      password: hashedPassword,
      bloodGroup: 'O+',
      allergies: JSON.stringify(['Dust', 'Pollution']),
      chronicDiseases: JSON.stringify(['Asthma']),
      emergencyContact: '+91 93613 25795',
      dateOfBirth: new Date('1995-08-10'),
      gender: 'Male',
      address: '123, Main Road, Chennai, Tamil Nadu 600001',
      profilePhoto: 'https://i.pravatar.cc/150?u=MLPR20260012',
    },
  });

  // Create sample patient records for patient3 (MLPR-20260012)
  
  // Lab Reports
  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: labReport.id,
      title: 'Complete Blood Count (CBC)',
      description: 'Hemoglobin: 14.5 g/dL, WBC: 7,500/cumm, Platelets: 2.5 lakhs/cumm - All values within normal range',
      fileUrl: 'https://placehold.co/600x400/e8f5e9/1b5e20?text=CBC+Report',
      date: new Date('2024-01-15'),
      hospitalId: apollo.id,
      doctorId: drSarah.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: labReport.id,
      title: 'Lipid Profile',
      description: 'Total Cholesterol: 195 mg/dL, LDL: 110 mg/dL, HDL: 45 mg/dL, Triglycerides: 150 mg/dL',
      fileUrl: 'https://placehold.co/600x400/e8f5e9/1b5e20?text=Lipid+Profile',
      date: new Date('2024-03-20'),
      hospitalId: fortis.id,
      doctorId: drAmit.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: labReport.id,
      title: 'Liver Function Test',
      description: 'ALT: 25 U/L, AST: 28 U/L, Bilirubin: 0.8 mg/dL - Normal liver function',
      fileUrl: 'https://placehold.co/600x400/e8f5e9/1b5e20?text=LFT+Report',
      date: new Date('2024-06-10'),
      hospitalId: apollo.id,
      doctorId: drSarah.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: labReport.id,
      title: 'Thyroid Profile',
      description: 'TSH: 2.5 mIU/L, T3: 1.2 ng/mL, T4: 8.5 μg/dL - Euthyroid state',
      fileUrl: 'https://placehold.co/600x400/e8f5e9/1b5e20?text=Thyroid+Profile',
      date: new Date('2024-09-15'),
      hospitalId: apollo.id,
      doctorId: drRajesh.id,
    },
  });

  // Prescriptions
  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: prescription.id,
      title: 'Diabetes Medication',
      description: 'Tab. Metformin 500mg - Twice daily after meals. For diabetes management.',
      fileUrl: 'https://placehold.co/600x400/fff3e0/e65100?text=Prescription',
      date: new Date('2024-02-10'),
      hospitalId: apollo.id,
      doctorId: drRajesh.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: prescription.id,
      title: 'Blood Pressure Medication',
      description: 'Tab. Amlodipine 5mg - Once daily in the morning. For hypertension.',
      fileUrl: 'https://placehold.co/600x400/fff3e0/e65100?text=BP+Medicine',
      date: new Date('2024-02-10'),
      hospitalId: apollo.id,
      doctorId: drRajesh.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: prescription.id,
      title: 'Allergy Medication',
      description: 'Tab. Cetirizine 10mg - Once daily at night. For dust allergy.',
      fileUrl: 'https://placehold.co/600x400/fff3e0/e65100?text=Allergy+Medicine',
      date: new Date('2024-05-20'),
      hospitalId: apollo.id,
      doctorId: drRajesh.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: prescription.id,
      title: 'Vitamin Supplements',
      description: 'Tab. Vitamin D3 1000IU - Once daily. Tab. B-Complex - Once daily.',
      fileUrl: 'https://placehold.co/600x400/fff3e0/e65100?text=Supplements',
      date: new Date('2024-08-05'),
      hospitalId: narayana.id,
      doctorId: drPriya.id,
    },
  });

  // Imaging
  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: imaging.id,
      title: 'Chest X-Ray PA View',
      description: 'Clear lung fields bilaterally. Normal heart size. No active pulmonary lesion.',
      fileUrl: 'https://placehold.co/600x400/e3f2fd/1565c0?text=Chest+X-Ray',
      date: new Date('2024-03-05'),
      hospitalId: fortis.id,
      doctorId: drAmit.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: imaging.id,
      title: 'MRI Brain',
      description: 'Normal study. No mass lesion, hemorrhage, or infarct. Ventricles normal in size.',
      fileUrl: 'https://placehold.co/600x400/e3f2fd/1565c0?text=MRI+Brain',
      date: new Date('2024-07-12'),
      hospitalId: apollo.id,
      doctorId: drSuresh.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: imaging.id,
      title: 'ECG Report',
      description: 'Normal sinus rhythm. Heart rate: 72 bpm. No ST-T changes. Normal ECG.',
      fileUrl: 'https://placehold.co/600x400/e3f2fd/1565c0?text=ECG+Report',
      date: new Date('2024-10-20'),
      hospitalId: apollo.id,
      doctorId: drSarah.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: imaging.id,
      title: '2D Echocardiography',
      description: 'Normal left ventricular function. EF: 60%. No valvular abnormalities.',
      fileUrl: 'https://placehold.co/600x400/e3f2fd/1565c0?text=Echo+Report',
      date: new Date('2024-10-20'),
      hospitalId: apollo.id,
      doctorId: drSarah.id,
    },
  });

  // Clinical Notes
  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: clinicalNote.id,
      title: 'Cardiology Consultation',
      description: 'Patient presented with mild chest discomfort. EKG normal. Advised stress test. Continue current BP medications.',
      fileUrl: 'https://placehold.co/600x400/f3e5f5/7b1fa2?text=Clinical+Note',
      date: new Date('2024-10-20'),
      hospitalId: apollo.id,
      doctorId: drSarah.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: clinicalNote.id,
      title: 'General Medicine Follow-up',
      description: 'Diabetes under control with current medications. HbA1c: 6.5%. Continue Metformin. Review after 3 months.',
      fileUrl: 'https://placehold.co/600x400/f3e5f5/7b1fa2?text=Follow+Up',
      date: new Date('2024-08-05'),
      hospitalId: apollo.id,
      doctorId: drRajesh.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: clinicalNote.id,
      title: 'Neurology Referral',
      description: 'Patient complained of occasional headaches. Suspected migraine. Advised MRI brain and follow-up in 2 weeks.',
      fileUrl: 'https://placehold.co/600x400/f3e5f5/7b1fa2?text=Neurology+Note',
      date: new Date('2024-07-12'),
      hospitalId: apollo.id,
      doctorId: drSuresh.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: clinicalNote.id,
      title: 'Pediatric Consultation',
      description: 'General wellness check for 8-year-old. Growth parameters normal. Vaccination up to date.',
      fileUrl: 'https://placehold.co/600x400/f3e5f5/7b1fa2?text=Pediatric+Note',
      date: new Date('2024-05-01'),
      hospitalId: narayana.id,
      doctorId: drPriya.id,
    },
  });

  // Bills
  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: bill.id,
      title: 'Annual Health Checkup Package',
      description: 'Package includes CBC, LFT, Lipid Profile, Thyroid Profile, ECG, Consultation charges',
      fileUrl: 'https://placehold.co/600x400/fff8e1/ff8f00?text=Invoice',
      date: new Date('2024-09-15'),
      hospitalId: apollo.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: bill.id,
      title: 'Cardiology Consultation Fee',
      description: 'Specialist consultation with Dr. Sarah Chen - Cardiology department',
      fileUrl: 'https://placehold.co/600x400/fff8e1/ff8f00?text=Invoice',
      date: new Date('2024-10-20'),
      hospitalId: apollo.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: bill.id,
      title: 'Laboratory Charges',
      description: 'Lipid Profile test, CBC test charges - Fortis Laboratory',
      fileUrl: 'https://placehold.co/600x400/fff8e1/ff8f00?text=Lab+Bill',
      date: new Date('2024-03-20'),
      hospitalId: fortis.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: bill.id,
      title: 'MRI Brain Investigation',
      description: 'MRI Brain charges including report',
      fileUrl: 'https://placehold.co/600x400/fff8e1/ff8f00?text=MRI+Bill',
      date: new Date('2024-07-12'),
      hospitalId: apollo.id,
    },
  });

  // Vaccinations
  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: vaccination.id,
      title: 'Influenza Vaccine',
      description: 'Quadrivalent flu vaccine administered. No adverse reactions.',
      fileUrl: 'https://placehold.co/600x400/e8f5e9/2e7d32?text=Vaccine',
      date: new Date('2024-05-01'),
      hospitalId: narayana.id,
      doctorId: drPriya.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: vaccination.id,
      title: 'Tetanus Toxoid (TT)',
      description: 'TT booster administered. Next due after 10 years.',
      fileUrl: 'https://placehold.co/600x400/e8f5e9/2e7d32?text=TT+Booster',
      date: new Date('2024-06-15'),
      hospitalId: apollo.id,
      doctorId: drRajesh.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: vaccination.id,
      title: 'COVID-19 Vaccine - Dose 1',
      description: 'Covishield vaccine administered. No adverse reactions observed.',
      fileUrl: 'https://placehold.co/600x400/e8f5e9/2e7d32?text=COVID+Vaccine',
      date: new Date('2024-02-01'),
      hospitalId: apollo.id,
      doctorId: drRajesh.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient3.id,
      recordTypeId: vaccination.id,
      title: 'COVID-19 Vaccine - Dose 2',
      description: 'Covishield vaccine second dose administered.',
      fileUrl: 'https://placehold.co/600x400/e8f5e9/2e7d32?text=COVID+Dose2',
      date: new Date('2024-03-01'),
      hospitalId: apollo.id,
      doctorId: drRajesh.id,
    },
  });

  // Create sample patient records for patient1
  await prisma.patientRecord.create({
    data: {
      patientId: patient1.id,
      recordTypeId: labReport.id,
      title: 'HbA1c Test',
      description: 'Diabetes monitoring - Result: 6.5%',
      date: new Date('2024-02-15'),
      hospitalId: apollo.id,
      doctorId: drSarah.id,
    },
  });

  await prisma.patientRecord.create({
    data: {
      patientId: patient1.id,
      recordTypeId: bill.id,
      title: 'Hospital Bill - Apollo',
      description: 'Consultation and diagnostic charges',
      date: new Date('2024-01-20'),
      hospitalId: apollo.id,
    },
  });

  // Create access records for patient3 (MLP-2024-001236)
  await prisma.accessRecord.create({
    data: {
      patientId: patient3.id,
      doctorId: drSarah.id,
      hospitalId: apollo.id,
      accessStartTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      accessExpiryTime: new Date(Date.now() + 7 * 60 * 60 * 1000),
      recordsViewed: JSON.stringify(['Medical History', 'Lab Reports', 'Prescriptions', 'Vaccination Records']),
      status: 'ACTIVE',
    },
  });

  await prisma.accessRecord.create({
    data: {
      patientId: patient3.id,
      doctorId: drAmit.id,
      hospitalId: fortis.id,
      accessStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      accessExpiryTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
      recordsViewed: JSON.stringify(['Medical History', 'Prescriptions']),
      status: 'EXPIRED',
    },
  });

  // Create pending consent requests for patient3
  await prisma.consentRequest.create({
    data: {
      patientId: patient3.id,
      doctorId: drRajesh.id,
      hospitalId: apollo.id,
      requestTime: new Date(Date.now() - 15 * 60 * 1000),
      duration: 24,
      recordsRequested: JSON.stringify(['Lab Reports', 'Prescriptions', 'Medical History']),
      status: 'PENDING',
    },
  });

  await prisma.consentRequest.create({
    data: {
      patientId: patient3.id,
      doctorId: drVenkatesh.id,
      hospitalId: miot.id,
      requestTime: new Date(Date.now() - 45 * 60 * 1000),
      duration: 12,
      recordsRequested: JSON.stringify(['Medical History']),
      status: 'PENDING',
    },
  });

  // Create notifications for patient3
  await prisma.notification.create({
    data: {
      patientId: patient3.id,
      type: 'ACCESS_GRANTED',
      title: 'Access Granted',
      message: 'Dr. Sarah Chen from Apollo Hospital has been granted access to your records.',
      doctorName: 'Dr. Sarah Chen',
      hospitalName: 'Apollo Hospital',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      patientId: patient3.id,
      type: 'CONSENT_REQUEST',
      title: 'New Access Request',
      message: 'Dr. Rajesh Kumar from Apollo Hospital is requesting access to your records.',
      doctorName: 'Dr. Rajesh Kumar',
      hospitalName: 'Apollo Hospital',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      patientId: patient3.id,
      type: 'CONSENT_REQUEST',
      title: 'New Access Request',
      message: 'Dr. Venkatesh from MIOT Hospitals is requesting access to your records.',
      doctorName: 'Dr. Venkatesh',
      hospitalName: 'MIOT Hospitals',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      patientId: patient3.id,
      type: 'ACCESS_EXPIRED',
      title: 'Access Expired',
      message: 'Access granted to Dr. Amit Patel from Fortis Healthcare has expired.',
      doctorName: 'Dr. Amit Patel',
      hospitalName: 'Fortis Healthcare',
      read: true,
    },
  });

  // Create access records (with 8-hour expiry)
  await prisma.accessRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: drSarah.id,
      hospitalId: apollo.id,
      accessStartTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      accessExpiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      recordsViewed: JSON.stringify(['Medical History', 'Lab Reports', 'Prescriptions']),
      status: 'ACTIVE',
    },
  });

  await prisma.accessRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: drRajesh.id,
      hospitalId: apollo.id,
      accessStartTime: new Date(Date.now() - 30 * 60 * 1000),
      accessExpiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      recordsViewed: JSON.stringify(['Medical History']),
      status: 'ACTIVE',
    },
  });

  await prisma.accessRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: drAmit.id,
      hospitalId: fortis.id,
      accessStartTime: new Date(Date.now() - 26 * 60 * 60 * 1000),
      accessExpiryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      recordsViewed: JSON.stringify(['Medical History']),
      status: 'EXPIRED',
    },
  });

  await prisma.accessRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: drVenkatesh.id,
      hospitalId: miot.id,
      accessStartTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      accessExpiryTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      recordsViewed: JSON.stringify(['Medical History', 'Prescriptions']),
      status: 'REVOKED',
    },
  });

  // Create pending consent requests
  await prisma.consentRequest.create({
    data: {
      patientId: patient1.id,
      doctorId: drSarah.id,
      hospitalId: apollo.id,
      requestTime: new Date(Date.now() - 10 * 60 * 1000),
      duration: 24,
      recordsRequested: JSON.stringify(['Lab Reports', 'Prescriptions']),
      status: 'PENDING',
    },
  });

  await prisma.consentRequest.create({
    data: {
      patientId: patient1.id,
      doctorId: drAmit.id,
      hospitalId: fortis.id,
      requestTime: new Date(Date.now() - 30 * 60 * 1000),
      duration: 24,
      recordsRequested: JSON.stringify(['Medical History']),
      status: 'PENDING',
    },
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      patientId: patient1.id,
      type: 'ACCESS_GRANTED',
      title: 'Access Granted',
      message: 'Dr. Sarah Chen from Apollo Hospital has been granted access to your records.',
      doctorName: 'Dr. Sarah Chen',
      hospitalName: 'Apollo Hospital',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      patientId: patient1.id,
      type: 'ACCESS_GRANTED',
      title: 'Access Granted',
      message: 'Dr. Rajesh Kumar from Apollo Hospital has been granted access to your records.',
      doctorName: 'Dr. Rajesh Kumar',
      hospitalName: 'Apollo Hospital',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      patientId: patient1.id,
      type: 'CONSENT_REQUEST',
      title: 'New Access Request',
      message: 'Dr. Sarah Chen from Apollo Hospital is requesting access to your records.',
      doctorName: 'Dr. Sarah Chen',
      hospitalName: 'Apollo Hospital',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      patientId: patient1.id,
      type: 'CONSENT_REQUEST',
      title: 'New Access Request',
      message: 'Dr. Amit Patel from Fortis Healthcare is requesting access to your records.',
      doctorName: 'Dr. Amit Patel',
      hospitalName: 'Fortis Healthcare',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      patientId: patient1.id,
      type: 'ACCESS_EXPIRED',
      title: 'Access Expired',
      message: 'Access granted to Dr. Amit Patel has expired.',
      doctorName: 'Dr. Amit Patel',
      hospitalName: 'Fortis Healthcare',
      read: true,
    },
  });

  await prisma.notification.create({
    data: {
      patientId: patient1.id,
      type: 'ACCESS_REVOKED',
      title: 'Access Revoked',
      message: 'You have revoked access for Dr. Venkatesh from MIOT Hospitals.',
      doctorName: 'Dr. Venkatesh',
      hospitalName: 'MIOT Hospitals',
      read: true,
    },
  });

  console.log('Database seeded successfully!');
  console.log('\nTest Credentials:');
  console.log(`Patient 1: ${patient1.patientId}`);
  console.log(`Patient 2: ${patient2.patientId}`);
  console.log(`Patient 3: ${patient3.patientId}`);
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
