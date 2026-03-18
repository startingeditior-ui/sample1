'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { notificationAPI } from '@/lib/api';
import { Notification } from '@/types';

interface UseNotificationListenerOptions {
  onNewNotification?: (notification: Notification) => void;
  onConsentUpdate?: (data: any) => void;
  onAccessUpdate?: (data: any) => void;
}

export function useNotificationListener(options: UseNotificationListenerOptions = {}) {
  const { socket, onConsentApproved, onConsentRejected, onAccessRevoked, onAccessExtended, onHospitalBlocked, onHospitalUnblocked, onProfileUpdated } = useSocket();
  const { patient, refreshProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (patient?.id) {
      fetchUnreadCount();
    }
  }, [patient?.id, fetchUnreadCount]);

  useEffect(() => {
    if (!socket || !patient) {
      console.log('Socket not connected, real-time updates disabled');
      return;
    }

    const handleConsentApproved = (data: any) => {
      console.log('Consent approved:', data);
      fetchUnreadCount();
      options.onConsentUpdate?.(data);
      options.onNewNotification?.(data.notification);
    };

    const handleConsentRejected = (data: any) => {
      console.log('Consent rejected:', data);
      fetchUnreadCount();
      options.onConsentUpdate?.(data);
      options.onNewNotification?.(data.notification);
    };

    const handleAccessRevoked = (data: any) => {
      console.log('Access revoked:', data);
      fetchUnreadCount();
      options.onAccessUpdate?.(data);
      options.onNewNotification?.(data.notification);
    };

    const handleAccessExtended = (data: any) => {
      console.log('Access extended:', data);
      fetchUnreadCount();
      options.onAccessUpdate?.(data);
      options.onNewNotification?.(data.notification);
    };

    const handleHospitalBlocked = (data: any) => {
      console.log('Hospital blocked:', data);
      fetchUnreadCount();
      options.onNewNotification?.(data.notification);
    };

    const handleHospitalUnblocked = (data: any) => {
      console.log('Hospital unblocked:', data);
      fetchUnreadCount();
      options.onNewNotification?.(data.notification);
    };

    const handleProfileUpdated = (data: any) => {
      console.log('Profile updated:', data);
      refreshProfile();
    };

    onConsentApproved(handleConsentApproved);
    onConsentRejected(handleConsentRejected);
    onAccessRevoked(handleAccessRevoked);
    onAccessExtended(handleAccessExtended);
    onHospitalBlocked(handleHospitalBlocked);
    onHospitalUnblocked(handleHospitalUnblocked);
    onProfileUpdated(handleProfileUpdated);

    return () => {
      socket.off('consent:approved', handleConsentApproved);
      socket.off('consent:rejected', handleConsentRejected);
      socket.off('access:revoked', handleAccessRevoked);
      socket.off('access:extended', handleAccessExtended);
      socket.off('hospital:blocked', handleHospitalBlocked);
      socket.off('hospital:unblocked', handleHospitalUnblocked);
      socket.off('profile:updated', handleProfileUpdated);
    };
  }, [socket, patient, fetchUnreadCount, refreshProfile, onConsentApproved, onConsentRejected, onAccessRevoked, onAccessExtended, onHospitalBlocked, onHospitalUnblocked, onProfileUpdated, options]);

  return {
    unreadCount,
    refreshUnreadCount: fetchUnreadCount,
  };
}
