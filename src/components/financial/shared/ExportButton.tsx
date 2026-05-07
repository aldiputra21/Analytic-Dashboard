// ExportButton.tsx — Icon-only export button for module toolbars
// Requirements: 1.1, 1.2, 1.3, 1.9, 1.10

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/financial/useAuth';
import { apiFetch } from '../../../services/financial/apiFetch';
import { exportUploadI18n } from '../../../i18n/exportUpload';

// ── Entity type → permission mapping ────────────────────────────────────────
// All 11 modules map to module="cfd" with their pluralised entity name.
const ENTITY_PERMISSION_MAP: Record<string, { module: string; entity: string }> = {
  // Financial modules
  balance_sheet:                  { module: 'cfd', entity: 'balance_sheets' },
  income_statement:               { module: 'cfd', entity: 'income_statements' },
  target:                         { module: 'public', entity: 'targets' },
  weekly_cash_flow:               { module: 'cfd', entity: 'weekly_cash_flows' },
  realization:                    { module: 'cfd', entity: 'realizations' },
  cash_flow_projection:           { module: 'cfd', entity: 'cash_flow_projections' },
  bank_loan:                      { module: 'cfd', entity: 'bank_loans' },
  // Master data modules
  corporate:                      { module: 'cfd', entity: 'corporates' },
  department:                     { module: 'public', entity: 'departments' },
  cost_center:                    { module: 'cfd', entity: 'cost_centers' },
  project:                        { module: 'public', entity: 'projects' },
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface ExportButtonProps {
  /** Entity type key, e.g. "balance_sheet", "income_statement" */
  entityType: string;
  /** Active filter context to pass to the export endpoint */
  filters?: Record<string, unknown>;
  /** Externally controlled disabled state (e.g. while parent is loading) */
  disabled?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export const ExportButton: React.FC<ExportButtonProps> = ({
  entityType,
  filters = {},
  disabled = false,
}) => {
  const { hasPermission, language } = useAuth();
  const t = exportUploadI18n[language];

  const [isLoading, setIsLoading] = useState(false);

  // ── Permission check (Req 1.2, 1.3) ──────────────────────────────────────
  const mapping = ENTITY_PERMISSION_MAP[entityType];
  if (!mapping) {
    // Unknown entity type — hide the button silently
    return null;
  }

  const permissionKey = `${mapping.module}.${mapping.entity}.read`;
  const canRead = hasPermission(permissionKey);

  // Requirement 1.3: hide when user lacks read permission
  if (!canRead) {
    return null;
  }

  // ── Export handler ────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        format: 'xlsx',
        lang: language,
        filters: JSON.stringify(filters),
      });

      const res = await apiFetch(
        `/api/frs/export/${entityType}?${params.toString()}`,
      );

      if (!res.ok) {
        // Requirement 1.10: show toast error on failure
        toast.error(t.export.error);
        return;
      }

      // Derive filename from Content-Disposition header, or fall back to a default
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
      const filename = filenameMatch
        ? filenameMatch[2]
        : `${entityType}_export.xlsx`;

      // Trigger browser file download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      // Requirement 1.10: show toast error on failure
      toast.error(t.export.error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // Requirement 1.1: icon-only button
  // Requirement 1.9: show loading spinner and disable during export
  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isLoading || disabled}
      title={t.export.buttonTooltip}
      aria-label={t.export.buttonTooltip}
      className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/50 bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
    </button>
  );
};

export default ExportButton;
