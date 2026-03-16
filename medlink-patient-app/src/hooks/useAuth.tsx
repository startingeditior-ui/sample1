'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Patient } from '@/types';
import { authAPI, patientAPI } from '@/lib/api';
import { useSocket } from './useSocket';

interface AuthContextType {
  patient: Patient | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPhone: (phone: string) => Promise<void>;
  loginWithPatientId: (patientId: string) => Promise<void>;
  verifyOTP: (identifier: string, otp: string, method: 'phone' | 'patientId') => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { joinPatientRoom, leavePatientRoom } = useSocket();

  const fetchProfile = useCallback(async (): Promise<Patient | null> => {
    try {
      const response = await patientAPI.getProfile();
      return response.data.patient;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('patientToken');
      const patientId = localStorage.getItem('patientId');
      
      if (token && patientId) {
        const profile = await fetchProfile();
        if (profile) {
          setPatient(profile);
          joinPatientRoom(profile.id);
        } else {
          localStorage.removeItem('patientToken');
          localStorage.removeItem('patientId');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchProfile, joinPatientRoom]);

  const loginWithPhone = async (phone: string) => {
    setIsLoading(true);
    try {
      await authAPI.login(phone);
      localStorage.setItem('loginMethod', 'phone');
      localStorage.setItem('loginIdentifier', phone);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.response?.data?.error || 'Failed to send OTP');
    }
  };

  const loginWithPatientId = async (patientId: string) => {
    setIsLoading(true);
    console.log('Login with Patient ID:', patientId);
    try {
      const response = await authAPI.loginWithPatientId(patientId);
      console.log('Login response:', response.data);
      localStorage.setItem('loginMethod', 'patientId');
      localStorage.setItem('loginIdentifier', patientId);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw new Error(error.response?.data?.error || error.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (identifier: string, otp: string, method: 'phone' | 'patientId') => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP(identifier, otp, method);
      const { token, patient: patientData } = response.data;
      
      localStorage.setItem('patientToken', token);
      localStorage.setItem('patientId', patientData.id);
      localStorage.removeItem('loginMethod');
      localStorage.removeItem('loginIdentifier');
      
      const profile = await fetchProfile();
      setPatient(profile || patientData);
      
      if (profile) {
        joinPatientRoom(profile.id);
        try {
          await authAPI.sendLoginNotification();
        } catch (error) {
          console.error('Failed to send login notification:', error);
        }
      }
      
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.response?.data?.error || 'Invalid OTP');
    }
  };

  const logout = () => {
    if (patient) {
      leavePatientRoom(patient.id);
    }
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientId');
    localStorage.removeItem('pendingPatientId');
    localStorage.removeItem('loginMethod');
    localStorage.removeItem('loginIdentifier');
    setPatient(null);
    authAPI.logout();
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('patientToken');
    if (token) {
      const profile = await fetchProfile();
      if (profile) {
        setPatient(profile);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ patient, isAuthenticated: !!patient, isLoading, loginWithPhone, loginWithPatientId, verifyOTP, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
