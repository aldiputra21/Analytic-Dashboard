// i18n/report-config.ts - Translations for Dynamic Excel Report feature
// Note: Common strings (save, cancel, delete, retry, errorLoadTable, etc.) come from commonsI18n
import { Locale } from './commons';

export interface ReportConfigCopy {
  // ─── Admin: ReportConfigManager ───────────────────────────────────────────
  manager: {
    title: string;
    subtitle: string;
    addNew: string;
  };

  // ─── Table columns ─────────────────────────────────────────────────────────
  table: {
    reportTitle: string;
    allowedRoles: string;
    empty: string;
    emptyDesc: string;
  };

  // ─── Modal form ────────────────────────────────────────────────────────────
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    // Tabs
    tabBasicInfo: string;
    tabFilters: string;
    tabQuery: string;
    tabColumns: string;
    tabTemplate: string;
  };

  // ─── Basic Info tab fields ─────────────────────────────────────────────────
  form: {
    titleId: string;
    titleIdPlaceholder: string;
    titleEn: string;
    titleEnPlaceholder: string;
    query: string;
    queryPlaceholder: string;
    queryHint: string;
    queryParamsTitle: string;
    queryParamsHint: string;
    isActive: string;
    allowedRoles: string;
    allowedRolesPlaceholder: string;
    retentionType: string;
    retentionTypeImmediate: string;
    retentionTypeDays: string;
    retentionDays: string;
    retentionDaysPlaceholder: string;
  };

  // ─── Filter Config array editor ────────────────────────────────────────────
  filters: {
    sectionTitle: string;
    addFilter: string;
    noFilters: string;
    paramName: string;
    paramNamePlaceholder: string;
    paramNameHint: string;
    labelId: string;
    labelIdPlaceholder: string;
    labelEn: string;
    labelEnPlaceholder: string;
    type: string;
    typePlaceholder: string;
    order: string;
    required: string;
    dropdownSource: string;
    dropdownSourceJson: string;
    dropdownSourceQuery: string;
    dropdownItems: string;
    dropdownItemsPlaceholder: string;
    dropdownQuery: string;
    dropdownQueryPlaceholder: string;
    dropdownQueryHint: string;
    // Filter type labels
    typeText: string;
    typeDate: string;
    typeDateRange: string;
    typeNumeric: string;
    typeNumericRange: string;
    typeDropdown: string;
    typeMonth: string;
    typeMonthRange: string;
    // Range field labels
    rangeFrom: string;
    rangeTo: string;
    // Dropdown items label columns
    dropdownItemLabelId: string;
    dropdownItemLabelEn: string;
  };

  // ─── Column Config array editor ────────────────────────────────────────────
  columns: {
    sectionTitle: string;
    addColumn: string;
    noColumns: string;
    fieldName: string;
    fieldNamePlaceholder: string;
    order: string;
    dataType: string;
    dataTypePlaceholder: string;
    format: string;
    formatPlaceholder: string;
    headerLabelId: string;
    headerLabelIdPlaceholder: string;
    headerLabelEn: string;
    headerLabelEnPlaceholder: string;
    // Column header toggle
    writeHeader: string;
    writeHeaderHint: string;
    // Data type labels
    dataTypeString: string;
    dataTypeNumber: string;
    dataTypeDate: string;
    dataTypeCurrency: string;
  };

  // ─── Template & Output tab ─────────────────────────────────────────────────
  template: {
    sectionTitle: string;
    uploadTemplate: string;
    uploadHint: string;
    currentTemplate: string;
    noTemplate: string;
    templatePath: string;
    cellInfoFilter: string;
    cellInfoFilterPlaceholder: string;
    cellInfoFilterHint: string;
    startRow: string;
    startRowPlaceholder: string;
    startRowHint: string;
    parseFromTemplate: string;
    parsing: string;
  };

  // ─── Toast / alert messages ────────────────────────────────────────────────
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    successCreate: string;
    successUpdate: string;
    successDelete: string;
    successToggleActive: string;
    successToggleInactive: string;
    errorCreate: string;
    errorUpdate: string;
    errorDelete: string;
    errorToggleStatus: string;
    errorQueryUnsafe: string;
    errorQueryNotSelect: string;
    errorParseTemplate: string;
    errorUploadTemplate: string;
  };

  // ─── Validation messages ───────────────────────────────────────────────────
  validation: {
    titleIdRequired: string;
    titleEnRequired: string;
    queryRequired: string;
    columnsMinOne: string;
    paramNameRequired: string;
    paramNameInvalid: string;
    labelIdRequired: string;
    labelEnRequired: string;
    filterTypeRequired: string;
    filterOrderPositive: string;
    fieldNameRequired: string;
    columnOrderPositive: string;
    dataTypeRequired: string;
    startRowPositive: string;
    retentionDaysPositive: string;
    allowedRolesRequired: string;
  };

  // ─── Notification texts (Requirement 7.1, 7.2, 7.3, 7.6) ─────────────────
  // Use .replace('{reportTitle}', title) for dynamic report title
  notifications: {
    report_generating: string;
    report_ready: string;
    report_failed: string;
  };

  // ─── ReportPage (user-facing generate page) ────────────────────────────────
  reportPage: {
    generateButton: string;
    generating: string;
    processingMessage: string;
    filterSectionTitle: string;
    requiredFieldsError: string;
    errorLoadConfig: string;
    errorFileNotFound: string;
    errorGenerateFailed: string;
    downloadButton: string;
    outputStatus: {
      pending: string;
      processing: string;
      completed: string;
      failed: string;
      downloaded_deleted: string;
      expired: string;
    };
  };
}

