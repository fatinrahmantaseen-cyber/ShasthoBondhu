import { BloodGroup } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000';
const API_PREFIX = '/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface DonorCreateInput {
  name: string;
  blood_group: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  area?: string;
  email?: string;
  phone: string;
  consent_given: boolean;
}

export interface DonorPublicResponse {
  id: string;
  name: string;
  blood_group: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  area: string | null;
  phone_masked: string;
  is_available: boolean;
  last_donation_date: string | null;
  total_donations: number;
  is_demo: boolean;
  created_at: string;
}

export interface DonorFilterParams {
  blood_group?: string;
  division?: string;
  district?: string;
  upazila?: string;
  is_available?: boolean;
  limit?: number;
  offset?: number;
}

export interface BloodRequestCreateInput {
  blood_group: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  units_required: number;
  required_by: string; // ISO 8601
  hospital_name: string;
  medical_reason?: string;
  additional_notes?: string;
  contact_name: string;
  contact_phone: string;
}

export interface BloodRequestPublicResponse {
  id: string;
  blood_group: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  units_required: number;
  required_by: string;
  hospital_name: string;
  medical_reason: string | null;
  additional_notes: string | null;
  request_status: 'pending' | 'in_progress' | 'fulfilled' | 'cancelled' | 'expired';
  contact_name: string;
  contact_phone_masked: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BloodRequestFilterParams {
  blood_group?: string;
  division?: string;
  district?: string;
  upazila?: string;
  request_status?: string;
  limit?: number;
  offset?: number;
}

export interface HospitalResponse {
  id: string;
  name: string;
  name_bn: string | null;
  classification: string;
  division: string;
  district: string;
  upazila: string;
  address: string;
  address_bn: string | null;
  public_contact: string;
  emergency_hotline: string | null;
  available_services: string[];
  has_icu: boolean;
  has_emergency: boolean;
  has_dialysis: boolean;
  verification_status: 'unverified' | 'pending_verification' | 'verified' | 'rejected';
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HospitalFilterParams {
  division?: string;
  district?: string;
  upazila?: string;
  classification?: string;
  has_icu?: boolean;
  has_emergency?: boolean;
  has_dialysis?: boolean;
  service?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DoctorResponse {
  id: string;
  name: string;
  name_bn: string | null;
  specialty: string;
  specialty_bn: string | null;
  qualifications: string;
  hospital_or_chamber: string;
  chamber_address: string;
  division: string;
  district: string;
  upazila: string;
  visiting_hours: string | null;
  consultation_fee: string | null;
  public_contact: string;
  bmdc_registration_number: string | null;
  verification_status: 'unverified' | 'pending_verification' | 'verified' | 'rejected';
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorFilterParams {
  division?: string;
  district?: string;
  upazila?: string;
  specialty?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PharmacyResponse {
  id: string;
  name: string;
  name_bn: string | null;
  division: string;
  district: string;
  upazila: string;
  address: string;
  address_bn: string | null;
  public_contact: string;
  is_open_24_hours: boolean;
  opening_hours: string | null;
  available_services: string[];
  drug_license_number: string | null;
  verification_status: 'unverified' | 'pending_verification' | 'verified' | 'rejected';
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PharmacyFilterParams {
  division?: string;
  district?: string;
  upazila?: string;
  is_open_24_hours?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AdminLoginInput {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface VerificationReviewInput {
  action: 'approve' | 'reject';
  notes?: string;
}

export interface VerificationAuditLog {
  id: string;
  entity_type: 'hospital' | 'doctor' | 'pharmacy';
  entity_id: string;
  action: 'approve' | 'reject';
  previous_status: string;
  new_status: string;
  reviewer_username: string;
  notes: string | null;
  created_at: string;
}

export interface HospitalAdminResponse extends HospitalResponse {
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
}

export interface DoctorAdminResponse extends DoctorResponse {
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
}

export interface PharmacyAdminResponse extends PharmacyResponse {
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
}

export interface AdminQueueFilterParams {
  status?: 'unverified' | 'pending_verification' | 'verified' | 'rejected' | string;
  division?: string;
  district?: string;
  specialty?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogFilterParams {
  entity_type?: 'hospital' | 'doctor' | 'pharmacy' | string;
  entity_id?: string;
  limit?: number;
  offset?: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json();
  }

  let errorMessage = `Request failed with status ${response.status}`;
  let errorDetails: unknown = null;

  try {
    const errorJson = await response.json();
    errorDetails = errorJson;

    if (errorJson?.detail) {
      if (typeof errorJson.detail === 'string') {
        errorMessage = errorJson.detail;
      } else if (Array.isArray(errorJson.detail) && errorJson.detail.length > 0) {
        // FastAPI validation error format
        const firstErr = errorJson.detail[0];
        const field = firstErr.loc ? firstErr.loc.slice(-1)[0] : '';
        errorMessage = field ? `${field}: ${firstErr.msg}` : firstErr.msg;
      }
    }
  } catch {
    // If not JSON, fallback to status text
    errorMessage = response.statusText || errorMessage;
  }

  throw new ApiError(response.status, errorMessage, errorDetails);
}

export const api = {
  baseUrl: API_BASE_URL,

  health: async (): Promise<{ status: string; database: { connected: boolean } }> => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_PREFIX}/health`, {
        headers: { Accept: 'application/json' },
      });
      return handleResponse(res);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, 'Unable to connect to healthcare server.');
    }
  },

  donors: {
    create: async (data: DonorCreateInput): Promise<DonorPublicResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/donors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(data),
        });
        return handleResponse<DonorPublicResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while registering donor.');
      }
    },

    list: async (params?: DonorFilterParams): Promise<DonorPublicResponse[]> => {
      try {
        const query = new URLSearchParams();
        if (params?.blood_group && params.blood_group !== 'All') {
          query.set('blood_group', params.blood_group);
        }
        if (params?.division && params.division !== 'All') {
          query.set('division', params.division);
        }
        if (params?.district && params.district !== 'All') {
          query.set('district', params.district);
        }
        if (params?.upazila && params.upazila.trim()) {
          query.set('upazila', params.upazila.trim());
        }
        if (params?.is_available !== undefined) {
          query.set('is_available', String(params.is_available));
        }
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));

        const qs = query.toString();
        const url = `${API_BASE_URL}${API_PREFIX}/donors${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        return handleResponse<DonorPublicResponse[]>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while fetching donor directory.');
      }
    },

    get: async (id: string): Promise<DonorPublicResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/donors/${encodeURIComponent(id)}`, {
          headers: { Accept: 'application/json' },
        });
        return handleResponse<DonorPublicResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while retrieving donor details.');
      }
    },
  },

  bloodRequests: {
    create: async (data: BloodRequestCreateInput): Promise<BloodRequestPublicResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/blood-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(data),
        });
        return handleResponse<BloodRequestPublicResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while submitting emergency blood request.');
      }
    },

    list: async (params?: BloodRequestFilterParams): Promise<BloodRequestPublicResponse[]> => {
      try {
        const query = new URLSearchParams();
        if (params?.blood_group && params.blood_group !== 'All') {
          query.set('blood_group', params.blood_group);
        }
        if (params?.division && params.division !== 'All') {
          query.set('division', params.division);
        }
        if (params?.district && params.district !== 'All') {
          query.set('district', params.district);
        }
        if (params?.upazila && params.upazila.trim()) {
          query.set('upazila', params.upazila.trim());
        }
        if (params?.request_status) {
          query.set('request_status', params.request_status);
        }
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));

        const qs = query.toString();
        const url = `${API_BASE_URL}${API_PREFIX}/blood-requests${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        return handleResponse<BloodRequestPublicResponse[]>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while fetching blood requests.');
      }
    },

    get: async (id: string): Promise<BloodRequestPublicResponse> => {
      try {
        const res = await fetch(
          `${API_BASE_URL}${API_PREFIX}/blood-requests/${encodeURIComponent(id)}`,
          { headers: { Accept: 'application/json' } }
        );
        return handleResponse<BloodRequestPublicResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while retrieving blood request.');
      }
    },
  },

  hospitals: {
    list: async (params?: HospitalFilterParams): Promise<HospitalResponse[]> => {
      try {
        const query = new URLSearchParams();
        if (params?.division && params.division !== 'All') {
          query.set('division', params.division);
        }
        if (params?.district && params.district !== 'All') {
          query.set('district', params.district);
        }
        if (params?.upazila && params.upazila.trim()) {
          query.set('upazila', params.upazila.trim());
        }
        if (params?.classification && params.classification !== 'All') {
          query.set('classification', params.classification);
        }
        if (params?.has_icu !== undefined) {
          query.set('has_icu', String(params.has_icu));
        }
        if (params?.has_emergency !== undefined) {
          query.set('has_emergency', String(params.has_emergency));
        }
        if (params?.has_dialysis !== undefined) {
          query.set('has_dialysis', String(params.has_dialysis));
        }
        if (params?.service && params.service !== 'All') {
          query.set('service', params.service);
        }
        if (params?.search && params.search.trim()) {
          query.set('search', params.search.trim());
        }
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));

        const qs = query.toString();
        const url = `${API_BASE_URL}${API_PREFIX}/hospitals${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        return handleResponse<HospitalResponse[]>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while fetching hospital directory.');
      }
    },

    get: async (id: string): Promise<HospitalResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/hospitals/${encodeURIComponent(id)}`, {
          headers: { Accept: 'application/json' },
        });
        return handleResponse<HospitalResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while retrieving hospital details.');
      }
    },
  },

