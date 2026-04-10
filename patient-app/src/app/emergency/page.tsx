'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Droplet, AlertTriangle, Heart, PhoneCall, Share2, Shield, User, MapPin, Copy, Check, Download, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Elements';
import { useAuth } from '@/hooks/useAuth';
import { patientAPI } from '@/lib/api';
import QRCode from 'qrcode';
import Image from 'next/image';

interface EmergencyDataResponse {
  name: string;
  gender: string;
  dob: string | null;
  bloodGroup: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  medications: string[];
  phone: string;
  guardianName: string;
  guardianMobile: string;
  guardianLocation: string;
}

export default function EmergencyPage() {
  const { patient, insuranceData, isAuthInitializing } = useAuth();
  const [emergencyData, setEmergencyData] = useState<EmergencyDataResponse | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEmergencyData = async () => {
      if (!patient?.patientId) return;
      try {
        const response = await patientAPI.getEmergencyData();
        if (response.data.success) {
          setEmergencyData(response.data.data);
        }
    } catch (error) {
      // In production, use proper error reporting service
      // console.error('Failed to fetch emergency data:', error);
      setError('Failed to load emergency data. Please try again.');
    } finally {
      setIsLoading(false);
    }
    };

    if (patient?.patientId) {
      fetchEmergencyData();
      QRCode.toDataURL(`EMERGENCY:${patient.patientId}`, {
        width: 150,
        margin: 2,
        color: {
          dark: '#BA1A1A',
          light: '#FFFFFF',
        },
      }).then(setQrCodeUrl);
    }
  }, [patient?.patientId]);

  const handleShare = async () => {
    if (!emergencyData) return;
    const shareData = `
🚨 MEDLINK EMERGENCY CARD 🚨

Patient ID: ${patient?.patientId}
Blood Group: ${displayData.bloodGroup}
Allergies: ${emergencyData.allergies.join(', ')}
Chronic Diseases: ${emergencyData.chronicDiseases.join(', ')}

Emergency / Guardian Contact: ${emergencyData.emergencyContact}
Name: ${emergencyData.emergencyContactName}
Relationship: ${emergencyData.emergencyContactRelationship}
Guardian Mobile: ${emergencyData.guardianMobile}
Guardian Location: ${emergencyData.guardianLocation}

${insuranceData?.insuranceProvider ? `Insurance Provider: ${insuranceData.insuranceProvider}` : ''}
${insuranceData?.insuranceCustomerId ? `Insurance ID: ${insuranceData.insuranceCustomerId}` : ''}
${insuranceData?.insuranceType ? `Insurance Type: ${insuranceData.insuranceType}` : ''}
${insuranceData?.insuranceSupportNumber ? `Insurance Support: ${insuranceData.insuranceSupportNumber}` : ''}

Scan QR code or visit MedLink to verify.
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MedLink Emergency Card',
          text: shareData,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy(shareData);
        }
      }
    } else {
      handleCopy(shareData);
    }
  };

    const handleCopy = async (text?: string) => {
      if (!emergencyData) return;
      const shareData = text || `
🚨 MEDLINK EMERGENCY CARD 🚨

Patient ID: ${patient?.patientId}
Blood Group: ${displayData.bloodGroup}
Allergies: ${emergencyData.allergies.join(', ')}
Chronic Diseases: ${emergencyData.chronicDiseases.join(', ')}

Emergency / Guardian Contact: ${emergencyData.emergencyContact}
Name: ${emergencyData.emergencyContactName}
Relationship: ${emergencyData.emergencyContactRelationship}
Guardian Mobile: ${emergencyData.guardianMobile}
Guardian Location: ${emergencyData.guardianLocation}

${insuranceData?.insuranceProvider ? `Insurance Provider: ${insuranceData.insuranceProvider}` : ''}
${insuranceData?.insuranceCustomerId ? `Insurance ID: ${insuranceData.insuranceCustomerId}` : ''}
${insuranceData?.insuranceType ? `Insurance Type: ${insuranceData.insuranceType}` : ''}
${insuranceData?.insuranceSupportNumber ? `Insurance Support: ${insuranceData.insuranceSupportNumber}` : ''}

Scan QR code or visit MedLink to verify.
      `.trim();

      try {
        await navigator.clipboard.writeText(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Silently fail - copy is optional enhancement
      }
    };

    const handleDownload = async () => {
      if (!cardRef.current) return;

      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(cardRef.current, {
          background: '#fef2f2',
        } as any);
        
        const link = document.createElement('a');
        link.download = `medlink-emergency-${patient?.patientId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        // Silently fail - download is optional enhancement
      }
    };

  if (isAuthInitializing || isLoading || !patient) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const displayData = emergencyData || {
    bloodGroup: patient.bloodGroup || 'Unknown',
    allergies: patient.allergies || ['None'],
    chronicDiseases: patient.chronicDiseases || ['None'],
    emergencyContact: patient.emergencyContact || 'Not set',
    emergencyContactName: patient.emergencyContactName || '',
    emergencyContactRelationship: patient.emergencyContactRelationship || '',
    guardianName: patient.guardianName || 'Not set',
    guardianMobile: patient.guardianMobile || 'Not set',
    guardianLocation: patient.guardianLocation || 'Not set',
  };

  const hasInsurance = insuranceData && (insuranceData.insuranceProvider || insuranceData.insuranceCustomerId);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-red-600"
      >
        <AlertCircle className="w-6 h-6" />
        <h1 className="text-xl font-bold">Emergency Card</h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-gray-500 text-sm"
      >
        Show this to medical staff in case of emergency
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <Card ref={cardRef} className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-5 max-w-sm w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              <span className="font-bold text-red-600">MEDLINK ID</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Patient ID</p>
              <p className="font-mono font-bold text-gray-900">{patient.patientId}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Droplet className="w-6 h-6 text-error" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Blood Group</p>
                <p className="text-2xl font-bold text-red-600">{displayData.bloodGroup}</p>
              </div>
            </div>

            <div className="h-px bg-red-200 my-1" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm font-medium text-gray-900">Known Allergies</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayData.allergies.map((allergy, idx) => (
                  <span key={idx} className="bg-red-100 text-error px-3 py-1 rounded-full text-sm font-medium">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-red-600" />
                <p className="text-sm font-medium text-gray-900">Chronic Conditions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayData.chronicDiseases.map((disease, idx) => (
                  <span key={idx} className="bg-red-100 text-error px-3 py-1 rounded-full text-sm font-medium">
                    {disease}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-px bg-red-200 my-1" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <PhoneCall className="w-4 h-4 text-red-600" />
                <p className="text-sm font-medium text-gray-900">Emergency / Guardian</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-text-outline" />
                  <p className="text-base font-medium text-gray-900">{displayData.emergencyContact}</p>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-text-outline" />
                  <p className="text-base font-medium text-gray-900">{displayData.emergencyContactName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-text-outline" />
                  <p className="text-base font-medium text-gray-900">{displayData.emergencyContactRelationship}</p>
                </div>
                {displayData.guardianMobile && (
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-text-outline" />
                    <p className="text-base font-medium text-gray-900">Guardian: {displayData.guardianMobile}</p>
                  </div>
                )}
                {displayData.guardianLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-text-outline" />
                    <p className="text-base font-medium text-gray-900">{displayData.guardianLocation}</p>
                  </div>
                )}
              </div>
            </div>

            {hasInsurance && (
              <>
                <div className="divider" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-error" />
                    <p className="text-sm font-medium text-gray-900">Insurance Information</p>
                  </div>
                  <div className="space-y-2">
                    {insuranceData?.insuranceProvider && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <p className="text-base font-medium text-gray-900">{insuranceData.insuranceProvider}</p>
                      </div>
                    )}
                    {insuranceData?.insuranceCustomerId && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p className="text-base font-medium text-gray-900">ID: {insuranceData.insuranceCustomerId}</p>
                      </div>
                    )}
                    {insuranceData?.insuranceType && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p className="text-base font-medium text-gray-900">{insuranceData.insuranceType}</p>
                      </div>
                    )}
                    {insuranceData?.insuranceSupportNumber && (
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-gray-400" />
                        <p className="text-base font-medium text-gray-900">{insuranceData.insuranceSupportNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} alt="Emergency QR" width={128} height={128} className="w-32 h-32" unoptimized />
            ) : (
              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-error" />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <Card className="bg-yellow-50 border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-text-primary">Important</h3>
              <p className="text-sm text-text-secondary mt-1">
                This data is accessible to hospitals even without your consent in case of emergency. 
                Full medical records remain protected and require OTP/NFC verification.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="filled" className="flex-1" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Card
          </Button>
          <Button variant="outlined" onClick={() => handleCopy()}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button variant="outlined" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
