import React from 'react';

export const InputBudget: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Input Target (Budget) per Proyek</h1>
        <p className="text-sm text-slate-500 mb-6">
          Input perkiraan target revenue dan breakdown limit nominal per kode Cost Center setiap bulannya. Membutuhkan approval setelah diajukan.
        </p>

        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih Proyek</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">-- Pilih Proyek --</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih Tahun</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">-- Pilih Tahun --</option>
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Target Revenue Per Bulan</h3>
            <div className="grid grid-cols-3 gap-3">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((v, i) => (
                <div key={i}>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">{v}</label>
                  <input type="number" placeholder="Rp 0" className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"/>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Target Biaya (Berdasarkan Cost Center)</h3>
            <p className="text-xs text-amber-600 mb-3 bg-amber-50 p-2 rounded-lg border border-amber-200">
              Pilih kode Cost Center terlebih dahulu untuk mengisi breakdown biaya bulanan.
            </p>
            <button type="button" className="text-indigo-600 text-sm font-semibold hover:underline">
              + Tambah Breakdown Cost Center
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border rounded-lg">
              Batal
            </button>
            <button type="button" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
              Ajukan (Butuh Approval)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
