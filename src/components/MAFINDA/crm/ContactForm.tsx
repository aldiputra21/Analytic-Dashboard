import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ContactRole, CreateContactInput } from '../../../types/crm';

interface ContactFormProps {
  customerId?: string; // if provided, saves to API on submit
  initialData?: Partial<CreateContactInput>;
  onSubmit: (data: CreateContactInput) => void | Promise<void>;
  onCancel?: () => void;
}

const ROLE_OPTIONS: { value: ContactRole; label: string }[] = [
  { value: 'PIC', label: 'PIC (Person In Charge)' },
  { value: 'Decision_Maker', label: 'Decision Maker' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Other', label: 'Lainnya' },
];

export function ContactForm({ initialData, onSubmit, onCancel }: ContactFormProps) {
  const [form, setForm] = useState<CreateContactInput>({
    name: initialData?.name ?? '',
    title: initialData?.title ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    role: initialData?.role ?? 'PIC',
    isPrimary: initialData?.isPrimary ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nama kontak wajib diisi';
    if (!form.role) errs.role = 'Role wajib dipilih';
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
        {/* Name */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Nama <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.name ? 'border-red-400' : 'border-slate-200'
            }`}
            placeholder="Nama lengkap kontak"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Jabatan</label>
          <input
            type="text"
            value={form.title ?? ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Jabatan / posisi"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as ContactRole })}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.role ? 'border-red-400' : 'border-slate-200'
            }`}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Telepon</label>
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="+62..."
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="email@perusahaan.com"
          />
        </div>

        {/* Is Primary */}
        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isPrimary"
            checked={form.isPrimary ?? false}
            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <label htmlFor="isPrimary" className="text-xs text-slate-700">
            Jadikan kontak utama
          </label>
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
          {submitting ? 'Menyimpan...' : 'Simpan Kontak'}
        </button>
      </div>
    </form>
  );
}
