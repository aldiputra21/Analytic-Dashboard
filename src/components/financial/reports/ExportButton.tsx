// ExportButton.tsx - Export with format selection (CSV, Excel, PDF, PNG)
// Requirements: 10.2

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, Image, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'png';

interface ExportOption {
  format: ExportFormat;
  label: string;
  icon: React.ElementType;
  description: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { format: 'csv', label: 'CSV', icon: Table, description: 'Comma-separated values' },
  { format: 'excel', label: 'Excel', icon: Table, description: 'Microsoft Excel (.xlsx)' },
  { format: 'pdf', label: 'PDF', icon: FileText, description: 'PDF with branding' },
  { format: 'png', label: 'PNG', icon: Image, description: 'Dashboard screenshot' },
];

interface ExportButtonProps {
  subsidiaryId?: string;
  periodType?: string;
  startDate?: string;
  endDate?: string;
  chartRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  subsidiaryId,
  periodType,
  startDate,
  endDate,
  chartRef,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setIsOpen(false);
    setIsExporting(true);
    setExportingFormat(format);

    try {
      if (format === 'png') {
        // PNG export: use html2canvas if available, otherwise show message
        if (chartRef?.current) {
          try {
            const { default: html2canvas } = await import('html2canvas' as any);
            const canvas = await html2canvas(chartRef.current);
            const link = document.createElement('a');
            link.download = `dashboard-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          } catch {
            alert('PNG export requires html2canvas. Please use another format.');
          }
        } else {
          alert('No chart element available for PNG export.');
        }
        return;
      }

      const token = localStorage.getItem('frs_token');
      const params = new URLSearchParams({ format });
      if (subsidiaryId) params.set('subsidiaryId', subsidiaryId);
      if (periodType) params.set('periodType', periodType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/frs/reports/export?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Export failed' } }));
        throw new Error(err.error?.message ?? 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const ext = format === 'excel' ? 'xlsx' : format;
      link.download = `financial-ratios-${Date.now()}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled || isExporting}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors',
          'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isExporting ? (
          <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {isExporting ? `Exporting ${exportingFormat?.toUpperCase()}...` : 'Export'}
        {!isExporting && <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {EXPORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{option.label}</p>
                  <p className="text-[10px] text-slate-400">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
