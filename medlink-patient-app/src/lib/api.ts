import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('patientToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientId');
        localStorage.removeItem('loginMethod');
        localStorage.removeItem('loginIdentifier');
        
        const errorCode = error.response?.data?.code;
        let redirectUrl = '/login';
        
        if (errorCode === 'TOKEN_EXPIRED') {
          redirectUrl = '/login?reason=session_expired';
        } else if (errorCode === 'NO_TOKEN' || errorCode === 'INVALID_TOKEN') {
          redirectUrl = '/login?reason=session_invalid';
        }
        
        window.location.href = redirectUrl;
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (phone: string) => {
    console.log('API: Sending OTP to phone:', phone);
    return apiClient.post('/auth/login', { phone });
  },
  loginWithPatientId: (patientId: string) => {
    console.log('API: Sending OTP for patientId:', patientId);
    return apiClient.post('/auth/login', { patientId });
  },
  verifyOTP: (identifier: string, otp: string, method: 'phone' | 'patientId') => {
    if (method === 'phone') {
      return apiClient.post('/auth/verify-otp', { phone: identifier, otp });
    } else {
      return apiClient.post('/auth/verify-otp', { patientId: identifier, otp });
    }
  },
  logout: () => apiClient.post('/auth/logout'),
  sendLoginNotification: () => apiClient.post('/auth/login-notification'),
  saveFcmToken: (fcmToken: string) => apiClient.post('/auth/fcm-token', { fcmToken }),
};

export const patientAPI = {
  getProfile: () => apiClient.get('/patient/profile'),
  updateProfile: (data: Record<string, unknown>) => apiClient.put('/patient/profile', data),
  getEmergencyData: () => apiClient.get('/patient/emergency-data'),
};

export const accessAPI = {
  getActiveAccess: () => apiClient.get('/access/active'),
  getAccessLogs: () => apiClient.get('/access/logs'),
  revokeAccess: (accessId: string) => apiClient.post(`/access/${accessId}/revoke`),
  extendAccess: (accessId: string, duration: number) => apiClient.post(`/access/${accessId}/extend`, { duration }),
  blockHospital: (hospitalId: string) => apiClient.post(`/access/block-hospital`, { hospitalId }),
  unblockHospital: (hospitalId: string) => apiClient.delete(`/access/block-hospital/${hospitalId}`),
  getBlockedHospitals: () => apiClient.get('/access/blocked-hospitals'),
};

export const consentAPI = {
  getPendingRequests: () => apiClient.get('/consent/pending'),
  sendOTP: () => apiClient.post('/consent/send-otp'),
  approveConsent: (requestId: string, otp: string, duration?: number) => 
    apiClient.post(`/consent/${requestId}/approve`, { otp, duration }),
  rejectConsent: (requestId: string) => apiClient.post(`/consent/${requestId}/reject`),
  requestAccess: (patientId: string) => apiClient.post('/consent/request', { patientId }),
};

export const notificationAPI = {
  getNotifications: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (notificationId: string) => apiClient.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
};

export const auditLogAPI = {
  getAuditLogs: (limit?: number) => apiClient.get(`/patient/audit-logs${limit ? `?limit=${limit}` : ''}`),
};

export const recordsAPI = {
  getRecords: (params?: {
    typeId?: string;
    hospitalId?: string;
    doctorId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiClient.get(`/patient/records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },
  getRecord: (id: string) => apiClient.get(`/patient/records/${id}`),
  addRecord: (data: {
    recordTypeId: string;
    title: string;
    description?: string;
    fileUrl?: string;
    date: string;
    hospitalId?: string;
    doctorId?: string;
  }) => apiClient.post('/patient/records', data),
  updateRecord: (id: string, data: Partial<{
    recordTypeId: string;
    title: string;
    description: string;
    fileUrl: string;
    date: string;
    hospitalId: string;
    doctorId: string;
  }>) => apiClient.put(`/patient/records/${id}`, data),
  deleteRecord: (id: string) => apiClient.delete(`/patient/records/${id}`),
  getRecordTypes: () => apiClient.get('/patient/records/types'),
};

export const doctorsAPI = {
  getDoctors: (params?: {
    specializationId?: string;
    hospitalId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiClient.get(`/doctors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },
  getDoctor: (id: string) => apiClient.get(`/doctors/${id}`),
  getSpecializations: () => apiClient.get('/doctors/specializations'),
};

export const hospitalsAPI = {
  getHospitals: (params?: {
    hospitalTypeId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiClient.get(`/hospitals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },
  getHospital: (id: string) => apiClient.get(`/hospitals/${id}`),
  getHospitalTypes: () => apiClient.get('/hospitals/types'),
};
