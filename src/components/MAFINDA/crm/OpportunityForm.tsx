import React, { useState } from 'react';
import { CreateOpportunityInput, PipelineStage } from '../../../types/crm';

interface OpportunityFormProps {
  initialData?: Partial<CreateOpportunityInput>;
  onSubmit: (data: CreateOpportunityInput) => void | Promise<void>;
  onCancel?: () => void;
  /** List of customers to pick from */
  customers?: { id: string; companyName: string }[];
  /** List of users (Sales Executives) to assign */
  salesExecutives?: { id: string; name: string }[];
  companyId: string;
}

export function OpportunityForm({
  initialData,
  onSubmit,
  onCancel,
  customers = [],
  salesExecutives = [],
  companyId,
}: OpportunityFormProps) {
  const [form, setForm] = useState<CreateOpportunityInput>({
    name: initialData?.name ?? '',
    customerId: initialData?.customerId ?? '',
    estimatedValue: initialData?.estimatedValue,
    assignedTo: initialData?.assignedTo ?? '',
    companyId,
    description: initialData?.description ?? '',
    tenderName: initialData?.tenderName ?? '',
    tenderEstimatedValue: initialData?.tenderEstimatedValue,
    tenderAnnouncementDate: initialData?.tenderAnnouncementDate,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nama opportunity wajib diisi';
    if (!form.customerId) errs.customerId = 'Pelanggan wajib dipilih';
    if (!form.assignedTo) errs.assignedTo = 'Sales Executive wajib dipilih';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await onSubmit(form);
    } catch (err: any) {
      setApiError(err.message ?? 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {apiError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Opportunity Name */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Nama Opportunity <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.name ? 'border-red-400' : 'border-slate-200'
          }`}
          placeholder="Nama proyek atau tender"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Customer */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Pelanggan <span className="text-red-500">*</span>
          </label>
          <select
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.customerId ? 'border-red-400' : 'border-slate-200'
            }`}
          >
            <option value="">Pilih pelanggan...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId}</p>}
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Sales Executive <span className="text-red-500">*</span>
          </label>
          <select
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.assignedTo ? 'border-red-400' : 'border-slate-200'
            }`}
          >
            <option value="">Pilih sales executive...</option>
            {salesExecutives.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {errors.assignedTo && <p className="mt-1 text-xs text-red-500">{errors.assignedTo}</p>}
        </div>

        {/* Estimated Value */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Estimasi Nilai (IDR)
          </label>
          <input
            type="number"
            min={0}
            value={form.estimatedValue ?? ''}
            onChange={(e) =>
              setForm({ ...form, estimatedValue: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>

        {/* Tender Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Nama Tender</label>
          <input
            type="text"
            value={form.tenderName ?? ''}
            onChange={(e) => setForm({ ...form, tenderName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nama tender (opsional)"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Deskripsi</label>
        <textarea
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Deskripsi singkat opportunity..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Opportunity'}
        </button>
      </div>
    </form>
  );
}
