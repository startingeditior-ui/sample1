'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, CreditCard, Calendar, AlertTriangle, Loader2, CheckCircle, ChevronRight, HelpCircle, Upload, X, FileText, Image as ImageIcon, Plus, IndianRupee, Building2, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Input } from '@/components/ui/Elements';
import { insuranceAPI } from '@/lib/api';
import { InsuranceData, InsuranceAvailment, InsuranceSummary } from '@/types';
import Link from 'next/link';

const PROVIDERS = [
  { id: 'star-health', name: 'Star Health and Allied Insurance', plans: [
    { name: 'Star Comprehensive Insurance Policy', coverage: '5 Lakh - 1 Crore', type: 'Health' },
    { name: 'Star Family Health Optima', coverage: '3 Lakh - 25 Lakh', type: 'Family Floater' },
    { name: 'Star Senior Citizens Red Carpet', coverage: '1 Lakh - 25 Lakh', type: 'Senior Citizen' },
    { name: 'Star Diabetes Safe', coverage: '3 Lakh - 10 Lakh', type: 'Specialized' },
  ]},
  { id: 'niva-bupa', name: 'Niva Bupa Health Insurance', plans: [
    { name: 'ReAssure 2.0', coverage: '3 Lakh - 1 Crore', type: 'Health' },
    { name: 'Aspire Plan', coverage: '3 Lakh - 3 Crore', type: 'Health' },
    { name: 'Health Premia (International)', coverage: '5 Lakh - 3 Crore', type: 'International' },
    { name: 'Senior First', coverage: '5 Lakh - 25 Lakh', type: 'Senior Citizen' },
  ]},
  { id: 'hdfc-ergo', name: 'HDFC ERGO Health Insurance', plans: [
    { name: 'Optima Secure', coverage: '5 Lakh - 2 Crore', type: 'Health' },
    { name: 'Optima Restore', coverage: '3 Lakh - 50 Lakh', type: 'Health' },
    { name: 'My:health Suraksha', coverage: '3 Lakh - 75 Lakh', type: 'Health' },
    { name: 'Optima Super Secure', coverage: '1 Crore - 10 Crore', type: 'Ultra-High Cover' },
  ]},
  { id: 'care-health', name: 'Care Health Insurance', plans: [
    { name: 'Care Plan', coverage: '4 Lakh - 6 Crore', type: 'Health' },
    { name: 'Care Supreme', coverage: '5 Lakh - 6 Crore', type: 'Premium' },
    { name: 'Care Joy', coverage: '3 Lakh - 10 Lakh', type: 'Maternity' },
  ]},
  { id: 'aditya-birla', name: 'Aditya Birla Health Insurance', plans: [
    { name: 'Activ Assure Diamond / Diamond Plus', coverage: '2 Lakh - 2 Crore', type: 'Health' },
    { name: 'Activ Health Enhanced', coverage: '2 Lakh - 2 Crore', type: 'Chronic Disease' },
    { name: 'Global Health Secure', coverage: '1 Crore - 6 Crore', type: 'International' },
  ]},
  { id: 'new-india', name: 'New India Assurance', plans: [
    { name: 'New India Mediclaim Policy', coverage: '1 Lakh - 15 Lakh', type: 'Health' },
    { name: 'New India Floater Mediclaim', coverage: '2 Lakh - 15 Lakh', type: 'Family Floater' },
    { name: 'Asha Kiran', coverage: '1 Lakh - 5 Lakh', type: 'Girl Child' },
  ]},
  { id: 'united-india', name: 'United India Insurance', plans: [
    { name: 'UNI Mediclaim Policy', coverage: '1 Lakh - 10 Lakh', type: 'Health' },
    { name: 'United India Family Medicare', coverage: '1 Lakh - 10 Lakh', type: 'Family Floater' },
  ]},
  { id: 'national-insurance', name: 'National Insurance Company', plans: [
    { name: 'Mediclaim 2012 Policy', coverage: '1 Lakh - 10 Lakh', type: 'Health' },
    { name: 'Parivar Mediclaim', coverage: '1 Lakh - 10 Lakh', type: 'Family Floater' },
  ]},
  { id: 'oriental-insurance', name: 'Oriental Insurance Company', plans: [
    { name: 'Individual Mediclaim Policy', coverage: '1 Lakh - 10 Lakh', type: 'Health' },
    { name: 'Happy Family Floater', coverage: '1 Lakh - 10 Lakh', type: 'Family Floater' },
  ]},
  { id: 'manipal-cigna', name: 'ManipalCigna Health Insurance', plans: [
    { name: 'ProHealth Plus', coverage: '4.5 Lakh - 1 Crore', type: 'Health' },
    { name: 'ProHealth Protect', coverage: '2.5 Lakh - 10 Lakh', type: 'Entry-Level' },
    { name: 'Lifestyle Protection - Critical Care', coverage: '5 Lakh - 3 Crore', type: 'Critical Illness' },
  ]},
  { id: 'bajaj-allianz', name: 'Bajaj Allianz Health Insurance', plans: [
    { name: 'Health Guard', coverage: '1.5 Lakh - 50 Lakh', type: 'Health' },
    { name: 'Global Personal Guard', coverage: '5 Lakh - 2 Crore', type: 'International' },
    { name: 'Extra Care Plus', coverage: '10 Lakh - 50 Lakh', type: 'Super Top-Up' },
  ]},
  { id: 'icici-lombard', name: 'ICICI Lombard Health Insurance', plans: [
    { name: 'Complete Health Insurance', coverage: '5 Lakh - 50 Lakh', type: 'Health' },
    { name: 'Health Advantage Plus', coverage: '3 Lakh - 10 Lakh', type: 'Top-Up' },
  ]},
  { id: 'tata-aig', name: 'Tata AIG Health Insurance', plans: [
    { name: 'MediCare / MediCare Premier', coverage: '5 Lakh - 2 Crore', type: 'Health' },
    { name: 'Wellsurance Family', coverage: '2 Lakh - 10 Lakh', type: 'Family Floater' },
  ]},
  { id: 'sbi-health', name: 'SBI Health Insurance', plans: [
    { name: 'Arogya Supreme', coverage: '3 Lakh - 3 Crore', type: 'Health' },
    { name: 'Arogya Plus', coverage: '1 Lakh - 3 Lakh', type: 'Basic' },
  ]},
  { id: 'kotak-mahindra', name: 'Kotak Mahindra Health Insurance', plans: [
    { name: 'Health Shield', coverage: '2 Lakh - 1 Crore', type: 'Health' },
    { name: 'Super Top Up Plan', coverage: '5 Lakh - 1 Crore', type: 'Top-Up' },
  ]},
  { id: 'digit-health', name: 'Digit Health Insurance', plans: [
    { name: 'Health Care Plus', coverage: '2 Lakh - 50 Lakh', type: 'Health' },
    { name: 'Group Health Insurance', coverage: '1 Lakh - 25 Lakh', type: 'Group' },
  ]},
  { id: 'edelweiss', name: 'Edelweiss Health Insurance', plans: [
    { name: 'Health Total', coverage: '5 Lakh - 3 Crore', type: 'Health' },
  ]},
  { id: 'acko', name: 'Acko Health Insurance', plans: [
    { name: 'Acko Platinum Health Plan', coverage: '1 Crore', type: 'Premium' },
    { name: 'Acko Standard Health Plan', coverage: '5 Lakh - 1 Crore', type: 'Standard' },
  ]},
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
        {options.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  );
}

