'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, QrCode, Copy, Share2, Bell, AlertCircle, CheckCircle, FileText, Loader, User } from 'lucide-react';
import { Card } from '@/components/ui/Elements';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationListener } from '@/hooks/useNotificationListener';
import { consentAPI, accessAPI, notificationAPI } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';

export default function DashboardPage() {
  const { patient, logout } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeAccess, setActiveAccess] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [consentRes, accessRes, notifRes] = await Promise.all([
        consentAPI.getPendingRequests(),
        accessAPI.getActiveAccess(),
        notificationAPI.getUnreadCount()
      ]);
      setPendingRequests(consentRes.data.consentRequests || []);
      setActiveAccess(accessRes.data.accessRecords || []);
      setUnreadNotifications(notifRes.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patient?.id) {
      fetchDashboardData();
    }
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

  const copyPatientId = () => {
    if (patient?.patientId) {
      navigator.clipboard.writeText(patient.patientId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (!patient) return null;

  const quickActions = [
    { icon: AlertCircle, label: 'Emergency', href: '/emergency', color: 'bg-red-500', text: 'red' },
    { icon: FileText, label: 'Records', href: '/records', color: 'bg-blue-500', text: 'blue' },
    { icon: Shield, label: 'Access', href: '/access', color: 'bg-emerald-500', text: 'emerald' },
    { icon: Bell, label: 'Alerts', href: '/notifications', color: 'bg-orange-500', text: 'orange' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium">{getGreeting()}</p>
            <h1 className="text-2xl font-bold mt-1">{patient.name}</h1>
            <p className="text-emerald-100 text-sm mt-1 font-mono">{patient.patientId}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
            {patient.profilePhoto ? (
              <Image src={patient.profilePhoto} alt="Profile" width={48} height={48} className="w-full h-full object-cover" unoptimized />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Link href="/profile">
            <button className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
              Profile
            </button>
          </Link>
          <button onClick={logout} className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{activeAccess.length}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <Link href="/notifications" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{unreadNotifications}</div>
          <div className="text-xs text-gray-500">Alerts</div>
        </Link>
        <Link href="/records" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">12</div>
          <div className="text-xs text-gray-500">Records</div>
        </Link>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Your QR Code</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-xl border-2 border-emerald-100">
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} alt="QR Code" width={128} height={128} className="w-32 h-32" unoptimized />
            ) : (
              <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm text-gray-600 mb-3">Show this to healthcare providers to share your medical records securely</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button 
                onClick={copyPatientId}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy ID'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Pending Requests</h2>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                {pendingRequests.length} new
              </span>
            </div>
            {pendingRequests.slice(0, 2).map((request) => (
              <Card key={request.id} className="mb-3 border-l-4 border-l-yellow-400 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{request.doctorName}</p>
                      <p className="text-sm text-gray-500">{request.hospitalName}</p>
                    </div>
                  </div>
                  <Link href="/consent">
                    <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">
                      Review
                    </button>
                  </Link>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Access */}
      <AnimatePresence>
        {activeAccess.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Active Access</h2>
              <Link href="/access" className="text-emerald-600 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-2">
              {activeAccess.slice(0, 3).map((access) => (
                <Card key={access.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{access.doctorName}</p>
                      <p className="text-sm text-gray-500">{access.hospitalName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                      Active
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{getTimeRemaining(access.accessExpiryTime)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link key={idx} href={action.href}>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center hover:border-gray-200 transition-colors">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">{action.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      )}
    </div>
  );
}
