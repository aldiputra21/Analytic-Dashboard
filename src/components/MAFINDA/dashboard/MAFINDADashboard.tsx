// MAFINDADashboard.tsx — Halaman dashboard utama MAFINDA
// Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 6.1

import React, { useState } from 'react';
import { useDashboard, type DashboardFilters } from '../../../hooks/mafinda/useDashboard';
import { useManagement } from '../../../hooks/mafinda/useManagement';
import { RevenueTargetChart } from './RevenueTargetChart';
import { RevenueCostCards } from './RevenueCostCards';
import { CashFlowChart } from './CashFlowChart';
import { AssetCompositionChart } from './AssetCompositionChart';
import { EquityLiabilityChart } from './EquityLiabilityChart';
import { HistoricalDataChart } from './HistoricalDataChart';
import { FinancialSummaryCards } from './FinancialSummaryCards';
import { CompositionPie3D } from './CompositionPie3D';
import { DepartmentPerformance } from './DepartmentPerformance';

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const MAFINDADashboard: React.FC = () => {
  // Global filters
  const [period, setPeriod] = useState<string>(currentPeriod());
  const [periodType, setPeriodType] = useState<DashboardFilters['periodType']>('monthly');
  const [historicalMonths, setHistoricalMonths] = useState<DashboardFilters['historicalMonths']>(6);

  // Per-widget independent filters
  const [revenueDeptId, setRevenueDeptId] = useState('');
  const [cashFlowDeptId, setCashFlowDeptId] = useState('');
  const [cashFlowProjectId, setCashFlowProjectId] = useState('');

  // Main dashboard data (revenue target, asset, equity, historical)
  const mainFilters: DashboardFilters = { period, periodType, historicalMonths };
  const main = useDashboard(mainFilters);

  // Revenue cost summary with its own department filter
  const revenueCostFilters: DashboardFilters = {
    period,
    periodType,
    departmentId: revenueDeptId || undefined,
    historicalMonths,
  };
  const revenueCost = useDashboard(revenueCostFilters);

  // Cash flow with its own department/project filter
  const cashFlowFilters: DashboardFilters = {
    period,
    periodType,
    departmentId: cashFlowDeptId || undefined,
    projectId: cashFlowProjectId || undefined,
    historicalMonths,
  };
  const cashFlow = useDashboard(cashFlowFilters);

  const { departments, projects } = useManagement();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dashboard Keuangan</h1>
            <p className="text-xs text-slate-500 mt-0.5">Ringkasan kinerja keuangan perusahaan</p>
          </div>

          {/* Global filters */}
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Periode</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Jenis Periode</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as DashboardFilters['periodType'])}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="monthly">Bulanan</option>
                <option value="quarterly">Kuartalan</option>
                <option value="annual">Tahunan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {main.error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
            Sebagian data gagal dimuat: {main.error}
          </div>
        </div>
      )}

      {/* Dashboard grid */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Row 0: Financial Summary Cards — full width */}
        <FinancialSummaryCards
          assetData={main.assetComposition}
          equityData={main.equityLiabilityComposition}
          isLoading={main.isLoading}
        />

        {/* Row 1: Revenue Target — full width */}
        <RevenueTargetChart
          data={main.revenueTargetData?.departments ?? []}
          period={period}
          isLoading={main.isLoading}
        />

        {/* Row 2: Revenue Cost Cards + Cash Flow — 2 col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueCostCards
            summary={revenueCost.revenueCostSummary}
            departments={departments}
            selectedDepartmentId={revenueDeptId}
            onDepartmentChange={setRevenueDeptId}
            isLoading={revenueCost.isLoading}
          />
          <CashFlowChart
            data={cashFlow.cashFlowData?.data ?? []}
            departments={departments}
            projects={projects}
            selectedDepartmentId={cashFlowDeptId}
            selectedProjectId={cashFlowProjectId}
            onDepartmentChange={setCashFlowDeptId}
            onProjectChange={setCashFlowProjectId}
            isLoading={cashFlow.isLoading}
          />
        </div>

        {/* Row 3: Pie 3D — Asset & Equity Composition */}
        <CompositionPie3D
          assetData={main.assetComposition}
          equityData={main.equityLiabilityComposition}
          isLoading={main.isLoading}
        />

        {/* Row 4: Asset Composition + Equity/Liability donut — 2 col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetCompositionChart
            data={main.assetComposition}
            isLoading={main.isLoading}
          />
          <EquityLiabilityChart
            data={main.equityLiabilityComposition}
            isLoading={main.isLoading}
          />
        </div>

        {/* Row 5: Department Performance Achievement */}
        <DepartmentPerformance
          departments={main.revenueTargetData?.departments ?? []}
          allDepartments={departments}
          period={period}
          isLoading={main.isLoading}
        />

        {/* Row 6: Historical Data — full width */}
        <HistoricalDataChart
          data={main.historicalData}
          selectedMonths={historicalMonths}
          onMonthsChange={setHistoricalMonths}
          isLoading={main.isLoading}
        />
      </div>
    </div>
  );
};
