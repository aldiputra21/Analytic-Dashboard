import React from 'react';

export const CostControlDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Dashboard Cost Control</h1>
        <p className="text-sm text-slate-500 mb-6">
          Menampilkan ringkasan budget, pendapatan, dan efisiensi pengeluaran tiap Cost Center.
        </p>
        
        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">Total Target Revenue</p>
            <p className="text-2xl font-bold text-indigo-900">Rp 0</p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Total Realisasi Revenue</p>
            <p className="text-2xl font-bold text-emerald-900">Rp 0</p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-100">
            <p className="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">Total Realisasi Biaya</p>
            <p className="text-2xl font-bold text-red-900">Rp 0</p>
          </div>
        </div>

        <div className="h-64 rounded border border-dashed border-slate-300 flex items-center justify-center p-4">
          <p className="text-sm text-slate-400 font-medium">Bagan Tren & Perbandingan Akan Tampil Di Sini</p>
        </div>
      </div>
    </div>
  );
};
