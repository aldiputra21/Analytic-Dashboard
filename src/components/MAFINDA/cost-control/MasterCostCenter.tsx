import React from 'react';

export const MasterCostCenter: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Pengelolaan Kode Cost Center</h1>
            <p className="text-sm text-slate-500">Melihat, menambah, dan mengubah master kode Cost Center yang digunakan proyek.</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
            + Tambah Kode
          </button>
        </div>
        
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Kode Cost Center</th>
                <th className="px-6 py-3 font-semibold">Keterangan / Deskripsi</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {/* Data Master Template */}
              <tr className="border-b text-slate-700 hover:bg-slate-50">
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                  Belum ada master data Cost Center.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
