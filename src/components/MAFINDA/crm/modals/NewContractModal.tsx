import React, { useState } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';

interface Props { onClose: () => void; }

const OPPORTUNITIES_WON = [
  'OPP-005 — Refinery Maintenance Turnaround - RU IV Cilacap',
  'OPP-006 — Offshore Platform Services - PHE WMO',
  'OPP-002 — Maintenance Services Contract - Chevron Pacific',
];
const CONTRACT_TYPES = ['Lump Sum', 'Unit Price', 'Cost Plus', 'Time & Material', 'Framework Agreement'];
const MANAGERS = ['Ir. Rudi Hartono', 'Budi Santoso', 'Siti Rahma', 'Ahmad Hidayat', 'Dewi Lestari'];

interface Milestone { milestone: string; pct: number; dueDate: string; }
interface Deliverable { item: string; }

export function NewContractModal({ onClose }: Props) {
  const [form, setForm] = useState({
    opportunityId: '', contractNumber: '', title: '',
    contractType: 'Lump Sum', contractValue: '',
    effectiveDate: '', expiryDate: '', signedDate: '',
    projectManager: '', siteLocation: '', mobilizationDate: '',
    retentionPct: 5, performanceBond: true, performanceBondPct: 5,
    paymentTerms: 'NET 30 days after invoice',
    warrantyMonths: 12, penaltyCapPct: 5,
    scopeOfWork: '', notes: '',
  });
  const [milestones, setMilestones] = useState<Milestone[]>([
    { milestone: 'Mobilisasi & Persiapan', pct: 15, dueDate: '' },
    { milestone: 'Progress 30%', pct: 25, dueDate: '' },
    { milestone: 'Progress 60%', pct: 30, dueDate: '' },
    { milestone: 'Mechanical Completion', pct: 20, dueDate: '' },
    { milestone: 'Final Acceptance', pct: 10, dueDate: '' },
  ]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    { item: 'Completion Report' }, { item: 'As-Built Documentation' },
  ]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const totalPct = milestones.reduce((s, m) => s + m.pct, 0);

  const updateMilestone = (i: number, k: keyof Milestone, v: any) =>
    setMilestones(ms => ms.map((m, j) => j === i ? { ...m, [k]: v } : m));
  const addMilestone = () => setMilestones(ms => [...ms, { milestone: '', pct: 0, dueDate: '' }]);
  const removeMilestone = (i: number) => setMilestones(ms => ms.filter((_, j) => j !== i));

  const updateDeliverable = (i: number, v: string) =>
    setDeliverables(ds => ds.map((d, j) => j === i ? { item: v } : d));
  const addDeliverable = () => setDeliverables(ds => [...ds, { item: '' }]);
  const removeDeliverable = (i: number) => setDeliverables(ds => ds.filter((_, j) => j !== i));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Contract</h2>
            <p className="text-xs text-gray-500">Buat kontrak baru dari opportunity yang won</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informasi Kontrak</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opportunity <span className="text-red-500">*</span></label>
                <select value={form.opportunityId} onChange={e => set('opportunityId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih opportunity yang won...</option>
                  {OPPORTUNITIES_WON.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Kontrak</label>
                <input value={form.contractNumber} onChange={e => set('contractNumber', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. CON-2026-RU4-0012" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipe Kontrak</label>
                <select value={form.contractType} onChange={e => set('contractType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Judul Kontrak <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Refinery Maintenance Turnaround - RU IV Cilacap" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nilai Kontrak (IDR) <span className="text-red-500">*</span></label>
                <input value={form.contractValue} onChange={e => set('contractValue', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 9800000000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Project Manager</label>
                <select value={form.projectManager} onChange={e => set('projectManager', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih PM...</option>
                  {MANAGERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Efektif</label>
                <input type="date" value={form.effectiveDate} onChange={e => set('effectiveDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Berakhir</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Tanda Tangan</label>
                <input type="date" value={form.signedDate} onChange={e => set('signedDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Mobilisasi</label>
                <input type="date" value={form.mobilizationDate} onChange={e => set('mobilizationDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lokasi Proyek</label>
                <input value={form.siteLocation} onChange={e => set('siteLocation', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Pertamina RU IV, Cilacap" />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Terms & Conditions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Terms</label>
                <input value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Warranty (bulan)</label>
                <input type="number" min={0} value={form.warrantyMonths} onChange={e => set('warrantyMonths', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Retention (%)</label>
                <input type="number" min={0} max={20} value={form.retentionPct} onChange={e => set('retentionPct', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Penalty Cap (%)</label>
                <input type="number" min={0} max={20} value={form.penaltyCapPct} onChange={e => set('penaltyCapPct', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.performanceBond} onChange={e => set('performanceBond', e.target.checked)}
                    className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Performance Bond diperlukan</span>
                  {form.performanceBond && (
                    <div className="flex items-center gap-2 ml-2">
                      <input type="number" min={0} max={20} value={form.performanceBondPct}
                        onChange={e => set('performanceBondPct', Number(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Payment Milestones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Milestones</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${totalPct === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Total: {totalPct}%
                </span>
              </div>
              <button onClick={addMilestone} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />Tambah
              </button>
            </div>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">{i+1}</span>
                  <input value={m.milestone} onChange={e => updateMilestone(i, 'milestone', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama milestone" />
                  <div className="flex items-center gap-1 w-20">
                    <input type="number" min={0} max={100} value={m.pct} onChange={e => updateMilestone(i, 'pct', Number(e.target.value))}
                      className="w-14 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <input type="date" value={m.dueDate} onChange={e => updateMilestone(i, 'dueDate', e.target.value)}
                    className="w-36 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {milestones.length > 1 && (
                    <button onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deliverables</h3>
              <button onClick={addDeliverable} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />Tambah
              </button>
            </div>
            <div className="space-y-2">
              {deliverables.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-emerald-500 mt-2.5 text-sm">✓</span>
                  <input value={d.item} onChange={e => updateDeliverable(i, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Completion Report" />
                  {deliverables.length > 1 && (
                    <button onClick={() => removeDeliverable(i)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Scope of Work</label>
            <textarea value={form.scopeOfWork} onChange={e => set('scopeOfWork', e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Deskripsi lingkup pekerjaan..." />
          </div>

          {/* Upload */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upload Dokumen Kontrak</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer">
              <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Upload draft kontrak</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX — maks 50MB</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700">Simpan Draft</button>
          <button onClick={onClose} className="px-6 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">✓ Buat Kontrak</button>
        </div>
      </div>
    </div>
  );
}
