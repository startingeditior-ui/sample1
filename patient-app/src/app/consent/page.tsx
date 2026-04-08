'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Clock, FileText, Check, X, Timer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Elements';

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
      setPendingRequests(response.data.data.consentRequests || []);
      if (response.data.data.consentRequests?.length > 0 && !selectedRequest) {
        setSelectedRequest(response.data.data.consentRequests[0]);
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
    } catch {
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
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-gray-900">Consent Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">Review and approve record access</p>
        </motion.div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">No pending requests</p>
            <p className="text-sm text-gray-400 mt-1">You have no pending consent requests</p>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-gray-900">Consent Requests</h1>
        <p className="text-gray-500 text-sm mt-0.5">Review and approve record access</p>
      </motion.div>

      {step === 'list' && (
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="cursor-pointer"
              onClick={() => { setSelectedRequest(request); setStep('detail'); }}
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.doctorName}</h3>
                      <p className="text-xs text-gray-500">{request.hospitalName}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {step === 'detail' && selectedRequest && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            {/* Doctor info */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedRequest.doctorName}</h3>
                    <p className="text-sm text-gray-500">{selectedRequest.hospitalName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedRequest.specialization}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 flex-shrink-0">Pending</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Records requested */}
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Clock className="w-3.5 h-3.5" />
                Requested {new Date(selectedRequest.requestTime).toLocaleString()}
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Records requested:</p>
              <div className="space-y-1.5">
                {selectedRequest.recordsRequested.map((record, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {record}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Duration grid */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">Access Duration</p>
              <div className="grid grid-cols-4 gap-2">
                {accessDurations.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                      duration === d.value
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outlined" className="flex-1" onClick={handleReject}>
                <X className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
              <Button variant="filled" className="flex-1" onClick={handleApprove} isLoading={isSendingOtp}>
                <Check className="w-4 h-4 mr-1.5" />
                Approve
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {step === 'otp' && selectedRequest && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Timer className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Enter OTP</h3>
              <p className="text-sm text-gray-500 mt-1">
                Enter the 6-digit code sent to your registered number to approve access
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
                className="text-center text-2xl tracking-[0.5em] font-bold"
              />

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outlined" className="flex-1" onClick={() => setStep('detail')}>
                  Back
                </Button>
                <Button type="submit" variant="filled" className="flex-1" isLoading={isVerifying}>
                  Verify &amp; Grant
                </Button>
              </div>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">OTP expires in 5 minutes</p>
            {!otpSent && (
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => { setOtp(''); setShowConfirmDialog(true); }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {showConfirmDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Access Grant</h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 mb-2">Granting access to:</p>
              <p className="font-bold text-gray-900">{selectedRequest.doctorName}</p>
              <p className="text-sm text-gray-600">{selectedRequest.hospitalName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selectedRequest.specialization}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Records to be shared</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedRequest.recordsRequested.map((record, idx) => (
                  <span key={idx} className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                    {record}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> Verify this is a legitimate request from {selectedRequest.hospitalName}. Do not share your OTP with anyone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outlined" className="flex-1" onClick={handleCancelConfirm}>
                Cancel
              </Button>
              <Button variant="filled" className="flex-1" onClick={handleConfirmApprove}>
                Confirm &amp; Continue
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
