export const thresholdI18n = {
  id: {
    title: 'Konfigurasi Threshold',
    subtitle: 'Atur ambang batas nilai untuk indikator rasio keuangan',
    resetDefaults: 'Reset ke Default',
    saveChanges: 'Simpan Perubahan',
    saving: 'Menyimpan...',
    tableHead: {
      ratio: 'Rasio',
      healthy: 'Ambang Batas Sehat',
      moderate: 'Ambang Batas Moderat',
      status: 'Status'
    },
    status: {
      default: 'Default',
      custom: 'Custom'
    },
    better: {
      lower: 'lebih rendah lebih baik',
      higher: 'lebih tinggi lebih baik'
    },
    periods: {
      monthly: 'Bulanan',
      quarterly: 'Kuartal',
      annual: 'Tahunan'
    },
    ratioLabels: {
      roa: 'ROA (%)',
      roe: 'ROE (%)',
      npm: 'NPM (%)',
      der: 'DER',
      currentRatio: 'Current Ratio',
      quickRatio: 'Quick Ratio',
      cashRatio: 'Cash Ratio',
      ocfRatio: 'OCF Ratio',
      dscr: 'DSCR',
    },
    note: 'Threshold mendefinisikan kapan peringatan (alerts) dihasilkan. Ambang batas Sehat harus lebih menguntungkan daripada ambang batas Moderat.',
    confirmReset: 'Reset semua threshold ke default industri?',
    alerts: {
      successSave: 'Threshold berhasil disimpan',
      successReset: 'Threshold berhasil direset ke default',
      errorFetch: 'Gagal memuat threshold',
      errorSave: 'Gagal menyimpan threshold',
      errorReset: 'Gagal mereset threshold'
    },
    validation: {
      positiveNumber: 'Nilai harus angka positif'
    }
  },
  en: {
    title: 'Threshold Configuration',
    subtitle: 'Configure threshold values for financial ratio indicators',
    resetDefaults: 'Reset Defaults',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    tableHead: {
      ratio: 'Ratio',
      healthy: 'Healthy Threshold',
      moderate: 'Moderate Threshold',
      status: 'Status'
    },
    status: {
      default: 'Default',
      custom: 'Custom'
    },
    better: {
      lower: 'lower is better',
      higher: 'higher is better'
    },
    periods: {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annual'
    },
    ratioLabels: {
      roa: 'ROA (%)',
      roe: 'ROE (%)',
      npm: 'NPM (%)',
      der: 'DER',
      currentRatio: 'Current Ratio',
      quickRatio: 'Quick Ratio',
      cashRatio: 'Cash Ratio',
      ocfRatio: 'OCF Ratio',
      dscr: 'DSCR',
    },
    note: 'Thresholds define when alerts are generated. Healthy thresholds must be more favorable than moderate thresholds.',
    confirmReset: 'Reset all thresholds to industry defaults?',
    alerts: {
      successSave: 'Thresholds saved successfully',
      successReset: 'Thresholds reset to defaults successfully',
      errorFetch: 'Failed to load thresholds',
      errorSave: 'Failed to save thresholds',
      errorReset: 'Failed to reset thresholds'
    },
    validation: {
      positiveNumber: 'Value must be a positive number'
    }
  }
};
