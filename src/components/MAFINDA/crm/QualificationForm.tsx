import React, { useState } from 'react';
import { CreateQualificationInput, ResourcePlanItem } from '../../../types/crm';
import { FEASIBILITY_THRESHOLDS } from '../../../services/crm/feasibilityCalculator';

interface QualificationFormProps {
  opportunityId: string;
  onSubmit: (data: CreateQualificationInput) => void | Promise<void>;
  onCancel?: () => void;
}

const SCORE_LABELS: Record<number, string> = {
  0: '0 - Tidak Ada',
  2: '2 - Sangat Rendah',
  4: '4 - Rendah',
  6: '6 - Cukup',
  8: '8 - Baik',
  10: '10 - Sangat Baik',
};

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="w-24 text-sm text-gray-600 text-right">
          {value} — {SCORE_LABELS[value] ?? value}
        </span>
      </div>
    </div>
  );
}

export function QualificationForm({ opportunityId, onSubmit, onCancel }: QualificationFormProps) {
  const [form, setForm] = useState<Required<CreateQualificationInput>>({
    technicalCapabilityScore: 5,
    resourceAvailabilityScore: 5,
    contractValueScore: 5,
    estimatedMarginScore: 5,
    riskScore: 5,
    notes: '',
    resourcePlan: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [newResource, setNewResource] = useState<ResourcePlanItem>({
    position: '',
    count: 1,
    durationMonths: 1,
  });

  // Live preview of feasibility score
  const previewScore = Math.round(
    (form.technicalCapabilityScore * 0.2 +
      form.resourceAvailabilityScore * 0.2 +
      form.contractValueScore * 0.2 +
      form.estimatedMarginScore * 0.25 +
      form.riskScore * 0.15) *
      10 *
      10
  ) / 10;

  const previewRecommendation =
    previewScore < FEASIBILITY_THRESHOLDS.REJECT_MAX
      ? 'Reject'
      : previewScore <= FEASIBILITY_THRESHOLDS.HOLD_MAX
      ? 'Hold'
      : 'Proceed';

  const recommendationColor =
    previewRecommendation === 'Proceed'
      ? 'text-green-700 bg-green-50 border-green-200'
      : previewRecommendation === 'Hold'
      ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
      : 'text-red-700 bg-red-50 border-red-200';

  const handleAddResource = () => {
    if (!newResource.position.trim()) return;
    setForm({ ...form, resourcePlan: [...form.resourcePlan, { ...newResource }] });
    setNewResource({ position: '', count: 1, durationMonths: 1 });
  };

  const handleRemoveResource = (index: number) => {
    setForm({ ...form, resourcePlan: form.resourcePlan.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err: any) {
      setApiError(err?.message ?? 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Live Score Preview */}
      <div className={`border rounded-lg p-4 ${recommendationColor}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Feasibility Score (Preview)</span>
          <span className="text-2xl font-bold">{previewScore.toFixed(1)}</span>
        </div>
        <div className="mt-1 text-sm font-semibold">Rekomendasi: {previewRecommendation}</div>
        {previewRecommendation === 'Reject' && (
          <p className="mt-1 text-xs">
            Score di bawah {FEASIBILITY_THRESHOLDS.REJECT_MAX} — konfirmasi BD_Manager diperlukan.
          </p>
        )}
      </div>

      {/* Technical Dimensions */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
          Dimensi Teknis
        </h3>
        <ScoreInput
          label="Kemampuan Teknis"
          value={form.technicalCapabilityScore}
          onChange={(v) => setForm({ ...form, technicalCapabilityScore: v })}
        />
        <ScoreInput
          label="Ketersediaan Sumber Daya"
          value={form.resourceAvailabilityScore}
          onChange={(v) => setForm({ ...form, resourceAvailabilityScore: v })}
        />
      </div>

      {/* Business Dimensions */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
          Dimensi Bisnis
        </h3>
        <ScoreInput
          label="Nilai Kontrak"
          value={form.contractValueScore}
          onChange={(v) => setForm({ ...form, contractValueScore: v })}
        />
        <ScoreInput
          label="Estimasi Margin"
          value={form.estimatedMarginScore}
          onChange={(v) => setForm({ ...form, estimatedMarginScore: v })}
        />
        <ScoreInput
          label="Risiko (semakin tinggi = risiko lebih rendah)"
          value={form.riskScore}
          onChange={(v) => setForm({ ...form, riskScore: v })}
        />
      </div>

      {/* Resource Plan */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
          Rencana Sumber Daya (Req 3.5)
        </h3>
        {form.resourcePlan.length > 0 && (
          <table className="w-full text-sm border rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Posisi</th>
                <th className="text-right px-3 py-2">Jumlah</th>
                <th className="text-right px-3 py-2">Durasi (bln)</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {form.resourcePlan.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{r.position}</td>
                  <td className="px-3 py-2 text-right">{r.count}</td>
                  <td className="px-3 py-2 text-right">{r.durationMonths}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(i)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-600">Posisi</label>
            <input
              type="text"
              value={newResource.position}
              onChange={(e) => setNewResource({ ...newResource, position: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="e.g. Project Manager"
            />
          </div>
          <div className="w-20">
            <label className="text-xs text-gray-600">Jumlah</label>
            <input
              type="number"
              min={1}
              value={newResource.count}
              onChange={(e) => setNewResource({ ...newResource, count: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-600">Durasi (bln)</label>
            <input
              type="number"
              min={1}
              value={newResource.durationMonths}
              onChange={(e) =>
                setNewResource({ ...newResource, durationMonths: Number(e.target.value) })
              }
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddResource}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            + Tambah
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Catatan tambahan analisis kualifikasi..."
        />
      </div>

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {apiError}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Analisis'}
        </button>
      </div>
    </form>
  );
}
