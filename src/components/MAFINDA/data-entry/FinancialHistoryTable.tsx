// FinancialHistoryTable.tsx — Riwayat input data keuangan dengan filter
// Requirements: 8.11

import React, { useState, useEffect, useCallback } from 'react';
import { formatRupiah } from '../../../utils/format';

type StatementType = 'balance-sheet' | 'income-statement' | 'cash-flow';

interface HistoryRow {
  id: string;
  period: string;
  type: StatementType;
  summary: string;
  version: number;
  updatedAt: string;
}

const TYPE_LABELS: Record<StatementType, string> = {
  'balance-sheet': 'Neraca',
  'income-statement': 'Laba Rugi',
  'cash-flow': 'Arus Kas',
};

const TYPE_COLORS: Record<StatementType, string> = {
  'balance-sheet': 'bg-blue-50 text-blue-700',
  'income-statement': 'bg-green-50 text-green-700',
  'cash-flow': 'bg-purple-50 text-purple-700',
};

function buildSummary(type: StatementType, row: any): string {
  if (type === 'balance-sheet') {
    const total = (row.currentAssets ?? 0) + (row.fixedAssets ?? 0) + (row.otherAssets ?? 0);
    return `Total Aset: ${formatRupiah(total)}`;
  }
  if (type === 'income-statement') {
    return `Revenue: ${formatRupiah(row.revenue ?? 0)} | Laba Bersih: ${formatRupiah(row.netProfit ?? 0)}`;
  }
  // cash-flow
  const cashIn = (row.operatingCashIn ?? 0) + (row.investingCashIn ?? 0) + (row.financingCashIn ?? 0);
  const cashOut = (row.operatingCashOut ?? 0) + (row.investingCashOut ?? 0) + (row.financingCashOut ?? 0);
  return `Cash In: ${formatRupiah(cashIn)} | Cash Out: ${formatRupiah(cashOut)}`;
}

async function fetchStatements(type: StatementType, period?: string): Promise<HistoryRow[]> {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  const url = `/api/financial-statements/${type}${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data: any[] = await res.json();
  return data.map((row) => ({
    id: row.id,
    period: row.period,
    type,
    summary: buildSummary(type, row),
    version: row.version ?? 1,
    updatedAt: row.updatedAt ?? row.createdAt ?? '',
  }));
}

export const FinancialHistoryTable: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<StatementType | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState('');
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const types: StatementType[] =
        typeFilter === 'all'
          ? ['balance-sheet', 'income-statement', 'cash-flow']
          : [typeFilter];

      const results = await Promise.all(
        types.map((t) => fetchStatements(t, periodFilter || undefined))
      );
      const merged = results
        .flat()
        .sort((a, b) => b.period.localeCompare(a.period) || b.updatedAt.localeCompare(a.updatedAt));
      setRows(merged);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, periodFilter]);

  useEffect(() => { load(); }, [load]);

  function formatDate(iso: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Riwayat Input Data Keuangan</h3>
          <p className="text-xs text-slate-500 mt-0.5">{rows.length} record ditemukan</p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          {isLoading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Jenis Laporan</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as StatementType | 'all')}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Semua</option>
            <option value="balance-sheet">Neraca</option>
            <option value="income-statement">Laba Rugi</option>
            <option value="cash-flow">Arus Kas</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Periode</label>
          <input
            type="month"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {periodFilter && (
          <div className="flex items-end">
            <button
              onClick={() => setPeriodFilter('')}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-24 text-sm text-slate-400">
            Memuat data...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-slate-400">
            Belum ada data keuangan yang diinput.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Jenis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Ringkasan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600">Versi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Diperbarui</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.period}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[row.type]}`}>
                      {TYPE_LABELS[row.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.summary}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      v{row.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {formatDate(row.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
