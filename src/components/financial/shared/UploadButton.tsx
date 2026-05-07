// UploadButton.tsx — Split-button dropdown: Upload + History dialog
// Requirements: 3.1, 3.2, 3.3, 18.1-18.10

import React, { useState, useRef, useEffect } from 'react';
import { Upload, ChevronDown, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/financial/useAuth';
import { exportUploadI18n } from '../../../i18n/exportUpload';
import { commonsI18n } from '../../../i18n/commons';
import { UploadModal } from './UploadModal';
import { UploadHistoryView } from '../upload/UploadHistoryView';

// ── Entity type → permission mapping ────────────────────────────────────────
const ENTITY_PERMISSION_MAP: Record<string, { module: string; entity: string }> = {
  // Financial modules
  balance_sheet:                  { module: 'cfd', entity: 'balance_sheets' },
  income_statement:               { module: 'cfd', entity: 'income_statements' },
  income_statement_projection:    { module: 'public', entity: 'targets' },
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

export interface UploadButtonProps {
  /** Entity type key, e.g. "balance_sheet", "income_statement" */
  entityType: string;
  /** Called after a successful upload confirmation so the parent can refresh data */
  onUploadComplete: () => void;
  /** Externally controlled disabled state (e.g. while parent is loading) */
  disabled?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export const UploadButton: React.FC<UploadButtonProps> = ({
  entityType,
  onUploadComplete,
  disabled = false,
}) => {
  const { hasPermission, language } = useAuth();
  const t = exportUploadI18n[language];
  const common = commonsI18n[language];

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Permission check ──────────────────────────────────────────────────────
  const mapping = ENTITY_PERMISSION_MAP[entityType];
  if (!mapping) return null;

  const permissionKey = `${mapping.module}.${mapping.entity}.upload`;
  const canUpload = hasPermission(permissionKey);
  if (!canUpload) return null;

  // ── Close dropdown on outside click ──────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenUpload = () => {
    if (disabled) return;
    setIsDropdownOpen(false);
    setIsUploadModalOpen(true);
  };

  const handleOpenHistory = () => {
    setIsDropdownOpen(false);
    setIsHistoryModalOpen(true);
  };

  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
    onUploadComplete();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Split Button */}
      <div ref={dropdownRef} className="relative flex items-stretch">
        {/* Main upload button */}
        <button
          type="button"
          onClick={handleOpenUpload}
          disabled={disabled}
          title={t.upload.buttonTooltip}
          aria-label={t.upload.buttonTooltip}
          className="
            group flex items-center gap-2 px-3 py-2 text-sm font-bold text-white
            bg-emerald-500 hover:bg-emerald-600
            rounded-l-xl border border-emerald-500 hover:border-emerald-600
            transition-all duration-200
            hover:shadow-lg hover:shadow-emerald-200
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
            cursor-pointer
          "
        >
          <Upload
            size={15}
            className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110"
          />
          <span className="hidden sm:inline">{t.upload.buttonTooltip}</span>
        </button>

        {/* Chevron / dropdown trigger */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen((v) => !v)}
          disabled={disabled}
          aria-label="More upload options"
          className="
            flex items-center justify-center px-1.5 py-2
            text-white bg-emerald-500 hover:bg-emerald-600
            rounded-r-xl border-l border-emerald-400
            transition-all duration-200
            hover:shadow-lg hover:shadow-emerald-200
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
            cursor-pointer
          "
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="
                absolute top-full right-0 mt-1.5 z-50
                w-52 bg-white rounded-xl shadow-xl shadow-slate-200/60
                border border-slate-200/80 overflow-hidden
              "
            >
              <button
                type="button"
                onClick={handleOpenUpload}
                disabled={disabled}
                className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm font-bold text-slate-700
                  hover:bg-emerald-50 hover:text-emerald-700
                  transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                  cursor-pointer
                "
              >
                <Upload size={15} className="text-emerald-500" />
                {t.upload.buttonTooltip}
              </button>

              <div className="h-px bg-slate-100 mx-3" />

              <button
                type="button"
                onClick={handleOpenHistory}
                className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm font-bold text-slate-700
                  hover:bg-indigo-50 hover:text-indigo-700
                  transition-colors duration-150
                  cursor-pointer
                "
              >
                <History size={15} className="text-indigo-500" />
                {t.history.title}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <UploadModal
        entityType={entityType}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* History Dialog */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsHistoryModalOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] overflow-hidden flex flex-col"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <History size={18} className="text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-black text-slate-800">
                    {t.history.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  aria-label={common.close}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dialog Body — UploadHistoryView without its own title */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <UploadHistoryView entityType={entityType} hideTitle />
              </div>

              {/* Dialog Footer */}
              <div className="flex justify-end px-6 py-4 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                >
                  {common.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UploadButton;
