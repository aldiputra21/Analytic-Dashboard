import { Locale } from './commons';

export interface CashFlowProjectionCopy {
  title: string;
  subtitle: string;
  addNew: string;
  tableHead: {
    year: string;
    corporate: string;
    initialBalance: string;
    notes: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    corporate: string;
    fiscalYear: string;
    initialBalance: string;
    notes: string;
    details: string;
    month: string;
    inflowSales: string;
    outflowOpex: string;
    totalInflow: string;
    totalOutflow: string;
    selectCorporate: string;
  };
  validation: {
    corporateRequired: string;
    yearRequired: string;
    amountMin: string;
    nominalZero: string;
    duplicateEntry: string;
  };
  alerts: {
    saveSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    deleteTitle: string;
    deleteDesc: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
}

export const cashFlowProjectionI18n: Record<Locale, CashFlowProjectionCopy> = {
  id: {
    title: 'Proyeksi Arus Kas',
    subtitle: 'Pantau dan rencanakan likuiditas perusahaan ke depan',
    addNew: 'Tambah Proyeksi',
    tableHead: {
      year: 'Tahun Fiskal',
      corporate: 'Perusahaan',
      initialBalance: 'Saldo Awal',
      notes: 'Catatan',
    },
    modal: {
      createTitle: 'Tambah Proyeksi Arus Kas',
      editTitle: 'Ubah Proyeksi Arus Kas',
      viewTitle: 'Detail Proyeksi Arus Kas',
      corporate: 'Perusahaan',
      fiscalYear: 'Tahun Fiskal',
      initialBalance: 'Saldo Awal',
      notes: 'Catatan/Keterangan',
      details: 'Detail Bulanan',
      month: 'Bulan',
      inflowSales: 'Arus Kas Masuk',
      outflowOpex: 'Arus Kas Keluar',
      totalInflow: 'Total Arus Kas Masuk',
      totalOutflow: 'Total Arus Kas Keluar',
      selectCorporate: 'Pilih Perusahaan',
    },
    validation: {
      corporateRequired: 'Perusahaan wajib dipilih',
      yearRequired: 'Tahun fiskal wajib diisi',
      amountMin: 'Nilai tidak boleh negatif',
      nominalZero: 'Data finansial tidak boleh kosong atau nol',
      duplicateEntry: 'Proyeksi untuk perusahaan dan tahun ini sudah ada',
    },
    alerts: {
      saveSuccess: 'Proyeksi berhasil disimpan',
      updateSuccess: 'Proyeksi berhasil diperbarui',
      deleteSuccess: 'Proyeksi berhasil dihapus',
      deleteTitle: 'Hapus Proyeksi',
      deleteDesc: 'Apakah Anda yakin ingin menghapus proyeksi ini? Tindakan ini tidak dapat dibatalkan.',
    },
    status: {
      empty: 'Tidak ada data proyeksi',
      emptyDesc: 'Belum ada data proyeksi arus kas yang ditemukan untuk kriteria ini.',
    },
  },
  en: {
    title: 'Cash Flow Projection',
    subtitle: 'Monitor and plan corporate liquidity ahead',
    addNew: 'Add Projection',
    tableHead: {
      year: 'Fiscal Year',
      corporate: 'Corporate',
      initialBalance: 'Initial Balance',
      notes: 'Notes',
    },
    modal: {
      createTitle: 'Add Cash Flow Projection',
      editTitle: 'Edit Cash Flow Projection',
      viewTitle: 'Cash Flow Projection Details',
      corporate: 'Corporate',
      fiscalYear: 'Fiscal Year',
      initialBalance: 'Initial Balance',
      notes: 'Notes/Remarks',
      details: 'Monthly Details',
      month: 'Month',
      inflowSales: 'Cash Inflow',
      outflowOpex: 'Cash Outflow',
      totalInflow: 'Total Cash Inflow',
      totalOutflow: 'Total Cash Outflow',
      selectCorporate: 'Select Corporate',
    },
    validation: {
      corporateRequired: 'Corporate is required',
      yearRequired: 'Fiscal year is required',
      amountMin: 'Value cannot be negative',
      nominalZero: 'Financial data cannot be empty or zero',
      duplicateEntry: 'Projection for this corporate and year already exists',
    },
    alerts: {
      saveSuccess: 'Projection saved successfully',
      updateSuccess: 'Projection updated successfully',
      deleteSuccess: 'Projection deleted successfully',
      deleteTitle: 'Delete Projection',
      deleteDesc: 'Are you sure you want to delete this projection? This action cannot be undone.',
    },
    status: {
      empty: 'No projection data',
      emptyDesc: 'No cash flow projection data found for this criteria.',
    },
  },
};
