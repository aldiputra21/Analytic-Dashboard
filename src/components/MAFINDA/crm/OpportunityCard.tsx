import React from 'react';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { OpportunitySummary, PipelineStage } from '../../../types/crm';

interface OpportunityCardProps {
  opportunity: OpportunitySummary;
  onEdit?: (id: string) => void;
  onStageChange?: (id: string, stage: PipelineStage) => void;
}

const STAGE_COLORS: Record<PipelineStage, string> = {
  Lead: 'bg-slate-100 text-slate-700',
  Qualification: 'bg-blue-50 text-blue-700',
  Tender: 'bg-amber-50 text-amber-700',
  Proposal: 'bg-purple-50 text-purple-700',
  Negotiation: 'bg-orange-50 text-orange-700',
  Contract: 'bg-emerald-50 text-emerald-700',
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function OpportunityCard({ opportunity, onEdit, onStageChange }: OpportunityCardProps) {
  const { id, name, customerName, estimatedValue, stage, probability, isStale, lastActivityDate } =
    opportunity;

  return (
    <div
      className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isStale ? 'border-amber-200' : 'border-slate-200'
      }`}
      onClick={() => onEdit?.(id)}
    >
      {/* Stale indicator */}
      {isStale && (
        <div className="flex items-center gap-1 mb-2 text-amber-600">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-[10px] font-medium">Tidak ada aktivitas &gt;14 hari</span>
        </div>
      )}

      {/* Name */}
      <p className="text-sm font-semibold text-slate-800 leading-tight mb-1 line-clamp-2">{name}</p>

      {/* Customer */}
      <p className="text-xs text-slate-500 mb-2">{customerName}</p>

      {/* Value & Probability */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-indigo-700">
          {estimatedValue ? formatCurrency(estimatedValue) : '—'}
        </span>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <TrendingUp className="w-3 h-3" />
          <span>{probability}%</span>
        </div>
      </div>

      {/* Last activity */}
      {lastActivityDate && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>
            {new Date(lastActivityDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      )}
    </div>
  );
}
