export type Language = 'en' | 'bn';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BangladeshDivision =
  | 'Dhaka'
  | 'Chittagong'
  | 'Rajshahi'
  | 'Sylhet'
  | 'Khulna'
  | 'Barishal'
  | 'Rangpur'
  | 'Mymensingh';

export interface BloodDonor {
  id: string;
  name: string; // e.g. "Tanvir Hasan" or "Donor S. Rahman (Demo)"
  bloodGroup: BloodGroup;
  division: BangladeshDivision | string;
  district: string;
  area: string;
  phoneMasked: string; // e.g. "+880 17**-***482"
  lastDonation: string; // e.g. "4 months ago"
  donationCount: number;
  available: boolean;
  isDemo: boolean;
}

export type BloodRequestStatus = 'pending' | 'in_progress' | 'fulfilled' | 'cancelled' | 'expired';

export interface BloodRequest {
  id: string;
  bloodGroup: BloodGroup;
  division: BangladeshDivision | string;
  district: string;
  upazila: string;
  unitsRequired: number;
  requiredBy: string;
  hospitalName: string;
  medicalReason?: string | null;
  additionalNotes?: string | null;
  requestStatus: BloodRequestStatus;
  contactName: string;
  contactPhoneMasked: string;
  isDemo: boolean;
  createdAt: string;
}

export interface Hospital {
  id: string;
  nameEn: string;
  nameBn: string;
  division: BangladeshDivision;
  districtEn: string;
  districtBn: string;
  addressEn: string;
  addressBn: string;
  contactEn: string; // e.g. "+880 2-XXXXXXX (Demo Line)"
  contactBn: string;
  type: 'Government' | 'Private' | 'Specialized';
  services: string[]; // e.g. ["24/7 Emergency", "ICU", "CCU", "Dialysis", "Blood Bank"]
  emergencyHotline?: string;
  bedStatusDemo: 'Call for Bed Info' | 'ICU Alert' | 'Standard Operation';
  ratingDemo: number;
  isDemo: boolean;
  verificationStatus?: 'unverified' | 'pending_verification' | 'verified' | string;
}

export interface Doctor {
  id: string;
  nameEn: string;
  nameBn: string;
  degreeEn: string;
  degreeBn: string;
  specialtyEn: string;
  specialtyBn: string;
  specialtyKey: 'medicine' | 'cardiology' | 'pediatrics' | 'gynecology' | 'orthopedics' | 'neurology' | 'dermatology' | 'ent' | string;
  hospitalEn: string;
  hospitalBn: string;
  chamberEn: string;
  chamberBn: string;
  division: BangladeshDivision;
  districtEn: string;
  districtBn: string;
  visitingHoursEn: string;
  visitingHoursBn: string;
  consultationFeeDemo: string;
  contactMasked: string;
  isDemo: boolean;
  verificationStatus?: 'unverified' | 'pending_verification' | 'verified' | string;
}

export interface Pharmacy {
  id: string;
  nameEn: string;
  nameBn: string;
  division: BangladeshDivision;
  districtEn: string;
  districtBn: string;
  addressEn: string;
  addressBn: string;
  phoneMasked: string;
  isOpen24Hours: boolean;
  openingHoursEn: string;
  openingHoursBn: string;
  services: string[];
  isDemo: boolean;
  verificationStatus?: 'unverified' | 'pending_verification' | 'verified' | string;
}

export interface Hotline {
  id: string;
  number: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  tagEn: string;
  tagBn: string;
  isGovernment: boolean;
}

