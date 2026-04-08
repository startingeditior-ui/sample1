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

const getToastFromNotification = (notification: Notification) => {
  switch (notification.type) {
    case 'LOGIN':
      return { type: 'info' as const, title: 'New Login', message: notification.message };
    case 'CONSENT_APPROVED':
      return { type: 'success' as const, title: 'Access Granted', message: notification.message };
    case 'CONSENT_REJECTED':
      return { type: 'warning' as const, title: 'Access Denied', message: notification.message };
    case 'ACCESS_REVOKED':
      return { type: 'warning' as const, title: 'Access Revoked', message: notification.message };
    case 'ACCESS_EXTENDED':
      return { type: 'info' as const, title: 'Access Extended', message: notification.message };
    case 'HOSPITAL_BLOCKED':
      return { type: 'success' as const, title: 'Hospital Blocked', message: notification.message };
    case 'HOSPITAL_UNBLOCKED':
      return { type: 'info' as const, title: 'Hospital Unblocked', message: notification.message };
    case 'RECORD_ADDED':
      return { type: 'info' as const, title: 'New Record', message: notification.message };
    case 'PROFILE_UPDATED':
      return { type: 'success' as const, title: 'Profile Updated', message: notification.message };
    default:
      return { type: 'info' as const, title: notification.title, message: notification.message };
  }
};

import { useToast } from '@/components/ToastProvider';

export function useNotificationListener(options: UseNotificationListenerOptions = {}) {
  const { showToast } = useToast();
  const { socket, onConsentApproved, onConsentRejected, onAccessRevoked, onAccessExtended, onHospitalBlocked, onHospitalUnblocked, onProfileUpdated, onRecordAdded, onRecordUpdated, onRecordDeleted, onNotificationNew } = useSocket();
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
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
        options.onNewNotification?.(data.notification);
      }
    };

    const handleConsentRejected = (data: any) => {
      console.log('Consent rejected:', data);
      fetchUnreadCount();
      options.onConsentUpdate?.(data);
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
        options.onNewNotification?.(data.notification);
      }
    };

    const handleAccessRevoked = (data: any) => {
      console.log('Access revoked:', data);
      fetchUnreadCount();
      options.onAccessUpdate?.(data);
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
        options.onNewNotification?.(data.notification);
      }
    };

    const handleAccessExtended = (data: any) => {
      console.log('Access extended:', data);
      fetchUnreadCount();
      options.onAccessUpdate?.(data);
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
        options.onNewNotification?.(data.notification);
      }
    };

    const handleHospitalBlocked = (data: any) => {
      console.log('Hospital blocked:', data);
      fetchUnreadCount();
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
        options.onNewNotification?.(data.notification);
      }
    };

    const handleHospitalUnblocked = (data: any) => {
      console.log('Hospital unblocked:', data);
      fetchUnreadCount();
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
        options.onNewNotification?.(data.notification);
      }
    };

    const handleProfileUpdated = (data: any) => {
      console.log('Profile updated:', data);
      refreshProfile();
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
      }
    };

    const handleRecordAdded = (data: any) => {
      console.log('Record added:', data);
      fetchUnreadCount();
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
        options.onNewNotification?.(data.notification);
      }
    };

    const handleRecordUpdated = (data: any) => {
      console.log('Record updated:', data);
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
      }
    };

    const handleRecordDeleted = (data: any) => {
      console.log('Record deleted:', data);
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
      }
    };

    const handleNotificationNew = (data: any) => {
      console.log('New notification received:', data);
      fetchUnreadCount();
      if (data.notification) {
        const toastData = getToastFromNotification(data.notification);
        showToast(toastData.type, toastData.title, toastData.message);
        options.onNewNotification?.(data.notification);
      }
    };

    onConsentApproved(handleConsentApproved);
    onConsentRejected(handleConsentRejected);
    onAccessRevoked(handleAccessRevoked);
    onAccessExtended(handleAccessExtended);
    onHospitalBlocked(handleHospitalBlocked);
    onHospitalUnblocked(handleHospitalUnblocked);
    onProfileUpdated(handleProfileUpdated);
    onRecordAdded(handleRecordAdded);
    onRecordUpdated(handleRecordUpdated);
    onRecordDeleted(handleRecordDeleted);
    onNotificationNew(handleNotificationNew);

    return () => {
      socket.off('consent:approved', handleConsentApproved);
      socket.off('consent:rejected', handleConsentRejected);
      socket.off('access:revoked', handleAccessRevoked);
      socket.off('access:extended', handleAccessExtended);
      socket.off('hospital:blocked', handleHospitalBlocked);
      socket.off('hospital:unblocked', handleHospitalUnblocked);
      socket.off('profile:updated', handleProfileUpdated);
      socket.off('record:added', handleRecordAdded);
      socket.off('record:updated', handleRecordUpdated);
      socket.off('record:deleted', handleRecordDeleted);
      socket.off('notification:new', handleNotificationNew);
    };
  }, [socket, patient, fetchUnreadCount, refreshProfile, onConsentApproved, onConsentRejected, onAccessRevoked, onAccessExtended, onHospitalBlocked, onHospitalUnblocked, onProfileUpdated, onRecordAdded, onRecordUpdated, onRecordDeleted, onNotificationNew, showToast, options]);

  return {
    unreadCount,
    refreshUnreadCount: fetchUnreadCount,
  };
}
