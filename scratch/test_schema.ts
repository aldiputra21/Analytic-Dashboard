import { z } from 'zod';

const filterConfigSchema = z.object({
  paramName: z.string().regex(/^[a-zA-Z0-9_]+$/),
  labelId: z.string().min(1),
  labelEn: z.string().min(1),
  type: z.enum(['text', 'date', 'date_range', 'numeric', 'numeric_range', 'dropdown', 'month', 'month_range']),
  order: z.number().int().positive(),
  required: z.boolean().optional(),
  dropdownSource: z.enum(['json', 'query']).optional(),
  dropdownItems: z.array(z.object({
    value: z.string(),
    labelId: z.string().default(''),
    labelEn: z.string().default(''),
  })).optional(),
  dropdownQuery: z.string().optional(),
});

const reportConfigCreateSchema = z.object({
  titleId: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200),
  filters: z.array(filterConfigSchema).default([]),
  columns: z.array(z.object({
    fieldName: z.string().min(1),
    order: z.number().int().positive(),
    dataType: z.enum(['string', 'number', 'date', 'currency']),
    format: z.string().optional(),
    headerLabelId: z.string().optional(),
    headerLabelEn: z.string().optional(),
  })).min(1),
  query: z.string().min(1),
  templateFilename: z.string().max(255).optional(),
  cellInfoFilter: z.string().max(10).optional(),
  startRow: z.number().int().positive().default(1),
  allowedRoles: z.array(z.string()).default([]),
  retentionType: z.enum(['immediate', 'days']).default('days'),
  retentionDays: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

const testPayload = {
  titleId: "Test Laporan",
  titleEn: "Test Report",
  query: "SELECT * FROM test",
  isActive: true,
  allowedRoles: ["admin", "finance"],
  retentionType: "days",
  retentionDays: 30,
  filters: [
    { paramName: "start_date", labelId: "Tanggal Mulai", labelEn: "Start Date", type: "date", order: 1, required: true }
  ],
  columns: [
    { fieldName: "id", order: 1, dataType: "string", headerLabelId: "ID", headerLabelEn: "ID" }
  ],
  startRow: 1
};

const result = reportConfigCreateSchema.safeParse(testPayload);
console.log("Success:", result.success);
if (result.success) {
  console.log("filters:", JSON.stringify(result.data.filters));
  console.log("allowedRoles:", JSON.stringify(result.data.allowedRoles));
} else {
  console.log("Errors:", JSON.stringify(result.error.flatten()));
}
