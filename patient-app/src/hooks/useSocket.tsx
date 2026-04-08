'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinPatientRoom: (patientId: string) => void;
  leavePatientRoom: (patientId: string) => void;
  onConsentRequest: (callback: (data: any) => void) => void;
  onConsentApproved: (callback: (data: any) => void) => void;
  onConsentRejected: (callback: (data: any) => void) => void;
  onAccessRevoked: (callback: (data: any) => void) => void;
  onAccessExtended: (callback: (data: any) => void) => void;
  onHospitalBlocked: (callback: (data: any) => void) => void;
  onHospitalUnblocked: (callback: (data: any) => void) => void;
  onProfileUpdated: (callback: (data: any) => void) => void;
  onRecordAdded: (callback: (data: any) => void) => void;
  onRecordUpdated: (callback: (data: any) => void) => void;
  onRecordDeleted: (callback: (data: any) => void) => void;
  onNotificationNew: (callback: (data: any) => void) => void;
  removeAllListeners: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const getSocketUrl = (): string => {
  // Always runs client-side only (called inside useEffect)
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:5002`;
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = getSocketUrl();
    console.log('Initializing socket connection to:', SOCKET_URL);

    // Create socket — use polling first, then upgrade to websocket (Socket.IO best practice)
    const newSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      console.log('Closing socket connection');
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
    };
  }, []);

  const joinPatientRoom = useCallback((patientId: string) => {
    if (socket) {
      socket.emit('join-patient-room', patientId);
    }
  }, [socket]);

  const leavePatientRoom = useCallback((patientId: string) => {
    if (socket) {
      socket.emit('leave-patient-room', patientId);
    }
  }, [socket]);

  const onConsentRequest = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('consent:new-request', callback);
    }
  }, [socket]);

  const onConsentApproved = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('consent:approved', callback);
    }
  }, [socket]);

  const onConsentRejected = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('consent:rejected', callback);
    }
  }, [socket]);

  const onAccessRevoked = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('access:revoked', callback);
    }
  }, [socket]);

  const onAccessExtended = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('access:extended', callback);
    }
  }, [socket]);

  const onHospitalBlocked = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('hospital:blocked', callback);
    }
  }, [socket]);

  const onHospitalUnblocked = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('hospital:unblocked', callback);
    }
  }, [socket]);

  const onProfileUpdated = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('profile:updated', callback);
    }
  }, [socket]);

  const onRecordAdded = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('record:added', callback);
    }
  }, [socket]);

  const onRecordUpdated = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('record:updated', callback);
    }
  }, [socket]);

  const onRecordDeleted = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('record:deleted', callback);
    }
  }, [socket]);

  const onNotificationNew = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('notification:new', callback);
    }
  }, [socket]);

  const removeAllListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners();
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinPatientRoom,
        leavePatientRoom,
        onConsentRequest,
        onConsentApproved,
        onConsentRejected,
        onAccessRevoked,
        onAccessExtended,
        onHospitalBlocked,
        onHospitalUnblocked,
        onProfileUpdated,
        onRecordAdded,
        onRecordUpdated,
        onRecordDeleted,
        onNotificationNew,
        removeAllListeners,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
