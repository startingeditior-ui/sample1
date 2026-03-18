'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Calendar, MapPin, Droplet, AlertTriangle, PhoneCall, LogOut, Shield, CreditCard } from 'lucide-react';
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
    if (insuranceData) {
      setInsurance(insuranceData);
    }
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-bold text-text-primary">Profile</h1>
        <p className="text-text-secondary text-sm">Your personal information</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-6"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto overflow-hidden">
          {patient.profilePhoto ? (
            <Image src={patient.profilePhoto} alt="Profile" width={96} height={96} className="w-full h-full object-cover" unoptimized />
          ) : (
            <User className="w-12 h-12 text-primary" />
          )}
        </div>
        <h2 className="text-lg font-semibold text-text-primary mt-4">{patient.name}</h2>
        <p className="text-text-secondary text-sm">{patient.patientId}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4">Personal Information</h3>

          <div className="space-y-4">
            <Input
              label="Full Name"
              value={patient.name || ''}
              disabled
              icon={<User className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Email"
              type="email"
              value={patient.email || ''}
              disabled
              icon={<Mail className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Phone Number"
              value={patient.phone || ''}
              disabled
              icon={<Phone className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Date of Birth"
              value={patient.dateOfBirth || 'Not set'}
              disabled
              icon={<Calendar className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Address"
              value={patient.address || 'Not set'}
              disabled
              icon={<MapPin className="w-5 h-5 text-text-outline" />}
            />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4">Medical Information</h3>

          <div className="space-y-4">
            <Input
              label="Blood Group"
              value={patient.bloodGroup || 'Not set'}
              disabled
              icon={<Droplet className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Allergies"
              value={patient.allergies?.length ? patient.allergies.join(', ') : 'None'}
              disabled
              icon={<AlertTriangle className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Chronic Diseases"
              value={patient.chronicDiseases?.length ? patient.chronicDiseases.join(', ') : 'None'}
              disabled
              icon={<AlertTriangle className="w-5 h-5 text-text-outline" />}
            />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4">Emergency Contact</h3>

          <div className="space-y-4">
            <Input
              label="Emergency Contact Number"
              value={patient.emergencyContact || 'Not set'}
              disabled
              icon={<PhoneCall className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Guardian Name"
              value={patient.guardianName || 'Not set'}
              disabled
              icon={<Shield className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Guardian Mobile Number"
              value={patient.guardianMobile || 'Not set'}
              disabled
              icon={<Phone className="w-5 h-5 text-text-outline" />}
            />

            <Input
              label="Guardian Location"
              value={patient.guardianLocation || 'Not set'}
              disabled
              icon={<MapPin className="w-5 h-5 text-text-outline" />}
            />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Insurance Information</h3>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
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
              icon={<CreditCard className="w-5 h-5 text-text-outline" />}
              placeholder="e.g., ABC Insurance Co."
            />

            <Input
              label="Customer ID / Policy Number"
              value={insurance.insuranceCustomerId || ''}
              onChange={(e) => handleInsuranceChange('insuranceCustomerId', e.target.value)}
              disabled={!isEditing}
              icon={<CreditCard className="w-5 h-5 text-text-outline" />}
              placeholder="e.g., POL-123456789"
            />

            <Input
              label="Insurance Type"
              value={insurance.insuranceType || ''}
              onChange={(e) => handleInsuranceChange('insuranceType', e.target.value)}
              disabled={!isEditing}
              icon={<CreditCard className="w-5 h-5 text-text-outline" />}
              placeholder="e.g., Health, Life, Critical Illness"
            />

            <Input
              label="Support Number"
              value={insurance.insuranceSupportNumber || ''}
              onChange={(e) => handleInsuranceChange('insuranceSupportNumber', e.target.value)}
              disabled={!isEditing}
              icon={<Phone className="w-5 h-5 text-text-outline" />}
              placeholder="e.g., 1-800-XXX-XXXX"
            />

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <Button variant="filled" className="flex-1" onClick={handleSaveInsurance}>
                  {saved ? 'Saved!' : 'Save Insurance'}
                </Button>
                <Button variant="outlined" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button variant="outlined" className="w-full text-error" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </motion.div>
    </div>
  );
}
