'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, QrCode, Copy, Share2, AlertCircle, CheckCircle, FileText, Loader, User, ShieldCheck } from 'lucide-react';
import { Card, IconCircle } from '@/components/ui/Elements';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationListener } from '@/hooks/useNotificationListener';
import { consentAPI, accessAPI, notificationAPI, recordsAPI, authAPI } from '@/lib/api';
import { ReauthModal } from '@/components/auth/ReauthModal';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';

export default function DashboardPage() {
  const { patient, logout, shouldReauthenticate, setLastDashboardEntry, isAuthInitializing, refreshProfile } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeAccess, setActiveAccess] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [isReauthLoading, setIsReauthLoading] = useState(false);
  const [reauthError, setReauthError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [consentRes, accessRes, notifRes, recordsRes] = await Promise.all([
        consentAPI.getPendingRequests(),
        accessAPI.getActiveAccess(),
        notificationAPI.getUnreadCount(),
        recordsAPI.getRecords(),
      ]);
      setPendingRequests(consentRes.data.data.consentRequests || []);
      setActiveAccess(accessRes.data.data.accessRecords || []);
      setUnreadNotifications(notifRes.data.data.unreadCount || 0);
      // Support both `total` field and array length
      const recs = recordsRes.data.data;
      setTotalRecords(
        typeof recs.total === 'number'
          ? recs.total
          : Array.isArray(recs.records)
          ? recs.records.length
          : Array.isArray(recs)
          ? recs.length
          : 0
      );
    } catch (error) {
      // In production, use proper error reporting service
      // console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patient?.id) fetchDashboardData();
  }, [patient?.id, fetchDashboardData]);

  useNotificationListener({
    onConsentUpdate: () => fetchDashboardData(),
    onAccessUpdate: () => fetchDashboardData(),
    onNewNotification: () => fetchDashboardData(),
  });

  useEffect(() => {
    if (patient?.patientId) {
      QRCode.toDataURL(patient.patientId, {
        width: 180,
        margin: 2,
        color: { dark: '#059669', light: '#FFFFFF' },
      }).then(setQrCodeUrl);
    }
  }, [patient?.patientId]);

  useEffect(() => {
    if (patient?.id) {
      if (shouldReauthenticate()) {
        setShowReauthModal(true);
      } else {
        setLastDashboardEntry();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  const handleReauthVerify = async (password: string) => {
    setIsReauthLoading(true);
    setReauthError('');
    try {
      const response = await authAPI.verifyPassword(password);
      return {
        token: response.data.token,
        patient: response.data.patient,
      };
    } catch (error: any) {
      setReauthError(error.response?.data?.error || 'Invalid password');
      throw error;
    } finally {
      setIsReauthLoading(false);
    }
  };

  const handleReauthLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const copyPatientId = async () => {
    const id = patient?.patientId;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      // Fallback for non-HTTPS / older browsers
      const el = document.createElement('textarea');
      el.value = id;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `My MedLink Patient ID: ${patient?.patientId}\nName: ${patient?.name}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'MedLink ID', text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard blocked
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const getTimeRemaining = (expiryStr: string) => {
    const now = new Date();
    const expiry = new Date(expiryStr);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isAuthInitializing || !patient) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Safely resolve photo URL — Next.js <Image> throws "Invalid URL" on null/empty/non-http values
  const rawPhoto = patient.profilePhoto || patient.photoUrl || '';
  const safePhotoUrl =
    rawPhoto &&
    (rawPhoto.startsWith('http://') ||
      rawPhoto.startsWith('https://') ||
      rawPhoto.startsWith('/') ||
      rawPhoto.startsWith('data:'))
      ? rawPhoto
      : null;

  const stats = [
    { value: activeAccess.length, label: 'Active', color: 'text-emerald-600', href: '/access' },
    { value: pendingRequests.length, label: 'Pending', color: 'text-yellow-600', href: '/consent' },
    { value: unreadNotifications, label: 'Alerts', color: 'text-blue-600', href: '/notifications' },
    { value: totalRecords, label: 'Records', color: 'text-purple-600', href: '/records' },
  ];

  const quickActions = [
    { icon: AlertCircle, label: 'Emergency', href: '/emergency', bg: 'bg-red-100', iconColor: 'text-red-600' },
    { icon: FileText, label: 'Records', href: '/records', bg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: Shield, label: 'Access', href: '/access', bg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { icon: ShieldCheck, label: 'Insurance', href: '/insurance', bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ];

  return (
    <div className="space-y-5">
      {/* ── Welcome Banner ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-5 lg:p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-emerald-100 text-sm font-medium">{getGreeting()}</p>
            <h1 className="text-2xl font-bold mt-0.5 truncate">{patient.name}</h1>
            <p className="text-emerald-100/80 text-xs mt-0.5 font-mono">{patient.patientId}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden ml-4 flex-shrink-0 border-2 border-white/30">
            {safePhotoUrl ? (
              <Image src={safePhotoUrl} alt="Profile" width={48} height={48} className="w-full h-full object-cover" unoptimized />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link href="/profile">
            <button className="px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-medium transition-colors border border-white/20">
              Profile
            </button>
          </Link>
          <button onClick={logout} className="px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-medium transition-colors border border-white/20">
            Logout
          </button>
        </div>
      </motion.div>

      {/* ── Loading ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── Stats Row ────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <Link key={i} href={s.href}>
                <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm text-center hover:border-emerald-100 hover:shadow-md transition-all">
                  <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── QR Code Card ─────────────────────────────────── */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Your QR Code</h3>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-white p-3 rounded-xl border-2 border-emerald-100 flex-shrink-0">
                {qrCodeUrl ? (
                  <Image src={qrCodeUrl} alt="QR Code" width={128} height={128} className="w-32 h-32" unoptimized />
                ) : (
                  <div className="w-32 h-32 bg-gray-50 flex items-center justify-center rounded-lg">
                    <QrCode className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Show this QR code to healthcare providers to share your medical records securely.
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={copyPatientId}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy ID'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                  >
                    {shared ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                    {shared ? 'Shared!' : 'Share'}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Pending Requests ─────────────────────────────── */}
          <AnimatePresence>
            {pendingRequests.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="section-heading">Pending Requests</h2>
                  <span className="pill-badge bg-yellow-100 text-yellow-700">
                    {pendingRequests.length} new
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingRequests.slice(0, 2).map((request) => (
                    <Card key={request.id} className="p-4 border-l-4 border-l-yellow-400">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconCircle color="bg-yellow-100">
                            <Shield className="w-5 h-5 text-yellow-600" />
                          </IconCircle>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{request.doctorName}</p>
                            <p className="text-xs text-gray-500">{request.hospitalName}</p>
                          </div>
                        </div>
                        <Link href="/consent">
                          <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
                            Review
                          </button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Active Access ─────────────────────────────────── */}
          <AnimatePresence>
            {activeAccess.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="section-heading">Active Access</h2>
                  <Link href="/access" className="text-emerald-600 text-sm font-medium hover:text-emerald-700">
                    View All →
                  </Link>
                </div>
                <div className="space-y-2">
                  {activeAccess.slice(0, 3).map((access) => (
                    <Card key={access.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <IconCircle color="bg-emerald-100">
                          <Shield className="w-5 h-5 text-emerald-600" />
                        </IconCircle>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{access.doctorName}</p>
                          <p className="text-xs text-gray-500">{access.hospitalName}</p>
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">
                          Active
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{getTimeRemaining(access.accessExpiryTime)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Quick Actions ─────────────────────────────────── */}
          <div>
            <h2 className="section-heading mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link key={idx} href={action.href}>
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm text-center hover:border-gray-200 hover:shadow-md transition-all group">
                      <div className={`icon-circle ${action.bg} mx-auto mb-2 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-5 h-5 ${action.iconColor}`} />
                      </div>
                      <p className="text-xs font-medium text-gray-700">{action.label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <ReauthModal
        isOpen={showReauthModal}
        onVerify={handleReauthVerify}
        onLogout={handleReauthLogout}
        isLoading={isReauthLoading}
        error={reauthError}
        onSuccess={async (newToken?: string, patientData?: { name?: string; phone?: string }) => {
          setLastDashboardEntry();
          setShowReauthModal(false);
          if (newToken) {
            localStorage.setItem('patientToken', newToken);
          }
          if (patientData) {
            localStorage.setItem('patientName', patientData.name || '');
            localStorage.setItem('patientPhone', patientData.phone || '');
          }
          await refreshProfile();
          fetchDashboardData();
        }}
      />
    </div>
  );
}
