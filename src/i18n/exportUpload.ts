// i18n/exportUpload.ts — Translations for Export & Upload Module
// Note: Common strings (save, cancel, loading, error, success, etc.) are in commonsI18n.
import { Locale } from './commons';

export interface ExportUploadCopy {
  export: {
    /** Tooltip / aria-label for the icon-only export button in toolbar */
    buttonTooltip: string;
    /** Modal / dialog title */
    title: string;
    /** Label for format selector */
    format: string;
    /** Format option label */
    xlsx: string;
    /** Format option label */
    csv: string;
    /** Toast message on successful export */
    success: string;
    /** Toast message on failed export */
    error: string;
    /** Filter summary label when no filters are active */
    allData: string;
  };
  upload: {
    /** Tooltip / aria-label for the icon-only upload button in toolbar */
    buttonTooltip: string;
    /** Modal title */
    title: string;
    /** Button label to download the Excel template */
    downloadTemplate: string;
    /** Placeholder text inside the drag-and-drop area */
    selectFile: string;
    /** Helper text showing accepted format and max size */
    fileInfo: string;
    /** Label for valid row count in review step */
    validRows: string;
    /** Label for invalid row count in review step */
    invalidRows: string;
    /** Label for total row count in review step */
    totalRows: string;
    /** Confirm upload button label */
    confirmUpload: string;
    /** Toast message on successful upload confirmation */
    success: string;
    /** Toast message on failed upload */
    error: string;
    /** Message shown when confirm button is disabled due to invalid rows */
    invalidRowsWarning: string;
    /** Label for row number column in staging rows table */
    rowNumber: string;
    /** Label for row data column in staging rows table */
    rowData: string;
    /** Label for validation status column in staging rows table */
    validationStatus: string;
    /** Label for error messages column in staging rows table */
    errorMessages: string;
    /** Status label for a valid row */
    rowValid: string;
    /** Status label for an invalid row */
    rowInvalid: string;
    /** Label for the file name display in review step */
    uploadedFile: string;
    /** Button label to download the uploaded file in review step */
    downloadFile: string;
    /** Step 1 label */
    stepSelectFile: string;
    /** Step 2 label */
    stepReview: string;
    /** Step 3 label */
    stepApproval: string;
    /** Error: file extension not .xlsx */
    errorInvalidExtension: string;
    /** Error: file exceeds max size */
    errorFileTooLarge: string;
    /** Error: all rows are invalid, no session created */
    errorAllRowsInvalid: string;
    /** Error: template config not found */
    errorTemplateConfigNotFound: string;
    /** Error: template base path not configured */
    errorTemplateBasePathNotConfigured: string;
    /** Error: template file not found on server */
    errorTemplateFileNotFound: string;
    /** Error: invalid file format / cannot be read */
    errorInvalidFileFormat: string;
    /** Cancelling session in progress message */
    cancelling: string;
    /** Toast message after session successfully cancelled */
    cancelSuccess: string;
    /** Toast message if session cancellation fails */
    cancelError: string;
    /** Search placeholder for staging rows table */
    searchRows: string;
    /** Confirmation dialog title when user clicks Cancel with an active session */
    cancelConfirmTitle: string;
    /** Confirmation dialog description when user clicks Cancel with an active session */
    cancelConfirmDesc: string;
  };
  history: {
    /** Section / page title */
    title: string;
    /** Column: original file name */
    fileName: string;
    /** Column: total rows in the upload */
    totalRows: string;
    /** Column: number of valid rows */
    validRows: string;
    /** Column: number of invalid rows */
    invalidRows: string;
    /** Column: upload session status */
    status: string;
    /** Column: user who performed the upload */
    uploadedBy: string;
    /** Column: date/time of upload */
    uploadedAt: string;
    /** Button to view detail of a history entry */
    viewDetail: string;
    /** Modal title for history detail */
    detailTitle: string;
    /** Status label: pending review */
    statusPendingReview: string;
    /** Status label: confirmed (awaiting approval) */
    statusConfirmed: string;
    /** Status label: approved */
    statusApproved: string;
    /** Status label: failed */
    statusFailed: string;
    /** Status label: cancelled */
    statusCancelled: string;
  };
}

