import React, { useState } from 'react';
import { FileText, Download, Printer, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// ---------------------- DUMMY DATA ---------------------- //

const incomeStatementData = [
  { item: 'PENDAPATAN', amount: null, type: 'header' },
  { item: 'Pendapatan Jasa / Operasional', amount: 1500000000, type: 'row' },
  { item: 'Pendapatan Lain-lain', amount: 50000000, type: 'row' },
  { item: 'Total Pendapatan', amount: 1550000000, type: 'subtotal' },

  { item: 'HARGA POKOK PENJUALAN (HPP)', amount: null, type: 'header' },
  { item: 'Biaya Material Langsung', amount: -400000000, type: 'row' },
  { item: 'Biaya Tenaga Kerja Langsung', amount: -350000000, type: 'row' },
  { item: 'Total HPP', amount: -750000000, type: 'subtotal' },

  { item: 'LABA KOTOR', amount: 800000000, type: 'total' },

  { item: 'BEBAN OPERASIONAL (OPEX)', amount: null, type: 'header' },
  { item: 'Beban Gaji & Tunjangan Pokok', amount: -150000000, type: 'row' },
  { item: 'Beban Pemasaran', amount: -45000000, type: 'row' },
  { item: 'Beban Sewa & Infrastruktur', amount: -80000000, type: 'row' },
  { item: 'Total Beban Operasional', amount: -275000000, type: 'subtotal' },

  { item: 'LABA BERSIH SEBELUM PAJAK', amount: 525000000, type: 'total' },
];

const balanceSheetData = [
  { item: 'ASET', amount: null, type: 'header' },
  { item: 'ASET LANCAR', amount: null, type: 'header2' },
  { item: 'Kas dan Setara Kas', amount: 850000000, type: 'row' },
  { item: 'Piutang Usaha', amount: 420000000, type: 'row' },
  { item: 'Persediaan', amount: 120000000, type: 'row' },
  { item: 'Total Aset Lancar', amount: 1390000000, type: 'subtotal' },

  { item: 'ASET TIDAK LANCAR', amount: null, type: 'header2' },
  { item: 'Aset Tetap (Net)', amount: 2100000000, type: 'row' },
  { item: 'Total Aset Tidak Lancar', amount: 2100000000, type: 'subtotal' },

  { item: 'TOTAL ASET', amount: 3490000000, type: 'total' },

  { item: 'LIABILITAS', amount: null, type: 'header' },
  { item: 'Hutang Usaha', amount: 310000000, type: 'row' },
  { item: 'Hutang Bank (Jangka Pendek)', amount: 150000000, type: 'row' },
  { item: 'Total Liabilitas', amount: 460000000, type: 'subtotal' },

  { item: 'EKUITAS', amount: null, type: 'header' },
  { item: 'Modal Saham', amount: 2000000000, type: 'row' },
  { item: 'Laba Ditahan', amount: 1030000000, type: 'row' },
  { item: 'Total Ekuitas', amount: 3030000000, type: 'subtotal' },

  { item: 'TOTAL LIABILITAS & EKUITAS', amount: 3490000000, type: 'total' },
];

const cashFlowData = [
  { item: 'ARUS KAS DARI AKTIVITAS OPERASI', amount: null, type: 'header' },
  { item: 'Penerimaan Kas dari Pelanggan', amount: 1350000000, type: 'row' },
  { item: 'Pembayaran Kas kepada Pemasok', amount: -600000000, type: 'row' },
  { item: 'Pembayaran Gaji dan Operasional', amount: -250000000, type: 'row' },
  { item: 'Kas Bersih dari Aktivitas Operasi', amount: 500000000, type: 'total' },

  { item: 'ARUS KAS DARI AKTIVITAS INVESTASI', amount: null, type: 'header' },
  { item: 'Pembelian Aset/Mesin Produksi', amount: -150000000, type: 'row' },
  { item: 'Kas Bersih dari Aktivitas Investasi', amount: -150000000, type: 'total' },

  { item: 'ARUS KAS DARI AKTIVITAS PENDANAAN', amount: null, type: 'header' },
  { item: 'Penerimaan Pinjaman Bank', amount: 0, type: 'row' },
  { item: 'Pembayaran Dividen', amount: -50000000, type: 'row' },
  { item: 'Kas Bersih dari Aktivitas Pendanaan', amount: -50000000, type: 'total' },

  { item: 'KENAIKAN (PENURUNAN) NETO KAS', amount: 300000000, type: 'total' },
  { item: 'SALDO KAS AWAL PERIODE', amount: 550000000, type: 'subtotal' },
  { item: 'SALDO KAS AKHIR PERIODE', amount: 850000000, type: 'total' },
];

const budgetActualData = [
  { costCenter: 'CC-01', department: 'Operations', budget: 500000000, actual: 480000000 },
  { costCenter: 'CC-02', department: 'Marketing', budget: 150000000, actual: 165000000 },
  { costCenter: 'CC-03', department: 'IT Infrastructure', budget: 100000000, actual: 95000000 },
  { costCenter: 'CC-04', department: 'HR & Admin', budget: 120000000, actual: 118000000 },
  { costCenter: 'CC-05', department: 'Finance', budget: 80000000, actual: 80000000 },
];

function formatRp(value: number | null): string {
  if (value === null) return '';
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export const ConsolidatedReport: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'is' | 'bs' | 'cf' | 'budget'>('is');
  const [period, setPeriod] = useState('April 2026');

  // Export functions
  const exportToExcel = () => {
    let wsData: any[] = [];
    let title = '';

    if (activeReport === 'is') {
      title = `Laporan Laba Rugi - ${period}`;
      wsData = incomeStatementData.map(r => ({ Keterangan: r.item, Jumlah: r.amount }));
    } else if (activeReport === 'bs') {
      title = `Neraca Keuangan - ${period}`;
      wsData = balanceSheetData.map(r => ({ Keterangan: r.item, Jumlah: r.amount }));
    } else if (activeReport === 'cf') {
      title = `Laporan Arus Kas - ${period}`;
      wsData = cashFlowData.map(r => ({ Keterangan: r.item, Jumlah: r.amount }));
    } else if (activeReport === 'budget') {
      title = `Laporan Realisasi Budget - ${period}`;
      wsData = budgetActualData.map(r => ({
        'Kode CC': r.costCenter,
        'Departemen': r.department,
        'Budget (Rp)': r.budget,
        'Actual (Rp)': r.actual,
        'Variance (Rp)': r.budget - r.actual,
        '% Pemakaian': ((r.actual / r.budget) * 100).toFixed(1) + '%'
      }));
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  const exportToPDF = () => {
    // Generate simple PDF report (dummy structured using jsPDF text)
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PT Titian Servis Indonesia', 14, 20);

    let title = '';
    if (activeReport === 'is') title = 'Laporan Laba Rugi';
    if (activeReport === 'bs') title = 'Laporan Neraca Keuangan';
    if (activeReport === 'cf') title = 'Laporan Arus Kas';
    if (activeReport === 'budget') title = 'Realisasi Budget Cost Center';

    doc.setFontSize(12);
    doc.text(title, 14, 30);
    doc.text(`Periode: ${period}`, 14, 36);

    doc.setFontSize(10);
    doc.text('Catatan: Ini adalah file ekspor yang disederhanakan dari Sistem Dashboard FRS.', 14, 50);

    doc.save(`${title} - ${period}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Formal Financial Reports</h2>
          <p className="text-sm text-slate-500 mt-1">

          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          >
            <option>Maret 2026</option>
            <option>April 2026</option>
            <option>Kuartal 1 2026</option>
          </select>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Printer className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Report Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveReport('is')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeReport === 'is' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Laba Rugi (Income Statement)
        </button>
        <button
          onClick={() => setActiveReport('bs')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeReport === 'bs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Neraca (Balance Sheet)
        </button>
        <button
          onClick={() => setActiveReport('cf')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeReport === 'cf' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Arus Kas (Cash Flow)
        </button>
        <button
          onClick={() => setActiveReport('budget')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeReport === 'budget' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Realisasi Budget Cost Center
        </button>
      </div>

      {/* Report Document Viewer Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Document Header Page */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-6 text-center">
          <h1 className="text-2xl font-serif font-bold text-slate-800">
            {activeReport === 'is' && 'Laporan Komprehensif Laba Rugi'}
            {activeReport === 'bs' && 'Laporan Posisi Keuangan (Neraca)'}
            {activeReport === 'cf' && 'Laporan Arus Kas'}
            {activeReport === 'budget' && 'Laporan Realisasi Anggaran (Cost Center)'}
          </h1>
          <p className="text-slate-600 mt-1">PT Titian Servis Indonesia</p>
          <p className="text-slate-500 text-sm">Periode yang berakhir: {period}</p>
        </div>

        {/* Tabular Data View */}
        <div className="p-8">
          <table className="w-full text-left border-collapse">
            {(activeReport === 'is' || activeReport === 'bs' || activeReport === 'cf') && (
              <tbody>
                {(activeReport === 'is' ? incomeStatementData : activeReport === 'bs' ? balanceSheetData : cashFlowData).map((row, i) => (
                  <tr key={i} className="group">
                    <td className={`py-2 px-4 border-b border-slate-100 
                      ${row.type === 'header' ? 'font-bold text-slate-900 pt-6 bg-slate-50/50' :
                        row.type === 'header2' ? 'font-semibold text-slate-700 pt-4 px-8' :
                          row.type === 'total' ? 'font-bold text-indigo-900 border-t-2 border-t-slate-300 border-b-4 border-b-slate-400 bg-indigo-50/30' :
                            row.type === 'subtotal' ? 'font-semibold text-slate-800 border-t border-t-slate-200' : 'pl-8 text-slate-600'}`
                    }>
                      {row.item}
                    </td>
                    <td className={`py-2 px-4 text-right border-b border-slate-100 font-mono tracking-wide
                      ${row.type === 'header' || row.type === 'header2' ? 'bg-slate-50/50' : ''}
                      ${row.type === 'total' ? 'font-bold text-indigo-900 border-t-2 border-t-slate-300 border-b-4 border-b-slate-400 bg-indigo-50/30' :
                        row.type === 'subtotal' ? 'font-semibold text-slate-800 border-t border-t-slate-200' : 'text-slate-700'}`
                    }>
                      {formatRp(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}

            {activeReport === 'budget' && (
              <>
                <thead>
                  <tr className="bg-slate-100">
                    <th className="py-3 px-4 font-semibold text-slate-700 text-sm border-b border-slate-200">Cost Center</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-sm border-b border-slate-200">Departemen</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-sm border-b border-slate-200 text-right">Anggaran (Budget)</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-sm border-b border-slate-200 text-right">Realisasi (Actual)</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-sm border-b border-slate-200 text-right">Selisih (Variance)</th>
                    <th className="py-3 px-4 font-semibold text-slate-700 text-sm border-b border-slate-200 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetActualData.map((row, i) => {
                    const variance = row.budget - row.actual;
                    const percent = (row.actual / row.budget) * 100;
                    return (
                      <tr key={i} className="hover:bg-slate-50 text-sm">
                        <td className="py-3 px-4 border-b border-slate-100 font-mono text-slate-600">{row.costCenter}</td>
                        <td className="py-3 px-4 border-b border-slate-100 text-slate-800 font-medium">{row.department}</td>
                        <td className="py-3 px-4 border-b border-slate-100 font-mono text-right text-slate-700">{formatRp(row.budget)}</td>
                        <td className="py-3 px-4 border-b border-slate-100 font-mono text-right text-slate-700">{formatRp(row.actual)}</td>
                        <td className={`py-3 px-4 border-b border-slate-100 font-mono text-right font-medium ${variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatRp(variance)}
                        </td>
                        <td className="py-3 px-4 border-b border-slate-100 text-right">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${percent > 100 ? 'bg-red-100 text-red-700' : percent > 90 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {percent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="py-3 px-4 text-right text-slate-800 border-t-2 border-slate-300">TOTAL KESELURUHAN:</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 border-t-2 border-slate-300">
                      {formatRp(budgetActualData.reduce((acc, r) => acc + r.budget, 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 border-t-2 border-slate-300">
                      {formatRp(budgetActualData.reduce((acc, r) => acc + r.actual, 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono border-t-2 border-slate-300">
                      {formatRp(budgetActualData.reduce((acc, r) => acc + (r.budget - r.actual), 0))}
                    </td>
                    <td className="border-t-2 border-slate-300"></td>
                  </tr>
                </tfoot>
              </>
            )}
          </table>
        </div>

        {/* Footer info inside document */}
        <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 flex justify-between text-xs text-slate-400">
          <p>Dihasilkan oleh: Sistem Titian FRS</p>
          <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedReport;
