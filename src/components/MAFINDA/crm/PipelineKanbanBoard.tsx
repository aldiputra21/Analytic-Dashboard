import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanColumn, PipelineStage } from '../../../types/crm';
import { OpportunityCard } from './OpportunityCard';

interface PipelineKanbanBoardProps {
  columns: KanbanColumn[];
  onStageChange?: (opportunityId: string, newStage: PipelineStage) => Promise<void>;
  onEditOpportunity?: (id: string) => void;
  onCreateOpportunity?: (stage: PipelineStage) => void;
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

const STAGE_HEADER_COLORS: Record<PipelineStage, string> = {
  Lead: 'bg-slate-100 text-slate-700 border-slate-200',
  Qualification: 'bg-blue-50 text-blue-700 border-blue-200',
  Tender: 'bg-amber-50 text-amber-700 border-amber-200',
  Proposal: 'bg-purple-50 text-purple-700 border-purple-200',
  Negotiation: 'bg-orange-50 text-orange-700 border-orange-200',
  Contract: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function PipelineKanbanBoard({
  columns,
  onStageChange,
  onEditOpportunity,
  onCreateOpportunity,
  loading = false,
}: PipelineKanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const handleDragStart = (e: React.DragEvent, opportunityId: string) => {
    setDraggingId(opportunityId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    if (draggingId && onStageChange) {
      await onStageChange(draggingId, stage);
    }
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Memuat pipeline...
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {columns.map((col) => (
        <div
          key={col.stage}
          className={`flex-shrink-0 w-60 flex flex-col rounded-xl border transition-colors ${
            dragOverStage === col.stage ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50'
          }`}
          onDragOver={(e) => handleDragOver(e, col.stage)}
          onDrop={(e) => handleDrop(e, col.stage)}
          onDragLeave={() => setDragOverStage(null)}
        >
          {/* Column Header */}
          <div className={`px-3 py-2.5 rounded-t-xl border-b ${STAGE_HEADER_COLORS[col.stage]}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{STAGE_LABELS[col.stage]}</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 bg-white/60 rounded-full">
                {col.count}
              </span>
            </div>
            {col.totalValue > 0 && (
              <p className="text-[10px] mt-0.5 opacity-70">{formatCurrency(col.totalValue)}</p>
            )}
          </div>

          {/* Cards */}
          <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
            {col.opportunities.map((opp) => (
              <div
                key={opp.id}
                draggable
                onDragStart={(e) => handleDragStart(e, opp.id)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${draggingId === opp.id ? 'opacity-40' : 'opacity-100'}`}
              >
                <OpportunityCard
                  opportunity={opp}
                  onEdit={onEditOpportunity}
                  onStageChange={onStageChange ? (id, stage) => onStageChange(id, stage) : undefined}
                />
              </div>
            ))}

            {col.opportunities.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Tidak ada opportunity</div>
            )}
          </div>

          {/* Add button */}
          {onCreateOpportunity && (
            <div className="p-2 border-t border-slate-200">
              <button
                onClick={() => onCreateOpportunity(col.stage)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
