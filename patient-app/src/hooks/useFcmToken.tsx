'use client';

import { useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { authAPI } from '@/lib/api';
import { useAuth } from './useAuth';

const firebaseConfig = {
  apiKey: "AIzaSyDFl9sE8oT5lL0l8x2gGPmVFhR0qKz4Q5s",
  authDomain: "medlink-notification.firebaseapp.com",
  projectId: "medlink-notification",
  storageBucket: "medlink-notification.appspot.com",
  messagingSenderId: "113320880948248735520",
  appId: "1:113320880948248735520:web:a1b2c3d4e5f6g7h8i9j0"
};

export function useFcmToken() {
  const { isAuthenticated } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated || initialized.current) return;
    initialized.current = true;

    const initMessaging = async () => {
      if (firebaseConfig.apiKey === "AIzaSyDFl9sE8oT5lL0l8x2gGPmVFhR0qKz4Q5s") {
        console.warn('Firebase messaging blocked: Using dummy API key. Please configure a valid key in useFcmToken.tsx');
        return;
      }

      try {
        const supported = await isSupported();
        if (!supported) {
          console.log('Firebase Messaging not supported');
          return;
        }

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const messaging = getMessaging(app);

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return;
        }

        const token = await getToken(messaging, { 
          vapidKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U" 
        });

        if (token) {
          await authAPI.saveFcmToken(token);
          console.log('FCM token saved');
        }

        onMessage(messaging, (payload) => {
          console.log('Foreground message:', payload);
        });
      } catch (error: any) {
        console.error('Error initializing FCM:', error.message);
      }
    };

    initMessaging();
  }, [isAuthenticated]);
}