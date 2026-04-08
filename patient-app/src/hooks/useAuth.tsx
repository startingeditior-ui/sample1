'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Patient } from '@/types';
import { authAPI, patientAPI } from '@/lib/api';
import { useSocket } from './useSocket';

const REAUTH_TIMEOUT_MS = 3 * 60 * 60 * 1000;
const LAST_DASHBOARD_ENTRY_KEY = 'lastDashboardEntry';

export const shouldReauthenticate = (): boolean => {
  if (typeof window === 'undefined') return false;
  const lastEntry = localStorage.getItem(LAST_DASHBOARD_ENTRY_KEY);
  if (!lastEntry) return false;
  const elapsed = Date.now() - parseInt(lastEntry, 10);
  return elapsed > REAUTH_TIMEOUT_MS;
};

export const setLastDashboardEntry = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_DASHBOARD_ENTRY_KEY, Date.now().toString());
  }
};

export const clearLastDashboardEntry = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LAST_DASHBOARD_ENTRY_KEY);
  }
};

interface AuthContextType {
  patient: Patient | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthInitializing: boolean;
  authError: string | null;
  insuranceData: InsuranceData | null;
  loginWithPhone: (phone: string) => Promise<void>;
  loginWithPatientId: (patientId: string) => Promise<void>;
  verifyOTP: (identifier: string, otp: string, method: 'phone' | 'patientId') => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  saveInsuranceData: (data: InsuranceData) => void;
  clearAuthError: () => void;
  shouldReauthenticate: () => boolean;
  setLastDashboardEntry: () => void;
  clearLastDashboardEntry: () => void;
}

interface InsuranceData {
  insuranceProvider?: string;
  insuranceCustomerId?: string;
  insuranceType?: string;
  insuranceSupportNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [insuranceData, setInsuranceData] = useState<InsuranceData | null>(null);
  const { joinPatientRoom, leavePatientRoom } = useSocket();

  const INSURANCE_STORAGE_KEY = 'patientInsuranceData';

  const loadInsuranceData = useCallback(() => {
    try {
      const stored = localStorage.getItem(INSURANCE_STORAGE_KEY);
      if (stored) {
        setInsuranceData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load insurance data:', error);
    }
  }, []);

  const saveInsuranceData = useCallback((data: InsuranceData) => {
    try {
      localStorage.setItem(INSURANCE_STORAGE_KEY, JSON.stringify(data));
      setInsuranceData(data);
    } catch (error) {
      console.error('Failed to save insurance data:', error);
    }
  }, []);

  const fetchProfile = useCallback(async (): Promise<Patient | null> => {
    try {
      const response = await patientAPI.getProfile();
      return response.data.data.patient;
    } catch (error: any) {
      const errorCode = error.response?.data?.error;
      if (errorCode === 'Token has expired' || errorCode === 'TOKEN_EXPIRED') {
        const storedPatientId = localStorage.getItem('patientId');
        if (storedPatientId) {
          return {
            id: storedPatientId,
            patientId: storedPatientId,
            name: localStorage.getItem('patientName') || 'Patient',
            phone: localStorage.getItem('patientPhone') || '',
            createdAt: new Date().toISOString(),
          } as Patient;
        }
      }
      console.error('Failed to fetch profile:', error);
      return null;
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsAuthInitializing(true);
      const token = localStorage.getItem('patientToken');
      const storedPatientId = localStorage.getItem('patientId');
      
      if (token && storedPatientId) {
        try {
          const profile = await fetchProfile();
          if (profile) {
            setPatient(profile);
            joinPatientRoom(profile.id);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        }
      }
      setIsLoading(false);
      setIsAuthInitializing(false);
    };

    initializeAuth();
    loadInsuranceData();
  }, [fetchProfile, joinPatientRoom, loadInsuranceData]);

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
      localStorage.setItem('patientName', patientData.name || '');
      localStorage.setItem('patientPhone', patientData.phone || '');
      localStorage.removeItem('loginMethod');
      localStorage.removeItem('loginIdentifier');
      
      localStorage.setItem(LAST_DASHBOARD_ENTRY_KEY, Date.now().toString());
      
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
    localStorage.removeItem('patientName');
    localStorage.removeItem('patientPhone');
    localStorage.removeItem('pendingPatientId');
    localStorage.removeItem('loginMethod');
    localStorage.removeItem('loginIdentifier');
    localStorage.removeItem(LAST_DASHBOARD_ENTRY_KEY);
    localStorage.removeItem('redirectAfterLogin');
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
    <AuthContext.Provider value={{ 
      patient, 
      isAuthenticated: !!patient, 
      isLoading, 
      isAuthInitializing,
      authError,
      insuranceData, 
      loginWithPhone, 
      loginWithPatientId, 
      verifyOTP, 
      logout, 
      refreshProfile, 
      saveInsuranceData,
      clearAuthError,
      shouldReauthenticate,
      setLastDashboardEntry,
      clearLastDashboardEntry
    }}>
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
