// Upload Service — Complete implementation for all 11 modules
// Requirements: 4.4, 4.5, 5.1-5.8, 6.2
// Task 6: Backend Services — Upload Service

import type ExcelJS from 'exceljs';
import { z } from 'zod';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { db } from '../../db/connection';
import { uploadSessions, uploadStagingRows, corporates, departments, projects, banks } from '../../db/schema/public';
import { configService } from '../management/configService';
import { AppError, ErrorCode } from '../../utils/errors';
import type { Locale } from '../../i18n/commons';
import type { AccessContext } from './dynamicTemplateService';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type EntityType =
  | 'balance_sheet'
  | 'income_statement'
  | 'income_statement_projection'
  | 'weekly_cash_flow'
  | 'realization'
  | 'cash_flow_projection'
  | 'bank_loan'
  | 'corporate'
  | 'department'
  | 'cost_center'
  | 'project';

export interface TemplateConfig {
  fileName: string;
  startRecord: number;
  columnOrder: string[];
}

export interface ParseAndValidateOptions {
  entityType: EntityType;
  file: Buffer;
  fileName: string;
  fileSize: number;
  userId: string;
  language: Locale;
  accessContext: AccessContext;
}

export interface ParseAndValidateResult {
  sessionId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: StagingRow[];
}

export interface StagingRow {
  rowNumber: number;
  rowData: Record<string, any>;
  isValid: boolean;
  errorMessages?: string[];
}

// ============================================================================
// Zod Validation Schemas (Reuse from form validation)
// Requirements: 5.3, 15.3
// ============================================================================

/**
 * Balance Sheet validation schema
 * Reuses same validation logic as form input
 */
const balanceSheetSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  corporate_id: z.string().uuid('Invalid corporate ID'),
  cash_and_bank: z.string().optional(),
  accounts_receivable: z.string().optional(),
  work_in_progress: z.string().optional(),
  inventory: z.string().optional(),
  prepaid_expenses: z.string().optional(),
  land: z.string().optional(),
  building: z.string().optional(),
  equipment: z.string().optional(),
  other_fixed_assets: z.string().optional(),
  accounts_payable: z.string().optional(),
  bank_loan_current: z.string().optional(),
  other_current_liabilities: z.string().optional(),
  bank_loan_long_term: z.string().optional(),
  other_long_term_liabilities: z.string().optional(),
  shareholder_loan: z.string().optional(),
  capital: z.string().optional(),
  earnings_after_tax: z.string().optional(),
  retained_earnings: z.string().optional(),
  dividends: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // At least one numeric field must be non-zero
  const numericFields = [
    'cash_and_bank', 'accounts_receivable', 'work_in_progress', 'inventory',
    'prepaid_expenses', 'land', 'building', 'equipment', 'other_fixed_assets',
    'accounts_payable', 'bank_loan_current', 'other_current_liabilities',
    'bank_loan_long_term', 'other_long_term_liabilities', 'shareholder_loan',
    'capital', 'earnings_after_tax', 'retained_earnings', 'dividends'
  ];
  
  const sum = numericFields.reduce((acc, field) => {
    const value = parseFloat(data[field as keyof typeof data] as string || '0');
    return acc + (isNaN(value) ? 0 : Math.abs(value));
  }, 0);
  
  return sum > 0;
}, 'At least one field must have a non-zero value');

/**
 * Income Statement validation schema
 */
const incomeStatementSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  corporate_id: z.string().uuid('Invalid corporate ID'),
  revenue: z.string().optional(),
  cogs: z.string().optional(),
  operating_expenses: z.string().optional(),
  interest_expense: z.string().optional(),
  tax_expense: z.string().optional(),
  other_income: z.string().optional(),
  other_expense: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  const numericFields = ['revenue', 'cogs', 'operating_expenses', 'interest_expense', 'tax_expense', 'other_income', 'other_expense'];
  const sum = numericFields.reduce((acc, field) => {
    const value = parseFloat(data[field as keyof typeof data] as string || '0');
    return acc + (isNaN(value) ? 0 : Math.abs(value));
  }, 0);
  return sum > 0;
}, 'At least one field must have a non-zero value');

/**
 * Income Statement Projection validation schema
 */
