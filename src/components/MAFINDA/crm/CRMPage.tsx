import React, { useState } from 'react';
import { CustomerList } from './CustomerList';
import { CustomerProfileForm } from './CustomerProfileForm';
import { PipelineKanbanBoard } from './PipelineKanbanBoard';
import { PipelineFunnelChart } from './PipelineFunnelChart';
import { Users, Kanban, BarChart2, Plus, ArrowLeft } from 'lucide-react';
import type { CreateCustomerInput } from '../../../types/crm';

type Tab = 'customers' | 'pipeline' | 'funnel';

export const CRMPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'customers', label: 'Pelanggan', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: Kanban },
    { id: 'funnel', label: 'Funnel', icon: BarChart2 },
  ];

  const handleBack = () => {
    setShowCreateCustomer(false);
  };

  const handleCreateCustomer = async (_data: CreateCustomerInput) => {
    // CustomerProfileForm handles the API call internally; just close on success
    setShowCreateCustomer(false);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowCreateCustomer(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'customers' && (
        <div>
          {showCreateCustomer ? (
            <div>
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke daftar
              </button>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Tambah Pelanggan Baru</h2>
                <CustomerProfileForm
                  onSubmit={handleCreateCustomer}
                  onCancel={handleBack}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Daftar Pelanggan</h2>
                <button
                  onClick={() => setShowCreateCustomer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Pelanggan
                </button>
              </div>
              <div className="p-4">
                <CustomerList
                  onSelect={() => {}}
                  onCreateNew={() => setShowCreateCustomer(true)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Pipeline Peluang</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            <PipelineKanbanBoard
              columns={[]}
              onStageChange={async () => {}}
            />
          </div>
        </div>
      )}

      {activeTab === 'funnel' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Funnel Penjualan</h2>
          </div>
          <div className="p-4">
            <PipelineFunnelChart data={[]} />
          </div>
        </div>
      )}
    </div>
  );
};
