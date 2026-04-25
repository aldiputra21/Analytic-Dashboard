export const auditLogI18n = {
  id: {
    title: 'Audit Trail',
    subtitle: 'Pantau semua riwayat perubahan dan aktivitas sistem',
    refresh: 'Segarkan',
    filters: {
      from: 'Dari:',
      to: 'Sampai:',
      action: 'Aksi:',
      entity: 'Entitas:',
      apply: 'Terapkan',
      all: 'Semua',
      create: 'Tambah',
      update: 'Ubah',
      delete: 'Hapus',
      login: 'Login',
      logout: 'Logout',
      export: 'Ekspor',
      backup: 'Cadangkan',
      restore: 'Pulihkan'
    },
    tableHead: {
      timestamp: 'Waktu',
      user: 'Pengguna',
      action: 'Aksi',
      entity: 'Entitas',
      details: 'Detail'
    },
    details: {
      hide: 'Sembunyikan',
      show: 'Tampilkan',
      oldValues: 'Nilai Lama',
      newValues: 'Nilai Baru',
      justification: 'Justifikasi',
      ipAddress: 'Alamat IP'
    },
    status: {
      loading: 'Memuat...',
      empty: 'Tidak ada data audit log',
      emptyDesc: 'Belum ada aktivitas yang terekam atau tidak ada data yang sesuai filter.'
    },
    alerts: {
      errorFetch: 'Gagal memuat audit log'
    }
  },
  en: {
    title: 'Audit Trail',
    subtitle: 'Monitor all system changes and activity logs',
    refresh: 'Refresh',
    filters: {
      from: 'From:',
      to: 'To:',
      action: 'Action:',
      entity: 'Entity:',
      apply: 'Apply',
      all: 'All',
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      login: 'Login',
      logout: 'Logout',
      export: 'Export',
      backup: 'Backup',
      restore: 'Restore'
    },
    tableHead: {
      timestamp: 'Timestamp',
      user: 'User',
      action: 'Action',
      entity: 'Entity',
      details: 'Details'
    },
    details: {
      hide: 'Hide',
      show: 'Show',
      oldValues: 'Previous Values',
      newValues: 'New Values',
      justification: 'Justification',
      ipAddress: 'IP Address'
    },
    status: {
      loading: 'Loading...',
      empty: 'No audit log entries found',
      emptyDesc: 'No activity has been recorded yet or no data matches the filters.'
    },
    alerts: {
      errorFetch: 'Failed to load audit log'
    }
  }
};