const incomeStatementProjectionSchema = z.object({
  department_id: z.string().uuid('Invalid department ID'),
  project_id: z.string().uuid('Invalid project ID').optional(),
  fiscal_year: z.number().int().min(2000).max(2100),
  target_type: z.enum(['revenue', 'cogs', 'operating_expenses']),
  month: z.number().int().min(1).max(12),
  cost_center_id: z.string().uuid('Invalid cost center ID').optional(),
  amount: z.string().refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  notes: z.string().optional(),
});

/**
 * Weekly Cash Flow validation schema
 */
const weeklyCashFlowSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  week: z.string().min(1, 'Week is required'),
  entity_type: z.enum(['corporate', 'project']),
  entity_id: z.string().uuid('Invalid entity ID'),
  corporate_id: z.string().uuid('Invalid corporate ID'),
  operating_cash_in: z.string().optional(),
  operating_cash_out: z.string().optional(),
  investing_cash_in: z.string().optional(),
  investing_cash_out: z.string().optional(),
  financing_cash_in: z.string().optional(),
  financing_cash_out: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  const numericFields = ['operating_cash_in', 'operating_cash_out', 'investing_cash_in', 'investing_cash_out', 'financing_cash_in', 'financing_cash_out'];
  const sum = numericFields.reduce((acc, field) => {
    const value = parseFloat(data[field as keyof typeof data] as string || '0');
    return acc + (isNaN(value) ? 0 : Math.abs(value));
  }, 0);
  return sum > 0;
}, 'At least one cash flow field must have a non-zero value');

/**
 * Realization validation schema
 */
const realizationSchema = z.object({
  transaction_date: z.string().min(1, 'Transaction date is required'),
  entity_type: z.enum(['department', 'project']),
  department_id: z.string().uuid('Invalid department ID').optional(),
  project_id: z.string().uuid('Invalid project ID').optional(),
  cost_center_id: z.string().uuid('Invalid cost center ID').optional(),
  category: z.enum(['cash-in', 'cash-out']),
  amount: z.string().refine((val) => parseFloat(val) !== 0, 'Amount cannot be zero'),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.entity_type === 'department' && !data.department_id) {
    return false;
  }
  if (data.entity_type === 'project' && !data.project_id) {
    return false;
  }
  return true;
}, 'Entity ID is required based on entity type');

/**
 * Cash Flow Projection validation schema — wide format (1 row = 1 fiscal year header + monthly totals)
 */
const cashFlowProjectionSchema = z.object({
  corporate_id: z.string().uuid('Invalid corporate ID'),
  fiscal_year: z.number().int().min(2000).max(2100),
  initial_balance: z.string().optional(),
  notes: z.string().optional(),
  jan_cash_in: z.string().optional(),
  jan_cash_out: z.string().optional(),
  feb_cash_in: z.string().optional(),
  feb_cash_out: z.string().optional(),
  mar_cash_in: z.string().optional(),
  mar_cash_out: z.string().optional(),
  apr_cash_in: z.string().optional(),
  apr_cash_out: z.string().optional(),
  may_cash_in: z.string().optional(),
  may_cash_out: z.string().optional(),
  jun_cash_in: z.string().optional(),
  jun_cash_out: z.string().optional(),
  jul_cash_in: z.string().optional(),
  jul_cash_out: z.string().optional(),
  aug_cash_in: z.string().optional(),
  aug_cash_out: z.string().optional(),
  sep_cash_in: z.string().optional(),
  sep_cash_out: z.string().optional(),
  oct_cash_in: z.string().optional(),
  oct_cash_out: z.string().optional(),
  nov_cash_in: z.string().optional(),
  nov_cash_out: z.string().optional(),
  dec_cash_in: z.string().optional(),
  dec_cash_out: z.string().optional(),
}).refine((data) => {
  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const d = data as Record<string, unknown>;
  return monthKeys.some(m => {
    const ci = parseFloat((d[`${m}_cash_in`] as string | undefined) ?? '0');
    const co = parseFloat((d[`${m}_cash_out`] as string | undefined) ?? '0');
    return ci !== 0 || co !== 0;
  });
}, 'At least one monthly cash flow value must be non-zero');

/**
 * Bank Loan validation schema
 */
const bankLoanSchema = z.object({
  bank_id: z.string().uuid('Invalid bank ID'),
  corporate_id: z.string().uuid('Invalid corporate ID'),
  credit_type: z.enum(['KMK', 'KMI']),
  amount: z.string().refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  start_date: z.string().min(1, 'Start date is required'),
  tenor: z.number().int().min(1, 'Tenor must be at least 1 month'),
  interest_type: z.enum(['flat', 'effective']),
  interest_rate: z.number().min(0).max(1, 'Interest rate must be between 0 and 1 (decimal)'),
  alert_min_days: z.number().int().min(0).optional(),
});

