// FRSDashboard.tsx - Main dashboard page wiring all components together
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 13.1, 13.2, 13.4, 13.6

import React, { useState, useMemo, useCallback } from 'react';
import { format, subYears } from 'date-fns';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { CompanySelector, getSubsidiaryColor } from './CompanySelector';
import { PeriodSelector, PeriodRange, getPeriodStartDate } from './PeriodSelector';
import { HealthScoreGauge } from './HealthScoreGauge';
import { RatioCard } from './RatioCard';
import { WaterfallChart } from '../../MAFINDA/dashboard/WaterfallChart';
import { ProjectionRealizationChart } from '../../MAFINDA/dashboard/ProjectionRealizationChart';
import { TrendChart, calculateYoY, TrendDataPoint, TrendSeries } from './TrendChart';
import { ComparisonChart, ComparisonDataPoint } from './ComparisonChart';
import { AlertPanel } from './AlertPanel';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { useRatios, useLatestRatios } from '../../../hooks/financial/useRatios';
import { useDashboardDepartments } from '../../../hooks/financial/useDashboardData';
import { useAuth } from '../../../hooks/financial/useAuth';
import { RatioName } from '../../../types/financial/ratio';
import { cn } from '../../../utils/cn';
// MAFINDA widgets
import { RevenueCostCards } from '../../MAFINDA/dashboard/RevenueCostCards';
import { CashFlowChart } from '../../MAFINDA/dashboard/CashFlowChart';
import { RevenueProfitTrend } from '../../MAFINDA/dashboard/RevenueProfitTrend';
import { AssetLiabilityTrend } from '../../MAFINDA/dashboard/AssetLiabilityTrend';
import { RevenueTargetChart } from '../../MAFINDA/dashboard/RevenueTargetChart';
import { CompositionPie3D } from '../../MAFINDA/dashboard/CompositionPie3D';
import { DepartmentPerformance } from '../../MAFINDA/dashboard/DepartmentPerformance';
import { DashboardGlobalFilter, type PeriodType as GlobalPeriodType } from './DashboardGlobalFilter';
import { useDashboard, useDashboardAggregated, type DashboardFilters } from '../../../hooks/mafinda/useDashboard';
import { FinancialSummaryCards } from '../../MAFINDA/dashboard/FinancialSummaryCards';

