'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Clock, FileText, Check, X, Timer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Badge, Input, Divider } from '@/components/ui/Elements';
import { consentAPI } from '@/lib/api';
import { ConsentRequest } from '@/types';
import { useNotificationListener } from '@/hooks/useNotificationListener';

const accessDurations = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 8, label: '8 hours' },
];

export default function ConsentPage() {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<ConsentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ConsentRequest | null>(null);
  const [otp, setOtp] = useState('');
  const [duration, setDuration] = useState(8);
  const [step, setStep] = useState<'list' | 'detail' | 'otp'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await consentAPI.getPendingRequests();
      setPendingRequests(response.data.consentRequests || []);
      if (response.data.consentRequests?.length > 0 && !selectedRequest) {
        setSelectedRequest(response.data.consentRequests[0]);
        setStep('detail');
      }
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRequest]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  useNotificationListener({
    onConsentUpdate: () => {
      fetchPendingRequests();
    },
  });

  const handleApprove = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmApprove = async () => {
    setShowConfirmDialog(false);
    setError('');
    setIsSendingOtp(true);
    try {
      await consentAPI.sendOTP();
      setOtpSent(true);
      setStep('otp');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      await consentAPI.approveConsent(selectedRequest!.id, otp, duration);
      alert(`Access granted successfully to ${selectedRequest!.doctorName} from ${selectedRequest!.hospitalName}!`);
      setOtp('');
      setStep('list');
      setSelectedRequest(null);
      fetchPendingRequests();
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    try {
      await consentAPI.rejectConsent(selectedRequest!.id);
      alert('Access request rejected');
      setOtp('');
      setStep('list');
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (error) {
      console.error('Failed to reject consent:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-bold text-text-primary">Consent Request</h1>
          <p className="text-text-secondary text-sm">Review and approve record access</p>
        </motion.div>

        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary">No Pending Requests</h2>
          <p className="text-text-secondary text-sm mt-2">You do not have any pending consent requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-bold text-text-primary">Consent Request</h1>
        <p className="text-text-secondary text-sm">Review and approve record access</p>
      </motion.div>

      {step === 'list' && (
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="cursor-pointer"
              onClick={() => {
                setSelectedRequest(request);
                setStep('detail');
              }}
            >
              <Card className="hover:border-primary transition-colors p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{request.doctorName}</h3>
                      <p className="text-xs text-text-secondary">{request.hospitalName}</p>
                    </div>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {step === 'detail' && selectedRequest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{selectedRequest.doctorName}</h3>
                <p className="text-sm text-text-secondary">{selectedRequest.hospitalName}</p>
                <p className="text-xs text-text-outline">{selectedRequest.specialization}</p>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>

            <Divider />

            <div>
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                <Clock className="w-4 h-4" />
                Requested {new Date(selectedRequest.requestTime).toLocaleString()}
              </div>
              <p className="text-sm font-medium text-text-primary mb-3">Records requested:</p>
              <div className="space-y-2">
                {selectedRequest.recordsRequested.map((record, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" />
                    {record}
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            <div>
              <p className="text-sm font-medium text-text-primary mb-3">Access Duration</p>
              <div className="grid grid-cols-4 gap-2">
                {accessDurations.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      duration === d.value
                        ? 'bg-primary text-white'
                        : 'bg-surface-low text-text-secondary hover:bg-surface-high'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outlined" className="flex-1" onClick={handleReject}>
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button variant="filled" className="flex-1" onClick={handleApprove} isLoading={isSendingOtp}>
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {step === 'otp' && selectedRequest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-5">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Timer className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary">Enter OTP</h3>
              <p className="text-sm text-text-secondary mt-1">
                Enter the 6-digit code sent to your phone to approve access
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <Input
                label="OTP Code"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              
              {error && (
                <div className="flex items-center justify-center gap-2 text-error text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outlined" className="flex-1" onClick={() => setStep('detail')}>
                  Back
                </Button>
                <Button type="submit" variant="filled" className="flex-1" isLoading={isVerifying}>
                  Verify & Grant
                </Button>
              </div>
            </form>

            <p className="text-xs text-text-outline text-center mt-4">
              OTP will expire in 5 minutes
            </p>
            {!otpSent && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => { setOtp(''); setShowConfirmDialog(true); }}
                  className="text-sm text-primary hover:underline"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {showConfirmDialog && selectedRequest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Confirm Access Grant</h3>
            </div>

            <div className="bg-surface-low rounded-xl p-4 mb-6">
              <p className="text-sm text-text-secondary mb-3">You are about to grant access to:</p>
              <p className="font-semibold text-text-primary text-lg">{selectedRequest.doctorName}</p>
              <p className="text-text-secondary">{selectedRequest.hospitalName}</p>
              <p className="text-sm text-text-outline mt-1">{selectedRequest.specialization}</p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-text-primary mb-2">Records to be shared:</p>
              <div className="flex flex-wrap gap-2">
                {selectedRequest.recordsRequested.map((record, idx) => (
                  <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    {record}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Please verify:</strong> Make sure this is a legitimate request from {selectedRequest.hospitalName}. 
                Do not share your OTP with anyone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outlined" className="flex-1" onClick={handleCancelConfirm}>
                Cancel
              </Button>
              <Button variant="filled" className="flex-1" onClick={handleConfirmApprove}>
                Confirm & Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
