import React from 'react';

export const InputRealisasiRevenue: React.FC = () => {
  return (
    <div className="p-6 max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Input Realisasi Revenue</h1>
        <p className="text-sm text-slate-500 mb-6">Pencatatan pendapatan riil proyek. Menunggu tindakan approval sebelum masuk agregasi.</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Proyek</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              <option value="">-- Pilih Proyek --</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Bulan</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i + 1}>Bulan {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun</label>
              <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" defaultValue={new Date().getFullYear()} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
            <input type="number" placeholder="Contoh: 150000000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border rounded-lg">Batal</button>
            <button type="button" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Ajukan Approval</button>
          </div>
        </form>
      </div>
    </div>
  );
};
