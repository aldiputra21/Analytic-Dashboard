import React, { useState } from 'react';
import { X, Plus, Trash2, Search, Building2 } from 'lucide-react';

interface Props { onClose: () => void; }

const INDUSTRIES = ['Oil & Gas', 'Refinery', 'Petrochemical', 'Mining', 'Power Plant', 'Construction', 'Manufacturing'];
const CONTACT_ROLES = ['PIC', 'Decision Maker', 'Technical', 'Finance', 'Procurement', 'Other'];

// Dummy customer list for parent selector (in production, fetch from API)
const EXISTING_CUSTOMERS = [
  { id: 'CUST-001', name: 'PT Pertamina (Persero)' },
  { id: 'CUST-002', name: 'Chevron Pacific Indonesia' },
  { id: 'CUST-003', name: 'TotalEnergies EP Indonesie' },
  { id: 'CUST-004', name: 'PT Medco Energi' },
  { id: 'CUST-005', name: 'Pertamina RU IV Cilacap' },
  { id: 'CUST-006', name: 'PT Pertamina Hulu Energi' },
];

interface ContactEntry { name: string; title: string; phone: string; email: string; role: string; isPrimary: boolean; }

export function NewCustomerModal({ onClose }: Props) {
  const [form, setForm] = useState({
    companyName: '', industry: 'Oil & Gas', address: '', npwp: '',
    website: '', phone: '', email: '', city: '', province: '',
    companySize: '', annualRevenue: '', notes: '', parentCustomerId: '',
  });
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [contacts, setContacts] = useState<ContactEntry[]>([
    { name: '', title: '', phone: '', email: '', role: 'PIC', isPrimary: true },
  ]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addContact = () => setContacts(c => [...c, { name: '', title: '', phone: '', email: '', role: 'PIC', isPrimary: false }]);
  const removeContact = (i: number) => setContacts(c => c.filter((_, j) => j !== i));
  const setContact = (i: number, k: keyof ContactEntry, v: any) =>
    setContacts(c => c.map((ct, j) => j === i ? { ...ct, [k]: v } : ct));
  const setPrimary = (i: number) =>
    setContacts(c => c.map((ct, j) => ({ ...ct, isPrimary: j === i })));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Customer</h2>
            <p className="text-xs text-gray-500">Tambah data pelanggan baru</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Company Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informasi Perusahaan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Perusahaan <span className="text-red-500">*</span></label>
                <input value={form.companyName} onChange={e => set('companyName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. PT Pertamina (Persero)" />
              </div>
              <div className="col-span-2 relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Perusahaan Induk <span className="text-xs font-normal text-gray-400">(opsional)</span>
                </label>
                {form.parentCustomerId ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm border border-blue-300 bg-blue-50 rounded-lg">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="flex-1 text-blue-800 font-medium">
                      {EXISTING_CUSTOMERS.find(c => c.id === form.parentCustomerId)?.name ?? form.parentCustomerId}
                    </span>
                    <button onClick={() => { set('parentCustomerId', ''); setParentSearch(''); }}
                      className="text-blue-400 hover:text-blue-600"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={parentSearch}
                      onChange={e => { setParentSearch(e.target.value); setShowParentDropdown(true); }}
                      onFocus={() => setShowParentDropdown(true)}
                      onBlur={() => setTimeout(() => setShowParentDropdown(false), 200)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cari perusahaan induk..." />
                    {showParentDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {EXISTING_CUSTOMERS
                          .filter(c => c.name.toLowerCase().includes(parentSearch.toLowerCase()))
                          .map(c => (
                            <button key={c.id} type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => { set('parentCustomerId', c.id); setParentSearch(c.name); setShowParentDropdown(false); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span>{c.name}</span>
                            </button>
                          ))}
                        {EXISTING_CUSTOMERS.filter(c => c.name.toLowerCase().includes(parentSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-xs text-gray-400">Tidak ada hasil</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-400">Pilih jika customer ini merupakan anak perusahaan</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Industri</label>
                <select value={form.industry} onChange={e => set('industry', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">NPWP</label>
                <input value={form.npwp} onChange={e => set('npwp', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00.000.000.0-000.000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Kantor</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+62 21 ..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Perusahaan</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="info@company.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
                <input value={form.website} onChange={e => set('website', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.company.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kota</label>
                <input value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jakarta Selatan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Provinsi</label>
                <input value={form.province} onChange={e => set('province', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="DKI Jakarta" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ukuran Perusahaan</label>
                <select value={form.companySize} onChange={e => set('companySize', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih ukuran...</option>
                  <option>1-50 karyawan</option>
                  <option>51-200 karyawan</option>
                  <option>201-1000 karyawan</option>
                  <option>1000+ karyawan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estimasi Revenue Tahunan</label>
                <select value={form.annualRevenue} onChange={e => set('annualRevenue', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih range...</option>
                  <option>{'< Rp 10 Miliar'}</option>
                  <option>Rp 10-50 Miliar</option>
                  <option>Rp 50-500 Miliar</option>
                  <option>Rp 500 Miliar - 1 Triliun</option>
                  <option>{'> Rp 1 Triliun'}</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Jl. Medan Merdeka Timur No. 1A, Jakarta Pusat 10110" />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Persons</h3>
              <button onClick={addContact} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold">
                <Plus className="w-3.5 h-3.5" />Tambah Contact
              </button>
            </div>
            <div className="space-y-3">
              {contacts.map((c, i) => (
                <div key={i} className={`border rounded-lg p-4 ${c.isPrimary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600">Contact {i + 1}</span>
                      {c.isPrimary && <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Primary</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!c.isPrimary && (
                        <button onClick={() => setPrimary(i)} className="text-xs text-blue-600 hover:text-blue-700">Set Primary</button>
                      )}
                      {contacts.length > 1 && (
                        <button onClick={() => removeContact(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nama <span className="text-red-500">*</span></label>
                      <input value={c.name} onChange={e => setContact(i, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nama lengkap" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Jabatan</label>
                      <input value={c.title} onChange={e => setContact(i, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. VP Operations" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Phone</label>
                      <input value={c.phone} onChange={e => setContact(i, 'phone', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+62 ..." />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <input type="email" value={c.email} onChange={e => setContact(i, 'email', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@company.com" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Role</label>
                      <select value={c.role} onChange={e => setContact(i, 'role', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Catatan tambahan tentang customer ini..." />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={onClose} className="px-6 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">✓ Simpan Customer</button>
        </div>
      </div>
    </div>
  );
}