export const exportUploadI18n: Record<Locale, ExportUploadCopy> = {
  id: {
    export: {
      buttonTooltip: 'Ekspor Data',
      title: 'Ekspor Data',
      format: 'Format',
      xlsx: 'Excel (.xlsx)',
      csv: 'CSV (.csv)',
      success: 'Data berhasil diekspor',
      error: 'Gagal mengekspor data',
      allData: 'Semua Data',
    },
    upload: {
      buttonTooltip: 'Unggah Data',
      title: 'Unggah Data',
      downloadTemplate: 'Unduh Template',
      selectFile: 'Klik atau seret file ke sini',
      fileInfo: 'Format: .xlsx | Ukuran maksimal: 10 MB',
      validRows: 'Baris Valid',
      invalidRows: 'Baris Tidak Valid',
      totalRows: 'Total Baris',
      confirmUpload: 'Konfirmasi Unggah',
      success: 'Data berhasil diunggah',
      error: 'Gagal mengunggah data',
      invalidRowsWarning: 'Semua baris harus valid sebelum dapat dikonfirmasi',
      rowNumber: 'No. Baris',
      rowData: 'Data',
      validationStatus: 'Status Validasi',
      errorMessages: 'Pesan Error',
      rowValid: 'Valid',
      rowInvalid: 'Tidak Valid',
      uploadedFile: 'File yang Diunggah',
      downloadFile: 'Unduh File',
      stepSelectFile: 'Pilih File',
      stepReview: 'Tinjau Data',
      stepApproval: 'Persetujuan',
      errorInvalidExtension: 'File harus berformat .xlsx',
      errorFileTooLarge: 'Ukuran file melebihi batas maksimum 10 MB',
      errorAllRowsInvalid: 'Semua baris tidak valid. Perbaiki file dan coba lagi.',
      errorTemplateConfigNotFound: 'Konfigurasi template tidak ditemukan untuk modul ini',
      errorTemplateBasePathNotConfigured: 'Path direktori template belum dikonfigurasi',
      errorTemplateFileNotFound: 'File template tidak ditemukan di server',
      errorInvalidFileFormat: 'Format file tidak valid atau tidak sesuai template',
      cancelling: 'Membatalkan...',
      cancelSuccess: 'Unggahan berhasil dibatalkan',
      cancelError: 'Gagal membatalkan unggahan',
      searchRows: 'Cari data baris...',
      cancelConfirmTitle: 'Batalkan Unggahan?',
      cancelConfirmDesc: 'Data yang sudah diunggah akan dihapus dan tidak dapat dipulihkan.',
    },
    history: {
      title: 'Riwayat Unggah',
      fileName: 'Nama File',
      totalRows: 'Total Baris',
      validRows: 'Baris Valid',
      invalidRows: 'Baris Tidak Valid',
      status: 'Status',
      uploadedBy: 'Diunggah Oleh',
      uploadedAt: 'Tanggal Unggah',
      viewDetail: 'Lihat Detail',
      detailTitle: 'Detail Riwayat Unggah',
      statusPendingReview: 'Menunggu Tinjauan',
      statusConfirmed: 'Dikonfirmasi',
      statusApproved: 'Disetujui',
      statusFailed: 'Gagal',
      statusCancelled: 'Dibatalkan',
    },
  },
  en: {
    export: {
      buttonTooltip: 'Export Data',
      title: 'Export Data',
      format: 'Format',
      xlsx: 'Excel (.xlsx)',
      csv: 'CSV (.csv)',
      success: 'Data exported successfully',
      error: 'Failed to export data',
      allData: 'All Data',
    },
    upload: {
      buttonTooltip: 'Upload Data',
      title: 'Upload Data',
      downloadTemplate: 'Download Template',
      selectFile: 'Click or drag file here',
      fileInfo: 'Format: .xlsx | Max size: 10 MB',
      validRows: 'Valid Rows',
      invalidRows: 'Invalid Rows',
      totalRows: 'Total Rows',
      confirmUpload: 'Confirm Upload',
      success: 'Data uploaded successfully',
      error: 'Failed to upload data',
      invalidRowsWarning: 'All rows must be valid before confirming',
      rowNumber: 'Row No.',
      rowData: 'Data',
      validationStatus: 'Validation Status',
      errorMessages: 'Error Messages',
      rowValid: 'Valid',
      rowInvalid: 'Invalid',
      uploadedFile: 'Uploaded File',
      downloadFile: 'Download File',
      stepSelectFile: 'Select File',
      stepReview: 'Review Data',
      stepApproval: 'Approval',
      errorInvalidExtension: 'File must be in .xlsx format',
      errorFileTooLarge: 'File size exceeds the maximum limit of 10 MB',
      errorAllRowsInvalid: 'All rows are invalid. Please fix the file and try again.',
      errorTemplateConfigNotFound: 'Template configuration not found for this module',
      errorTemplateBasePathNotConfigured: 'Template directory path is not configured',
      errorTemplateFileNotFound: 'Template file not found on server',
      errorInvalidFileFormat: 'Invalid file format or does not match the template',
      cancelling: 'Cancelling...',
      cancelSuccess: 'Upload cancelled successfully',
      cancelError: 'Failed to cancel upload',
      searchRows: 'Search row data...',
      cancelConfirmTitle: 'Cancel Upload?',
      cancelConfirmDesc: 'The uploaded data will be deleted and cannot be recovered.',
    },
    history: {
      title: 'Upload History',
      fileName: 'File Name',
      totalRows: 'Total Rows',
      validRows: 'Valid Rows',
      invalidRows: 'Invalid Rows',
      status: 'Status',
      uploadedBy: 'Uploaded By',
      uploadedAt: 'Upload Date',
      viewDetail: 'View Detail',
      detailTitle: 'Upload History Detail',
      statusPendingReview: 'Pending Review',
      statusConfirmed: 'Confirmed',
      statusApproved: 'Approved',
      statusFailed: 'Failed',
      statusCancelled: 'Cancelled',
    },
  },
};
