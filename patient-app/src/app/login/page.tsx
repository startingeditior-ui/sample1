'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
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
    const pattern = /^MLPR-\d{8}$/;
    return pattern.test(trimmed);
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
      // Send raw 10-digit phone — backend matches all stored formats
      try {
        await loginWithPhone(cleanedPhone);
        setShowOTP(true);
      } catch (err: any) {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } else {
      if (!validatePatientId(inputValue)) {
        setInputError('Please enter your Patient ID (e.g. MLPR-20260001)');
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
        // Send raw 10-digit phone — backend matches all stored formats
        identifier = inputValue.replace(/\D/g, '').slice(-10);
      } else {
        identifier = inputValue.toUpperCase().trim();
      }
      await verifyOTP(identifier, otp, loginMethod);
      setIsSuccess(true);
      setSuccessMessage('Login successful!');
      
      // Check for stored redirect URL or returnUrl query param
      const storedRedirect = typeof window !== 'undefined' ? localStorage.getItem('redirectAfterLogin') : null;
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get('returnUrl');
      
      // Determine where to redirect
      let redirectPath = '/';
      if (storedRedirect && storedRedirect !== '/login' && storedRedirect !== '/') {
        redirectPath = storedRedirect;
      } else if (returnUrl && returnUrl !== '/login') {
        redirectPath = returnUrl;
      }
      
      // Clear stored redirect
      localStorage.removeItem('redirectAfterLogin');
      
      setTimeout(() => router.push(redirectPath), 2000);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Image src="/ML.png" alt="MedLinkID" width={64} height={64} className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">MedLinkID</h1>
          <p className="text-gray-500 mt-1 text-sm">Your Digital Medical Record</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Success State */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-6"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-semibold text-lg text-gray-800">{successMessage}</p>
              <p className="text-sm text-gray-500 mt-1">Redirecting to dashboard...</p>
            </motion.div>
          )}

          {/* Session warning */}
          {sessionMessage && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {sessionMessage}
            </div>
          )}

          {/* Main Card */}
          {!isSuccess && !showOTP && (
            <form onSubmit={handleSendOTP}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Login with your phone number or Patient ID
                </p>

                {/* Segmented Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                  {(['phone', 'patientId'] as LoginMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleLoginMethod(m)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        loginMethod === m
                          ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {m === 'phone' ? 'Phone Number' : 'Patient ID'}
                    </button>
                  ))}
                </div>

                {loginMethod === 'phone' ? (
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="9876543210"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    icon={<Phone className="w-4 h-4" />}
                    error={inputError}
                  />
                ) : (
                  <Input
                    label="Patient ID"
                    type="text"
                    placeholder="MLPR-20250012"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                    icon={<User className="w-4 h-4" />}
                    error={inputError}
                  />
                )}

                {error && (
                  <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                Send OTP
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-center text-gray-400 text-xs mt-4">
                For testing, use any phone number or patient ID
              </p>
            </form>
          )}

          {/* OTP Step */}
          {!isSuccess && showOTP && (
            <form onSubmit={handleVerifyOTP}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Verify OTP</h2>
                <p className="text-gray-500 text-sm mb-6">
                  We sent a 6-digit code to your registered number
                </p>

                <Input
                  label="Enter OTP"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-bold"
                />

                {error && (
                  <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                Verify &amp; Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <button
                  type="button"
                  onClick={() => setShowOTP(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Change {loginMethod === 'phone' ? 'Number' : 'Patient ID'}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* Footer note */}
      <div className="pb-8 text-center">
        <p className="text-gray-400 text-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