/**
 * Corporate validation schema
 */
const corporateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  industry: z.string().min(1, 'Industry is required'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  tax_rate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  fiscal_year_start_month: z.number().int().min(1).max(12),
});

/**
 * Department validation schema
 */
const departmentSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  corporate_id: z.string().uuid('Invalid corporate ID'),
  head_id: z.string().uuid('Invalid head ID').optional(),
  description: z.string().optional(),
});

/**
 * Cost Center validation schema
 */
const costCenterSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  corporate_id: z.string().uuid('Invalid corporate ID'),
  parent_id: z.string().uuid('Invalid parent ID').optional(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
});

/**
 * Project validation schema
 */
const projectSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  department_id: z.string().uuid('Invalid department ID'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']),
  description: z.string().optional(),
});

/**
 * Get validation schema for entity type
 */
function getValidationSchema(entityType: EntityType): z.ZodSchema {
  const schemas: Record<EntityType, z.ZodSchema> = {
    balance_sheet: balanceSheetSchema,
    income_statement: incomeStatementSchema,
    income_statement_projection: incomeStatementProjectionSchema,
    weekly_cash_flow: weeklyCashFlowSchema,
    realization: realizationSchema,
    cash_flow_projection: cashFlowProjectionSchema,
    bank_loan: bankLoanSchema,
    corporate: corporateSchema,
    department: departmentSchema,
    cost_center: costCenterSchema,
    project: projectSchema,
  };

  return schemas[entityType];
}

// ============================================================================
// Template Configuration
// Requirements: 4.4, 4.5
// ============================================================================

/**
 * Fetch template configuration from system_configs
 * Requirements: 4.4, 4.5, 4.6, 4.7
 */
async function getTemplateConfig(entityType: EntityType): Promise<TemplateConfig> {
  const configKey = `upload_template_${entityType}`;
  const config = await configService.get<TemplateConfig>(configKey);

  if (!config) {
    throw AppError.internal(
      `Template configuration not found for ${entityType}. Config key: ${configKey}`
    );
  }

  return config;
}

/**
 * Get base path for uploaded files
 */
async function getUploadBasePath(): Promise<string> {
  const config = await configService.get<string>('upload_base_path');

  if (!config) {
    throw AppError.internal(
      'Upload base path not configured. Config key: upload_base_path'
    );
  }

  return config;
}

// ============================================================================
// File Storage
// Requirements: Design Section 6.2
// ============================================================================

/**
 * Save uploaded file to storage
 * Path: {upload_base_path}/{sessionId}/{fileName}
 * Requirements: 6.3
 */
async function saveUploadedFile(
  sessionId: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  const basePath = await getUploadBasePath();
  const uploadDir = path.join(basePath, sessionId);
  const filePath = path.join(uploadDir, fileName);

  // Create directory if it doesn't exist
  await fs.mkdir(uploadDir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, fileBuffer);

  return filePath;
}

// ============================================================================
// Excel Parsing
// Requirements: 5.1, 5.2
// ============================================================================

/**
 * Parse Excel file and extract rows
 * Requirements: 5.1, 5.2
 */
async function parseExcelFile(
  fileBuffer: Buffer,
  templateConfig: TemplateConfig
): Promise<Record<string, any>[]> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw AppError.badRequest(
      ErrorCode.INVALID_INPUT,
      'Excel file has no worksheets'
    );
  }

  const rows: Record<string, any>[] = [];
  const { startRecord, columnOrder } = templateConfig;

  // Iterate through rows starting from startRecord
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRecord) {
      return; // Skip header rows
    }

    const rowData: Record<string, any> = {};
    let hasData = false;

    // Map columns according to columnOrder
    columnOrder.forEach((columnName, index) => {
      const cell = row.getCell(index + 1);
      let value: any = cell.value;

      // Handle different cell types
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object' && 'result' in value) {
        // Formula cell
        value = value.result;
      } else if (value instanceof Date) {
        // Date cell - format as YYYY-MM-DD
        value = value.toISOString().split('T')[0];
      }

      rowData[columnName] = value;
      if (value !== '') {
        hasData = true;
      }
    });

    // Only add row if it has at least one non-empty cell
    if (hasData) {
      rows.push(rowData);
    }
  });

  return rows;
}

