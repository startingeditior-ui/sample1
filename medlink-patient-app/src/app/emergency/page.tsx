'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Droplet, AlertTriangle, Heart, PhoneCall, Share2, Shield, User, MapPin, Copy, Check, Download, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Elements';
import { useAuth } from '@/hooks/useAuth';
import QRCode from 'qrcode';
import Image from 'next/image';

export default function EmergencyPage() {
  const { patient, insuranceData } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (patient?.patientId) {
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
    const shareData = `
🚨 MEDLINK EMERGENCY CARD 🚨

Patient ID: ${patient?.patientId}
Blood Group: ${emergencyData.bloodGroup}
Allergies: ${emergencyData.allergies.join(', ')}
Chronic Diseases: ${emergencyData.chronicDiseases.join(', ')}

Emergency Contact: ${emergencyData.emergencyContact}
Guardian: ${emergencyData.guardianName}
Guardian Phone: ${emergencyData.guardianMobile}
Guardian Location: ${emergencyData.guardianLocation}

${emergencyData.insuranceProvider ? `Insurance Provider: ${emergencyData.insuranceProvider}` : ''}
${emergencyData.insuranceCustomerId ? `Insurance ID: ${emergencyData.insuranceCustomerId}` : ''}
${emergencyData.insuranceType ? `Insurance Type: ${emergencyData.insuranceType}` : ''}
${emergencyData.insuranceSupportNumber ? `Insurance Support: ${emergencyData.insuranceSupportNumber}` : ''}

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
    const shareData = text || `
🚨 MEDLINK EMERGENCY CARD 🚨

Patient ID: ${patient?.patientId}
Blood Group: ${emergencyData.bloodGroup}
Allergies: ${emergencyData.allergies.join(', ')}
Chronic Diseases: ${emergencyData.chronicDiseases.join(', ')}

Emergency Contact: ${emergencyData.emergencyContact}
Guardian: ${emergencyData.guardianName}
Guardian Phone: ${emergencyData.guardianMobile}
Guardian Location: ${emergencyData.guardianLocation}

${emergencyData.insuranceProvider ? `Insurance Provider: ${emergencyData.insuranceProvider}` : ''}
${emergencyData.insuranceCustomerId ? `Insurance ID: ${emergencyData.insuranceCustomerId}` : ''}
${emergencyData.insuranceType ? `Insurance Type: ${emergencyData.insuranceType}` : ''}
${emergencyData.insuranceSupportNumber ? `Insurance Support: ${emergencyData.insuranceSupportNumber}` : ''}

Scan QR code or visit MedLink to verify.
    `.trim();

    try {
      await navigator.clipboard.writeText(shareData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
      console.error('Failed to download:', err);
    }
  };

  if (!patient) return null;

  const emergencyData = {
    bloodGroup: patient.bloodGroup || 'Unknown',
    allergies: patient.allergies || ['None'],
    chronicDiseases: patient.chronicDiseases || ['None'],
    emergencyContact: patient.emergencyContact || 'Not set',
    guardianName: patient.guardianName || 'Not set',
    guardianMobile: patient.guardianMobile || 'Not set',
    guardianLocation: patient.guardianLocation || 'Not set',
    insuranceProvider: insuranceData?.insuranceProvider || '',
    insuranceCustomerId: insuranceData?.insuranceCustomerId || '',
    insuranceType: insuranceData?.insuranceType || '',
    insuranceSupportNumber: insuranceData?.insuranceSupportNumber || '',
  };

  const hasInsurance = insuranceData && (insuranceData.insuranceProvider || insuranceData.insuranceCustomerId);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-error"
      >
        <AlertCircle className="w-6 h-6" />
        <h1 className="text-xl font-bold">Emergency Card</h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-text-secondary text-sm"
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
              <Shield className="w-6 h-6 text-error" />
              <span className="font-bold text-error">MEDLINK ID</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">Patient ID</p>
              <p className="font-mono font-bold text-text-primary">{patient.patientId}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Droplet className="w-6 h-6 text-error" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Blood Group</p>
                <p className="text-2xl font-bold text-error">{emergencyData.bloodGroup}</p>
              </div>
            </div>

            <div className="divider" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-error" />
                <p className="text-sm font-medium text-text-primary">Known Allergies</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {emergencyData.allergies.map((allergy, idx) => (
                  <span key={idx} className="bg-red-100 text-error px-3 py-1 rounded-full text-sm font-medium">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-error" />
                <p className="text-sm font-medium text-text-primary">Chronic Conditions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {emergencyData.chronicDiseases.map((disease, idx) => (
                  <span key={idx} className="bg-red-100 text-error px-3 py-1 rounded-full text-sm font-medium">
                    {disease}
                  </span>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <PhoneCall className="w-4 h-4 text-error" />
                <p className="text-sm font-medium text-text-primary">Emergency Contact</p>
              </div>
              <p className="text-lg font-semibold text-text-primary">{emergencyData.emergencyContact}</p>
            </div>

            <div className="divider" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-error" />
                <p className="text-sm font-medium text-text-primary">Guardian Information</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-text-outline" />
                  <p className="text-base font-medium text-text-primary">{emergencyData.guardianName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-text-outline" />
                  <p className="text-base font-medium text-text-primary">{emergencyData.guardianMobile}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-outline" />
                  <p className="text-base font-medium text-text-primary">{emergencyData.guardianLocation}</p>
                </div>
              </div>
            </div>

            {hasInsurance && (
              <>
                <div className="divider" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-error" />
                    <p className="text-sm font-medium text-text-primary">Insurance Information</p>
                  </div>
                  <div className="space-y-2">
                    {emergencyData.insuranceProvider && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-text-outline" />
                        <p className="text-base font-medium text-text-primary">{emergencyData.insuranceProvider}</p>
                      </div>
                    )}
                    {emergencyData.insuranceCustomerId && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-text-outline" />
                        <p className="text-base font-medium text-text-primary">ID: {emergencyData.insuranceCustomerId}</p>
                      </div>
                    )}
                    {emergencyData.insuranceType && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-text-outline" />
                        <p className="text-base font-medium text-text-primary">{emergencyData.insuranceType}</p>
                      </div>
                    )}
                    {emergencyData.insuranceSupportNumber && (
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-text-outline" />
                        <p className="text-base font-medium text-text-primary">{emergencyData.insuranceSupportNumber}</p>
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
