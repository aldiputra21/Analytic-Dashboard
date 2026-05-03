export const thresholdI18n = {
  id: {
    title: 'Konfigurasi Threshold',
    subtitle: 'Atur ambang batas nilai untuk indikator rasio keuangan',
    resetDefaults: 'Reset ke Default',
    saveChanges: 'Simpan Perubahan',
    subsidiary: 'Perusahaan',
    tableHead: {
      ratio: 'Rasio',
      healthy: 'Ambang Batas Sehat',
      moderate: 'Ambang Batas Moderat',
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
      errorSave: 'Gagal menyimpan threshold',
      errorReset: 'Gagal mereset threshold'
    },
    validation: {
      positiveNumber: 'Nilai harus angka positif'
    },
    messages: {
      belowHealthy: '{ratio} ({value}) berada di bawah ambang batas sehat ({threshold})',
      criticallyBelow: '{ratio} ({value}) berada jauh di bawah ambang batas moderat ({threshold})',
      aboveHealthy: '{ratio} ({value}) melebihi ambang batas sehat ({threshold})',
      criticallyAbove: '{ratio} ({value}) melebihi ambang batas moderat ({threshold})',
    }
  },
  en: {
    title: 'Threshold Configuration',
    subtitle: 'Configure threshold values for financial ratio indicators',
    resetDefaults: 'Reset Defaults',
    saveChanges: 'Save Changes',
    subsidiary: 'Corporate',
    tableHead: {
      ratio: 'Ratio',
      healthy: 'Healthy Threshold',
      moderate: 'Moderate Threshold',
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
      errorSave: 'Failed to save thresholds',
      errorReset: 'Failed to reset thresholds'
    },
    validation: {
      positiveNumber: 'Value must be a positive number'
    },
    messages: {
      belowHealthy: '{ratio} ({value}) is below healthy threshold ({threshold})',
      criticallyBelow: '{ratio} ({value}) is critically below moderate threshold ({threshold})',
      aboveHealthy: '{ratio} ({value}) exceeds healthy threshold ({threshold})',
      criticallyAbove: '{ratio} ({value}) critically exceeds moderate threshold ({threshold})',
    }
  }
};
