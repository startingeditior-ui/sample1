'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Clock, AlertTriangle, Check, CheckCheck, Loader } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Elements';
import { Button } from '@/components/ui/Button';
import { notificationAPI } from '@/lib/api';
import { Notification } from '@/types';
import { useNotificationListener } from '@/hooks/useNotificationListener';

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN');
};

const getIcon = (type: string) => {
  switch (type) {
    case 'ACCESS_GRANTED': return <Shield className="w-5 h-5 text-emerald-600" />;
    case 'ACCESS_EXPIRED': return <Clock className="w-5 h-5 text-gray-500" />;
    case 'ACCESS_REVOKED':
    case 'CONSENT_REJECTED': return <Check className="w-5 h-5 text-red-600" />;
    case 'EMERGENCY_ACCESS': return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'CONSENT_REQUEST': return <Shield className="w-5 h-5 text-yellow-600" />;
    default: return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'ACCESS_GRANTED': return { bg: 'bg-emerald-50', border: 'border-emerald-100' };
    case 'ACCESS_EXPIRED': return { bg: 'bg-gray-50', border: 'border-gray-100' };
    case 'ACCESS_REVOKED':
    case 'CONSENT_REJECTED': return { bg: 'bg-red-50', border: 'border-red-100' };
    case 'EMERGENCY_ACCESS': return { bg: 'bg-red-50', border: 'border-red-100' };
    case 'CONSENT_REQUEST': return { bg: 'bg-yellow-50', border: 'border-yellow-100' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-100' };
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useNotificationListener({
    onNewNotification: (notification) => {
      setNotifications(prev => [notification, ...prev]);
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n =>
    filter === 'all' || (filter === 'unread' && !n.read)
  );

  const markAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) { console.error('Failed to mark as read:', error); }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) { console.error('Failed to mark all as read:', error); }
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="tonal" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark all read
          </Button>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Bell className="w-8 h-8" />}
              title="No notifications"
              description={filter === 'unread' ? 'All caught up!' : 'Your notifications will appear here'}
            />
          </Card>
        ) : (
          filteredNotifications.map((notification, idx) => {
            const style = getTypeStyle(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => markAsRead(notification.id)}
                className={`cursor-pointer transition-all ${!notification.read ? 'ring-2 ring-emerald-500/25 rounded-2xl' : ''}`}
              >
                <div className={`${style.bg} border ${style.border} rounded-2xl p-4`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
