'use client';

import React from 'react';
import { useLanguage } from '@/context/language-context';
import { X, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                {type === 'privacy' ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <FileText className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <div>
                <h3 id="legal-modal-title" className="text-xl font-bold tracking-tight">
                  {type === 'privacy' ? t.modals.legal.privacyTitle : t.modals.legal.termsTitle}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">ShasthoBondhu Governance & Policies</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Donor Identity & Contact Protection Protocol</p>
                  <p className="mt-1">
                    Voluntary blood donors in Bangladesh deserve complete privacy and protection
                    against spam, marketing, and non-medical harassment.
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-base">1. Donor Data Protection</h4>
              <p>
                ShasthoBondhu does not expose unfiltered personal phone numbers of blood donors on
                public webpages. Contact requests will require user authentication, emergency
                verification, and donor consent confirmation in the live platform.
              </p>

              <h4 className="font-bold text-slate-900 text-base">2. Prohibition of Commercialization</h4>
              <p>
                In strict adherence to Bangladesh Safe Blood Transfusion regulations and national
                ethical norms, blood donation must be 100% voluntary. Buying or selling human blood
                is strictly illegal.
              </p>

              <h4 className="font-bold text-slate-900 text-base">3. Data Retention & Prototype Notice</h4>
              <p>
                This current website version is a demonstration frontend prototype. No real-world
                sensitive patient records or medical histories are captured or stored on remote
                databases.
              </p>
            </>
          ) : (
            <>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Medical Advice & Emergency Guidance Disclaimer</p>
                  <p className="mt-1">
                    ShasthoBondhu is an informational assistance platform and directory. It does NOT
                    substitute for clinical diagnosis, hospital triage, or physician consultation.
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-base">1. Nature of Directory Listings</h4>
              <p>
                All sample hospitals, doctors, and pharmacy listings shown during this initial
                frontend phase are mock demonstration records. Contact telephone numbers and visiting
                schedules must be confirmed with the respective healthcare institution prior to
                travel.
              </p>

              <h4 className="font-bold text-slate-900 text-base">2. Dengue & Infectious Disease Advisory</h4>
              <p>
                Information provided regarding dengue symptoms and mosquito prevention complies with
                general public health guidance from the Directorate General of Health Services (DGHS)
                and World Health Organization (WHO). If you exhibit severe symptoms (e.g. sharp abdominal
                pain, persistent vomiting, mucosal bleeding), visit the nearest hospital casualty
                department immediately.
              </p>

              <h4 className="font-bold text-slate-900 text-base">3. Emergency Responsibility</h4>
              <p>
                In cases of acute trauma, myocardial infarction (heart attack), stroke, or critical
                shock, always dial 999 or 16263 directly rather than browsing websites.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-sm transition-colors"
          >
            {t.modals.legal.close}
          </button>
        </div>
      </div>
    </div>
  );
}
