// SqlQueryEditor.tsx
// SQL query textarea with:
// - Table/column browser panel (fetched from information_schema)
// - Simple autocomplete dropdown (tables, columns, SQL keywords)
// - Click table/column to insert at cursor

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Database, ChevronRight, ChevronDown, Table2,
  Eye, Search, X, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbColumn {
  name: string;
  type: string;
  nullable: boolean;
}

interface DbTable {
  schema: string;
  name: string;
  type: 'table' | 'view';
  columns: DbColumn[];
}

interface SqlQueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  language: 'id' | 'en';
  /** Ref to the internal textarea for external cursor-based insertion */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

// ─── SQL Keywords for autocomplete ───────────────────────────────────────────

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ILIKE',
  'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'CROSS JOIN',
  'ON', 'AS', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'EXTRACT', 'DATE_TRUNC',
  'NOW', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'INTERVAL', 'BETWEEN',
  'IS NULL', 'IS NOT NULL', 'EXISTS', 'UNION', 'UNION ALL',
  'WITH', 'RETURNING', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK',
];

// ─── Component ────────────────────────────────────────────────────────────────

export const SqlQueryEditor: React.FC<SqlQueryEditorProps> = ({
  value,
  onChange,
  placeholder,
  hint,
  language,
  textareaRef: externalRef,
}) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;

  // ── Schema state ──────────────────────────────────────────────────────────
  const [tables, setTables] = useState<DbTable[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  // ── Autocomplete state ────────────────────────────────────────────────────
  const [acSuggestions, setAcSuggestions] = useState<string[]>([]);
  const [acIndex, setAcIndex] = useState(0);
  const [acWord, setAcWord] = useState('');
  const [acPos, setAcPos] = useState<{ top: number; left: number } | null>(null);
  const acRef = useRef<HTMLDivElement>(null);

  // ── Fetch schema ──────────────────────────────────────────────────────────
  const fetchSchema = useCallback(async () => {
    setIsLoadingSchema(true);
    setSchemaError(null);
    try {
      const res = await apiFetch('/api/frs/report-configs/schema');
      if (!res.ok) throw new Error('Failed to load schema');
      const data = await res.json();
      setTables(data.tables ?? []);
    } catch {
      setSchemaError(language === 'id' ? 'Gagal memuat skema database' : 'Failed to load database schema');
    } finally {
      setIsLoadingSchema(false);
    }
  }, [language]);

  useEffect(() => {
    if (showPanel && tables.length === 0 && !isLoadingSchema) {
      fetchSchema();
    }
  }, [showPanel, tables.length, isLoadingSchema, fetchSchema]);

  // ── Insert text at cursor ─────────────────────────────────────────────────
  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      onChange(value + text);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const newVal = value.substring(0, start) + text + value.substring(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [value, onChange]);

  // ── Replace current word with autocomplete suggestion ─────────────────────
  const applyAcSuggestion = useCallback((suggestion: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart ?? 0;
    const before = value.substring(0, cursor);
    const after = value.substring(cursor);
    // Find start of current word
    const wordStart = before.search(/[\w.]*$/);
    const newVal = value.substring(0, wordStart) + suggestion + after;
    onChange(newVal);
    setAcSuggestions([]);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = wordStart + suggestion.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [value, onChange]);

  // ── Autocomplete logic ────────────────────────────────────────────────────
  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't trigger on navigation/control keys
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(e.key)) return;

    const ta = e.currentTarget;
    const cursor = ta.selectionStart ?? 0;
    const before = value.substring(0, cursor);

    // Extract current word (allow dots for schema.table)
    const match = before.match(/[\w.]+$/);
    const word = match ? match[0] : '';

    if (word.length < 2) {
      setAcSuggestions([]);
      return;
    }

    setAcWord(word);

    const wordLower = word.toLowerCase();
    const suggestions: string[] = [];

    // Match SQL keywords
    SQL_KEYWORDS.forEach((kw) => {
      if (kw.toLowerCase().startsWith(wordLower)) suggestions.push(kw);
    });

    // Match schema.table or table names
    tables.forEach((t) => {
      const fullName = `${t.schema}.${t.name}`;
      const shortName = t.name;
      if (fullName.toLowerCase().startsWith(wordLower)) suggestions.push(fullName);
      else if (shortName.toLowerCase().startsWith(wordLower)) suggestions.push(shortName);

      // Match column names
      t.columns.forEach((col) => {
        if (col.name.toLowerCase().startsWith(wordLower)) {
          if (!suggestions.includes(col.name)) suggestions.push(col.name);
        }
      });
    });

    if (suggestions.length === 0) {
      setAcSuggestions([]);
      return;
    }

    setAcSuggestions(suggestions.slice(0, 12));
    setAcIndex(0);

    // Calculate dropdown position
    const rect = ta.getBoundingClientRect();
    // Approximate cursor position using line/char counts
    const lines = before.split('\n');
    const lineNum = lines.length - 1;
    const lineHeight = 21; // ~text-sm line height
    const charWidth = 8.4; // ~monospace char width
    const lastLine = lines[lineNum];
    setAcPos({
      top: rect.top + window.scrollY + (lineNum + 1) * lineHeight + 8,
      left: rect.left + window.scrollX + Math.min(lastLine.length * charWidth, rect.width - 200),
    });
  }, [value, tables]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (acSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAcIndex((i) => Math.min(i + 1, acSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAcIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      applyAcSuggestion(acSuggestions[acIndex]);
    } else if (e.key === 'Escape') {
      setAcSuggestions([]);
    }
  }, [acSuggestions, acIndex, applyAcSuggestion]);

  // Close autocomplete on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (acRef.current && !acRef.current.contains(e.target as Node)) {
        setAcSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Filtered tables ───────────────────────────────────────────────────────
  const filteredTables = tables.filter((t) => {
    const q = tableSearch.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.schema.toLowerCase().includes(q);
  });

  // Group by schema
  const schemaGroups = filteredTables.reduce<Record<string, DbTable[]>>((acc, t) => {
    if (!acc[t.schema]) acc[t.schema] = [];
    acc[t.schema].push(t);
    return acc;
  }, {});

  const toggleTable = (key: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const labels = {
    tables: language === 'id' ? 'Tabel & View' : 'Tables & Views',
    searchPlaceholder: language === 'id' ? 'Cari tabel...' : 'Search tables...',
    columns: language === 'id' ? 'kolom' : 'columns',
    clickToInsert: language === 'id' ? 'Klik untuk sisipkan' : 'Click to insert',
    noTables: language === 'id' ? 'Tidak ada tabel ditemukan' : 'No tables found',
    loadError: language === 'id' ? 'Gagal memuat' : 'Failed to load',
    retry: language === 'id' ? 'Coba lagi' : 'Retry',
    hidePanel: language === 'id' ? 'Sembunyikan' : 'Hide',
    showPanel: language === 'id' ? 'Tabel & Kolom' : 'Tables & Columns',
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowPanel((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border cursor-pointer',
            showPanel
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          )}
        >
          <Database size={13} />
          {showPanel ? labels.hidePanel : labels.showPanel}
        </button>
      </div>

      <div className={cn('flex gap-3', showPanel ? 'items-start' : '')}>
        {/* Table browser panel */}
        {showPanel && (
          <div className="w-64 shrink-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col max-h-[420px]">
            {/* Panel header */}
            <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Database size={11} />
                {labels.tables}
              </span>
              <button
                type="button"
                onClick={fetchSchema}
                disabled={isLoadingSchema}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title={labels.retry}
              >
                <RefreshCw size={11} className={isLoadingSchema ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Search */}
            <div className="px-2 py-1.5 border-b border-slate-700">
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder={labels.searchPlaceholder}
                  className="w-full pl-6 pr-6 py-1 bg-slate-800 border border-slate-600 rounded-md text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {tableSearch && (
                  <button
                    type="button"
                    onClick={() => setTableSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingSchema ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : schemaError ? (
                <div className="p-3 text-center">
                  <AlertCircle size={16} className="mx-auto text-red-400 mb-1" />
                  <p className="text-[10px] text-red-400">{schemaError}</p>
                  <button
                    type="button"
                    onClick={fetchSchema}
                    className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {labels.retry}
                  </button>
                </div>
              ) : Object.keys(schemaGroups).length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-6">{labels.noTables}</p>
              ) : (
                Object.entries(schemaGroups).map(([schema, schemaTables]) => (
                  <div key={schema}>
                    {/* Schema header */}
                    <div className="px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/50">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{schema}</span>
                    </div>
                    {schemaTables.map((table) => {
                      const key = `${table.schema}.${table.name}`;
                      const isExpanded = expandedTables.has(key);
                      return (
                        <div key={key}>
                          {/* Table row */}
                          <div className="flex items-center group">
                            <button
                              type="button"
                              onClick={() => toggleTable(key)}
                              className="flex items-center gap-1.5 flex-1 px-3 py-1.5 text-left hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              {isExpanded
                                ? <ChevronDown size={11} className="text-slate-500 shrink-0" />
                                : <ChevronRight size={11} className="text-slate-500 shrink-0" />
                              }
                              {table.type === 'view'
                                ? <Eye size={11} className="text-purple-400 shrink-0" />
                                : <Table2 size={11} className="text-indigo-400 shrink-0" />
                              }
                              <span className="text-[11px] text-slate-200 truncate">{table.name}</span>
                              <span className="text-[9px] text-slate-500 ml-auto shrink-0">
                                {table.columns.length}
                              </span>
                            </button>
                            {/* Click to insert table name */}
                            <button
                              type="button"
                              onClick={() => insertAtCursor(table.name)}
                              className="px-2 py-1.5 text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title={labels.clickToInsert}
                            >
                              <span className="text-[9px] font-mono">+</span>
                            </button>
                          </div>

                          {/* Columns */}
                          {isExpanded && (
                            <div className="border-l border-slate-700 ml-6">
                              {table.columns.map((col) => (
                                <button
                                  key={col.name}
                                  type="button"
                                  onClick={() => insertAtCursor(col.name)}
                                  className="w-full flex items-center gap-2 px-3 py-1 hover:bg-slate-800 transition-colors cursor-pointer text-left group/col"
                                  title={`${col.type}${col.nullable ? '' : ' NOT NULL'}`}
                                >
                                  <span className="text-[11px] text-slate-300 group-hover/col:text-indigo-300 truncate flex-1">
                                    {col.name}
                                  </span>
                                  <span className="text-[9px] text-slate-600 shrink-0 font-mono">
                                    {col.type.replace('character varying', 'varchar').replace('timestamp without time zone', 'timestamp')}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyUp={handleKeyUp}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setAcSuggestions([]), 150)}
            placeholder={placeholder}
            rows={14}
            spellCheck={false}
            className="w-full px-4 py-3 bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-sm font-mono resize-none leading-relaxed"
          />

          {/* Autocomplete dropdown */}
          {acSuggestions.length > 0 && acPos && (
            <div
              ref={acRef}
              style={{ position: 'fixed', top: acPos.top, left: acPos.left, zIndex: 9999 }}
              className="bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden min-w-[180px] max-w-[280px]"
            >
              {acSuggestions.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyAcSuggestion(s); }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer',
                    i === acIndex
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-200 hover:bg-slate-700'
                  )}
                >
                  {/* Highlight matching prefix */}
                  <span className="text-indigo-300">{s.substring(0, acWord.length)}</span>
                  <span>{s.substring(acWord.length)}</span>
                </button>
              ))}
              <div className="px-3 py-1 border-t border-slate-700 text-[9px] text-slate-500">
                ↑↓ navigate · Enter/Tab select · Esc close
              </div>
            </div>
          )}
        </div>
      </div>

      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
};
