// Export Service - CSV, Excel, PDF
// Requirements: 10.1, 10.3, 10.4, 10.8

import * as XLSX from 'xlsx';

export interface ExportMetadata {
  exportDate: string;
  periodRange: string;
  exportedBy: string;
}

const RATIO_HEADERS = [
  'Subsidiary',
  'Period Type',
  'Period Start',
  'Period End',
  'ROA (%)',
  'ROE (%)',
  'NPM (%)',
  'DER',
  'Current Ratio',
  'Quick Ratio',
  'Cash Ratio',
  'OCF Ratio',
  'DSCR',
  'Health Score',
];

function formatValue(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'N/A';
  return v.toFixed(2);
}

function rowToArray(row: any): (string | number)[] {
  return [
    row.subsidiary_name ?? row.subsidiaryName ?? '',
    row.period_type ?? row.periodType ?? '',
    row.period_start_date ?? row.periodStartDate ?? '',
    row.period_end_date ?? row.periodEndDate ?? '',
    formatValue(row.roa),
    formatValue(row.roe),
    formatValue(row.npm),
    formatValue(row.der),
    formatValue(row.current_ratio ?? row.currentRatio),
    formatValue(row.quick_ratio ?? row.quickRatio),
    formatValue(row.cash_ratio ?? row.cashRatio),
    formatValue(row.ocf_ratio ?? row.ocfRatio),
    formatValue(row.dscr),
    formatValue(row.health_score ?? row.healthScore),
  ];
}

/**
 * Exports ratio data to CSV format with metadata header.
 * Requirements: 10.1, 10.4
 */
export function exportToCSV(rows: any[], metadata: ExportMetadata): string {
  const lines: string[] = [];

  // Metadata header (Req 10.4)
  lines.push(`# Export Date: ${metadata.exportDate}`);
  lines.push(`# Period Range: ${metadata.periodRange}`);
  lines.push(`# Exported By: ${metadata.exportedBy}`);
  lines.push('');

  // Column headers
  lines.push(RATIO_HEADERS.join(','));

  // Data rows
  for (const row of rows) {
    const values = rowToArray(row).map((v) => {
      const s = String(v);
      // Escape commas and quotes
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Exports ratio data to Excel format with metadata sheet.
 * Requirements: 10.1, 10.4
 */
export function exportToExcel(rows: any[], metadata: ExportMetadata): Buffer {
  const wb = XLSX.utils.book_new();

  // Metadata sheet (Req 10.4)
  const metaData = [
    ['Export Date', metadata.exportDate],
    ['Period Range', metadata.periodRange],
    ['Exported By', metadata.exportedBy],
  ];
  const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
  XLSX.utils.book_append_sheet(wb, metaSheet, 'Metadata');

  // Data sheet
  const dataRows = [RATIO_HEADERS, ...rows.map(rowToArray)];
  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);

  // Auto-width columns
  const colWidths = RATIO_HEADERS.map((h) => ({ wch: Math.max(h.length, 12) }));
  dataSheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, dataSheet, 'Financial Ratios');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

/**
 * Exports ratio data to PDF format with company branding.
 * Requirements: 10.3, 10.4
 */
export async function exportToPDF(rows: any[], metadata: ExportMetadata): Promise<Buffer> {
  // Dynamic import to avoid issues in non-browser environments
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header / branding
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Ratio Monitoring System', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Consolidated Financial Ratios Report', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Metadata (Req 10.4)
  doc.setFontSize(8);
  doc.text(`Export Date: ${metadata.exportDate}`, 14, y);
  doc.text(`Period: ${metadata.periodRange}`, 14, y + 5);
  doc.text(`Exported By: ${metadata.exportedBy}`, 14, y + 10);
  y += 18;

  // Table headers
  const colWidths = [35, 18, 20, 20, 14, 14, 14, 14, 18, 18, 18, 18, 14, 18];
  const shortHeaders = [
    'Subsidiary', 'Period', 'Start', 'End',
    'ROA%', 'ROE%', 'NPM%', 'DER',
    'Curr.R', 'Quick.R', 'Cash.R', 'OCF.R', 'DSCR', 'Health',
  ];

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(63, 81, 181);
  doc.setTextColor(255, 255, 255);

  let x = 14;
  doc.rect(x, y - 4, colWidths.reduce((a, b) => a + b, 0), 6, 'F');
  for (let i = 0; i < shortHeaders.length; i++) {
    doc.text(shortHeaders[i], x + 1, y, { maxWidth: colWidths[i] - 2 });
    x += colWidths[i];
  }
  y += 4;

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  for (let ri = 0; ri < rows.length; ri++) {
    if (y > 185) {
      doc.addPage();
      y = 15;
    }

    const values = rowToArray(rows[ri]);
    x = 14;

    if (ri % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(x, y - 3, colWidths.reduce((a, b) => a + b, 0), 5, 'F');
    }

    for (let ci = 0; ci < values.length; ci++) {
      doc.text(String(values[ci]), x + 1, y, { maxWidth: colWidths[ci] - 2 });
      x += colWidths[ci];
    }
    y += 5;
  }

  // Footer
  const pageCount = (doc.internal as any).getNumberOfPages?.() ?? 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated: ${metadata.exportDate}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  return Buffer.from(doc.output('arraybuffer'));
}
