import React, { useState, useEffect } from 'react';
import { Search, Plus, Building2, Users, ChevronRight } from 'lucide-react';

interface CustomerSummary {
  id: string;
  companyName: string;
  industry: string;
  address?: string;
  npwp?: string;
  status: 'Active' | 'Inactive';
  picCount: number;
  createdAt: string;
}

interface CustomerListProps {
  onSelect?: (customerId: string) => void;
  onCreateNew?: () => void;
}

export function CustomerList({ onSelect, onCreateNew }: CustomerListProps) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const res = await fetch(`/api/crm/customers?${params}`, {
        headers: { 'X-User-Id': '1' },
      });
      if (!res.ok) throw new Error('Gagal memuat data pelanggan');
      const data = await res.json();
      setCustomers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Daftar Pelanggan</h3>
        </div>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Pelanggan
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama perusahaan atau industri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-slate-100">
        {loading && (
          <div className="px-6 py-8 text-center text-sm text-slate-500">Memuat...</div>
        )}
        {error && (
          <div className="px-6 py-4 text-sm text-red-600 bg-red-50">{error}</div>
        )}
        {!loading && !error && customers.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            {search ? 'Tidak ada pelanggan yang cocok' : 'Belum ada pelanggan'}
          </div>
        )}
        {!loading &&
          customers.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">{c.companyName}</p>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      c.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-500">{c.industry}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3 h-3" />
                    {c.picCount} PIC
                  </span>
                  {c.npwp && (
                    <span className="text-xs text-slate-400">NPWP: {c.npwp}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
      </div>
    </div>
  );
}
