// DataEntryPage.tsx — Halaman input data keuangan
// Requirements: 8.1, 8.2, 8.3, 8.11

import React, { useState, useEffect, useCallback } from 'react';
import { useManagement } from '../../../hooks/mafinda/useManagement';
import { BalanceSheetForm } from './BalanceSheetForm';
import { IncomeStatementForm } from './IncomeStatementForm';
import { CashFlowStatementForm } from './CashFlowStatementForm';
import { FinancialHistoryTable } from './FinancialHistoryTable';

type Tab = 'balance-sheet' | 'income-statement' | 'cash-flow' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'balance-sheet', label: 'Neraca' },
  { id: 'income-statement', label: 'Laba Rugi' },
  { id: 'cash-flow', label: 'Arus Kas' },
  { id: 'history', label: 'Riwayat' },
];

async function fetchExistingPeriods(type: 'balance-sheet' | 'income-statement'): Promise<string[]> {
  try {
    const res = await fetch(`/api/financial-statements/${type}`);
    if (!res.ok) return [];
    const data: Array<{ period: string }> = await res.json();
    return data.map((d) => d.period);
  } catch {
    return [];
  }
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold text-slate-900">Input Data Keuangan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Input Neraca, Laba Rugi, Arus Kas, dan lihat riwayat</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'balance-sheet' && (
          <BalanceSheetForm
            existingPeriods={bsPeriods}
            onSaved={handleSaved}
          />
        )}

        {activeTab === 'income-statement' && (
          <IncomeStatementForm
            existingPeriods={isPeriods}
            onSaved={handleSaved}
          />
        )}

        {activeTab === 'cash-flow' && (
          <CashFlowStatementForm
            departments={departments}
            projects={projects}
            onSaved={handleSaved}
          />
        )}

        {activeTab === 'history' && (
          <FinancialHistoryTable key={refreshKey} />
        )}
      </div>
    </div>
  );
};
