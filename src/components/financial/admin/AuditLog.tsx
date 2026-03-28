// AuditLog.tsx - Admin component for viewing audit trail
// Requirements: 11.7

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/financial/useAuth';

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  subsidiaryId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  justification?: string;
  ipAddress?: string;
  createdAt: string;
}

interface AuditLogProps {
  subsidiaryId?: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-slate-100 text-slate-600',
  logout: 'bg-slate-100 text-slate-600',
  export: 'bg-purple-100 text-purple-700',
  backup: 'bg-amber-100 text-amber-700',
  restore: 'bg-amber-100 text-amber-700',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function JsonViewer({ data }: { data?: Record<string, any> }) {
  if (!data) return <span className="text-slate-400">—</span>;
  return (
    <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-1.5 max-w-xs overflow-auto max-h-24 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export const AuditLog: React.FC<AuditLogProps> = ({ subsidiaryId }) => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAuditLog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (subsidiaryId) params.set('subsidiaryId', subsidiaryId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (actionFilter) params.set('action', actionFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      params.set('limit', '200');

      const res = await fetch(`/api/frs/audit-log?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message ?? 'Failed to load audit log');
      }

      const data = await res.json();
      setEntries(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, subsidiaryId, startDate, endDate, actionFilter, entityTypeFilter]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {subsidiaryId ? 'Changes for selected subsidiary' : 'All system changes'}
          </p>
        </div>
        <button
          onClick={fetchAuditLog}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-slate-600">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-slate-600">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-slate-600">Action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="export">Export</option>
            <option value="backup">Backup</option>
            <option value="restore">Restore</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-slate-600">Entity:</label>
          <input
            type="text"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            placeholder="e.g. financial_data"
            className="text-xs border border-slate-200 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={fetchAuditLog}
          className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >
          Apply
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-slate-400">
            No audit log entries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Timestamp</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Entity</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          {entry.userId}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[entry.action] ?? 'bg-slate-100 text-slate-600'}`}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          <span className="font-medium">{entry.entityType}</span>
                          {entry.entityId && (
                            <span className="text-slate-400 ml-1">#{entry.entityId.slice(-6)}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">
                          {isExpanded ? '▲ Hide' : '▼ Show'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="font-semibold text-slate-600 mb-1">Previous Values</p>
                                <JsonViewer data={entry.oldValues} />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-600 mb-1">New Values</p>
                                <JsonViewer data={entry.newValues} />
                              </div>
                              {entry.justification && (
                                <div className="col-span-2">
                                  <p className="font-semibold text-slate-600 mb-1">Justification</p>
                                  <p className="text-slate-700 bg-amber-50 border border-amber-200 rounded p-1.5">
                                    {entry.justification}
                                  </p>
                                </div>
                              )}
                              {entry.ipAddress && (
                                <div>
                                  <p className="font-semibold text-slate-600 mb-1">IP Address</p>
                                  <p className="text-slate-600">{entry.ipAddress}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Showing up to 200 most recent entries. Use filters to narrow results.
      </p>
    </div>
  );
};
