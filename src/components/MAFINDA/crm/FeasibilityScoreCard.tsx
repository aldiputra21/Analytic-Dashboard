import React from 'react';
import { Qualification, QualificationRecommendation } from '../../../types/crm';
import { FEASIBILITY_THRESHOLDS } from '../../../services/crm/feasibilityCalculator';

interface FeasibilityScoreCardProps {
  qualification: Qualification;
  onApprove?: () => void;
  onReject?: () => void;
  canApprove?: boolean;
}

function ScoreBar({ score, max = 10 }: { score?: number; max?: number }) {
  const pct = score != null ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-6 text-right">{score ?? '—'}</span>
    </div>
  );
}

const RECOMMENDATION_STYLES: Record<QualificationRecommendation, string> = {
  Proceed: 'bg-green-100 text-green-800 border-green-300',
  Hold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Reject: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

function ScoreGauge({ score }: { score: number }) {
  const color =
    score < FEASIBILITY_THRESHOLDS.REJECT_MAX
      ? '#ef4444'
      : score <= FEASIBILITY_THRESHOLDS.HOLD_MAX
      ? '#f59e0b'
      : '#22c55e';

  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-14 overflow-hidden">
        {/* Background arc */}
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 141.4} 141.4`}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-xl font-bold" style={{ color }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-500 mt-1">/ 100</span>
    </div>
  );
}

export function FeasibilityScoreCard({
  qualification,
  onApprove,
  onReject,
  canApprove = false,
}: FeasibilityScoreCardProps) {
  const {
    feasibilityScore,
    recommendation,
    status,
    technicalCapabilityScore,
    resourceAvailabilityScore,
    contractValueScore,
    estimatedMarginScore,
    riskScore,
    notes,
    resourcePlan,
    version,
    createdAt,
    approvedBy,
    approvedAt,
  } = qualification;

  return (
    <div className="bg-white border rounded-xl shadow-sm p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Analisis Kualifikasi</h3>
          <p className="text-xs text-gray-500 mt-0.5">Versi {version}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              RECOMMENDATION_STYLES[recommendation]
            }`}
          >
            {recommendation}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Score Gauge */}
      <div className="flex justify-center">
        <ScoreGauge score={feasibilityScore} />
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Dimensi Teknis
        </p>
        <div className="space-y-1.5">
          <div>
            <span className="text-xs text-gray-600">Kemampuan Teknis</span>
            <ScoreBar score={technicalCapabilityScore} />
          </div>
          <div>
            <span className="text-xs text-gray-600">Ketersediaan Sumber Daya</span>
            <ScoreBar score={resourceAvailabilityScore} />
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
          Dimensi Bisnis
        </p>
        <div className="space-y-1.5">
          <div>
            <span className="text-xs text-gray-600">Nilai Kontrak</span>
            <ScoreBar score={contractValueScore} />
          </div>
          <div>
            <span className="text-xs text-gray-600">Estimasi Margin</span>
            <ScoreBar score={estimatedMarginScore} />
          </div>
          <div>
            <span className="text-xs text-gray-600">Risiko</span>
            <ScoreBar score={riskScore} />
          </div>
        </div>
      </div>

      {/* Resource Plan */}
      {resourcePlan && resourcePlan.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Rencana Sumber Daya
          </p>
          <table className="w-full text-xs border rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-2 py-1">Posisi</th>
                <th className="text-right px-2 py-1">Jml</th>
                <th className="text-right px-2 py-1">Durasi</th>
              </tr>
            </thead>
            <tbody>
              {resourcePlan.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1">{r.position}</td>
                  <td className="px-2 py-1 text-right">{r.count}</td>
                  <td className="px-2 py-1 text-right">{r.durationMonths} bln</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
          <p className="text-xs font-semibold text-gray-500 mb-1">Catatan</p>
          {notes}
        </div>
      )}

      {/* Approval info */}
      {status === 'Approved' && approvedBy && (
        <p className="text-xs text-gray-500">
          Disetujui oleh {approvedBy} pada{' '}
          {approvedAt ? new Date(approvedAt).toLocaleDateString('id-ID') : '—'}
        </p>
      )}

      {/* Low score warning (Req 3.4) */}
      {feasibilityScore < FEASIBILITY_THRESHOLDS.REJECT_MAX && status === 'Draft' && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
          Score di bawah {FEASIBILITY_THRESHOLDS.REJECT_MAX}. Rekomendasi otomatis: Reject.
          Konfirmasi BD_Manager diperlukan untuk melanjutkan.
        </div>
      )}

      {/* Approve / Reject actions */}
      {canApprove && status === 'Draft' && (
        <div className="flex gap-2 pt-2">
          {onReject && (
            <button
              onClick={onReject}
              className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
            >
              Tolak
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Setujui
            </button>
          )}
        </div>
      )}
    </div>
  );
}