function DocumentUploader({
  files,
  onFilesChange
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newPreviews: string[] = [];
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      }
    });
    
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 font-medium">Click to upload documents</p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 10MB each)</p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {files.map((file, index) => (
            <div key={index} className="relative border rounded-lg p-3 flex items-center gap-3">
              <span aria-label="Image file">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-8 h-8 text-emerald-500" />
                ) : (
                  <FileText className="w-8 h-8 text-blue-500" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Provider', 'Plan', 'Details'];
  
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
              index + 1 < currentStep 
                ? 'bg-emerald-500 text-white' 
                : index + 1 === currentStep 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {index + 1 < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-sm ${index + 1 === currentStep ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${index + 1 < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function InsurancePage() {
  const [insuranceData, setInsuranceData] = useState<InsuranceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Insurance availments state
  const [availments, setAvailments] = useState<InsuranceAvailment[]>([]);
  const [insuranceSummary, setInsuranceSummary] = useState<InsuranceSummary | null>(null);
  const [isLoadingAvailments, setIsLoadingAvailments] = useState(false);
  const [showAddAvailment, setShowAddAvailment] = useState(false);
  const [newAvailment, setNewAvailment] = useState({
    hospitalName: '',
    amountAvailed: '',
    dateOfAvailment: '',
    reason: ''
  });
  const [isAddingAvailment, setIsAddingAvailment] = useState(false);
  
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedDocUrls, setUploadedDocUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState<InsuranceData>({
    insuranceProvider: '',
    insurancePlan: '',
    insuranceCustomerId: '',
    insuranceType: '',
    insuranceSupportNumber: '',
    insuranceExpiryDate: '',
    insuranceSumInsured: '',
    insuranceDocuments: []
  });

  const fetchInsurance = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await insuranceAPI.getInsurance();
      if (response.data.success && response.data.data) {
        setInsuranceData(response.data.data);
        setFormData(response.data.data);
        setUploadedDocUrls(response.data.data.insuranceDocuments || []);
        if (response.data.data.insuranceProvider) {
          setSelectedProvider(response.data.data.insuranceProvider);
        }
        if (response.data.data.insurancePlan) {
          setSelectedPlan(response.data.data.insurancePlan);
        }
      }
    } catch (error) {
      // In production, use proper error reporting service
      // console.error('Failed to fetch insurance:', error);
      setError('Failed to load insurance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsurance(); }, [fetchInsurance]);

  const fetchAvailments = useCallback(async () => {
    try {
      setIsLoadingAvailments(true);
      const [availmentsRes, summaryRes] = await Promise.all([
        insuranceAPI.getAvailments(),
        insuranceAPI.getInsuranceSummary()
      ]);
      if (availmentsRes.data.success) {
        setAvailments(availmentsRes.data.data.availments || []);
      }
      if (summaryRes.data.success) {
        setInsuranceSummary(summaryRes.data.data);
      }
    } catch (error) {
      // Silent fail for availments
    } finally {
      setIsLoadingAvailments(false);
    }
  }, []);

  useEffect(() => {
    if (insuranceData?.insuranceProvider) {
      fetchAvailments();
    }
  }, [insuranceData?.insuranceProvider, fetchAvailments]);

  const handleAddAvailment = async () => {
    if (!newAvailment.hospitalName || !newAvailment.amountAvailed || !newAvailment.dateOfAvailment) {
      setSaveError('Please fill in hospital name, amount, and date');
      return;
    }
    
    try {
      setIsAddingAvailment(true);
      setSaveError('');
      await insuranceAPI.addAvailment({
        hospitalName: newAvailment.hospitalName,
        amountAvailed: parseFloat(newAvailment.amountAvailed),
        dateOfAvailment: newAvailment.dateOfAvailment,
        reason: newAvailment.reason || undefined
      });
      setShowAddAvailment(false);
      setNewAvailment({ hospitalName: '', amountAvailed: '', dateOfAvailment: '', reason: '' });
      fetchAvailments();
    } catch (error: any) {
      setSaveError(error.response?.data?.error || 'Failed to add availment');
    } finally {
      setIsAddingAvailment(false);
    }
  };

  const handleChange = (field: keyof InsuranceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getProviderPlans = () => {
    const provider = PROVIDERS.find(p => p.name === selectedProvider);
    return provider?.plans || [];
  };

  const handleNextStep = () => {
    if (wizardStep === 1 && !selectedProvider) {
      setSaveError('Please select an insurance provider');
      return;
    }
    if (wizardStep === 2 && !selectedPlan) {
      setSaveError('Please select a plan');
      return;
    }
    setSaveError('');
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardStep(prev => prev - 1);
    setSaveError('');
  };

  const handleUploadDocuments = async () => {
    if (uploadedFiles.length === 0) return;
    
    try {
      setUploadLoading(true);
      const response = await insuranceAPI.uploadDocuments(uploadedFiles);
      if (response.data.success && response.data.files) {
        setUploadedDocUrls(response.data.files);
        setFormData(prev => ({ ...prev, insuranceDocuments: response.data.files }));
      }
    } catch (error: any) {
      setSaveError(error.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider || !selectedPlan || !formData.insuranceCustomerId || !formData.insuranceSupportNumber) {
      setSaveError('Please fill in all required fields');
      return;
    }

    const provider = PROVIDERS.find(p => p.name === selectedProvider);
    
    try {
      setIsSaving(true);
      setSaveError('');
      await insuranceAPI.saveInsurance({
        ...formData,
        insuranceProvider: provider?.name || selectedProvider,
        insurancePlan: selectedPlan,
        insuranceDocuments: uploadedDocUrls
      });
      setSaveSuccess(true);
      setInsuranceData({ ...formData, insuranceProvider: provider?.name, insurancePlan: selectedPlan, insuranceDocuments: uploadedDocUrls });
      setIsEditing(false);
      setWizardStep(1);
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

  const startEditing = () => {
    setIsEditing(true);
    setWizardStep(1);
    setSelectedProvider('');
    setSelectedPlan('');
    setUploadedFiles([]);
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-gray-900">Insurance</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your health insurance policy</p>
      </motion.div>

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

      {(hasInsurance && !isEditing) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{insuranceData.insuranceProvider}</h3>
                  <p className="text-sm text-gray-500">{insuranceData.insurancePlan}</p>
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
              <Button variant="filled" size="sm" className="flex-1" onClick={startEditing}>
                Edit Policy
              </Button>
              <Button variant="outlined" size="sm" onClick={handleCallSupport}>
                <Phone className="w-3.5 h-3.5 mr-1" />
                Call
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Insurance Summary Card */}
      {hasInsurance && insuranceSummary && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              Insurance Coverage Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Sum Insured</p>
                <p className="text-lg font-bold text-gray-900">₹{insuranceSummary.sumInsured.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Availed</p>
                <p className="text-lg font-bold text-emerald-600">₹{insuranceSummary.totalAvailed.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Remaining</p>
                <p className="text-lg font-bold text-gray-900">₹{insuranceSummary.remaining.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Pending Claims</p>
                <p className="text-lg font-bold text-amber-600">{insuranceSummary.pendingClaims}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Pending Claims Section */}
      {hasInsurance && insuranceSummary && insuranceSummary.pendingClaims > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Pending Claims Details
            </h3>
            <div className="bg-white rounded-lg p-3 text-center mb-4">
              <p className="text-xs text-gray-500 mb-1">Total Pending Amount</p>
              <p className="text-2xl font-bold text-amber-600">₹{insuranceSummary.pendingAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="space-y-3">
              {availments.filter(a => a.claimStatus === 'PENDING').map((availment) => (
                <div key={availment.id} className="border border-amber-100 rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{availment.hospitalName || 'Unknown Hospital'}</p>
                        <p className="text-xs text-gray-500">{formatDate(availment.dateOfAvailment)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">₹{availment.amountAvailed.toLocaleString('en-IN')}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        PENDING
                      </span>
                    </div>
                  </div>
                  {availment.reason && (
                    <div className="mt-2 pt-2 border-t border-amber-50">
                      <p className="text-xs text-gray-500">Reason:</p>
                      <p className="text-sm text-gray-700">{availment.reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Claims History Section */}
      {hasInsurance && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-gray-600" />
                Claims History
              </h3>
            </div>

            {isLoadingAvailments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : availments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileQuestion className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No claims recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your insurance claims to track coverage usage</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availments.map((availment) => (
                  <div key={availment.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{availment.hospitalName || 'Unknown Hospital'}</p>
                          <p className="text-xs text-gray-500">{formatDate(availment.dateOfAvailment)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{availment.amountAvailed.toLocaleString('en-IN')}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          availment.claimStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          availment.claimStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {availment.claimStatus}
                        </span>
                      </div>
                    </div>
                    {availment.reason && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Reason:</p>
                        <p className="text-sm text-gray-700">{availment.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Add Availment Modal */}
      <AnimatePresence>
        {showAddAvailment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddAvailment(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-gray-800 mb-4">Add Insurance Claim</h3>
              <div className="space-y-4">
                <FormField label="Hospital Name *">
                  <Input
                    value={newAvailment.hospitalName}
                    onChange={(e) => setNewAvailment(prev => ({ ...prev, hospitalName: e.target.value }))}
                    placeholder="e.g., Apollo Hospital"
                    icon={<Building2 className="w-4 h-4" />}
                  />
                </FormField>
                <FormField label="Amount Availed *">
                  <Input
                    type="number"
                    value={newAvailment.amountAvailed}
                    onChange={(e) => setNewAvailment(prev => ({ ...prev, amountAvailed: e.target.value }))}
                    placeholder="e.g., 50000"
                    icon={<IndianRupee className="w-4 h-4" />}
                  />
                </FormField>
                <FormField label="Date of Availment *">
                  <Input
                    type="date"
                    value={newAvailment.dateOfAvailment}
                    onChange={(e) => setNewAvailment(prev => ({ ...prev, dateOfAvailment: e.target.value }))}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                </FormField>
                <FormField label="Reason / Root Cause">
                  <textarea
                    value={newAvailment.reason}
                    onChange={(e) => setNewAvailment(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Cardiac surgery, Knee replacement, etc."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={3}
                  />
                </FormField>
              </div>
              {saveError && (
                <div className="flex items-center gap-2 mt-4 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4" />
                  {saveError}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <Button variant="outlined" className="flex-1" onClick={() => {
                  setShowAddAvailment(false);
                  setNewAvailment({ hospitalName: '', amountAvailed: '', dateOfAvailment: '', reason: '' });
                  setSaveError('');
                }}>
                  Cancel
                </Button>
                <Button variant="filled" className="flex-1" onClick={handleAddAvailment} isLoading={isAddingAvailment}>
                  Add Claim
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {((!hasInsurance || isEditing) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-center">
              {hasInsurance ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
            </h3>
            
            <StepIndicator currentStep={wizardStep} />

            <AnimatePresence mode="wait">
              {wizardStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-600 mb-4">Select your insurance provider</p>
                  <FormField label="Insurance Provider *">
                    <StyledSelect
                      value={selectedProvider}
                      onChange={(value) => {
                        setSelectedProvider(value);
                        setSelectedPlan('');
                        handleChange('insuranceProvider', value);
                      }}
                      options={PROVIDERS.map(p => p.name)}
                      placeholder="Select provider"
                    />
                  </FormField>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="filled" 
                      size="sm"
                      className="flex-1" 
                      onClick={handleNextStep}
                      disabled={!selectedProvider}
                    >
                      Next
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-600 mb-4">Select your insurance plan</p>
                  <FormField label="Plan *">
                    <StyledSelect
                      value={selectedPlan}
                      onChange={(value) => setSelectedPlan(value)}
                      options={getProviderPlans().map(p => p.name)}
                      placeholder="Select plan"
                      disabled={!selectedProvider}
                    />
                  </FormField>

                  {selectedPlan && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {(() => {
                        const plan = getProviderPlans().find(p => p.name === selectedPlan);
                        return plan ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Coverage</span>
                              <span className="text-sm font-medium text-gray-800">₹{plan.coverage}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Plan Type</span>
                              <span className="text-sm font-medium text-gray-800">{plan.type}</span>
                            </div>
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button variant="outlined" size="sm" onClick={handlePrevStep}>
                      Back
                    </Button>
                    <Button 
                      variant="filled" 
                      size="sm"
                      className="flex-1" 
                      onClick={handleNextStep}
                      disabled={!selectedPlan}
                    >
                      Next
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Policy Details</p>
                    
                    <FormField label="Member / Customer ID *" helperText="Your unique policy number">
                      <Input
                        value={formData.insuranceCustomerId || ''}
                        onChange={(e) => handleChange('insuranceCustomerId', e.target.value)}
                        icon={<CreditCard className="w-4 h-4" />}
                        placeholder="e.g., POL-2024-00391847"
                      />
                    </FormField>
                    
                    <FormField label="Support Number *" helperText="Customer care helpline">
                      <Input
                        type="tel"
                        value={formData.insuranceSupportNumber || ''}
                        onChange={(e) => handleChange('insuranceSupportNumber', e.target.value)}
                        icon={<Phone className="w-4 h-4" />}
                        placeholder="e.g., 1800-425-2255"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Coverage (Optional)</p>
                    
                    <FormField label="Sum Insured">
                      <Input
                        type="number"
                        value={formData.insuranceSumInsured || ''}
                        onChange={(e) => handleChange('insuranceSumInsured', e.target.value)}
                        icon={<CreditCard className="w-4 h-4" />}
                        placeholder="e.g., 500000"
                      />
                    </FormField>
                    
                    <FormField label="Policy Expiry Date">
                      <Input
                        type="date"
                        value={formData.insuranceExpiryDate || ''}
                        onChange={(e) => handleChange('insuranceExpiryDate', e.target.value)}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </FormField>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Documents (Optional)</p>
                    <DocumentUploader
                      files={uploadedFiles}
                      onFilesChange={setUploadedFiles}
                    />
                    {uploadedFiles.length > 0 && (
                      <Button 
                        variant="outlined" 
                        size="sm"
                        onClick={handleUploadDocuments}
                        isLoading={uploadLoading}
                      >
                        <Upload className="w-4 h-4 mr-1.5" />
                        Upload Documents
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outlined" size="sm" onClick={handlePrevStep}>
                      Back
                    </Button>
                    <Button variant="filled" size="sm" className="flex-1" onClick={handleSave} isLoading={isSaving}>
                      {hasInsurance ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5 bg-gray-50 border-gray-200 opacity-75">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Buy New Insurance</p>
              <p className="text-sm text-gray-500">Explore our wide range of insurance plans</p>
            </div>
            <Button variant="outlined" size="sm" disabled>
              Coming Soon
            </Button>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5 bg-amber-50 border-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Visible in Emergency Access</h4>
              <p className="text-sm text-gray-600 mt-1">
                If you are unconscious, first responders will see your insurer name and support number for quick contact.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

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