function parseDateSafe(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

import { useQueryClient } from '@tanstack/react-query';
import { dashboardI18n } from '../../../i18n/dashboard';
import { commonsI18n } from '../../../i18n/commons';

export interface FRSDashboardProps {
  selectedSubsidiaryId?: string;
  onSubsidiaryChange?: (id: string) => void;
}

export const FRSDashboard: React.FC<FRSDashboardProps> = ({
  selectedSubsidiaryId,
  onSubsidiaryChange
}) => {
  const { language } = useAuth();
  const t = dashboardI18n[language];
  const common = commonsI18n[language];

  const [selectedCompany, setSelectedCompany] = React.useState<string | 'all'>(selectedSubsidiaryId || 'all');

  // Sync with global state if it changes outside
  React.useEffect(() => {
    if (selectedSubsidiaryId && selectedSubsidiaryId !== selectedCompany) {
      setSelectedCompany(selectedSubsidiaryId);
    } else if (!selectedSubsidiaryId && selectedCompany !== 'all') {
      setSelectedCompany('all');
    }
  }, [selectedSubsidiaryId]);

  const handleCompanyChange = (id: string | 'all') => {
    setSelectedCompany(id);
    if (onSubsidiaryChange) {
      onSubsidiaryChange(id === 'all' ? '' : id);
    }
  };
  const [period, setPeriod] = useState<PeriodRange>('1y');
  const [comparisonRatio, setComparisonRatio] = useState<RatioName>('roa');

  // MAFINDA dashboard state
  const [year, setYear] = useState(new Date().getFullYear());
  const [globalPeriodType, setGlobalPeriodType] = useState<GlobalPeriodType>('quarterly');
  const [subPeriod, setSubPeriod] = useState('Q1');

  const mafindaPeriod = useMemo(() => {
    if (globalPeriodType === 'quarterly') {
      return `${year}-${subPeriod}`; // e.g. "2026-Q1"
    } else {
      return `${year}-${subPeriod}`; // e.g. "2026-S1"
    }
  }, [year, globalPeriodType, subPeriod]);

  const { corporates: subsidiariesData, isLoading: subsLoading, refetch: refetchSubs } = useCorporates();
  const subsidiaries = Array.isArray(subsidiariesData) ? subsidiariesData : [];

  // Fetch latest ratios (for gauges and cards) - Filtered by global period
  const { ratios: latestRatios, isLoading: ratiosLoading, refetch: refetchRatios } = useLatestRatios({
    period: mafindaPeriod
  });

  // Period-filtered ratios for trend chart — memoize startDate to prevent infinite re-renders
  // Trends show historical data ending at the selected period
  const trendEndDate = useMemo(() => {
    const parts = mafindaPeriod.split('-');
    const y = parseInt(parts[0]);
    const p = parts[1];
    if (p === 'Q1') return new Date(y, 2, 31);
    if (p === 'Q2') return new Date(y, 5, 30);
    if (p === 'Q3') return new Date(y, 8, 30);
    if (p === 'Q4') return new Date(y, 11, 31);
    if (p === 'S1') return new Date(y, 5, 30);
    if (p === 'S2') return new Date(y, 11, 31);
    return new Date();
  }, [mafindaPeriod]);

  const startDate = useMemo(() => format(getPeriodStartDate(period, trendEndDate), 'yyyy-MM-dd'), [period, trendEndDate]);
  const endDate = useMemo(() => format(trendEndDate, 'yyyy-MM-dd'), [trendEndDate]);

  const { ratios: trendRatios } = useRatios({
    subsidiaryId: selectedCompany !== 'all' ? selectedCompany : undefined,
    startDate,
    endDate,
  });

  const mafindaHistoricalMonths = 60; // Fetch 5 years for trends

  const [revenueDeptId, setRevenueDeptId] = useState('');
  const [cashFlowDeptId, setCashFlowDeptId] = useState('');

  const aggregatedFilters = useMemo(
    () => ({
      period: mafindaPeriod,
      historicalMonths: mafindaHistoricalMonths,
      cashFlowMonths: globalPeriodType === 'quarterly' ? 3 : 6,
      corporateId: selectedCompany !== 'all' ? selectedCompany : undefined,
      revCostDeptId: revenueDeptId || undefined,
      cashFlowDeptId: cashFlowDeptId || undefined,
    }),
    [mafindaPeriod, mafindaHistoricalMonths, globalPeriodType, selectedCompany, revenueDeptId, cashFlowDeptId]
  );

  const mafindaData = useDashboardAggregated(aggregatedFilters);

  const isLoading = subsLoading || ratiosLoading || mafindaData.isLoading;

  // Debug log to verify data range
  React.useEffect(() => {
    if (mafindaData.cashFlowData?.data) {
      console.log('[Dashboard] Cash Flow Data periods:', 
        Array.from(new Set(mafindaData.cashFlowData.data.map(d => d.period))).sort()
      );
    }
  }, [mafindaData.cashFlowData]);

  const { departments, options: departmentOptions, isLoading: isDeptsLoading } = useDashboardDepartments(selectedCompany);

  // Filter latest ratios by selected company
  const displayedRatios = useMemo(() => {
    if (selectedCompany === 'all') return latestRatios;
    return latestRatios.filter((r) => r.subsidiaryId === selectedCompany);
  }, [latestRatios, selectedCompany]);

  const dynamicPeriodLabel = useMemo(() => {
    if (displayedRatios.length === 0) return null;
    const latestPeriod = displayedRatios.reduce((max, r) => (r.period > max ? r.period : max), '');
    if (!latestPeriod) return null;
    const [y, m] = latestPeriod.split('-');
    return `${common.months[parseInt(m) - 1]} ${y}`;
  }, [displayedRatios]);

  // Build comparison chart data
  const comparisonData: ComparisonDataPoint[] = useMemo(() =>
    latestRatios.map((r, idx) => {
      const colorIdx = subsidiaries.findIndex((s) => s.id === r.subsidiaryId);
      return {
        subsidiaryId: r.subsidiaryId,
        subsidiaryName: r.corporateName ?? r.subsidiaryId,
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

  const subsidiaryNames = useMemo(() => {
    const map: Record<string, string> = {};
    subsidiaries.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [subsidiaries]);

  // Build trend chart data from trendRatios
  const trendChartData: TrendDataPoint[] = useMemo(() => {
    // Group by period start date
    const byDate = new Map<string, Record<string, number | null>>();
    trendRatios.forEach((r) => {
      const key = r.periodStartDate || r.period;
      if (!byDate.has(key)) byDate.set(key, {});
      const entry = byDate.get(key)!;
      const subKey = r.corporateName || r.corporateId || r.subsidiaryId;
      entry[`${subKey}_roa`] = r.roa;
      entry[`${subKey}_npm`] = r.npm;
    });

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([date, values]) => {
        const parsedDate = parseDateSafe(date);
        if (!parsedDate) return [];
        return [{
          date: parsedDate,
          label: format(parsedDate, 'MMM yy'),
          ...values,
        }];
      });
  }, [trendRatios, subsidiaries]);

  // Build trend series
  const trendSeries: TrendSeries[] = useMemo(() => {
    const series: TrendSeries[] = [];
    displayedRatios.forEach((r, idx) => {
      const color = getSubsidiaryColor(idx);
      const subName = r.corporateName ?? r.subsidiaryId;
      series.push({ key: `${subName}_roa`, label: `${subName} ROA`, color, unit: '%' });
      series.push({ key: `${subName}_npm`, label: `${subName} NPM`, color: color + '99', unit: '%' });
    });
    return series;
  }, [displayedRatios]);

  // YoY calculations for the selected company's latest ratios
  const yoyData = useMemo(() => {
    if (displayedRatios.length === 0) return [];
    const latest = displayedRatios[0];
    const latestDate = parseDateSafe(latest.periodStartDate);
    if (!latestDate) return [];
    // Find data from ~1 year ago
    const oneYearAgo = format(subYears(latestDate, 1), 'yyyy-MM-dd');
    const prevRatio = trendRatios.find(
      (r) => r.subsidiaryId === latest.subsidiaryId && r.periodStartDate <= oneYearAgo
    );
    if (!prevRatio) return [];
    return [
      { key: 'roa', label: 'ROA', value: latest.roa !== null && prevRatio.roa !== null ? calculateYoY(latest.roa, prevRatio.roa) : null },
      { key: 'npm', label: 'NPM', value: latest.npm !== null && prevRatio.npm !== null ? calculateYoY(latest.npm, prevRatio.npm) : null },
    ];
  }, [displayedRatios, trendRatios]);

  const queryClient = useQueryClient();

  const handleRefresh = useCallback(() => {
    // Clear all dashboard and transactional data
    queryClient.invalidateQueries({ queryKey: ['mafinda'] });
    queryClient.invalidateQueries({ queryKey: ['corporates'] });
    queryClient.invalidateQueries({ queryKey: ['ratios'] });
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    queryClient.invalidateQueries({ queryKey: ['management'] });
    
    // Add a toast notification if possible, but at least trigger the fetchers
  }, [queryClient]);

  if (isLoading && subsidiaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {t.title}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Corporate Finance Dashboard • {
              dynamicPeriodLabel || (
                globalPeriodType === 'quarterly' 
                  ? (subPeriod === 'Q1' ? `${common.months[0]} - ${common.months[2]} ${year}` : subPeriod === 'Q2' ? `${common.months[3]} - ${common.months[5]} ${year}` : subPeriod === 'Q3' ? `${common.months[6]} - ${common.months[8]} ${year}` : `${common.months[9]} - ${common.months[11]} ${year}`)
                  : (subPeriod === 'S1' ? `${common.months[0]} - ${common.months[5]} ${year}` : `${common.months[6]} - ${common.months[11]} ${year}`)
              )
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <DashboardGlobalFilter
            year={year}
            setYear={setYear}
            periodType={globalPeriodType}
            setPeriodType={setGlobalPeriodType}
            subPeriod={subPeriod}
            setSubPeriod={setSubPeriod}
          />

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

          <CompanySelector
            subsidiaries={subsidiaries}
            selectedId={selectedCompany}
            onChange={handleCompanyChange}
          />

          <button
            onClick={handleRefresh}
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95 shadow-sm bg-white border border-slate-200"
            title="Refresh Dashboard"
          >
            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin text-indigo-600")} />
          </button>
        </div>
      </div>

      {/* Health Score Gauges - responsive grid */}
      {displayedRatios.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">{t.healthScores}</h3>
          <div className={cn(
            'grid gap-4',
            displayedRatios.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
              displayedRatios.length === 2 ? 'grid-cols-2' :
                displayedRatios.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
                  'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          )}>
            {displayedRatios.map((r) => {
              const colorIdx = subsidiaries.findIndex((s) => s.id === r.subsidiaryId);
              return (
                <HealthScoreGauge
                  key={r.subsidiaryId}
                  score={r.healthScore}
                  subsidiaryName={r.corporateName ?? r.subsidiaryId}
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
          const colorIdx = subsidiaries.findIndex((s) => s.id === r.subsidiaryId);
          return (
            <RatioCard
              key={r.subsidiaryId}
              subsidiaryName={r.corporateName ?? r.subsidiaryId}
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
          title={t.ratioTrends}
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

      {/* ── CFD Section ── */}
      <div className="pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t.opFinancialPerformance}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t.opFinancialPerformanceDesc}</p>
          </div>
        </div>

        {mafindaData.error && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
            {t.cfdDataLoadError}: {mafindaData.error}
          </div>
        )}

        {/* Financial Summary Cards — 6 metric cards */}
        <div className="mb-4">
          <FinancialSummaryCards
            assetData={mafindaData.assetComposition}
            equityData={mafindaData.equityLiabilityComposition}
            isLoading={mafindaData.isLoading}
          />
        </div>

        {/* Revenue Target — full width */}
        <div className="mb-4">
          <RevenueTargetChart
            data={mafindaData.revenueTargetData?.departments ?? []}
            period={mafindaPeriod}
            isLoading={mafindaData.isLoading}
          />
        </div>

        {/* Department Performance Achievement */}
        <div className="mb-4">
          <DepartmentPerformance
            departments={mafindaData.revenueTargetData?.departments ?? []}
            allDepartments={departments}
            period={mafindaPeriod}
            isLoading={mafindaData.isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <RevenueCostCards
              summary={mafindaData.revenueCostSummary}
              departments={departmentOptions}
              selectedDepartmentId={revenueDeptId}
              onDepartmentChange={setRevenueDeptId}
              isLoading={mafindaData.isLoading || isDeptsLoading}
            />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <CashFlowChart
              data={mafindaData.cashFlowData?.data ?? []}
              departments={departmentOptions}
              projects={[]} // Removed project filter from dashboard
              selectedDepartmentId={cashFlowDeptId}
              selectedProjectId={''}
              onDepartmentChange={setCashFlowDeptId}
              onProjectChange={() => { }}
              isLoading={mafindaData.isLoading || isDeptsLoading}
            />
          </div>
        </div>

        {/* Projection Visualization Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <WaterfallChart 
            data={mafindaData.cashFlowBridge ?? []} 
            isLoading={mafindaData.isLoading} 
          />
          <ProjectionRealizationChart 
            data={mafindaData.projectionRealization ?? []} 
            isLoading={mafindaData.isLoading} 
          />
        </div>

        {/* Pie 3D — Asset & Equity Composition */}
        <div className="mb-4">
          <CompositionPie3D
            assetData={mafindaData.assetComposition}
            equityData={mafindaData.equityLiabilityComposition}
            isLoading={mafindaData.isLoading}
          />
        </div>

        {/* Historical Financial Trend - Split into 2 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueProfitTrend
            data={mafindaData.historicalData}
            isLoading={mafindaData.isLoading}
          />
          <AssetLiabilityTrend
            data={mafindaData.historicalData}
            isLoading={mafindaData.isLoading}
          />
        </div>
      </div>

      {/* Empty state */}
      {!isLoading && subsidiaries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">{t.noSubsidiaries}</p>
          <p className="text-sm text-slate-400 mt-1">{t.noSubsidiariesDesc}</p>
        </div>
      )}
    </div>
  );
};
