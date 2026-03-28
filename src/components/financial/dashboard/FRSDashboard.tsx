// FRSDashboard.tsx - Main dashboard page wiring all components together
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 13.1, 13.2, 13.4, 13.6

import React, { useState, useMemo } from 'react';
import { format, subYears } from 'date-fns';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { CompanySelector, getSubsidiaryColor } from './CompanySelector';
import { PeriodSelector, PeriodRange, getPeriodStartDate } from './PeriodSelector';
import { HealthScoreGauge } from './HealthScoreGauge';
import { RatioCard } from './RatioCard';
import { TrendChart, calculateYoY, TrendDataPoint, TrendSeries } from './TrendChart';
import { ComparisonChart, ComparisonDataPoint } from './ComparisonChart';
import { AlertPanel } from './AlertPanel';
import { useSubsidiaries } from '../../../hooks/financial/useSubsidiaries';
import { useLatestRatios, useRatios } from '../../../hooks/financial/useRatios';
import { useAlerts } from '../../../hooks/financial/useAlerts';
import { RatioName } from '../../../types/financial/ratio';
import { cn } from '../../../utils/cn';
// MAFINDA widgets
import { RevenueCostCards } from '../../MAFINDA/dashboard/RevenueCostCards';
import { CashFlowChart } from '../../MAFINDA/dashboard/CashFlowChart';
import { AssetCompositionChart } from '../../MAFINDA/dashboard/AssetCompositionChart';
import { EquityLiabilityChart } from '../../MAFINDA/dashboard/EquityLiabilityChart';
import { RevenueTargetChart } from '../../MAFINDA/dashboard/RevenueTargetChart';
import { HistoricalDataChart } from '../../MAFINDA/dashboard/HistoricalDataChart';
import { useDashboard, type DashboardFilters } from '../../../hooks/mafinda/useDashboard';
import { useManagement } from '../../../hooks/mafinda/useManagement';