// ============================================================================
// Validation
// Requirements: 5.3, 15.3
// ============================================================================

/**
 * Validate a single row using Zod schema
 * Requirements: 5.3, 15.3
 */
function validateRow(
  rowData: Record<string, any>,
  entityType: EntityType
): { isValid: boolean; errorMessages?: string[] } {
  const schema = getValidationSchema(entityType);
  const result = schema.safeParse(rowData);

  if (result.success) {
    return { isValid: true };
  } else {
    const errorMessages = result.error.issues.map((err) => {
      const field = err.path.join('.');
      return `${field}: ${err.message}`;
    });
    return { isValid: false, errorMessages };
  }
}

// ============================================================================
// Dropdown Value Resolution
// Converts display labels (e.g. "CORP01 - PT ABC") back to UUIDs before Zod validation.
// Also supports UUID passthrough for backward compatibility with existing files.
// ============================================================================

interface ResolutionMaps {
  corporateMap?: Map<string, string>;   // label|UUID → UUID
  departmentMap?: Map<string, string>;
  projectMap?: Map<string, string>;
  bankMap?: Map<string, string>;
}

async function buildResolutionMaps(
  entityType: EntityType,
  access: AccessContext,
): Promise<ResolutionMaps> {
  const needsCorp = ['balance_sheet', 'income_statement', 'weekly_cash_flow', 'cash_flow_projection', 'bank_loan', 'department', 'cost_center'].includes(entityType);
  const needsDept = ['income_statement_projection', 'realization', 'project'].includes(entityType);
  const needsProj = ['income_statement_projection', 'weekly_cash_flow', 'realization'].includes(entityType);
  const needsBank = entityType === 'bank_loan';

  const result: ResolutionMaps = {};

  const corpFilter = (access.scope === 'system' || access.hasFullCorporateAccess)
    ? eq(corporates.isActive, true)
    : and(eq(corporates.isActive, true), inArray(corporates.id, access.corporateIds.length > 0 ? access.corporateIds : ['__none__']));

  const deptFilter = (access.scope === 'system' || access.hasFullCorporateAccess)
    ? eq(departments.isActive, true)
    : and(eq(departments.isActive, true), inArray(departments.corporateId, access.corporateIds.length > 0 ? access.corporateIds : ['__none__']));

  const projFilter = (access.scope === 'system' || access.hasFullCorporateAccess)
    ? eq(projects.isActive, true)
    : access.corporateIds.length > 0
      ? and(eq(projects.isActive, true), inArray(departments.corporateId, access.corporateIds))
      : and(eq(projects.isActive, true), inArray(projects.departmentId, access.departmentIds.length > 0 ? access.departmentIds : ['__none__']));

  const [corpRows, deptRows, projRows, bankRows] = await Promise.all([
    needsCorp
      ? db.select({ id: corporates.id, code: corporates.code, name: corporates.name }).from(corporates).where(corpFilter).orderBy(asc(corporates.code))
      : Promise.resolve([]),
    needsDept
      ? db.select({ id: departments.id, code: departments.code, name: departments.name, corpCode: corporates.code })
          .from(departments)
          .innerJoin(corporates, eq(departments.corporateId, corporates.id))
          .where(deptFilter)
          .orderBy(asc(corporates.code), asc(departments.code))
      : Promise.resolve([]),
    needsProj
      ? db.select({ id: projects.id, code: projects.code, name: projects.name })
          .from(projects)
          .innerJoin(departments, eq(projects.departmentId, departments.id))
          .where(projFilter)
          .orderBy(asc(projects.code))
      : Promise.resolve([]),
    needsBank
      ? db.select({ id: banks.id, code: banks.code, name: banks.name }).from(banks).where(eq(banks.status, 'active')).orderBy(asc(banks.code))
      : Promise.resolve([]),
  ]);

  if (needsCorp) {
    result.corporateMap = new Map<string, string>();
    for (const r of corpRows) {
      result.corporateMap.set(`${r.code} - ${r.name}`, r.id);
      result.corporateMap.set(r.id, r.id); // UUID passthrough
    }
    // Single-access auto-assign: store the single UUID under empty-string key
    if (corpRows.length === 1) {
      result.corporateMap.set('', corpRows[0].id);
    }
  }

  if (needsDept) {
    result.departmentMap = new Map<string, string>();
    for (const r of deptRows) {
      result.departmentMap.set(`${r.corpCode}-${r.code} - ${r.name}`, r.id);
      result.departmentMap.set(r.id, r.id);
    }
    if (deptRows.length === 1) {
      result.departmentMap.set('', deptRows[0].id);
    }
  }

  if (needsProj) {
    result.projectMap = new Map<string, string>();
    for (const r of projRows) {
      result.projectMap.set(`${r.code} - ${r.name}`, r.id);
      result.projectMap.set(r.id, r.id);
    }
  }

  if (needsBank) {
    result.bankMap = new Map<string, string>();
    for (const r of bankRows) {
      result.bankMap.set(`${r.code} - ${r.name}`, r.id);
      result.bankMap.set(r.id, r.id);
    }
  }

  return result;
}

