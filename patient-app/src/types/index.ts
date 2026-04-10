export interface InsurancePlan {
  name: string;
  coverage: string;
  type: string;
}

export interface InsuranceAvailment {
  id: string;
  hospitalId: string | null;
  hospitalName: string | null;
  amountAvailed: number;
  dateOfAvailment: string;
  reason: string | null;
  claimStatus: string;
}

export interface InsuranceSummary {
  sumInsured: number;
  totalAvailed: number;
  pendingClaims: number;
  pendingAmount: number;
  remaining: number;
}

export interface InsuranceData {
  insuranceProvider?: string;
  insurancePlan?: string;
  insuranceCustomerId?: string;
  insuranceType?: string;
  insuranceSupportNumber?: string;
  insuranceExpiryDate?: string;
  insuranceSumInsured?: string;
  insuranceDocuments?: string[];
  totalAvailed?: number;
  insuranceAvailments?: InsuranceAvailment[];
}

export interface Patient {
  id: string;
  patientId: string;       // normalized from patientCode by the backend
  patientCode?: string;    // raw patientCode field from DB (also present in response)
  name: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  profilePhoto?: string;   // normalized from photoUrl by the backend
  photoUrl?: string;       // raw photoUrl field (also present in response, same value)
  dateOfBirth?: string;    // normalized from dob by the backend (YYYY-MM-DD)
  dob?: string;            // raw dob field (also present in response, same value)
  gender?: string;
  address?: string;
  guardianName?: string;
  guardianLocation?: string;
  insuranceProvider?: string;
  insuranceCustomerId?: string;
  insuranceType?: string;
  insuranceSupportNumber?: string;
  insuranceExpiryDate?: string;
  insuranceSumInsured?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  hospitalName: string;
  specialization: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface AccessRecord {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  doctorName: string;
  hospitalName: string;
  specialization?: string;
  accessStartTime: string;
  accessExpiryTime: string;
  recordsViewed: string[];
  status: 'active' | 'expired' | 'revoked';
}

export interface Notification {
  id: string;
  patientId: string;
  type: 'access_granted' | 'access_revoked' | 'access_expired' | 'emergency_access' | 'LOGIN' | 'CONSENT_APPROVED' | 'CONSENT_REJECTED' | 'CONSENT_REQUEST' | 'ACCESS_REVOKED' | 'ACCESS_EXTENDED' | 'HOSPITAL_BLOCKED' | 'HOSPITAL_UNBLOCKED' | 'RECORD_ADDED' | 'PROFILE_UPDATED';
  title: string;
  message: string;
  doctorName?: string;
  hospitalName?: string;
  accessTime?: string;
  createdAt: string;
  read: boolean;
}

export interface ConsentRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  specialization: string;
  requestTime: string;
  recordsRequested: string[];
  duration: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface EmergencyData {
  bloodGroup: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: string;
}

export type AccessDuration = 6 | 12 | 24 | 48;

export interface BlockedHospital {
  id: string;
  hospitalId: string;
  hospitalName: string;
  blockedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  description: string;
  doctorName?: string;
  hospitalName?: string;
  metadata?: any;
  createdAt: string;
}

export interface MedicalRecordType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface MedicalRecord {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  date: string;
  hospitalId?: string;
  hospitalName?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  recordType: MedicalRecordType;
  createdAt: string;
  updatedAt: string;
}

export interface Specialization {
  id: string;
  name: string;
  doctorCount?: number;
}

export interface HospitalType {
  id: string;
  name: string;
  hospitalCount?: number;
}

export interface DoctorWithDetails {
  id: string;
  name: string;
  specializationId?: string;
  specialization?: string;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
}

export interface HospitalWithDetails {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  hospitalTypeId?: string;
  hospitalType?: string;
  doctorCount?: number;
}

export interface RecordsResponse {
  records: MedicalRecord[];
  total: number;
  limit: number;
  offset: number;
}
