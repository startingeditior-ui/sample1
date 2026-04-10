'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Calendar, MapPin, Droplet, AlertTriangle, PhoneCall, LogOut, Shield, Pencil, Lock, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Input } from '@/components/ui/Elements';
import { useAuth } from '@/hooks/useAuth';
import { patientAPI } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

// Reusable styled select component
function StyledSelect({ 
  value, 
  onChange, 
  options, 
  placeholder,
  disabled = false
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: string[]; 
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none disabled:bg-gray-50 disabled:text-gray-400"
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  );
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
  const { patient, logout, isAuthInitializing } = useAuth();
   
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Edit personal info state
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: ''
  });
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalError, setPersonalError] = useState('');
  const [personalSuccess, setPersonalSuccess] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    const pwd = newPassword;
    
    if (pwd.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    
    if (!hasLower || !hasUpper || !hasDigit) {
      setPasswordError('Password must contain uppercase, lowercase, and number');
      return;
    }
    
    if (pwd !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      if (!patient) return;
      console.log('Calling API - patientId:', patient.id, 'password:', newPassword, 'length:', newPassword.length);
      const res = await patientAPI.setPassword(patient.id, newPassword);
      console.log('Password set result:', res.data);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error('Password set error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to set password';
      setPasswordError(errorMsg);
     } finally {
       setPasswordLoading(false);
     }
   };

   const handleChangePersonal = (field: keyof typeof formData, value: string) => {
     setFormData(prev => ({ ...prev, [field]: value }));
   };

   const handleSavePersonal = async (e: React.FormEvent) => {
     e.preventDefault();
     setPersonalError('');
     
     try {
       if (!patient) return;
       setIsSavingPersonal(true);
       
       const response = await patientAPI.updateProfile({
         name: formData.name,
         email: formData.email,
         phone: formData.phone,
         dob: formData.dob,
         gender: formData.gender,
         address: formData.address
       });
       
       if (response.data.success) {
         setPersonalSuccess(true);
         setIsEditingPersonal(false);
         setTimeout(() => setPersonalSuccess(false), 3000);
         // Refresh patient data
         // Note: This would require a refetch mechanism or we could update the patient object directly
       } else {
         setPersonalError(response.data.error || 'Failed to update profile');
       }
     } catch (err: any) {
       setPersonalError(err.response?.data?.error || err.message || 'Failed to update profile');
     } finally {
       setIsSavingPersonal(false);
     }
   };

   const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isAuthInitializing) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

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
         {(!isEditingPersonal && patient) ? (
           <Card className="p-5">
             <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
             <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={patient.name || ''} />
             <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={patient.email || ''} />
             <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={patient.phone || ''} />
             <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={patient.dateOfBirth || patient.dob || ''} />
             <InfoRow icon={<Droplet className="w-4 h-4" />} label="Gender" value={patient.gender || ''} />
             <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={patient.address || ''} />
             <div className="flex justify-end mt-4">
               <Button variant="ghost" size="sm" onClick={() => setEditingPersonal(true)} className="text-emerald-600 hover:bg-emerald-50">
                 <Pencil className="w-4 h-4 mr-1.5" />
                 Edit
               </Button>
             </div>
           </Card>
         ) : (
           <Card className="p-5">
             <h3 className="font-semibold text-gray-800 mb-2">Edit Personal Information</h3>
             <form onSubmit={handleSavePersonal} className="space-y-4">
               <Input
                 label="Full Name"
                 value={formData.name || ''}
                 onChange={(e) => handleChangePersonal('name', e.target.value)}
                 required
                 icon={<User className="w-4 h-4" />}
               />
               <Input
                 label="Email"
                 type="email"
                 value={formData.email || ''}
                 onChange={(e) => handleChangePersonal('email', e.target.value)}
                 required
                 icon={<Mail className="w-4 h-4" />}
               />
               <Input
                 label="Phone"
                 type="tel"
                 value={formData.phone || ''}
                 onChange={(e) => handleChangePersonal('phone', e.target.value)}
                 icon={<Phone className="w-4 h-4" />}
               />
               <Input
                 label="Date of Birth"
                 type="date"
                 value={formData.dob || ''}
                 onChange={(e) => handleChangePersonal('dob', e.target.value)}
                 icon={<Calendar className="w-4 h-4" />}
               />
               <StyledSelect
                 label="Gender"
                 value={formData.gender || ''}
                 onChange={(value) => handleChangePersonal('gender', value)}
                 options={['Male', 'Female', 'Other', 'Prefer not to say']}
                 placeholder="Select gender"
               />
               <Input
                 label="Address"
                 value={formData.address || ''}
                 onChange={(e) => handleChangePersonal('address', e.target.value)}
                 icon={<MapPin className="w-4 h-4" />}
               />
               <div className="flex gap-3">
                 <Button variant="outlined" size="sm" onClick={() => setEditingPersonal(false)}>
                   Cancel
                 </Button>
                 <Button variant="filled" size="sm" className="flex-1" onClick={handleSavePersonal} isLoading={isSavingPersonal}>
                   {isSavingPersonal ? 'Saving...' : 'Save Changes'}
                 </Button>
               </div>
               {personalError && (
                 <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                   <AlertCircle className="w-4 h-4" />
                   {personalError}
                 </div>
               )}
               {personalSuccess && (
                 <div className="flex items-center gap-2 mt-3 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                   <CheckCircle className="w-4 h-4" />
                   Changes saved successfully!
                 </div>
               )}
             </form>
           </Card>
         )}
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

      {/* Emergency / Guardian */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-2">Emergency / Guardian</h3>
          <InfoRow icon={<PhoneCall className="w-4 h-4" />} label="Contact" value={patient.emergencyContact || ''} />
          <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={patient.emergencyContactName || ''} />
          <InfoRow icon={<Shield className="w-4 h-4" />} label="Relationship" value={patient.emergencyContactRelationship || ''} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Guardian Mobile" value={patient.guardianMobile || ''} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Guardian Location" value={patient.guardianLocation || ''} />
        </Card>
      </motion.div>

      {/* Insurance Link Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
        <Link href="/insurance">
          <Card className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Insurance</p>
                <p className="text-sm text-gray-500">Manage your health insurance</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Card>
        </Link>
      </motion.div>

      {/* Set Password */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Security</h3>
            </div>
            {!showPasswordForm && (
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(true)} className="text-emerald-600 hover:bg-emerald-50">
                <Pencil className="w-4 h-4 mr-1.5" />
                Set Password
              </Button>
            )}
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2 mb-4 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
              Password set successfully!
            </div>
          )}

          {showPasswordForm && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters with uppercase, lowercase, number"
                icon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                icon={<Lock className="w-4 h-4" />}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="showPassword" className="text-sm text-gray-600">
                  Show passwords
                </label>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" variant="filled" className="flex-1" isLoading={passwordLoading}>
                  Set Password
                </Button>
                <Button type="button" variant="outlined" onClick={() => {
                  setShowPasswordForm(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {!showPasswordForm && (
            <p className="text-sm text-gray-500">
              Set a password to secure your account and enable re-authentication after 3 hours of inactivity.
            </p>
          )}
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
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
