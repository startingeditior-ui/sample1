'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Ban, X, AlertTriangle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Badge, Divider, IconCircle, EmptyState } from '@/components/ui/Elements';
import Link from 'next/link';
import { accessAPI } from '@/lib/api';
import { AccessRecord } from '@/types';
import { useNotificationListener } from '@/hooks/useNotificationListener';

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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

export default function AccessPage() {
  const [accessList, setAccessList] = useState<AccessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<{id: string, name: string} | null>(null);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const fetchAccessRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await accessAPI.getActiveAccess();
      setAccessList(response.data.data.accessRecords || []);
    } catch (error) {
      // In production, use proper error reporting service
      // console.error('Failed to fetch access records:', error);
      setError('Failed to load access records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccessRecords(); }, [fetchAccessRecords]);

  useNotificationListener({ onAccessUpdate: () => fetchAccessRecords() });

  const handleRevoke = async (accessId: string) => {
    if (confirm('Are you sure you want to revoke access?')) {
      try {
        setIsRevoking(accessId);
        await accessAPI.revokeAccess(accessId);
        setAccessList(prev => prev.filter(a => a.id !== accessId));
    } catch (error) {
      // In production, use proper error reporting service
      // console.error('Failed to revoke access:', error);
      setError('Failed to revoke access. Please try again.');
    } finally {
      setIsRevoking(null);
    }
    }
  };

  const handleBlockHospital = (hospitalId: string, hospitalName: string) => {
    setSelectedHospital({ id: hospitalId, name: hospitalName });
    setShowBlockModal(true);
  };

    const confirmBlock = async () => {
      if (!selectedHospital) return;
      try {
        await accessAPI.blockHospital(selectedHospital.id);
        setShowBlockModal(false);
        setSelectedHospital(null);
        fetchAccessRecords();
      } catch (error: any) {
        // In production, use proper error reporting service
        // console.error('Failed to block hospital:', error);
        setError('Failed to block hospital. Please try again.');
      }
    };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-7 h-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Access Control</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage who can view your records</p>
          </div>
          <Link href="/logs" className="text-emerald-600 text-sm font-medium hover:text-emerald-700 mt-1">
            View All Logs
          </Link>
        </div>
      </motion.div>

      <div className="flex items-center gap-2">
        <h2 className="section-heading">Active Access</h2>
        <span className="pill-badge bg-emerald-100 text-emerald-700">
          {accessList.length}
        </span>
      </div>

      {/* Access List */}
      {accessList.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Shield className="w-8 h-8" />}
            title="No active access sessions"
            description="When doctors access your records, they'll appear here"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {accessList.map((access, idx) => (
            <motion.div
              key={access.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card className="p-5">
                {/* Doctor info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <IconCircle color="bg-emerald-100" size="lg">
                      <Shield className="w-6 h-6 text-emerald-600" />
                    </IconCircle>
                    <div>
                      <h3 className="font-semibold text-gray-900">{access.doctorName}</h3>
                      <p className="text-sm text-gray-500">{access.hospitalName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{access.specialization}</p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <Divider className="mb-4" />

                {/* Timing */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Started</span>
                    <span className="text-gray-700 font-medium">{formatTime(access.accessStartTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Expires in</span>
                    <span className="text-emerald-600 font-semibold">{getTimeRemaining(access.accessExpiryTime)}</span>
                  </div>
                </div>

                {/* Records */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Records accessible:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {access.recordsViewed.map((record, rIdx) => (
                      <span key={rIdx} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {record}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRevoke(access.id)}
                    isLoading={isRevoking === access.id}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Revoke
                  </Button>
                  <Button
                    variant="tonal"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleBlockHospital(access.hospitalId, access.hospitalName)}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Block Hospital
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Block Hospital Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Block Hospital?</h3>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium text-gray-800">{selectedHospital?.name}</span> will be blocked from requesting access to your records.
              </p>
              <div className="flex gap-3">
                <Button variant="outlined" className="flex-1" onClick={() => setShowBlockModal(false)}>
                  Cancel
                </Button>
                <Button variant="filled" className="flex-1 bg-red-600 hover:bg-red-700" onClick={confirmBlock}>
                  Block
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
