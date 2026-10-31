'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  ApiError,
  HospitalAdminResponse,
  DoctorAdminResponse,
  PharmacyAdminResponse,
  VerificationReviewInput,
} from '@/lib/api-client';
import {
  Building2,
  Stethoscope,
  Pill,
  MapPin,
  Phone,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Loader2,
  Eye,
  Calendar,
} from 'lucide-react';
import { ReviewModal } from './review-modal';

type EntityType = 'hospital' | 'doctor' | 'pharmacy';
type Entity = HospitalAdminResponse | DoctorAdminResponse | PharmacyAdminResponse;

interface VerificationQueueProps {
  entityType: EntityType;
  token: string;
  onUnauthorized: () => void;
}

const DIVISIONS = [
  'All',
  'Dhaka',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Rangpur',
  'Mymensingh',
];

export function VerificationQueue({
  entityType,
  token,
  onUnauthorized,
}: VerificationQueueProps) {
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'unverified' | 'pending_verification' | 'rejected' | 'verified'>('unverified');
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Review Modal state
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refreshItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: statusFilter,
        division: selectedDivision !== 'All' ? selectedDivision : undefined,
      };

      let data: Entity[] = [];
      if (entityType === 'hospital') {
        data = await api.admin.hospitals.list(token, params);
      } else if (entityType === 'doctor') {
        data = await api.admin.doctors.list(token, params);
      } else {
        data = await api.admin.pharmacies.list(token, params);
      }
      setItems(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : `Failed to load ${entityType} submissions.`);
    } finally {
      setLoading(false);
    }
  }, [entityType, token, statusFilter, selectedDivision, onUnauthorized]);

  useEffect(() => {
    let isSubscribed = true;

    async function loadInitial() {
      try {
        const params = {
          status: statusFilter,
          division: selectedDivision !== 'All' ? selectedDivision : undefined,
        };

        let data: Entity[] = [];
        if (entityType === 'hospital') {
          data = await api.admin.hospitals.list(token, params);
        } else if (entityType === 'doctor') {
          data = await api.admin.doctors.list(token, params);
        } else {
          data = await api.admin.pharmacies.list(token, params);
        }

        if (isSubscribed) {
          setItems(data);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isSubscribed) return;
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err instanceof Error ? err.message : `Failed to load ${entityType} submissions.`);
        setLoading(false);
      }
    }

    loadInitial();
    return () => {
      isSubscribed = false;
    };
  }, [entityType, token, statusFilter, selectedDivision, onUnauthorized]);

  const handleOpenReview = (entity: Entity) => {
    setSelectedEntity(entity);
    setModalOpen(true);
  };

  const handleReviewSubmit = async (action: 'approve' | 'reject', notes?: string) => {
    if (!selectedEntity) return;

    const reviewInput: VerificationReviewInput = { action, notes };
    if (entityType === 'hospital') {
      await api.admin.hospitals.review(token, selectedEntity.id, reviewInput);
    } else if (entityType === 'doctor') {
      await api.admin.doctors.review(token, selectedEntity.id, reviewInput);
    } else {
      await api.admin.pharmacies.review(token, selectedEntity.id, reviewInput);
    }

    setSuccessBanner(
      `Successfully ${action === 'approve' ? 'approved & verified' : 'rejected'} "${selectedEntity.name}".`
    );
    // Refresh queue
    await refreshItems();
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      (item.name_bn && item.name_bn.toLowerCase().includes(term)) ||
      item.district.toLowerCase().includes(term) ||
      item.upazila.toLowerCase().includes(term)
    );
  });

  const getEntityIcon = () => {
    switch (entityType) {
      case 'hospital':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'doctor':
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
      case 'pharmacy':
        return <Pill className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Message */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refreshItems}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Status Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            {getEntityIcon()}
            <h3 className="text-base font-bold text-slate-900 capitalize">
              {entityType} Verification Queue
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(
              [
                { id: 'unverified', label: 'Unverified (New)', icon: Clock },
                { id: 'pending_verification', label: 'Pending Verification', icon: Clock },
                { id: 'rejected', label: 'Rejected', icon: XCircle },
                { id: 'verified', label: 'Verified (Live)', icon: CheckCircle2 },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Location Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${entityType} submissions by name, district, or upazila...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {DIVISIONS.map((div) => (
                <option key={div} value={div}>
                  {div === 'All' ? 'All Divisions' : div}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 flex justify-end">
            <button
              onClick={refreshItems}
              disabled={loading}
              className="w-full p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Queue Items List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-semibold">Fetching {entityType} submissions...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            {getEntityIcon()}
          </div>
          <h4 className="text-base font-bold text-slate-800">
            No {statusFilter.replace('_', ' ')} submissions found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter === 'unverified'
              ? `There are currently no new unverified ${entityType} submissions awaiting review.`
              : `No submissions matching status "${statusFilter}" were found for the selected division.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isHosp = entityType === 'hospital';
            const isDoc = entityType === 'doctor';
            const isPharm = entityType === 'pharmacy';

            const hosp = isHosp ? (item as HospitalAdminResponse) : null;
            const doc = isDoc ? (item as DoctorAdminResponse) : null;
            const pharm = isPharm ? (item as PharmacyAdminResponse) : null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                      {item.name_bn && (
                        <p className="text-xs text-slate-500 font-medium">{item.name_bn}</p>
                      )}
                    </div>
                    <div>
                      {item.verification_status === 'verified' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                      {item.verification_status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                      {item.verification_status === 'unverified' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Clock className="w-3 h-3" />
                          Unverified
                        </span>
                      )}
                      {item.verification_status === 'pending_verification' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Classification / Specialty / License */}
                  <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {isHosp && hosp && (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-500">Classification:</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{hosp.classification}</span>
                      </div>
                    )}
                    {isDoc && doc && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Specialty:</span>
                          <span className="font-bold text-emerald-700">{doc.specialty}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">BMDC Registration:</span>
                          <span className="font-mono font-bold text-indigo-700">{doc.bmdc_registration_number || 'None'}</span>
                        </div>
                      </>
                    )}
                    {isPharm && pharm && (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-500">Drug License:</span>
                        <span className="font-mono font-bold text-purple-700">{pharm.drug_license_number || 'Unprovided'}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.upazila}, {item.district}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.public_contact}</span>
                      </span>
                    </div>
                  </div>

                  {/* Submission Timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Submitted: {new Date(item.created_at).toLocaleDateString()}</span>
                    </span>
                    {item.reviewed_by && (
                      <span className="italic text-slate-500">Reviewed by {item.reviewed_by}</span>
                    )}
                  </div>
                </div>

                {/* Inspect Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleOpenReview(item)}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect & Review</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Dialog Modal */}
      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        entityType={entityType}
        entity={selectedEntity}
        onReview={handleReviewSubmit}
      />
    </div>
  );
}
