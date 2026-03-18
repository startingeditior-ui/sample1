'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, User, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Elements';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

type LoginMethod = 'phone' | 'patientId';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithPhone, loginWithPatientId, verifyOTP, isLoading } = useAuth();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
  const [inputValue, setInputValue] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');
  const [inputError, setInputError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      setSessionMessage('Your session has expired. Please login again.');
    } else if (reason === 'session_invalid') {
      setSessionMessage('Your session is invalid. Please login again.');
    }
  }, [searchParams]);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const validatePatientId = (id: string) => {
    const trimmed = id.trim().toUpperCase();
    // MLPR-YYYYXXXX format (e.g., MLPR-20260001)
    const pattern = /^MLPR-\d{8}$/;
    return pattern.test(trimmed);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7, 12)}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInputError('');

    if (loginMethod === 'phone') {
      if (!validatePhone(inputValue)) {
        setInputError('Please enter a valid phone number');
        return;
      }
      const cleanedPhone = inputValue.replace(/\D/g, '').slice(-10);
      const formattedPhone = `+91 ${cleanedPhone.slice(0, 5)} ${cleanedPhone.slice(5)}`;
      
      try {
        await loginWithPhone(formattedPhone);
        setShowOTP(true);
      } catch (err: any) {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } else {
      if (!validatePatientId(inputValue)) {
        setInputError('Please enter your Patient ID');
        return;
      }
      
      try {
        await loginWithPatientId(inputValue.toUpperCase().trim());
        setShowOTP(true);
      } catch (err: any) {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    try {
      let identifier: string;
      if (loginMethod === 'phone') {
        const cleanedPhone = inputValue.replace(/\D/g, '').slice(-10);
        identifier = `+91 ${cleanedPhone.slice(0, 5)} ${cleanedPhone.slice(5)}`;
      } else {
        identifier = inputValue.toUpperCase().trim();
      }
      
      await verifyOTP(identifier, otp, loginMethod);
      setIsSuccess(true);
      setSuccessMessage('You have successfully logged in to the patient portal!');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    setError('');
    await handleSendOTP(new Event('submit') as any);
  };

  const toggleLoginMethod = (method: LoginMethod) => {
    setLoginMethod(method);
    setInputValue('');
    setError('');
    setInputError('');
    setShowOTP(false);
  };

  return (
    <div className="min-h-screen bg-surface-lowest flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 lg:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Image src="/ML.png" alt="MedLinkID" width={64} height={64} className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4" />
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">MedLinkID</h1>
          <p className="text-text-secondary mt-2">Your Digital Medical Record</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md"
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>

          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-6 rounded-xl text-center mb-6"
            >
              <div className="flex justify-center mb-2">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-lg">{successMessage}</p>
              <p className="text-sm mt-1">Redirecting to dashboard...</p>
            </motion.div>
          )}

          {!showOTP ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="md-card">
                <h2 className="text-lg font-semibold mb-4">Welcome Back</h2>
                <p className="text-text-secondary text-sm mb-6">
                  Login with your phone number or Patient ID
                </p>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => toggleLoginMethod('phone')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      loginMethod === 'phone'
                        ? 'bg-primary text-white'
                        : 'bg-surface-low text-text-secondary hover:bg-surface-high'
                    }`}
                  >
                    Phone Number
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLoginMethod('patientId')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      loginMethod === 'patientId'
                        ? 'bg-primary text-white'
                        : 'bg-surface-low text-text-secondary hover:bg-surface-high'
                    }`}
                  >
                    Patient ID
                  </button>
                </div>

                {loginMethod === 'phone' ? (
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={inputValue}
                    onChange={(e) => setInputValue(formatPhone(e.target.value))}
                    icon={<Phone className="w-5 h-5 text-text-outline" />}
                  />
                ) : (
                  <Input
                    label="Patient ID"
                    type="text"
                    placeholder="MLPR-20250012"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                    icon={<User className="w-5 h-5 text-text-outline" />}
                  />
                )}
                
                {inputError && (
                  <div className="flex items-center gap-2 mt-2 text-error text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {inputError}
                  </div>
                )}
                
                {sessionMessage && (
                  <div className="flex items-center gap-2 mt-2 text-yellow-600 text-sm bg-yellow-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {sessionMessage}
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-error text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send OTP
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <p className="text-center text-text-secondary text-sm">
                Test: +91 98765 43210 or MLPR-20260001
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="md-card">
                <h2 className="text-lg font-semibold mb-4">Verify OTP</h2>
                <p className="text-text-secondary text-sm mb-6">
                  We sent a 6-digit code to your registered mobile number
                </p>
                
                <Input
                  label="Enter OTP"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-error text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Verify & Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOTP(false)}
                  className="text-text-secondary text-sm hover:text-primary transition-colors"
                >
                  Change {loginMethod === 'phone' ? 'Phone Number' : 'Patient ID'}
                </button>
                <span className="hidden sm:inline text-text-outline">|</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-primary text-sm hover:text-primary/80 transition-colors"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      <div className="p-6 text-center">
        <p className="text-text-outline text-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-lowest flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