function resolveDropdownValues(
  rowData: Record<string, any>,
  entityType: EntityType,
  maps: ResolutionMaps,
): Record<string, any> {
  const resolved = { ...rowData };

  // corporate_id resolution + auto-assign for single-access
  if (maps.corporateMap) {
    const raw = String(resolved.corporate_id ?? '');
    const uuid = maps.corporateMap.get(raw) ?? maps.corporateMap.get('');
    if (uuid) resolved.corporate_id = uuid;
  }

  // department_id resolution + auto-assign for single-access
  if (maps.departmentMap) {
    const raw = String(resolved.department_id ?? '');
    const uuid = maps.departmentMap.get(raw) ?? maps.departmentMap.get('');
    if (uuid) resolved.department_id = uuid;
  }

  // project_id resolution (optional, no auto-assign)
  if (maps.projectMap && resolved.project_id) {
    const raw = String(resolved.project_id);
    const uuid = maps.projectMap.get(raw);
    if (uuid) resolved.project_id = uuid;
  }

  // entity_id resolution for weekly_cash_flow (project UUID when entity_type = 'project')
  if (entityType === 'weekly_cash_flow' && maps.projectMap && resolved.entity_id) {
    const raw = String(resolved.entity_id);
    const uuid = maps.projectMap.get(raw);
    if (uuid) resolved.entity_id = uuid;
    // If entity_type is 'corporate', entity_id should equal corporate_id
    else if (resolved.entity_type === 'corporate' && resolved.corporate_id) {
      resolved.entity_id = resolved.corporate_id;
    }
  }

  // bank_id resolution
  if (maps.bankMap && resolved.bank_id) {
    const raw = String(resolved.bank_id);
    const uuid = maps.bankMap.get(raw);
    if (uuid) resolved.bank_id = uuid;
  }

  // CFP wide format: 'corporate' column → corporate_id UUID
  if (entityType === 'cash_flow_projection' && maps.corporateMap) {
    const raw = String(resolved.corporate ?? '');
    const uuid = maps.corporateMap.get(raw) ?? maps.corporateMap.get('');
    if (uuid) {
      resolved.corporate_id = uuid;
      delete resolved.corporate;
    }
  }

  return resolved;
}

// ============================================================================
// Cash Flow Projection Wide-Format Transformer
// Converts a wide row (1 row = 1 header + 24 monthly columns) into the
// structure stored in uploadStagingRows.rowData
// ============================================================================

const CFP_MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function transformCfpWideRow(rawRow: Record<string, any>): Record<string, any> {
  const details: Array<{ month: number; type: string; group: string; category: string; amount: string }> = [];

  CFP_MONTH_KEYS.forEach((m, idx) => {
    const ci = parseFloat(String(rawRow[`${m}_cash_in`] ?? '0'));
    const co = parseFloat(String(rawRow[`${m}_cash_out`] ?? '0'));
    if (!isNaN(ci) && ci !== 0) {
      details.push({ month: idx + 1, type: 'cash-in', group: 'operating', category: 'Upload', amount: ci.toString() });
    }
    if (!isNaN(co) && co !== 0) {
      details.push({ month: idx + 1, type: 'cash-out', group: 'operating', category: 'Upload', amount: co.toString() });
    }
  });

  return {
    corporate_id: rawRow.corporate_id,
    fiscal_year: rawRow.fiscal_year,
    initial_balance: rawRow.initial_balance || '0',
    notes: rawRow.notes || null,
    details,
  };
}

// ============================================================================
// Main Upload Function
// Requirements: 5.4, 5.5, 5.6, 5.7, 5.8
// ============================================================================

/**
 * Parse and validate uploaded file
 * Requirements: 4.4, 4.5, 5.1-5.8
 */
