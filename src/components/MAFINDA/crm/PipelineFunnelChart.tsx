import React from 'react';
import { FunnelStageData, PipelineStage } from '../../../types/crm';

interface PipelineFunnelChartProps {
  data: FunnelStageData[];
  loading?: boolean;
}

const STAGE_LABELS: Record<PipelineStage, string> = {
  Lead: 'Lead',
  Qualification: 'Kualifikasi',
  Tender: 'Tender',
  Proposal: 'Proposal',
  Negotiation: 'Negosiasi',
  Contract: 'Kontrak',
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  Lead: 'bg-slate-400',
  Qualification: 'bg-blue-400',
  Tender: 'bg-amber-400',
  Proposal: 'bg-purple-400',
  Negotiation: 'bg-orange-400',
  Contract: 'bg-emerald-500',
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function PipelineFunnelChart({ data, loading = false }: PipelineFunnelChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Memuat funnel...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Tidak ada data pipeline
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      {data.map((item, idx) => {
        const widthPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const marginPct = (100 - widthPct) / 2;

        return (
          <div key={item.stage} className="relative">
            {/* Funnel bar */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg text-white text-xs font-medium transition-all"
              style={{
                marginLeft: `${marginPct}%`,
                marginRight: `${marginPct}%`,
              }}
            >
              <div
                className={`absolute inset-0 rounded-lg ${STAGE_COLORS[item.stage]}`}
                style={{ opacity: 0.85 }}
              />
              <span className="relative z-10">{STAGE_LABELS[item.stage]}</span>
              <div className="relative z-10 flex items-center gap-3">
                <span>{item.count} opp</span>
                {item.totalValue > 0 && (
                  <span className="opacity-80">{formatCurrency(item.totalValue)}</span>
                )}
              </div>
            </div>

            {/* Conversion rate arrow */}
            {idx < data.length - 1 && item.count > 0 && (
              <div className="flex justify-center my-0.5">
                <span className="text-[10px] text-slate-400">
                  ↓ {data[idx + 1].conversionRate.toFixed(0)}% konversi
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
