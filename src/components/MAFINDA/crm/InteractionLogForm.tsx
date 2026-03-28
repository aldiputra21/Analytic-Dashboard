import React, { useState } from 'react';
import { InteractionType, CreateInteractionInput } from '../../../types/crm';

interface InteractionLogFormProps {
  entityId: string;
  entityType: 'customer' | 'opportunity';
  onSubmit: (data: CreateInteractionInput) => void | Promise<void>;
  onCancel?: () => void;
}

const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
  { value: 'Visit', label: 'Kunjungan' },
  { value: 'Phone', label: 'Telepon' },
  { value: 'Email', label: 'Email' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Other', label: 'Lainnya' },
];

export function InteractionLogForm({
  entityId,
  entityType,
  onSubmit,
  onCancel,
}: InteractionLogFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<CreateInteractionInput>({
    entityId,
    entityType,
    type: 'Meeting',
    interactionDate: new Date(today),
    summary: '',
    nextAction: '',
    nextActionDate: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.type) errs.type = 'Jenis interaksi wajib dipilih';
    if (!form.interactionDate) errs.interactionDate = 'Tanggal wajib diisi';
    if (!form.summary.trim()) errs.summary = 'Ringkasan wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Jenis Interaksi <span className="text-red-500">*</span>
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as InteractionType })}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.type ? 'border-red-400' : 'border-slate-200'
            }`}
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Tanggal <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={
              form.interactionDate instanceof Date
                ? form.interactionDate.toISOString().split('T')[0]
                : String(form.interactionDate)
            }
            onChange={(e) =>
              setForm({ ...form, interactionDate: new Date(e.target.value) })
            }
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.interactionDate ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.interactionDate && (
            <p className="mt-1 text-xs text-red-500">{errors.interactionDate}</p>
          )}
        </div>

        {/* Summary */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Ringkasan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
              errors.summary ? 'border-red-400' : 'border-slate-200'
            }`}
            placeholder="Ringkasan hasil interaksi..."
          />
          {errors.summary && <p className="mt-1 text-xs text-red-500">{errors.summary}</p>}
        </div>

        {/* Next Action */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Tindak Lanjut
          </label>
          <input
            type="text"
            value={form.nextAction ?? ''}
            onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Rencana tindak lanjut..."
          />
        </div>

        {/* Next Action Date */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Tanggal Tindak Lanjut
          </label>
          <input
            type="date"
            value={
              form.nextActionDate instanceof Date
                ? form.nextActionDate.toISOString().split('T')[0]
                : form.nextActionDate
                ? String(form.nextActionDate)
                : ''
            }
            onChange={(e) =>
              setForm({
                ...form,
                nextActionDate: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : 'Catat Interaksi'}
        </button>
      </div>
    </form>
  );
}
