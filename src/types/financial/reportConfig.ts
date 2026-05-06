// Types for Dynamic Excel Report feature

export interface FilterConfig {
  paramName: string;           // alphanumeric + underscore only
  labelId: string;             // label bahasa Indonesia
  labelEn: string;             // label bahasa Inggris
  type: 'text' | 'date' | 'date_range' | 'numeric' | 'numeric_range' | 'dropdown' | 'month' | 'month_range';
  order: number;               // urutan tampil (integer positif)
  required?: boolean;
  dropdownSource?: 'json' | 'query';
  dropdownItems?: Array<{ value: string; labelId: string; labelEn: string }>;
  dropdownQuery?: string;      // SQL query untuk source='query'
}

export interface ColumnConfig {
  fieldName: string;           // nama field dari hasil query
  order: number;               // urutan kolom di Excel
  dataType: 'string' | 'number' | 'date' | 'currency';
  format?: string;             // contoh: 'DD/MM/YYYY', '#,##0.00'
  headerLabelId?: string;
  headerLabelEn?: string;
}

export type ReportOutputStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'downloaded_deleted'
  | 'expired';

export interface ReportConfig {
  id: string;
  titleId: string;
  titleEn: string;
  filters: FilterConfig[];
  columns: ColumnConfig[];
  query: string;
  templateFilename?: string | null;
  cellInfoFilter?: string | null;
  startRow: number;
  writeHeader: boolean;        // tulis baris header untuk semua kolom sebelum data
  allowedRoles: string[];
  retentionType: string;
  retentionDays?: number | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt?: Date | null;
}

export interface CreateReportConfigInput {
  titleId: string;
  titleEn: string;
  filters?: FilterConfig[];
  columns: ColumnConfig[];
  query: string;
  templateFilename?: string;
  cellInfoFilter?: string;
  startRow?: number;
  writeHeader?: boolean;
  allowedRoles?: string[];
  retentionType?: 'immediate' | 'days';
  retentionDays?: number;
  isActive?: boolean;
}

export interface UpdateReportConfigInput extends Partial<CreateReportConfigInput> {}

export interface ListReportConfigsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListReportConfigsResult {
  data: ReportConfig[];
  total: number;
  page: number;
  pageSize: number;
}
