import React, { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { CreateCustomerInput, CreateContactInput, ContactRole } from '../../../types/crm';
import { ContactForm } from './ContactForm';

interface CustomerProfileFormProps {
  initialData?: Partial<CreateCustomerInput>;
  onSubmit: (data: CreateCustomerInput) => void | Promise<void>;
  onCancel?: () => void;
}

const INDUSTRIES = [
  'Konstruksi',
  'Manufaktur',
  'Teknologi',
  'Energi',
  'Pertambangan',
  'Perkebunan',
  'Transportasi',
  'Jasa',
  'Perdagangan',
  'Lainnya',
];

const ROLE_LABELS: Record<ContactRole, string> = {
  PIC: 'PIC',
  Decision_Maker: 'Decision Maker',
  Technical: 'Technical',
  Other: 'Lainnya',
};

export function CustomerProfileForm({
  initialData,
  onSubmit,
  onCancel,
}: CustomerProfileFormProps) {
  const [form, setForm] = useState<CreateCustomerInput>({
    companyName: initialData?.companyName ?? '',
    industry: initialData?.industry ?? '',
    address: initialData?.address ?? '',
    npwp: initialData?.npwp ?? '',
    contacts: initialData?.contacts ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string | string[]> = {};
    if (!form.companyName.trim()) errs.companyName = 'Nama perusahaan wajib diisi';
    if (!form.industry.trim()) errs.industry = 'Industri wajib diisi';
    if (form.contacts.length === 0) {
      errs.contacts = 'Minimal satu kontak wajib diisi';
    } else if (!form.contacts.some((c) => c.role === 'PIC')) {
      errs.contacts = 'Minimal satu kontak dengan role PIC wajib diisi';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddContact = (contact: CreateContactInput) => {
    setForm({ ...form, contacts: [...form.contacts, contact] });
    setShowContactForm(false);
    // Clear contact error if now valid
    if (form.contacts.length >= 0) {
      const newContacts = [...form.contacts, contact];
      if (newContacts.some((c) => c.role === 'PIC')) {
        setErrors((prev) => {
          const { contacts: _, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const handleRemoveContact = (index: number) => {
    const updated = form.contacts.filter((_, i) => i !== index);
    setForm({ ...form, contacts: updated });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Company Info */}
      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-3">Informasi Perusahaan</h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Perusahaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.companyName ? 'border-red-400' : 'border-slate-200'
              }`}
              placeholder="PT Nama Perusahaan"
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-red-500">{errors.companyName as string}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Industri <span className="text-red-500">*</span>
            </label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.industry ? 'border-red-400' : 'border-slate-200'
              }`}
            >
              <option value="">Pilih industri...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="mt-1 text-xs text-red-500">{errors.industry as string}</p>
            )}
          </div>

          {/* NPWP */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">NPWP</label>
            <input
              type="text"
              value={form.npwp ?? ''}
              onChange={(e) => setForm({ ...form, npwp: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="00.000.000.0-000.000"
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Alamat</label>
            <textarea
              value={form.address ?? ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Alamat lengkap perusahaan"
            />
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-800">
            Kontak <span className="text-red-500">*</span>
          </h4>
          <button
            type="button"
            onClick={() => setShowContactForm(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tambah Kontak
          </button>
        </div>

        {errors.contacts && (
          <p className="mb-2 text-xs text-red-500">{errors.contacts as string}</p>
        )}

        {/* Contact list */}
        {form.contacts.length > 0 && (
          <div className="space-y-2 mb-3">
            {form.contacts.map((contact, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{contact.name}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        contact.role === 'PIC'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ROLE_LABELS[contact.role]}
                    </span>
                    {contact.isPrimary && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700">
                        Utama
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {contact.title && (
                      <span className="text-xs text-slate-500">{contact.title}</span>
                    )}
                    {contact.phone && (
                      <span className="text-xs text-slate-400">{contact.phone}</span>
                    )}
                    {contact.email && (
                      <span className="text-xs text-slate-400">{contact.email}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveContact(idx)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Inline contact form */}
        {showContactForm && (
          <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/30">
            <p className="text-xs font-semibold text-slate-700 mb-3">Tambah Kontak Baru</p>
            <ContactForm
              onSubmit={handleAddContact}
              onCancel={() => setShowContactForm(false)}
            />
          </div>
        )}

        {form.contacts.length === 0 && !showContactForm && (
          <button
            type="button"
            onClick={() => setShowContactForm(true)}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah kontak pertama
          </button>
        )}
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
          {submitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
        </button>
      </div>
    </form>
  );
}