  doctors: {
    list: async (params?: DoctorFilterParams): Promise<DoctorResponse[]> => {
      try {
        const query = new URLSearchParams();
        if (params?.division && params.division !== 'All') {
          query.set('division', params.division);
        }
        if (params?.district && params.district !== 'All') {
          query.set('district', params.district);
        }
        if (params?.upazila && params.upazila.trim()) {
          query.set('upazila', params.upazila.trim());
        }
        if (params?.specialty && params.specialty !== 'All') {
          query.set('specialty', params.specialty);
        }
        if (params?.search && params.search.trim()) {
          query.set('search', params.search.trim());
        }
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));

        const qs = query.toString();
        const url = `${API_BASE_URL}${API_PREFIX}/doctors${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        return handleResponse<DoctorResponse[]>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while fetching doctor directory.');
      }
    },

    get: async (id: string): Promise<DoctorResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/doctors/${encodeURIComponent(id)}`, {
          headers: { Accept: 'application/json' },
        });
        return handleResponse<DoctorResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while retrieving doctor profile.');
      }
    },
  },

  pharmacies: {
    list: async (params?: PharmacyFilterParams): Promise<PharmacyResponse[]> => {
      try {
        const query = new URLSearchParams();
        if (params?.division && params.division !== 'All') {
          query.set('division', params.division);
        }
        if (params?.district && params.district !== 'All') {
          query.set('district', params.district);
        }
        if (params?.upazila && params.upazila.trim()) {
          query.set('upazila', params.upazila.trim());
        }
        if (params?.is_open_24_hours !== undefined) {
          query.set('is_open_24_hours', String(params.is_open_24_hours));
        }
        if (params?.search && params.search.trim()) {
          query.set('search', params.search.trim());
        }
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));

        const qs = query.toString();
        const url = `${API_BASE_URL}${API_PREFIX}/pharmacies${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        return handleResponse<PharmacyResponse[]>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while fetching pharmacy directory.');
      }
    },

    get: async (id: string): Promise<PharmacyResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/pharmacies/${encodeURIComponent(id)}`, {
          headers: { Accept: 'application/json' },
        });
        return handleResponse<PharmacyResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Network error while retrieving pharmacy details.');
      }
    },
  },

  admin: {
    login: async (data: AdminLoginInput): Promise<AdminLoginResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(data),
        });
        return handleResponse<AdminLoginResponse>(res);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'Unable to connect to administrative authentication server.');
      }
    },

    hospitals: {
      list: async (token: string, params?: AdminQueueFilterParams): Promise<HospitalAdminResponse[]> => {
        try {
          const query = new URLSearchParams();
          if (params?.status) query.set('status', params.status);
          if (params?.division && params.division !== 'All') query.set('division', params.division);
          if (params?.district && params.district !== 'All') query.set('district', params.district);
          if (params?.limit) query.set('limit', String(params.limit));
          if (params?.offset) query.set('offset', String(params.offset));

          const qs = query.toString();
          const url = `${API_BASE_URL}${API_PREFIX}/admin/hospitals${qs ? `?${qs}` : ''}`;
          const res = await fetch(url, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          return handleResponse<HospitalAdminResponse[]>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Network error while retrieving administrative hospital submissions.');
        }
      },

      get: async (token: string, id: string): Promise<HospitalAdminResponse> => {
        try {
          const res = await fetch(`${API_BASE_URL}${API_PREFIX}/admin/hospitals/${encodeURIComponent(id)}`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          return handleResponse<HospitalAdminResponse>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Network error while retrieving hospital submission.');
        }
      },

      review: async (token: string, id: string, data: VerificationReviewInput): Promise<VerificationAuditLog> => {
        try {
          const res = await fetch(`${API_BASE_URL}${API_PREFIX}/admin/hospitals/${encodeURIComponent(id)}/review`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });
          return handleResponse<VerificationAuditLog>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Failed to process hospital review decision.');
        }
      },
    },

    doctors: {
      list: async (token: string, params?: AdminQueueFilterParams): Promise<DoctorAdminResponse[]> => {
        try {
          const query = new URLSearchParams();
          if (params?.status) query.set('status', params.status);
          if (params?.division && params.division !== 'All') query.set('division', params.division);
          if (params?.district && params.district !== 'All') query.set('district', params.district);
          if (params?.specialty && params.specialty !== 'All') query.set('specialty', params.specialty);
          if (params?.limit) query.set('limit', String(params.limit));
          if (params?.offset) query.set('offset', String(params.offset));

          const qs = query.toString();
          const url = `${API_BASE_URL}${API_PREFIX}/admin/doctors${qs ? `?${qs}` : ''}`;
          const res = await fetch(url, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          return handleResponse<DoctorAdminResponse[]>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Network error while retrieving administrative doctor submissions.');
        }
      },

      get: async (token: string, id: string): Promise<DoctorAdminResponse> => {
        try {
          const res = await fetch(`${API_BASE_URL}${API_PREFIX}/admin/doctors/${encodeURIComponent(id)}`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          return handleResponse<DoctorAdminResponse>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Network error while retrieving doctor submission.');
        }
      },

      review: async (token: string, id: string, data: VerificationReviewInput): Promise<VerificationAuditLog> => {
        try {
          const res = await fetch(`${API_BASE_URL}${API_PREFIX}/admin/doctors/${encodeURIComponent(id)}/review`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });
          return handleResponse<VerificationAuditLog>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Failed to process doctor review decision.');
        }
      },
    },

    pharmacies: {
      list: async (token: string, params?: AdminQueueFilterParams): Promise<PharmacyAdminResponse[]> => {
        try {
          const query = new URLSearchParams();
          if (params?.status) query.set('status', params.status);
          if (params?.division && params.division !== 'All') query.set('division', params.division);
          if (params?.district && params.district !== 'All') query.set('district', params.district);
          if (params?.limit) query.set('limit', String(params.limit));
          if (params?.offset) query.set('offset', String(params.offset));

          const qs = query.toString();
          const url = `${API_BASE_URL}${API_PREFIX}/admin/pharmacies${qs ? `?${qs}` : ''}`;
          const res = await fetch(url, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          return handleResponse<PharmacyAdminResponse[]>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Network error while retrieving administrative pharmacy submissions.');
        }
      },

      get: async (token: string, id: string): Promise<PharmacyAdminResponse> => {
        try {
          const res = await fetch(`${API_BASE_URL}${API_PREFIX}/admin/pharmacies/${encodeURIComponent(id)}`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          return handleResponse<PharmacyAdminResponse>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Network error while retrieving pharmacy submission.');
        }
      },

      review: async (token: string, id: string, data: VerificationReviewInput): Promise<VerificationAuditLog> => {
        try {
          const res = await fetch(`${API_BASE_URL}${API_PREFIX}/admin/pharmacies/${encodeURIComponent(id)}/review`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });
          return handleResponse<VerificationAuditLog>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Failed to process pharmacy review decision.');
        }
      },
    },

    auditLogs: {
      list: async (token: string, params?: AuditLogFilterParams): Promise<VerificationAuditLog[]> => {
        try {
          const query = new URLSearchParams();
          if (params?.entity_type) query.set('entity_type', params.entity_type);
          if (params?.entity_id) query.set('entity_id', params.entity_id);
          if (params?.limit) query.set('limit', String(params.limit));
          if (params?.offset) query.set('offset', String(params.offset));

          const qs = query.toString();
          const url = `${API_BASE_URL}${API_PREFIX}/admin/audit-logs${qs ? `?${qs}` : ''}`;
          const res = await fetch(url, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          return handleResponse<VerificationAuditLog[]>(res);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(0, 'Network error while retrieving verification audit trail.');
        }
      },
    },
  },
};

