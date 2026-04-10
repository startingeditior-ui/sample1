'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, LogOut, Shield, Smartphone, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Elements';
import { authAPI } from '@/lib/api';

interface ReauthModalProps {
  isOpen: boolean;
  onVerify: (password: string) => Promise<{ token?: string; patient?: { name?: string; phone?: string } }>;
  onLogout: () => void;
  isLoading: boolean;
  error?: string;
  onSuccess?: (newToken?: string, patientData?: { name?: string; phone?: string }) => void;
}

type AuthMethod = 'password' | 'otp';

export function ReauthModal({ isOpen, onVerify, onLogout, isLoading, error, onSuccess }: ReauthModalProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setOtp('');
      setOtpSent(false);
      setOtpError('');
      setResendTimer(0);
    }
  }, [isOpen]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    try {
      const result = await onVerify(password);
      onSuccess?.(result?.token, result?.patient);
    } catch {
      // Error handling done by parent via error prop
    }
    setPassword('');
  };

  const handleRequestOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      await authAPI.requestReauthOTP();
      setOtpSent(true);
      setResendTimer(60);
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await authAPI.verifyReauthOTP(otp);
      const newToken = response.data.token;
      const patientData = response.data.patient;
      onSuccess?.(newToken, patientData);
      setOtp('');
      setOtpSent(false);
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogout = () => {
    setPassword('');
    setOtp('');
    onLogout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-full mx-auto mb-4">
                <Lock className="w-7 h-7 text-emerald-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Authentication Required
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                For security, please verify your identity to continue accessing your dashboard.
              </p>

              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAuthMethod('password')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    authMethod === 'password'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('otp'); setOtpSent(false); setOtp(''); setOtpError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    authMethod === 'otp'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  OTP
                </button>
              </div>

              {authMethod === 'password' ? (
                <form onSubmit={handlePasswordSubmit}>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    disabled={isLoading}
                  />

                  {error && (
                    <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleLogout}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      isLoading={isLoading}
                      disabled={!password.trim()}
                    >
                      Verify
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  {!otpSent ? (
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-4">
                        We&apos;ll send a verification code to your registered phone number.
                      </p>
                      <Button
                        type="button"
                        onClick={handleRequestOTP}
                        isLoading={otpLoading}
                        className="w-full"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Send OTP
                      </Button>
                      {otpError && (
                        <div className="flex items-center justify-center gap-2 mt-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {otpError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleOTPVerify}>
                      <Input
                        label="Enter OTP"
                        type="text"
                        placeholder="6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                        disabled={otpLoading}
                        maxLength={6}
                      />

                      {otpError && (
                        <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {otpError}
                        </div>
                      )}

                      <div className="flex justify-center mt-3">
                        <button
                          type="button"
                          onClick={handleRequestOTP}
                          disabled={resendTimer > 0 || otpLoading}
                          className="text-sm text-emerald-600 hover:text-emerald-700 disabled:text-gray-400"
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </button>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button
                          type="button"
variant="outlined"
                          onClick={handleLogout}
                          className="flex-1"
                          disabled={otpLoading}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          isLoading={otpLoading}
                          disabled={otp.length !== 6}
                        >
                          Verify OTP
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield className="w-3 h-3" />
                Session timed out for security
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}