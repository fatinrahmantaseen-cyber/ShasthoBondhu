'use client';

import React from 'react';
import { useLanguage } from '@/context/language-context';
import { OFFICIAL_HOTLINES } from '@/data/sample-data';
import { X, PhoneCall, ShieldCheck } from 'lucide-react';

interface HotlineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HotlineModal({ isOpen, onClose }: HotlineModalProps) {
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hotline-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
                <PhoneCall className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h3 id="hotline-modal-title" className="text-xl font-bold tracking-tight">
                  {t.modals.hotlines.title}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">{t.modals.hotlines.subtitle}</p>
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

        {/* List of Hotlines */}
        <div className="p-6 space-y-3.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.modals.hotlines.callPrompt}
          </p>

          <div className="grid grid-cols-1 gap-3">
            {OFFICIAL_HOTLINES.map((hotline) => {
              const name = language === 'bn' ? hotline.nameBn : hotline.nameEn;
              const desc = language === 'bn' ? hotline.descriptionBn : hotline.descriptionEn;
              const tag = language === 'bn' ? hotline.tagBn : hotline.tagEn;

              return (
                <div
                  key={hotline.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 tracking-tight">
                        {name}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-md">{desc}</p>
                  </div>

                  <a
                    href={`tel:${hotline.number}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm shrink-0"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{hotline.number}</span>
                  </a>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              These are verified government emergency services operated by the People&apos;s
              Republic of Bangladesh. In life-threatening emergencies, call immediately.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
          >
            {t.modals.hotlines.close}
          </button>
        </div>
      </div>
    </div>
  );
}