export const reportConfigI18n: Record<Locale, ReportConfigCopy> = {
  id: {
    manager: {
      title: 'Konfigurasi Laporan',
      subtitle: 'Kelola konfigurasi laporan Excel dinamis — query, filter, kolom, dan template.',
      addNew: 'Tambah Konfigurasi Laporan',
    },

    table: {
      reportTitle: 'Judul Laporan',
      allowedRoles: 'Role yang Dapat Akses',
      empty: 'Belum ada konfigurasi laporan',
      emptyDesc: 'Klik "Tambah Konfigurasi Laporan" untuk membuat laporan baru.',
    },

    modal: {
      createTitle: 'Tambah Konfigurasi Laporan',
      editTitle: 'Ubah Konfigurasi Laporan',
      viewTitle: 'Detail Konfigurasi Laporan',
      tabBasicInfo: 'Info Dasar',
      tabFilters: 'Filter',
      tabQuery: 'Query SQL',
      tabColumns: 'Kolom Output',
      tabTemplate: 'Template & Output',
    },

    form: {
      titleId: 'Judul Laporan (Indonesia)',
      titleIdPlaceholder: 'Contoh: Laporan Arus Kas Bulanan',
      titleEn: 'Judul Laporan (Inggris)',
      titleEnPlaceholder: 'Example: Monthly Cash Flow Report',
      query: 'Query SQL',
      queryPlaceholder: 'SELECT ... FROM ... WHERE ...',
      queryHint: 'Hanya query SELECT yang diizinkan. Gunakan ${PARAM} atau {{PARAM}} untuk placeholder filter.',
      queryParamsTitle: 'Parameter Tersedia',
      queryParamsHint: 'Klik tombol parameter untuk menyisipkan ke posisi kursor di query. ${WHERE} akan di-generate otomatis dari semua filter aktif.',
      isActive: 'Aktif',
      allowedRoles: 'Role yang Dapat Mengakses',
      allowedRolesPlaceholder: 'Pilih role...',
      retentionType: 'Kebijakan Retensi File',
      retentionTypeImmediate: 'Hapus setelah diunduh',
      retentionTypeDays: 'Simpan selama N hari',
      retentionDays: 'Jumlah Hari Retensi',
      retentionDaysPlaceholder: 'Contoh: 30',
    },

    filters: {
      sectionTitle: 'Konfigurasi Filter',
      addFilter: 'Tambah Filter',
      noFilters: 'Belum ada filter. Klik "Tambah Filter" untuk menambahkan.',
      paramName: 'Nama Parameter',
      paramNamePlaceholder: 'Contoh: start_date',
      paramNameHint: 'Hanya huruf, angka, dan underscore. Harus sesuai dengan placeholder di query.',
      labelId: 'Label (Indonesia)',
      labelIdPlaceholder: 'Contoh: Tanggal Mulai',
      labelEn: 'Label (Inggris)',
      labelEnPlaceholder: 'Example: Start Date',
      type: 'Tipe Filter',
      typePlaceholder: 'Pilih tipe...',
      order: 'Urutan Tampil',
      required: 'Wajib Diisi',
      dropdownSource: 'Sumber Data Dropdown',
      dropdownSourceJson: 'Array JSON Statis',
      dropdownSourceQuery: 'SQL Query',
      dropdownItems: 'Item Dropdown (JSON)',
      dropdownItemsPlaceholder: '[{"value":"1","label":"Opsi 1"}]',
      dropdownQuery: 'Query Sumber Dropdown',
      dropdownQueryPlaceholder: 'SELECT value, label FROM ...',
      dropdownQueryHint: 'Query harus mengembalikan field: value (sebagai ID) dan label (sebagai tampilan default). Opsional: gunakan label_id & label_en untuk dukungan multi-bahasa.',
      typeText: 'Teks',
      typeDate: 'Tanggal',
      typeDateRange: 'Rentang Tanggal',
      typeNumeric: 'Angka',
      typeNumericRange: 'Rentang Angka',
      typeDropdown: 'Dropdown',
      typeMonth: 'Bulan (Month Picker)',
      typeMonthRange: 'Rentang Bulan',
      rangeFrom: 'Dari',
      rangeTo: 'Sampai',
      dropdownItemLabelId: 'Label (Indonesia)',
      dropdownItemLabelEn: 'Label (Inggris)',
    },

    columns: {
      sectionTitle: 'Konfigurasi Kolom Output',
      addColumn: 'Tambah Kolom',
      noColumns: 'Belum ada kolom. Minimal satu kolom output wajib ditambahkan.',
      fieldName: 'Nama Field (dari Query)',
      fieldNamePlaceholder: 'Contoh: transaction_date',
      order: 'Urutan Kolom',
      dataType: 'Tipe Data',
      dataTypePlaceholder: 'Pilih tipe data...',
      format: 'Format (Opsional)',
      formatPlaceholder: 'Contoh: DD/MM/YYYY atau #,##0.00',
      headerLabelId: 'Header Kolom (Indonesia)',
      headerLabelIdPlaceholder: 'Contoh: Tanggal Transaksi',
      headerLabelEn: 'Header Kolom (Inggris)',
      headerLabelEnPlaceholder: 'Example: Transaction Date',
      writeHeader: 'Tulis Header Kolom',
      writeHeaderHint: 'Jika aktif, baris header akan ditulis sebelum data. Label wajib diisi.',
      dataTypeString: 'Teks',
      dataTypeNumber: 'Angka',
      dataTypeDate: 'Tanggal',
      dataTypeCurrency: 'Mata Uang',
    },

    template: {
      sectionTitle: 'Template & Pengaturan Output',
      uploadTemplate: 'Upload Template Excel',
      uploadHint: 'Upload file .xlsx sebagai template laporan. Baris data akan ditulis mulai dari baris yang dikonfigurasi.',
      currentTemplate: 'Template saat ini',
      noTemplate: 'Belum ada template yang diupload',
      templatePath: 'Lokasi Penyimpanan Template',
      cellInfoFilter: 'Cell Ringkasan Filter',
      cellInfoFilterPlaceholder: 'Contoh: A3',
      cellInfoFilterHint: 'Cell tempat ringkasan filter yang diinput user akan ditulis (misal: A3).',
      startRow: 'Baris Mulai Data',
      startRowPlaceholder: 'Contoh: 5',
      startRowHint: 'Baris pertama tempat data hasil query akan ditulis di Excel.',
      parseFromTemplate: 'Deteksi Otomatis dari Template',
      parsing: 'Mendeteksi...',
    },

    alerts: {
      deleteTitle: 'Hapus konfigurasi laporan?',
      deleteDesc: 'Tindakan ini akan menghapus konfigurasi laporan secara permanen. Data laporan yang sudah di-generate tidak akan terpengaruh.',
      successCreate: 'Konfigurasi laporan berhasil dibuat',
      successUpdate: 'Konfigurasi laporan berhasil diperbarui',
      successDelete: 'Konfigurasi laporan berhasil dihapus',
      successToggleActive: 'Laporan berhasil diaktifkan',
      successToggleInactive: 'Laporan berhasil dinonaktifkan',
      errorCreate: 'Gagal membuat konfigurasi laporan',
      errorUpdate: 'Gagal memperbarui konfigurasi laporan',
      errorDelete: 'Gagal menghapus konfigurasi laporan',
      errorToggleStatus: 'Gagal mengubah status laporan',
      errorQueryUnsafe: 'Query mengandung perintah yang tidak diizinkan: {keyword}',
      errorQueryNotSelect: 'Query harus diawali dengan SELECT',
      errorParseTemplate: 'Gagal membaca template Excel',
      errorUploadTemplate: 'Gagal mengupload file template',
    },

    validation: {
      titleIdRequired: 'Judul laporan (Indonesia) wajib diisi',
      titleEnRequired: 'Judul laporan (Inggris) wajib diisi',
      queryRequired: 'Query SQL wajib diisi',
      columnsMinOne: 'Minimal satu kolom output wajib ditambahkan',
      paramNameRequired: 'Nama parameter wajib diisi',
      paramNameInvalid: 'Nama parameter hanya boleh mengandung huruf, angka, dan underscore',
      labelIdRequired: 'Label Indonesia wajib diisi',
      labelEnRequired: 'Label Inggris wajib diisi',
      filterTypeRequired: 'Tipe filter wajib dipilih',
      filterOrderPositive: 'Urutan tampil harus berupa angka positif',
      fieldNameRequired: 'Nama field wajib diisi',
      columnOrderPositive: 'Urutan kolom harus berupa angka positif',
      dataTypeRequired: 'Tipe data wajib dipilih',
      startRowPositive: 'Baris mulai data harus berupa angka positif',
      retentionDaysPositive: 'Jumlah hari retensi harus berupa angka positif',
      allowedRolesRequired: 'Minimal satu role akses wajib dipilih',
    },

    notifications: {
      report_generating: 'Laporan "{reportTitle}" sedang dibuat',
      report_ready: 'Laporan "{reportTitle}" siap diunduh',
      report_failed: 'Gagal membuat laporan "{reportTitle}"',
    },

    reportPage: {
      generateButton: 'Generate Laporan',
      generating: 'Sedang Memproses...',
      processingMessage: 'Laporan sedang diproses di background. Anda akan menerima notifikasi saat laporan siap.',
      filterSectionTitle: 'Filter Laporan',
      requiredFieldsError: 'Mohon lengkapi semua filter yang wajib diisi',
      errorLoadConfig: 'Gagal memuat konfigurasi laporan',
      errorFileNotFound: 'File laporan tidak ditemukan atau sudah dihapus',
      errorGenerateFailed: 'Gagal memulai proses generate laporan',
      downloadButton: 'Unduh Laporan',
      outputStatus: {
        pending: 'Menunggu',
        processing: 'Sedang Diproses',
        completed: 'Selesai',
        failed: 'Gagal',
        downloaded_deleted: 'Sudah Diunduh',
        expired: 'Kedaluwarsa',
      },
    },
  },

  en: {
    manager: {
      title: 'Report Configuration',
      subtitle: 'Manage dynamic Excel report configurations — query, filters, columns, and templates.',
      addNew: 'Add Report Configuration',
    },

    table: {
      reportTitle: 'Report Title',
      allowedRoles: 'Accessible Roles',
      empty: 'No report configurations yet',
      emptyDesc: 'Click "Add Report Configuration" to create a new report.',
    },

    modal: {
      createTitle: 'Add Report Configuration',
      editTitle: 'Edit Report Configuration',
      viewTitle: 'Report Configuration Detail',
      tabBasicInfo: 'Basic Info',
      tabFilters: 'Filters',
      tabQuery: 'SQL Query',
      tabColumns: 'Output Columns',
      tabTemplate: 'Template & Output',
    },

    form: {
      titleId: 'Report Title (Indonesian)',
      titleIdPlaceholder: 'Example: Laporan Arus Kas Bulanan',
      titleEn: 'Report Title (English)',
      titleEnPlaceholder: 'Example: Monthly Cash Flow Report',
      query: 'SQL Query',
      queryPlaceholder: 'SELECT ... FROM ... WHERE ...',
      queryHint: 'Only SELECT queries are allowed. Use ${PARAM} or {{PARAM}} for filter placeholders.',
      queryParamsTitle: 'Available Parameters',
      queryParamsHint: 'Click a parameter button to insert it at the cursor position in the query. ${WHERE} is auto-generated from all active filters.',
      isActive: 'Active',
      allowedRoles: 'Roles with Access',
      allowedRolesPlaceholder: 'Select roles...',
      retentionType: 'File Retention Policy',
      retentionTypeImmediate: 'Delete after download',
      retentionTypeDays: 'Keep for N days',
      retentionDays: 'Retention Days',
      retentionDaysPlaceholder: 'Example: 30',
    },

    filters: {
      sectionTitle: 'Filter Configuration',
      addFilter: 'Add Filter',
      noFilters: 'No filters yet. Click "Add Filter" to add one.',
      paramName: 'Parameter Name',
      paramNamePlaceholder: 'Example: start_date',
      paramNameHint: 'Letters, numbers, and underscores only. Must match the placeholder in the query.',
      labelId: 'Label (Indonesian)',
      labelIdPlaceholder: 'Example: Tanggal Mulai',
      labelEn: 'Label (English)',
      labelEnPlaceholder: 'Example: Start Date',
      type: 'Filter Type',
      typePlaceholder: 'Select type...',
      order: 'Display Order',
      required: 'Required',
      dropdownSource: 'Dropdown Data Source',
      dropdownSourceJson: 'Static JSON Array',
      dropdownSourceQuery: 'SQL Query',
      dropdownItems: 'Dropdown Items (JSON)',
      dropdownItemsPlaceholder: '[{"value":"1","label":"Option 1"}]',
      dropdownQuery: 'Dropdown Source Query',
      dropdownQueryPlaceholder: 'SELECT value, label FROM ...',
      dropdownQueryHint: 'Query must return fields: value (as ID) and label (as default display). Optional: use label_id & label_en for multi-language support.',
      typeText: 'Text',
      typeDate: 'Date',
      typeDateRange: 'Date Range',
      typeNumeric: 'Numeric',
      typeNumericRange: 'Numeric Range',
      typeDropdown: 'Dropdown',
      typeMonth: 'Month (Month Picker)',
      typeMonthRange: 'Month Range',
      rangeFrom: 'From',
      rangeTo: 'To',
      dropdownItemLabelId: 'Label (Indonesian)',
      dropdownItemLabelEn: 'Label (English)',
    },

    columns: {
      sectionTitle: 'Output Column Configuration',
      addColumn: 'Add Column',
      noColumns: 'No columns yet. At least one output column is required.',
      fieldName: 'Field Name (from Query)',
      fieldNamePlaceholder: 'Example: transaction_date',
      order: 'Column Order',
      dataType: 'Data Type',
      dataTypePlaceholder: 'Select data type...',
      format: 'Format (Optional)',
      formatPlaceholder: 'Example: DD/MM/YYYY or #,##0.00',
      headerLabelId: 'Column Header (Indonesian)',
      headerLabelIdPlaceholder: 'Example: Tanggal Transaksi',
      headerLabelEn: 'Column Header (English)',
      headerLabelEnPlaceholder: 'Example: Transaction Date',
      writeHeader: 'Write Column Header',
      writeHeaderHint: 'If enabled, a header row will be written before the data. Labels are required.',
      dataTypeString: 'Text',
      dataTypeNumber: 'Number',
      dataTypeDate: 'Date',
      dataTypeCurrency: 'Currency',
    },

    template: {
      sectionTitle: 'Template & Output Settings',
      uploadTemplate: 'Upload Excel Template',
      uploadHint: 'Upload an .xlsx file as the report template. Data rows will be written starting from the configured row.',
      currentTemplate: 'Current template',
      noTemplate: 'No template uploaded yet',
      templatePath: 'Template Storage Location',
      cellInfoFilter: 'Filter Summary Cell',
      cellInfoFilterPlaceholder: 'Example: A3',
      cellInfoFilterHint: 'The cell where a summary of user-entered filters will be written (e.g., A3).',
      startRow: 'Data Start Row',
      startRowPlaceholder: 'Example: 5',
      startRowHint: 'The first row where query result data will be written in Excel.',
      parseFromTemplate: 'Auto-detect from Template',
      parsing: 'Detecting...',
    },

    alerts: {
      deleteTitle: 'Delete report configuration?',
      deleteDesc: 'This will permanently delete the report configuration. Previously generated report files will not be affected.',
      successCreate: 'Report configuration created successfully',
      successUpdate: 'Report configuration updated successfully',
      successDelete: 'Report configuration deleted successfully',
      successToggleActive: 'Report activated successfully',
      successToggleInactive: 'Report deactivated successfully',
      errorCreate: 'Failed to create report configuration',
      errorUpdate: 'Failed to update report configuration',
      errorDelete: 'Failed to delete report configuration',
      errorToggleStatus: 'Failed to change report status',
      errorQueryUnsafe: 'Query contains a disallowed command: {keyword}',
      errorQueryNotSelect: 'Query must start with SELECT',
      errorParseTemplate: 'Failed to read Excel template',
      errorUploadTemplate: 'Failed to upload template file',
    },

    validation: {
      titleIdRequired: 'Report title (Indonesian) is required',
      titleEnRequired: 'Report title (English) is required',
      queryRequired: 'SQL query is required',
      columnsMinOne: 'At least one output column is required',
      paramNameRequired: 'Parameter name is required',
      paramNameInvalid: 'Parameter name may only contain letters, numbers, and underscores',
      labelIdRequired: 'Indonesian label is required',
      labelEnRequired: 'English label is required',
      filterTypeRequired: 'Filter type is required',
      filterOrderPositive: 'Display order must be a positive number',
      fieldNameRequired: 'Field name is required',
      columnOrderPositive: 'Column order must be a positive number',
      dataTypeRequired: 'Data type is required',
      startRowPositive: 'Data start row must be a positive number',
      retentionDaysPositive: 'Retention days must be a positive number',
      allowedRolesRequired: 'At least one access role is required',
    },

    notifications: {
      report_generating: 'Report "{reportTitle}" is being generated',
      report_ready: 'Report "{reportTitle}" is ready to download',
      report_failed: 'Report generation failed for "{reportTitle}"',
    },

    reportPage: {
      generateButton: 'Generate Report',
      generating: 'Processing...',
      processingMessage: 'Your report is being processed in the background. You will receive a notification when it is ready.',
      filterSectionTitle: 'Report Filters',
      requiredFieldsError: 'Please fill in all required filters',
      errorLoadConfig: 'Failed to load report configuration',
      errorFileNotFound: 'Report file not found or has been deleted',
      errorGenerateFailed: 'Failed to start report generation',
      downloadButton: 'Download Report',
      outputStatus: {
        pending: 'Pending',
        processing: 'Processing',
        completed: 'Completed',
        failed: 'Failed',
        downloaded_deleted: 'Downloaded',
        expired: 'Expired',
      },
    },
  },
};
