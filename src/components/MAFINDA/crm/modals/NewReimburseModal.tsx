import React, { useState } from 'react';
import { X, Upload, Plus, Trash2, Receipt } from 'lucide-react';

interface Props { onClose: () => void; }

const CATEGORIES = ['travel', 'accommodation', 'meals', 'transportation', 'entertainment', 'printing', 'other'];
const CATEGORY_LABELS: Record<string, string> = {
  travel: '✈ Travel', accommodation: '🏨 Akomodasi', meals: '🍽 Makan & Minum',
  transportation: '🚗 Transportasi', entertainment: '🎭 Entertainment', printing: '🖨 Cetak & ATK', other: '📦 Lainnya',
};
const PROJECTS = [
  'EPC Project - Offshore Platform', 'Maintenance Contract - Chevron',
  'Pipeline Installation - Total E&P', 'Engineering Services - ExxonMobil',
  'Refinery Turnaround - RU IV', 'Various Projects',
];
const REQUESTERS = ['Ahmad Rizki', 'Dewi Lestari', 'Budi Santoso', 'Siti Nurhaliza', 'Rudi Hartono'];

interface ReceiptItem { description: string; amount: string; date: string; }

export function NewReimburseModal({ onClose }: Props) {
  const [form, setForm] = useState({
    requester: '', category: 'travel', project: '',
    activityDate: '', activityDescription: '',
    totalAmount: '', currency: 'IDR',
    approver: 'Finance Manager', notes: '',
    bankAccount: '', bankName: '',
  });
  const [receipts, setReceipts] = useState<ReceiptItem[]>([
    { description: '', amount: '', date: '' },
  ]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addReceipt = () => setReceipts(r => [...r, { description: '', amount: '', date: '' }]);
  const removeReceipt = (i: number) => setReceipts(r => r.filter((_, j) => j !== i));
  const updateReceipt = (i: number, k: keyof ReceiptItem, v: string) =>
    setReceipts(r => r.map((item, j) => j === i ? { ...item, [k]: v } : item));

  const totalFromReceipts = receipts.reduce((s, r) => s + (parseFloat(r.amount.replace(/\D/g, '')) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Reimbursement Request</h2>
            <p className="text-xs text-gray-500">Ajukan permintaan penggantian biaya</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informasi Pengajuan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pemohon <span className="text-red-500">*</span></label>
                <select value={form.requester} onChange={e => set('requester', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih pemohon...</option>
                  {REQUESTERS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proyek / Kegiatan <span className="text-red-500">*</span></label>
                <select value={form.project} onChange={e => set('project', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih proyek...</option>
                  {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Kegiatan</label>
                <input type="date" value={form.activityDate} onChange={e => set('activityDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Approver</label>
                <input value={form.approver} onChange={e => set('approver', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Kategori Biaya <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => set('category', c)}
                  className={`px-2 py-2 text-xs font-medium rounded-lg border-2 transition-colors text-center ${form.category === c ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Kegiatan <span className="text-red-500">*</span></label>
            <textarea value={form.activityDescription} onChange={e => set('activityDescription', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Jelaskan kegiatan yang memerlukan penggantian biaya..." />
          </div>

          {/* Receipt Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rincian Biaya</h3>
              <button onClick={addReceipt} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />Tambah Item
              </button>
            </div>
            <div className="space-y-2">
              {receipts.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Receipt className="w-4 h-4 text-gray-400 shrink-0" />
                  <input value={r.description} onChange={e => updateReceipt(i, 'description', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Deskripsi item" />
                  <input type="date" value={r.date} onChange={e => updateReceipt(i, 'date', e.target.value)}
                    className="w-36 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={r.amount} onChange={e => updateReceipt(i, 'amount', e.target.value)}
                    className="w-32 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="Jumlah (IDR)" />
                  {receipts.length > 1 && (
                    <button onClick={() => removeReceipt(i)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            {/* Total */}
            <div className="mt-3 flex justify-end">
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm">
                <span className="text-orange-600 font-medium">Total: </span>
                <span className="font-bold text-orange-800">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalFromReceipts)}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informasi Rekening</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Bank</label>
                <select value={form.bankName} onChange={e => set('bankName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih bank...</option>
                  {['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga', 'Permata Bank'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Rekening</label>
                <input value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nomor rekening" />
              </div>
            </div>
          </div>

          {/* Upload Receipts */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upload Bukti / Kwitansi</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer">
              <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Upload foto atau scan kwitansi</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — maks 10MB per file</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Tambahan</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Catatan atau keterangan tambahan..." />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700">Simpan Draft</button>
          <button onClick={onClose} className="px-6 py-2 text-sm font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-700">✓ Ajukan Reimburse</button>
        </div>
      </div>
    </div>
  );
}