export async function parseAndValidateUpload(
  options: ParseAndValidateOptions
): Promise<ParseAndValidateResult> {
  const { entityType, file, fileName, fileSize, userId, language, accessContext } = options;

  try {
    // Step 1: Fetch template configuration (Requirements: 4.4, 4.5)
    const templateConfig = await getTemplateConfig(entityType);

    // Step 2: Parse Excel file (Requirements: 5.1, 5.2)
    let parsedRows: Record<string, any>[];
    try {
      parsedRows = await parseExcelFile(file, templateConfig);
    } catch (error) {
      throw AppError.badRequest(
        ErrorCode.INVALID_INPUT,
        'Invalid file format or corrupted Excel file',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }

    if (parsedRows.length === 0) {
      throw AppError.badRequest(
        ErrorCode.INVALID_INPUT,
        'No data rows found in the uploaded file'
      );
    }

    // Step 2b: Build resolution maps (dropdown label → UUID)
    const resolutionMaps = await buildResolutionMaps(entityType, accessContext);

    // Step 2c: Resolve dropdown display values → UUIDs / codes
    const resolvedRows = parsedRows.map(row => resolveDropdownValues(row, entityType, resolutionMaps));

    // Step 2d: For CFP wide format, expand monthly columns into details array
    const processedRows = entityType === 'cash_flow_projection'
      ? resolvedRows.map(row => transformCfpWideRow(row))
      : resolvedRows;

    // Step 3: Validate each row (Requirements: 5.3, 15.3)
    const stagingRows: StagingRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < processedRows.length; i++) {
      const rowData = processedRows[i];
      const validation = validateRow(rowData, entityType);

      const stagingRow: StagingRow = {
        rowNumber: i + 1,
        rowData,
        isValid: validation.isValid,
        errorMessages: validation.errorMessages,
      };

      stagingRows.push(stagingRow);

      if (validation.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }
    }

    // Step 4: Check if all rows are invalid (Requirement: 5.7)
    if (validCount === 0) {
      throw AppError.badRequest(
        ErrorCode.INVALID_INPUT,
        'All rows in the file are invalid. Please fix the errors and try again.',
        {
          totalRows: processedRows.length,
          invalidRows: invalidCount,
          preview: stagingRows.slice(0, 5),
        }
      );
    }

    // Step 5: Create upload session and staging rows in transaction (Requirements: 5.4, 5.5, 5.6, 11.3)
    const result = await db.transaction(async (tx) => {
      // Create upload session
      const [session] = await tx
        .insert(uploadSessions)
        .values({
          userId,
          module: 'cfd',
          entityType,
          fileName,
          fileSize,
          totalRows: processedRows.length,
          validRows: validCount,
          invalidRows: invalidCount,
          status: 'pending_review',
          createdBy: userId,
        })
        .returning();

      // Save uploaded file to storage (Requirement: 6.3)
      const filePath = await saveUploadedFile(session.id, fileName, file);

      // Update session with file path
      await tx
        .update(uploadSessions)
        .set({ filePath })
        .where(eq(uploadSessions.id, session.id));

      // Insert staging rows
      const stagingRowsToInsert = stagingRows.map((row) => ({
        sessionId: session.id,
        rowNumber: row.rowNumber,
        rowData: row.rowData,
        isValid: row.isValid,
        errorMessages: row.errorMessages || null,
      }));

      await tx.insert(uploadStagingRows).values(stagingRowsToInsert);

      return {
        sessionId: session.id,
        totalRows: processedRows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        preview: stagingRows.slice(0, 5), // Return first 5 rows as preview
      };
    });

    return result;
  } catch (error) {
    // Re-throw AppError as-is
    if (error instanceof AppError) {
      throw error;
    }

    // Wrap other errors
    throw AppError.internal(
      'Failed to process upload: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

// ============================================================================
// Error Handling
// Requirements: 4.6, 4.7, 5.7, 5.8
// ============================================================================

/**
 * Error codes for upload service
 */
export const UploadErrorCode = {
  TEMPLATE_CONFIG_NOT_FOUND: 'TEMPLATE_CONFIG_NOT_FOUND',
  TEMPLATE_BASE_PATH_NOT_CONFIGURED: 'TEMPLATE_BASE_PATH_NOT_CONFIGURED',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  ALL_ROWS_INVALID: 'ALL_ROWS_INVALID',
  NO_DATA_ROWS: 'NO_DATA_ROWS',
} as const;
