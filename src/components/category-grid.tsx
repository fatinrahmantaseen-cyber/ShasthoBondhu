'use client';

import React from 'react';
import { useLanguage } from '@/context/language-context';
import {
  Stethoscope,
  Building2,
  Pill,
  Droplets,
  AlertTriangle,
  PhoneForwarded,
  ArrowRight,
} from 'lucide-react';

interface CategoryGridProps {
  onOpenHotlines: () => void;
}

export function CategoryGrid({ onOpenHotlines }: CategoryGridProps) {
  const { t } = useLanguage();

  const categories = [
    {
      id: 'doctor',
      title: t.categories.doctor.title,
      desc: t.categories.doctor.desc,
      btn: t.categories.doctor.btn,
      icon: Stethoscope,
      href: '#doctors',
      color: 'blue',
      badge: 'Chamber Directory',
    },
    {
      id: 'hospital',
      title: t.categories.hospital.title,
      desc: t.categories.hospital.desc,
      btn: t.categories.hospital.btn,
      icon: Building2,
      href: '#hospitals',
      color: 'cyan',
      badge: 'ICU & Emergency',
    },
    {
      id: 'pharmacy',
      title: t.categories.pharmacy.title,
      desc: t.categories.pharmacy.desc,
      btn: t.categories.pharmacy.btn,
      icon: Pill,
      href: '#pharmacies',
      color: 'emerald',
      badge: '24/7 Dispensaries',
    },
    {
      id: 'blood',
      title: t.categories.blood.title,
      desc: t.categories.blood.desc,
      btn: t.categories.blood.btn,
      icon: Droplets,
      href: '#blood',
      color: 'rose',
      badge: 'Voluntary Network',
    },
    {
      id: 'dengue',
      title: t.categories.dengue.title,
      desc: t.categories.dengue.desc,
      btn: t.categories.dengue.btn,
      icon: AlertTriangle,
      href: '#dengue',
      color: 'amber',
      badge: 'Health Alert BD',
    },
    {
      id: 'emergency',
      title: t.categories.emergency.title,
      desc: t.categories.emergency.desc,
      btn: t.categories.emergency.btn,
      icon: PhoneForwarded,
      action: onOpenHotlines,
      color: 'teal',
      badge: 'Toll-Free 16263',
    },
  ];

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t.categories.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            {t.categories.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;

            const colorClasses: Record<
              string,
              { bg: string; iconBg: string; text: string; border: string; hover: string }
            > = {
              blue: {
                bg: 'bg-blue-50/40',
                iconBg: 'bg-blue-100 text-blue-600',
                text: 'text-blue-600',
                border: 'border-blue-100',
                hover: 'hover:border-blue-300 hover:shadow-blue-500/10',
              },
              cyan: {
                bg: 'bg-cyan-50/40',
                iconBg: 'bg-cyan-100 text-cyan-700',
                text: 'text-cyan-700',
                border: 'border-cyan-100',
                hover: 'hover:border-cyan-300 hover:shadow-cyan-500/10',
              },
              emerald: {
                bg: 'bg-emerald-50/40',
                iconBg: 'bg-emerald-100 text-emerald-600',
                text: 'text-emerald-700',
                border: 'border-emerald-100',
                hover: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
              },
              rose: {
                bg: 'bg-rose-50/40',
                iconBg: 'bg-rose-100 text-rose-600',
                text: 'text-rose-600',
                border: 'border-rose-100',
                hover: 'hover:border-rose-300 hover:shadow-rose-500/10',
              },
              amber: {
                bg: 'bg-amber-50/40',
                iconBg: 'bg-amber-100 text-amber-700',
                text: 'text-amber-700',
                border: 'border-amber-100',
                hover: 'hover:border-amber-300 hover:shadow-amber-500/10',
              },
              teal: {
                bg: 'bg-teal-50/40',
                iconBg: 'bg-teal-100 text-teal-700',
                text: 'text-teal-700',
                border: 'border-teal-100',
                hover: 'hover:border-teal-300 hover:shadow-teal-500/10',
              },
            };

            const cl = colorClasses[cat.color] || colorClasses.blue;

            const CardContent = (
              <div
                className={`group relative p-6 rounded-2xl border ${cl.border} ${cl.bg} ${cl.hover} transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${cl.iconBg} shadow-2xs group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className={`text-xs font-bold ${cl.text} flex items-center gap-1`}>
                    {cat.btn}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:${cl.text} group-hover:translate-x-1 transition-all`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );

            if (cat.action) {
              return (
                <button
                  key={cat.id}
                  onClick={cat.action}
                  className="text-left w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-2xl"
                >
                  {CardContent}
                </button>
              );
            }

            return (
              <a
                key={cat.id}
                href={cat.href}
                className="block text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl"
              >
                {CardContent}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

