'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Calendar, MapPin, Droplet, AlertTriangle, PhoneCall, LogOut, Shield, CreditCard, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Input } from '@/components/ui/Elements';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

interface InsuranceData {
  insuranceProvider?: string;
  insuranceCustomerId?: string;
  insuranceType?: string;
  insuranceSupportNumber?: string;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-gray-400 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value || 'Not set'}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { patient, logout, insuranceData, saveInsuranceData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [insurance, setInsurance] = useState<InsuranceData>({
    insuranceProvider: '',
    insuranceCustomerId: '',
    insuranceType: '',
    insuranceSupportNumber: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (insuranceData) setInsurance(insuranceData);
  }, [insuranceData]);

  const handleInsuranceChange = (field: keyof InsuranceData, value: string) => {
    setInsurance(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSaveInsurance = () => {
    saveInsuranceData(insurance);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/');
    }
  };

  if (!patient) return null;

  // Safely resolve photo URL — Next.js <Image> throws "Invalid URL" on null/empty/non-http values
  const rawPhoto = patient.profilePhoto || patient.photoUrl || '';
  const validPhotoUrl =
    rawPhoto &&
    (rawPhoto.startsWith('http://') ||
      rawPhoto.startsWith('https://') ||
      rawPhoto.startsWith('/') ||
      rawPhoto.startsWith('data:'))
      ? rawPhoto
      : null;

  return (
    <div className="space-y-5">
      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-4"
      >
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto overflow-hidden border-4 border-white shadow-md">
          {validPhotoUrl ? (
            <Image src={validPhotoUrl} alt="Profile" width={96} height={96} className="w-full h-full object-cover" unoptimized />
          ) : (
            <User className="w-12 h-12 text-emerald-600" />
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mt-4">{patient.name}</h2>
        <p className="text-gray-500 text-sm font-mono mt-0.5">{patient.patientId || patient.patientCode}</p>
      </motion.div>

      {/* Personal Information */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
          <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={patient.name || ''} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={patient.email || ''} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={patient.phone || ''} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={patient.dateOfBirth || patient.dob || ''} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={patient.address || ''} />
        </Card>
      </motion.div>

      {/* Medical Information */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-2">Medical Information</h3>
          <InfoRow icon={<Droplet className="w-4 h-4" />} label="Blood Group" value={patient.bloodGroup || ''} />
          <InfoRow icon={<AlertTriangle className="w-4 h-4" />} label="Allergies" value={patient.allergies?.length ? patient.allergies.join(', ') : 'None'} />
          <InfoRow icon={<AlertTriangle className="w-4 h-4" />} label="Chronic Diseases" value={patient.chronicDiseases?.length ? patient.chronicDiseases.join(', ') : 'None'} />
        </Card>
      </motion.div>

      {/* Emergency Contact */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-2">Emergency Contact</h3>
          <InfoRow icon={<PhoneCall className="w-4 h-4" />} label="Emergency Contact" value={patient.emergencyContact || ''} />
          <InfoRow icon={<Shield className="w-4 h-4" />} label="Guardian Name" value={patient.guardianName || ''} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Guardian Mobile" value={patient.guardianMobile || ''} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Guardian Location" value={patient.guardianLocation || ''} />
        </Card>
      </motion.div>

      {/* Insurance Information */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Insurance Information</h3>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-emerald-600 hover:bg-emerald-50">
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <Input
              label="Insurance Provider"
              value={insurance.insuranceProvider || ''}
              onChange={(e) => handleInsuranceChange('insuranceProvider', e.target.value)}
              disabled={!isEditing}
              icon={<CreditCard className="w-4 h-4" />}
              placeholder="e.g., ABC Insurance Co."
            />
            <Input
              label="Customer ID / Policy Number"
              value={insurance.insuranceCustomerId || ''}
              onChange={(e) => handleInsuranceChange('insuranceCustomerId', e.target.value)}
              disabled={!isEditing}
              icon={<CreditCard className="w-4 h-4" />}
              placeholder="e.g., POL-123456789"
            />
            <Input
              label="Insurance Type"
              value={insurance.insuranceType || ''}
              onChange={(e) => handleInsuranceChange('insuranceType', e.target.value)}
              disabled={!isEditing}
              icon={<CreditCard className="w-4 h-4" />}
              placeholder="e.g., Health, Life"
            />
            <Input
              label="Support Number"
              value={insurance.insuranceSupportNumber || ''}
              onChange={(e) => handleInsuranceChange('insuranceSupportNumber', e.target.value)}
              disabled={!isEditing}
              icon={<Phone className="w-4 h-4" />}
              placeholder="e.g., 1-800-XXX-XXXX"
            />

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <Button variant="filled" className="flex-1" onClick={handleSaveInsurance}>
                  {saved ? '✓ Saved' : 'Save Insurance'}
                </Button>
                <Button variant="outlined" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </motion.div>
    </div>
  );
}
