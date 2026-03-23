import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }

      const errorCode = error.response?.data?.error;

      if (errorCode === 'Token has expired' || errorCode === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const oldToken = localStorage.getItem('patientToken');
          if (!oldToken) {
            throw new Error('No token to refresh');
          }

          const response = await apiClient.post('/auth/refresh-token', {}, {
            headers: {
              Authorization: `Bearer ${oldToken}`,
            },
          });

          const newToken = response.data.token;
          localStorage.setItem('patientToken', newToken);

          if (response.data.patient) {
            localStorage.setItem('patientName', response.data.patient.name || '');
          }

          onRefreshed(newToken);
          isRefreshing = false;

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];
          localStorage.removeItem('patientToken');
          localStorage.removeItem('patientId');
          localStorage.removeItem('patientName');
          localStorage.removeItem('patientPhone');
          localStorage.removeItem('loginMethod');
          localStorage.removeItem('loginIdentifier');
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/login?reason=session_expired';
          return Promise.reject(refreshError);
        }
      }

      if (errorCode === 'Invalid token' || errorCode === 'INVALID_TOKEN') {
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientId');
        localStorage.removeItem('patientName');
        localStorage.removeItem('patientPhone');
        localStorage.removeItem('loginMethod');
        localStorage.removeItem('loginIdentifier');
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/login?reason=session_invalid';
        return Promise.reject(error);
      }

      if (errorCode === 'No token provided' || errorCode === 'NO_TOKEN') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    if (originalRequest?._retry) {
      return Promise.reject(error);
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
  verifyPassword: (password: string) => apiClient.post('/auth/verify-password', { password }),
  requestReauthOTP: () => apiClient.post('/auth/request-reauth-otp'),
  verifyReauthOTP: (otp: string) => apiClient.post('/auth/verify-reauth-otp', { otp }),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
};

export const patientAPI = {
  getProfile: () => apiClient.get('/patient/profile'),
  updateProfile: (data: Record<string, unknown>) => apiClient.put('/patient/profile', data),
  getEmergencyData: () => apiClient.get('/patient/emergency-data'),
  setPassword: (password: string) => apiClient.post('/patient/set-password', { password }),
};

export const accessAPI = {
  getActiveAccess: () => apiClient.get('/access/active'),
  getAccessLogs: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    return apiClient.get(`/access/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },
  revokeAccess: (accessId: string) => apiClient.post('/access/revoke', { accessId }),
  blockHospital: (hospitalId: string) => apiClient.post('/access/block-hospital', { hospitalId }),
  unblockHospital: (hospitalId: string) => apiClient.delete(`/access/block-hospital/${hospitalId}`),
  getBlockedHospitals: () => apiClient.get('/access/blocked-hospitals'),
};

export const consentAPI = {
  getPendingRequests: () => apiClient.get('/consent/pending'),
  sendOTP: (requestId: string) => apiClient.post('/consent/send-otp', { requestId }),
  approveConsent: (requestId: string, otp: string, duration?: number) => 
    apiClient.post('/consent/approve', { requestId, otp, duration }),
  rejectConsent: (requestId: string) => apiClient.post('/consent/reject', { requestId }),
  requestAccess: (patientId: string) => apiClient.post('/consent/request', { patientId }),
};

export const notificationAPI = {
  getNotifications: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    return apiClient.get(`/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (notificationId: string) => apiClient.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
};

export const auditLogAPI = {
  getAuditLogs: (page = 1, limit = 20) => apiClient.get(`/patient/audit-log?page=${page}&limit=${limit}`),
};

export const recordsAPI = {
  getRecords: () => apiClient.get('/patient/records'),
  getRecord: (id: string) => apiClient.get(`/patient/records/${id}`),
  getRecordTypes: () => apiClient.get('/patient/records/types'),
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
};

export const otpAPI = {
  generateOTP: () => apiClient.post('/patient/otp/generate'),
  getOTPStatus: () => apiClient.get('/patient/otp/status'),
  revokeOTP: () => apiClient.post('/patient/otp/revoke'),
};

export const qrAPI = {
  getQR: () => apiClient.get('/patient/qr'),
};