export const FRSDashboard: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<string | 'all'>('all');
  const [period, setPeriod] = useState<PeriodRange>('1y');
  const [comparisonRatio, setComparisonRatio] = useState<RatioName>('roa');

  const { subsidiaries, isLoading: subsLoading, refetch: refetchSubs } = useSubsidiaries(true);
  const { ratios: latestRatios, isLoading: ratiosLoading, refetch: refetchRatios } = useLatestRatios();
  const { alerts, isLoading: alertsLoading, refetch: refetchAlerts, acknowledge } = useAlerts({ status: 'active' });

  // Period-filtered ratios for trend chart
  const startDate = format(getPeriodStartDate(period), 'yyyy-MM-dd');
  const { ratios: trendRatios } = useRatios({
    subsidiaryId: selectedCompany !== 'all' ? selectedCompany : undefined,
    startDate,
    enabled: true,
  });

  const isLoading = subsLoading || ratiosLoading;

  // MAFINDA dashboard state
  function currentPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  const [mafindaPeriod, setMafindaPeriod] = useState(currentPeriod());
  const [mafindaPeriodType, setMafindaPeriodType] = useState<DashboardFilters['periodType']>('monthly');
  const [mafindaHistoricalMonths, setMafindaHistoricalMonths] = useState<DashboardFilters['historicalMonths']>(6);
  const [revenueDeptId, setRevenueDeptId] = useState('');
  const [cashFlowDeptId, setCashFlowDeptId] = useState('');
  const [cashFlowProjectId, setCashFlowProjectId] = useState('');

  const mainFilters: DashboardFilters = { period: mafindaPeriod, periodType: mafindaPeriodType, historicalMonths: mafindaHistoricalMonths };
  const mafindaMain = useDashboard(mainFilters);
  const mafindaRevCost = useDashboard({ ...mainFilters, departmentId: revenueDeptId || undefined });
  const mafindaCashFlow = useDashboard({ ...mainFilters, departmentId: cashFlowDeptId || undefined, projectId: cashFlowProjectId || undefined });
  const { departments, projects } = useManagement();

  // Build subsidiary map for alerts
  const subsidiaryMap = useMemo(
    () => Object.fromEntries(subsidiaries.map((s) => [s.id, s.name])),
    [subsidiaries]
  );

  // Filter latest ratios by selected company
  const displayedRatios = useMemo(() => {
    if (selectedCompany === 'all') return latestRatios;
    return latestRatios.filter((r) => r.subsidiaryId === selectedCompany);
  }, [latestRatios, selectedCompany]);

  // Build comparison chart data
  const comparisonData: ComparisonDataPoint[] = useMemo(() =>
    latestRatios.map((r, idx) => {
      const sub = subsidiaries.find((s) => s.id === r.subsidiaryId);
      const colorIdx = subsidiaries.findIndex((s) => s.id === r.subsidiaryId);
      return {
        subsidiaryId: r.subsidiaryId,
        subsidiaryName: sub?.name ?? r.subsidiaryId,
        color: getSubsidiaryColor(colorIdx),
        roa: r.roa,
        roe: r.roe,
        npm: r.npm,
        der: r.der,
        currentRatio: r.currentRatio,
        quickRatio: r.quickRatio,
        cashRatio: r.cashRatio,
        ocfRatio: r.ocfRatio,
        dscr: r.dscr,
      };
    }),
    [latestRatios, subsidiaries]
  );

  // Build trend chart data from trendRatios
  const trendChartData: TrendDataPoint[] = useMemo(() => {
    // Group by period start date
    const byDate = new Map<string, Record<string, number | null>>();
    trendRatios.forEach((r) => {
      const key = r.periodStartDate;
      if (!byDate.has(key)) byDate.set(key, {});
      const entry = byDate.get(key)!;
      const sub = subsidiaries.find((s) => s.id === r.subsidiaryId);
      const subKey = sub?.name ?? r.subsidiaryId;
      entry[`${subKey}_roa`] = r.roa;
      entry[`${subKey}_npm`] = r.npm;
    });

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: new Date(date),
        label: format(new Date(date), 'MMM yy'),
        ...values,
      }));
  }, [trendRatios, subsidiaries]);

  // Build trend series
  const trendSeries: TrendSeries[] = useMemo(() => {
    const series: TrendSeries[] = [];
    subsidiaries.forEach((sub, idx) => {
      const color = getSubsidiaryColor(idx);
      series.push({ key: `${sub.name}_roa`, label: `${sub.name} ROA`, color, unit: '%' });
      series.push({ key: `${sub.name}_npm`, label: `${sub.name} NPM`, color: color + '99', unit: '%' });
    });
    return series;
  }, [subsidiaries]);

  // YoY calculations for the selected company's latest ratios
  const yoyData = useMemo(() => {
    if (displayedRatios.length === 0) return [];
    const latest = displayedRatios[0];
    // Find data from ~1 year ago
    const oneYearAgo = format(subYears(new Date(latest.periodStartDate), 1), 'yyyy-MM-dd');
    const prevRatio = trendRatios.find(
      (r) => r.subsidiaryId === latest.subsidiaryId && r.periodStartDate <= oneYearAgo
    );
    if (!prevRatio) return [];
    return [
      { key: 'roa', label: 'ROA', value: latest.roa !== null && prevRatio.roa !== null ? calculateYoY(latest.roa, prevRatio.roa) : null },
      { key: 'npm', label: 'NPM', value: latest.npm !== null && prevRatio.npm !== null ? calculateYoY(latest.npm, prevRatio.npm) : null },
    ];
  }, [displayedRatios, trendRatios]);

  const handleRefresh = () => {
    refetchSubs();
    refetchRatios();
    refetchAlerts();
  };

  if (isLoading && subsidiaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <CompanySelector
          subsidiaries={subsidiaries}
          selectedId={selectedCompany}
          onChange={setSelectedCompany}
        />
        <PeriodSelector value={period} onChange={setPeriod} />
        <button
          onClick={handleRefresh}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Alert Panel */}
      {alerts.length > 0 && (
        <AlertPanel
          alerts={alerts}
          subsidiaryMap={subsidiaryMap}
          onAcknowledge={acknowledge}
        />
      )}

      {/* Health Score Gauges - responsive grid */}
      {displayedRatios.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Financial Health Scores</h3>
          <div className={cn(
            'grid gap-4',
            displayedRatios.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
            displayedRatios.length === 2 ? 'grid-cols-2' :
            displayedRatios.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
            'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          )}>
            {displayedRatios.map((r) => {
              const sub = subsidiaries.find((s) => s.id === r.subsidiaryId);
              const colorIdx = subsidiaries.findIndex((s) => s.id === r.subsidiaryId);
              return (
                <HealthScoreGauge
                  key={r.subsidiaryId}
                  score={r.healthScore}
                  subsidiaryName={sub?.name ?? r.subsidiaryId}
                  subsidiaryColor={getSubsidiaryColor(colorIdx)}
                  size={displayedRatios.length > 3 ? 'sm' : 'md'}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Ratio Cards - one per subsidiary */}
      <div className={cn(
        'grid gap-4',
        displayedRatios.length === 1 ? 'grid-cols-1' :
        displayedRatios.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
      )}>
        {displayedRatios.map((r) => {
          const sub = subsidiaries.find((s) => s.id === r.subsidiaryId);
          const colorIdx = subsidiaries.findIndex((s) => s.id === r.subsidiaryId);
          return (
            <RatioCard
              key={r.subsidiaryId}
              subsidiaryName={sub?.name ?? r.subsidiaryId}
              subsidiaryColor={getSubsidiaryColor(colorIdx)}
              ratios={r}
              lastUpdatedAt={r.dataUpdatedAt ? new Date(r.dataUpdatedAt) : undefined}
            />
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Chart */}
        <TrendChart
          data={trendChartData}
          series={trendSeries}
          title="Ratio Trends"
          period={period}
          yoyData={yoyData}
          formatValue={(v) => `${v.toFixed(2)}%`}
        />

        {/* Comparison Chart */}
        <ComparisonChart
          data={comparisonData}
          selectedRatio={comparisonRatio}
          onRatioChange={setComparisonRatio}
          isRefreshing={ratiosLoading}
        />
      </div>

      {/* ── MAFINDA Section ── */}
      <div className="pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Kinerja Keuangan Operasional</h2>
            <p className="text-xs text-slate-500 mt-0.5">Revenue, arus kas, komposisi aset & liabilitas</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={mafindaPeriod}
              onChange={(e) => setMafindaPeriod(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={mafindaPeriodType}
              onChange={(e) => setMafindaPeriodType(e.target.value as DashboardFilters['periodType'])}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="monthly">Bulanan</option>
              <option value="quarterly">Kuartalan</option>
              <option value="annual">Tahunan</option>
            </select>
          </div>
        </div>

        {mafindaMain.error && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
            Sebagian data MAFINDA gagal dimuat: {mafindaMain.error}
          </div>
        )}

        {/* Revenue Target — full width */}
        <div className="mb-4">
          <RevenueTargetChart
            data={mafindaMain.revenueTargetData?.departments ?? []}
            period={mafindaPeriod}
            isLoading={mafindaMain.isLoading}
          />
        </div>

        {/* Revenue Cost + Cash Flow — 2 col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <RevenueCostCards
              summary={mafindaRevCost.revenueCostSummary}
              departments={departments}
              selectedDepartmentId={revenueDeptId}
              onDepartmentChange={setRevenueDeptId}
              isLoading={mafindaRevCost.isLoading}
            />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <CashFlowChart
              data={mafindaCashFlow.cashFlowData?.data ?? []}
              departments={departments}
              projects={projects}
              selectedDepartmentId={cashFlowDeptId}
              selectedProjectId={cashFlowProjectId}
              onDepartmentChange={setCashFlowDeptId}
              onProjectChange={setCashFlowProjectId}
              isLoading={mafindaCashFlow.isLoading}
            />
          </div>
        </div>

        {/* Asset + Equity — 2 col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <AssetCompositionChart data={mafindaMain.assetComposition} isLoading={mafindaMain.isLoading} />
          <EquityLiabilityChart data={mafindaMain.equityLiabilityComposition} isLoading={mafindaMain.isLoading} />
        </div>

        {/* Historical — full width */}
        <HistoricalDataChart
          data={mafindaMain.historicalData}
          selectedMonths={mafindaHistoricalMonths}
          onMonthsChange={setMafindaHistoricalMonths}
          isLoading={mafindaMain.isLoading}
        />
      </div>

      {/* Empty state */}
      {!isLoading && subsidiaries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No subsidiaries found</p>
          <p className="text-sm text-slate-400 mt-1">Add subsidiaries to start monitoring financial ratios</p>
        </div>
      )}
    </div>
  );
};
