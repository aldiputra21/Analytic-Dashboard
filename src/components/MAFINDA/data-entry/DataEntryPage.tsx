// DataEntryPage.tsx — Halaman input data keuangan (full-screen, compact layout)
// Requirements: 8.1, 8.2, 8.3, 8.11

import React, { useState, useEffect, useCallback } from 'react';
import { useManagement } from '../../../hooks/mafinda/useManagement';
import { BalanceSheetForm } from './BalanceSheetForm';
import { IncomeStatementForm } from './IncomeStatementForm';
import { CashFlowStatementForm } from './CashFlowStatementForm';
import { FinancialHistoryTable } from './FinancialHistoryTable';

type Tab = 'balance-sheet' | 'income-statement' | 'cash-flow' | 'history';

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: 'balance-sheet',    label: 'Neraca',   short: 'Neraca' },
  { id: 'income-statement', label: 'Laba Rugi', short: 'L/R' },
  { id: 'cash-flow',        label: 'Arus Kas',  short: 'AK' },
  { id: 'history',          label: 'Riwayat',   short: 'Riwayat' },
];

async function fetchExistingPeriods(type: 'balance-sheet' | 'income-statement'): Promise<string[]> {
  try {
    const res = await fetch(`/api/financial-statements/${type}`);
    if (!res.ok) return [];
    const data: Array<{ period: string }> = await res.json();
    return data.map((d) => d.period);
  } catch { return []; }
}

export const DataEntryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('balance-sheet');
  const [bsPeriods, setBsPeriods] = useState<string[]>([]);
  const [isPeriods, setIsPeriods] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { departments, projects } = useManagement();

  const loadPeriods = useCallback(async () => {
    const [bs, is] = await Promise.all([
      fetchExistingPeriods('balance-sheet'),
      fetchExistingPeriods('income-statement'),
    ]);
    setBsPeriods(bs);
    setIsPeriods(is);
  }, []);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  function handleSaved() {
    loadPeriods();
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Sticky header + tabs ── */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-4 shrink-0">
        <div className="shrink-0">
          <h1 className="text-sm font-bold text-slate-900 leading-tight">Input Data Keuangan</h1>
          <p className="text-[10px] text-slate-400">Neraca · Laba Rugi · Arus Kas</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content area — fills remaining height, scrollable ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'balance-sheet' && (
          <BalanceSheetForm existingPeriods={bsPeriods} onSaved={handleSaved} />
        )}
        {activeTab === 'income-statement' && (
          <IncomeStatementForm existingPeriods={isPeriods} onSaved={handleSaved} />
        )}
        {activeTab === 'cash-flow' && (
          <CashFlowStatementForm departments={departments} projects={projects} onSaved={handleSaved} />
        )}
        {activeTab === 'history' && (
          <FinancialHistoryTable key={refreshKey} />
        )}
      </div>
    </div>
  );
};
