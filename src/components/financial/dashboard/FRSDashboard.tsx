// FRSDashboard.tsx - Main dashboard page wiring all components together
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 13.1, 13.2, 13.4, 13.6

import React, { useState, useMemo, useCallback } from 'react';
import { format, subYears } from 'date-fns';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { CompanySelector, getSubsidiaryColor } from './CompanySelector';
import { PeriodSelector, PeriodRange, getPeriodStartDate } from './PeriodSelector';
import { HealthScoreGauge } from './HealthScoreGauge';
import { RatioCard } from './RatioCard';
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
import { AssetCompositionChart } from '../../MAFINDA/dashboard/AssetCompositionChart';
import { EquityLiabilityChart } from '../../MAFINDA/dashboard/EquityLiabilityChart';
import { RevenueTargetChart } from '../../MAFINDA/dashboard/RevenueTargetChart';
import { HistoricalDataChart } from '../../MAFINDA/dashboard/HistoricalDataChart';
import { FinancialSummaryCards } from '../../MAFINDA/dashboard/FinancialSummaryCards';
import { CompositionPie3D } from '../../MAFINDA/dashboard/CompositionPie3D';
import { DepartmentPerformance } from '../../MAFINDA/dashboard/DepartmentPerformance';
import { useDashboard, type DashboardFilters } from '../../../hooks/mafinda/useDashboard';
import { useManagement } from '../../../hooks/mafinda/useManagement';

function parseDateSafe(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

import { dashboardI18n } from '../../../i18n/dashboard';

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

  const { corporates: subsidiariesData, isLoading: subsLoading, refetch: refetchSubs } = useCorporates();
  const subsidiaries = Array.isArray(subsidiariesData) ? subsidiariesData : [];
  
  // Fetch latest ratios (for gauges and cards)
  const { ratios: latestRatios, isLoading: ratiosLoading, refetch: refetchRatios } = useLatestRatios();

  // Period-filtered ratios for trend chart — memoize startDate to prevent infinite re-renders
  const startDate = useMemo(() => format(getPeriodStartDate(period), 'yyyy-MM-dd'), [period]);
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

  const mainFilters: DashboardFilters = useMemo(
    () => ({
      period: mafindaPeriod,
      periodType: mafindaPeriodType,
      historicalMonths: mafindaHistoricalMonths,
      corporateId: selectedCompany !== 'all' ? selectedCompany : undefined,
    }),
    [mafindaPeriod, mafindaPeriodType, mafindaHistoricalMonths, selectedCompany]
  );
  const mafindaRevCostFilters = useMemo(
    () => ({ ...mainFilters, departmentId: revenueDeptId || undefined }),
    [mainFilters, revenueDeptId]
  );
  const mafindaCashFlowFilters = useMemo(
    () => ({ ...mainFilters, departmentId: cashFlowDeptId || undefined }),
    [mainFilters, cashFlowDeptId]
  );

  const mafindaMain = useDashboard(mainFilters);
  const mafindaRevCost = useDashboard(mafindaRevCostFilters);
  const mafindaCashFlow = useDashboard(mafindaCashFlowFilters);
  const { options: departmentOptions, isLoading: isDeptsLoading } = useDashboardDepartments(selectedCompany);
  const { departments: deptsData } = useManagement();
  const departments = Array.isArray(deptsData) ? deptsData : [];

  // Filter latest ratios by selected company
  const displayedRatios = useMemo(() => {
    if (selectedCompany === 'all') return latestRatios;
    return latestRatios.filter((r) => r.subsidiaryId === selectedCompany);
  }, [latestRatios, selectedCompany]);

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
      const key = r.periodStartDate;
      if (!byDate.has(key)) byDate.set(key, {});
      const entry = byDate.get(key)!;
      const subKey = r.corporateName ?? r.subsidiaryId;
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
    latestRatios.forEach((r, idx) => {
      const color = getSubsidiaryColor(idx);
      const subName = r.corporateName ?? r.subsidiaryId;
      series.push({ key: `${subName}_roa`, label: `${subName} ROA`, color, unit: '%' });
      series.push({ key: `${subName}_npm`, label: `${subName} NPM`, color: color + '99', unit: '%' });
    });
    return series;
  }, [latestRatios]);

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

  const handleRefresh = useCallback(() => {
    refetchSubs();
    refetchRatios();
  }, [refetchSubs, refetchRatios]);

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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <CompanySelector
          subsidiaries={subsidiaries}
          selectedId={selectedCompany}
          onChange={handleCompanyChange}
        />
        <PeriodSelector value={period} onChange={setPeriod} />
        <button
          onClick={handleRefresh}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          {t.refresh}
        </button>
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
              <option value="monthly">{t.periodMonthly}</option>
              <option value="quarterly">{t.periodQuarterly}</option>
              <option value="annual">{t.periodAnnual}</option>
            </select>
          </div>
        </div>

        {mafindaMain.error && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
            {t.cfdDataLoadError}: {mafindaMain.error}
          </div>
        )}

        {/* Financial Summary Cards — 6 metric cards */}
        <div className="mb-4">
          <FinancialSummaryCards
            assetData={mafindaMain.assetComposition}
            equityData={mafindaMain.equityLiabilityComposition}
            isLoading={mafindaMain.isLoading}
          />
        </div>

        {/* Revenue Target — full width */}
        <div className="mb-4">
          <RevenueTargetChart
            data={mafindaMain.revenueTargetData?.departments ?? []}
            period={mafindaPeriod}
            isLoading={mafindaMain.isLoading}
          />
        </div>

        {/* Department Performance Achievement */}
        <div className="mb-4">
          <DepartmentPerformance
            departments={mafindaMain.revenueTargetData?.departments ?? []}
            allDepartments={departments}
            period={mafindaPeriod}
            isLoading={mafindaMain.isLoading}
          />
        </div>

        {/* Revenue Cost + Cash Flow — 2 col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <RevenueCostCards
              summary={mafindaRevCost.revenueCostSummary}
              departments={departmentOptions}
              selectedDepartmentId={revenueDeptId}
              onDepartmentChange={setRevenueDeptId}
              isLoading={mafindaRevCost.isLoading || isDeptsLoading}
            />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <CashFlowChart
              data={mafindaCashFlow.cashFlowData?.data ?? []}
              departments={departmentOptions}
              projects={[]} // Removed project filter from dashboard
              selectedDepartmentId={cashFlowDeptId}
              selectedProjectId={''}
              onDepartmentChange={setCashFlowDeptId}
              onProjectChange={() => {}}
              isLoading={mafindaCashFlow.isLoading || isDeptsLoading}
            />
          </div>
        </div>

        {/* Pie 3D — Asset & Equity Composition */}
        <div className="mb-4">
          <CompositionPie3D
            assetData={mafindaMain.assetComposition}
            equityData={mafindaMain.equityLiabilityComposition}
            isLoading={mafindaMain.isLoading}
          />
        </div>

        {/* Asset + Equity donut — 2 col */}
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
          <p className="text-slate-500 font-medium">{t.noSubsidiaries}</p>
          <p className="text-sm text-slate-400 mt-1">{t.noSubsidiariesDesc}</p>
        </div>
      )}
    </div>
  );
};
