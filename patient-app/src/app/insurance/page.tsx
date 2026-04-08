'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Phone, CreditCard, Calendar, AlertTriangle, Loader2, CheckCircle, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Input, Badge, EmptyState } from '@/components/ui/Elements';
import { insuranceAPI } from '@/lib/api';
import { InsuranceData } from '@/types';
import Link from 'next/link';

const PLAN_TYPES = [
  'Individual Health Plan',
  'Family Floater',
  'Critical Illness',
  'Group / Corporate',
  'Government — PMJAY',
  'Government — CGHS',
  'Government — ESI',
  'Other'
];

interface ExpiryStatus {
  label: string;
  color: string;
  bg: string;
}

const getExpiryStatus = (expiryDate: string | undefined): ExpiryStatus | null => {
  if (!expiryDate) return null;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { label: 'Expired', color: 'text-red-600', bg: 'bg-red-100' };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'text-red-600', bg: 'bg-red-100' };
  if (daysLeft <= 60) return { label: `${daysLeft}d left`, color: 'text-amber-600', bg: 'bg-amber-100' };
  return { label: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-100' };
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function FormField({ 
  label, 
  children, 
  helperText 
}: { 
  label: string; 
  children: React.ReactNode; 
  helperText?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {helperText && (
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          {helperText}
        </p>
      )}
    </div>
  );
}

function StyledSelect({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: string[]; 
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  );
}

export default function InsurancePage() {
  const [insuranceData, setInsuranceData] = useState<InsuranceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState<InsuranceData>({
    insuranceProvider: '',
    insuranceCustomerId: '',
    insuranceType: '',
    insuranceSupportNumber: '',
    insuranceExpiryDate: '',
    insuranceSumInsured: ''
  });

  const fetchInsurance = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await insuranceAPI.getInsurance();
      if (response.data.success && response.data.data) {
        setInsuranceData(response.data.data);
        setFormData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch insurance:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsurance(); }, [fetchInsurance]);

  const handleChange = (field: keyof InsuranceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.insuranceProvider || !formData.insuranceCustomerId || !formData.insuranceType || !formData.insuranceSupportNumber) {
      setSaveError('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');
      await insuranceAPI.saveInsurance(formData);
      setSaveSuccess(true);
      setInsuranceData(formData);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error.response?.data?.error || 'Failed to save insurance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCallSupport = () => {
    if (insuranceData?.insuranceSupportNumber) {
      window.location.href = `tel:${insuranceData.insuranceSupportNumber}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const hasInsurance = insuranceData?.insuranceProvider && insuranceData.insuranceCustomerId;
  const expiryStatus = getExpiryStatus(insuranceData?.insuranceExpiryDate);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-gray-900">Insurance</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your health insurance policy</p>
      </motion.div>

      {/* Success Toast */}
      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100"
        >
          <CheckCircle className="w-5 h-5" />
          Insurance saved successfully
        </motion.div>
      )}

      {/* Error Toast */}
      {saveError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-100"
        >
          <AlertTriangle className="w-5 h-5" />
          {saveError}
        </motion.div>
      )}

      {/* Insurance Card (when exists) */}
      {hasInsurance && !isEditing && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{insuranceData.insuranceProvider}</h3>
                  <p className="text-sm text-gray-500">{insuranceData.insuranceType}</p>
                </div>
              </div>
              {expiryStatus && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${expiryStatus.bg} ${expiryStatus.color}`}>
                  {expiryStatus.label}
                </span>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Member ID</span>
                <span className="text-sm font-medium text-gray-800 font-mono">{insuranceData.insuranceCustomerId}</span>
              </div>
              {insuranceData.insuranceSumInsured && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Sum Insured</span>
                  <span className="text-sm font-medium text-gray-800">₹{insuranceData.insuranceSumInsured}</span>
                </div>
              )}
              {insuranceData.insuranceExpiryDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Expires</span>
                  <span className="text-sm font-medium text-gray-800">{formatDate(insuranceData.insuranceExpiryDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Support</span>
                <span className="text-sm font-medium text-gray-800">{insuranceData.insuranceSupportNumber}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="filled" className="flex-1" onClick={() => setIsEditing(true)}>
                Edit Policy
              </Button>
              <Button variant="outlined" onClick={handleCallSupport}>
                <Phone className="w-4 h-4 mr-1.5" />
                Call Support
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Add/Edit Form */}
      {(!hasInsurance || isEditing) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              {hasInsurance ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
            </h3>
            
            <div className="space-y-5">
              {/* Policy Details Section */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Policy Details</p>
                
                <FormField label="Insurance Provider Name *" helperText="The name of your insurance company">
                  <Input
                    value={formData.insuranceProvider || ''}
                    onChange={(e) => handleChange('insuranceProvider', e.target.value)}
                    icon={<Shield className="w-4 h-4" />}
                    placeholder="e.g., Star Health Insurance"
                  />
                </FormField>
                
                <FormField label="Member / Customer ID *" helperText="Your unique policy number (found on insurance card)">
                  <Input
                    value={formData.insuranceCustomerId || ''}
                    onChange={(e) => handleChange('insuranceCustomerId', e.target.value)}
                    icon={<CreditCard className="w-4 h-4" />}
                    placeholder="e.g., SH-2024-00391847"
                  />
                </FormField>
                
                <FormField label="Plan Type *" helperText="Select the type of your health insurance plan">
                  <StyledSelect
                    value={formData.insuranceType || ''}
                    onChange={(value) => handleChange('insuranceType', value)}
                    options={PLAN_TYPES}
                    placeholder="Select plan type"
                  />
                </FormField>
                
                <FormField label="Support Number *" helperText="Customer care helpline for claims & queries">
                  <Input
                    type="tel"
                    value={formData.insuranceSupportNumber || ''}
                    onChange={(e) => handleChange('insuranceSupportNumber', e.target.value)}
                    icon={<Phone className="w-4 h-4" />}
                    placeholder="e.g., 1800-425-2255"
                  />
                </FormField>
              </div>

              {/* Coverage Section */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Coverage (Optional)</p>
                
                <FormField label="Sum Insured (Coverage)" helperText="Maximum amount covered by your policy (in ₹)">
                  <Input
                    type="number"
                    value={formData.insuranceSumInsured || ''}
                    onChange={(e) => handleChange('insuranceSumInsured', e.target.value)}
                    icon={<CreditCard className="w-4 h-4" />}
                    placeholder="e.g., 500000"
                  />
                </FormField>
                
                <FormField label="Policy Expiry Date" helperText="When your current policy expires">
                  <Input
                    type="date"
                    value={formData.insuranceExpiryDate || ''}
                    onChange={(e) => handleChange('insuranceExpiryDate', e.target.value)}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                </FormField>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="filled" className="flex-1" onClick={handleSave} isLoading={isSaving}>
                  {hasInsurance ? 'Update Insurance' : 'Save Insurance'}
                </Button>
                {hasInsurance && (
                  <Button variant="outlined" onClick={() => {
                    setIsEditing(false);
                    setFormData(insuranceData);
                    setSaveError('');
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Emergency Access Note */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5 bg-amber-50 border-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Visible in Emergency Access</h4>
              <p className="text-sm text-gray-600 mt-1">
                If you are unconscious, first responders will see your insurer name and support number for quick contact.
              </p>
              <div className="mt-3 pt-3 border-t border-amber-100">
                <p className="text-xs text-gray-500">
                  Full policy details remain private. Only your insurer and support number are visible in emergency.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Profile Link Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
        <Link href="/profile">
          <Card className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">View Full Profile</p>
                <p className="text-sm text-gray-500">Personal and medical information</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Card>
        </Link>
      </motion.div>
    </div>
  );
}