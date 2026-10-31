'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Building2,
  Stethoscope,
  Pill,
  MapPin,
  Phone,
  Clock,
  ShieldAlert,
  Loader2,
  BadgeCheck,
} from 'lucide-react';
import {
  HospitalAdminResponse,
  DoctorAdminResponse,
  PharmacyAdminResponse,
} from '@/lib/api-client';

type Entity = HospitalAdminResponse | DoctorAdminResponse | PharmacyAdminResponse;

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'hospital' | 'doctor' | 'pharmacy';
  entity: Entity | null;
  onReview: (action: 'approve' | 'reject', notes?: string) => Promise<void>;
}

export function ReviewModal({
  isOpen,
  onClose,
  entityType,
  entity,
  onReview,
}: ReviewModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !entity) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onReview('approve', notes.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      setError('A rejection reason is strictly required by the audit policy.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onReview('reject', notes.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Pending Verification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            Unverified
          </span>
        );
    }
  };

  const isHospital = entityType === 'hospital';
  const isDoctor = entityType === 'doctor';
  const isPharmacy = entityType === 'pharmacy';

  const hospital = isHospital ? (entity as HospitalAdminResponse) : null;
  const doctor = isDoctor ? (entity as DoctorAdminResponse) : null;
  const pharmacy = isPharmacy ? (entity as PharmacyAdminResponse) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-300 rounded-xl border border-blue-500/30">
              {isHospital && <Building2 className="w-6 h-6" />}
              {isDoctor && <Stethoscope className="w-6 h-6" />}
              {isPharmacy && <Pill className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-blue-300">
                  {entityType} verification review
                </span>
                {getStatusBadge(entity.verification_status)}
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5 line-clamp-1">{entity.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Review Submission Error</p>
                <p className="text-xs mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* Primary details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Official Name</span>
              <p className="font-semibold text-slate-900 mt-0.5">{entity.name}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bangla Name</span>
              <p className="font-medium text-slate-800 mt-0.5">{entity.name_bn || 'Not provided'}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Location (Division / District / Upazila)</span>
              <p className="font-medium text-slate-900 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{entity.upazila}, {entity.district}, {entity.division}</span>
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Public Contact</span>
              <p className="font-medium text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{entity.public_contact}</span>
              </p>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Full Physical Address</span>
              <p className="text-slate-800 mt-0.5 leading-relaxed">{isDoctor ? doctor?.chamber_address : (hospital?.address || pharmacy?.address)}</p>
            </div>
            {((isHospital && hospital?.address_bn) || (isPharmacy && pharmacy?.address_bn)) && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Address (Bangla)</span>
                <p className="text-slate-800 mt-0.5 leading-relaxed">{isHospital ? hospital?.address_bn : pharmacy?.address_bn}</p>
              </div>
            )}
          </div>

          {/* Entity Specific Highlights */}
          {isHospital && hospital && (
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 space-y-3">
              <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Facility Capabilities & Emergency Status</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block">Classification</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{hospital.classification}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block">Emergency 24/7</span>
                  <span className={`font-bold mt-0.5 block ${hospital.has_emergency ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {hospital.has_emergency ? 'Yes (Active)' : 'No'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block">ICU Unit</span>
                  <span className={`font-bold mt-0.5 block ${hospital.has_icu ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {hospital.has_icu ? 'Available' : 'None'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block">Dialysis</span>
                  <span className={`font-bold mt-0.5 block ${hospital.has_dialysis ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {hospital.has_dialysis ? 'Available' : 'None'}
                  </span>
                </div>
              </div>
              {hospital.emergency_hotline && (
                <div className="text-xs bg-white p-2.5 rounded-lg border border-blue-100 flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Dedicated Emergency Hotline:</span>
                  <span className="font-bold text-red-600">{hospital.emergency_hotline}</span>
                </div>
              )}
              {hospital.available_services && hospital.available_services.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-blue-900 block mb-1.5">Available Services:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {hospital.available_services.map((svc, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isDoctor && doctor && (
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-3">
              <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span>Physician Credentials & BMDC Registration</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block">Specialty</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{doctor.specialty} ({doctor.specialty_bn || 'N/A'})</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block">BMDC Registration Number</span>
                  <span className="font-mono font-bold text-indigo-700 mt-0.5 block">{doctor.bmdc_registration_number || 'Pending Submission'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 sm:col-span-2">
                  <span className="text-slate-500 block">Qualifications & Degrees</span>
                  <span className="font-medium text-slate-900 mt-0.5 block">{doctor.qualifications}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block">Hospital / Chamber</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{doctor.hospital_or_chamber}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block">Visiting Hours & Consultation Fee</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {doctor.visiting_hours || 'TBD'} • {doctor.consultation_fee ? `Fee: ${doctor.consultation_fee}` : 'No Fee Set'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isPharmacy && pharmacy && (
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200/80 space-y-3">
              <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-purple-600" />
                <span>Drug Licensing & Operations</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-purple-100 sm:col-span-2">
                  <span className="text-slate-500 block">DGDA Drug License Number</span>
                  <span className="font-mono font-bold text-purple-800 mt-0.5 block">
                    {pharmacy.drug_license_number || 'Unprovided / Pending Review'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-500 block">Open 24 Hours</span>
                  <span className={`font-bold mt-0.5 block ${pharmacy.is_open_24_hours ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {pharmacy.is_open_24_hours ? 'Yes (24/7)' : (pharmacy.opening_hours || 'Day Hours')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Past Review Audit Details (if any) */}
          {(entity.reviewed_by || entity.reviewed_at) && (
            <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-700 block mb-1">Previous Administrative Decision:</span>
              <p>Reviewed by <strong className="text-slate-900">{entity.reviewed_by}</strong> on {entity.reviewed_at ? new Date(entity.reviewed_at).toLocaleString() : 'N/A'}</p>
              {entity.review_notes && <p className="mt-1 text-slate-800 bg-white p-2 rounded border border-slate-200 italic">&ldquo;{entity.review_notes}&rdquo;</p>}
            </div>
          )}

          {/* Review Decision Form */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <label htmlFor="review-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Verification Remarks / Audit Notes {rejecting && <span className="text-rose-600 font-extrabold">* (Required for rejection)</span>}
            </label>
            <textarea
              id="review-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                rejecting
                  ? 'Specify reason for rejection (e.g. invalid BMDC registration, expired drug license, unreachable phone)...'
                  : 'Optional notes for audit trail (e.g. verified with MoHFW directory)...'
              }
              className={`w-full p-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                rejecting ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-300 focus:ring-blue-500'
              }`}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!rejecting ? (
              <>
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  disabled={submitting}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Submission...</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Verify</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  disabled={submitting}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={submitting || !notes.trim()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Rejection...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
