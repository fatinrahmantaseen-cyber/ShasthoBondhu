'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, VerificationAuditLog, ApiError } from '@/lib/api-client';
import {
  History,
  Building2,
  Stethoscope,
  Pill,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AuditLogTableProps {
  token: string;
  onUnauthorized: () => void;
}

export function AuditLogTable({ token, onUnauthorized }: AuditLogTableProps) {
  const [logs, setLogs] = useState<VerificationAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const refreshLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = entityFilter !== 'all' ? { entity_type: entityFilter } : undefined;
      const data = await api.admin.auditLogs.list(token, params);
      setLogs(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to retrieve verification audit logs.');
    } finally {
      setLoading(false);
    }
  }, [token, entityFilter, onUnauthorized]);

  useEffect(() => {
    let isSubscribed = true;

    async function loadInitialLogs() {
      try {
        const params = entityFilter !== 'all' ? { entity_type: entityFilter } : undefined;
        const data = await api.admin.auditLogs.list(token, params);
        if (isSubscribed) {
          setLogs(data);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isSubscribed) return;
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to retrieve verification audit logs.');
        setLoading(false);
      }
    }

    loadInitialLogs();
    return () => {
      isSubscribed = false;
    };
  }, [token, entityFilter, onUnauthorized]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'doctor':
        return <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />;
      case 'pharmacy':
        return <Pill className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/60">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Verification Audit Ledger</h3>
            <p className="text-xs text-slate-500">
              অপরিবর্তনীয় যাচাইকরণ ও পর্যালোচনা ইতিহাস (Immutable administrative audit trail)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Entities</option>
              <option value="hospital">Hospitals Only</option>
              <option value="doctor">Doctors Only</option>
              <option value="pharmacy">Pharmacies Only</option>
            </select>
          </div>

          <button
            onClick={refreshLogs}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="m-5 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refreshLogs}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Body */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-semibold">Loading verification audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <History className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No verification audit records found.</p>
          <p className="text-xs text-slate-400">Review decisions taken by administrators will appear here chronologically.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status Transition</th>
                <th className="py-3 px-4">Remarks / Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {log.reviewer_username}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 capitalize font-semibold">
                      {getEntityIcon(log.entity_type)}
                      {log.entity_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {log.action === 'approve' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                    <span className="line-through text-slate-400">{log.previous_status}</span>
                    <span className="mx-1.5 text-slate-400">&rarr;</span>
                    <span className="font-bold text-slate-900">{log.new_status}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                    {log.notes ? (
                      <span title={log.notes} className="italic">&ldquo;{log.notes}&rdquo;</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
