import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface IncomeStatementData {
  companyId: string;
  period: string;
  revenue: number;
  cogs: number;
  operationalExpenses: number;
  marketingSales: number;
  administrativeCosts: number;
  itTechnology: number;
  humanResources: number;
  maintenanceRepairs: number;
  miscellaneous: number;
  otherIncome: number;
  otherExpenses: number;
  tax: number;
}

interface Props {
  companyId: string;
  onSubmit: (data: IncomeStatementData) => Promise<void>;
  initialData?: Partial<IncomeStatementData>;
}

export default function IncomeStatementForm({ companyId, onSubmit, initialData }: Props) {
  const [formData, setFormData] = useState<IncomeStatementData>({
    companyId,
    period: new Date().toISOString().slice(0, 7),
    revenue: 0,
    cogs: 0,
    operationalExpenses: 0,
    marketingSales: 0,
    administrativeCosts: 0,
    itTechnology: 0,
    humanResources: 0,
    maintenanceRepairs: 0,
    miscellaneous: 0,
    otherIncome: 0,
    otherExpenses: 0,
    tax: 0,
    ...initialData
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate totals
  const grossProfit = formData.revenue - formData.cogs;
  const totalOperatingExpenses = 
    formData.operationalExpenses +
    formData.marketingSales +
    formData.administrativeCosts +
    formData.itTechnology +
    formData.humanResources +
    formData.maintenanceRepairs +
    formData.miscellaneous;
  const operatingProfit = grossProfit - totalOperatingExpenses;
  const profitBeforeTax = operatingProfit + formData.otherIncome - formData.otherExpenses;
  const netProfit = profitBeforeTax - formData.tax;

  const handleChange = (field: keyof IncomeStatementData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.revenue <= 0) {
      setError('Revenue must be greater than 0');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit income statement');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const InputField = ({ label, field }: { label: string; field: keyof IncomeStatementData }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={formData[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="0"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Period Selection */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Period</h3>
        <input
          type="month"
          value={formData.period}
          onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Revenue & COGS */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">💵</span>
          Revenue & Cost of Goods Sold
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <InputField label="Revenue (Pendapatan)" field="revenue" />
          <InputField label="COGS (Harga Pokok Penjualan)" field="cogs" />
        </div>

        <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
          <p className="text-lg font-bold text-white">Gross Profit: {formatRupiah(grossProfit)}</p>
          <p className="text-sm text-green-100">Margin: {formData.revenue > 0 ? ((grossProfit / formData.revenue) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>

      {/* Operating Expenses */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Operating Expenses (Biaya Operasional)
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">7 Cost Control Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="1. Operational Expenses" field="operationalExpenses" />
              <InputField label="2. Marketing & Sales" field="marketingSales" />
              <InputField label="3. Administrative Costs" field="administrativeCosts" />
              <InputField label="4. IT & Technology" field="itTechnology" />
              <InputField label="5. Human Resources" field="humanResources" />
              <InputField label="6. Maintenance & Repairs" field="maintenanceRepairs" />
              <InputField label="7. Miscellaneous" field="miscellaneous" />
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm font-semibold text-orange-900">Total Operating Expenses: {formatRupiah(totalOperatingExpenses)}</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
          <p className="text-lg font-bold text-white">Operating Profit: {formatRupiah(operatingProfit)}</p>
        </div>
      </div>

      {/* Other Income/Expenses */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">💰</span>
          Other Income & Expenses
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Other Income (Pendapatan Lain)" field="otherIncome" />
          <InputField label="Other Expenses (Biaya Lain)" field="otherExpenses" />
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
          <p className="text-lg font-bold text-white">Profit Before Tax: {formatRupiah(profitBeforeTax)}</p>
        </div>
      </div>

      {/* Tax */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          Tax (Pajak)
        </h3>

        <InputField label="Tax Amount" field="tax" />

        <div className={`mt-4 p-6 rounded-xl ${netProfit >= 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-pink-600'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white opacity-90 mb-1">NET PROFIT (Laba Bersih)</p>
              <p className="text-3xl font-bold text-white">{formatRupiah(netProfit)}</p>
              {formData.revenue > 0 && (
                <p className="text-sm text-white opacity-90 mt-1">
                  Net Profit Margin: {((netProfit / formData.revenue) * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <TrendingUp className={`w-12 h-12 text-white ${netProfit < 0 ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl p-6 shadow-lg text-white">
        <h3 className="text-lg font-bold mb-4">Income Statement Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Revenue:</span>
            <span className="font-semibold">{formatRupiah(formData.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span>Gross Profit:</span>
            <span className="font-semibold">{formatRupiah(grossProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span>Operating Profit:</span>
            <span className="font-semibold">{formatRupiah(operatingProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span>Profit Before Tax:</span>
            <span className="font-semibold">{formatRupiah(profitBeforeTax)}</span>
          </div>
          <div className="flex justify-between border-t border-white/30 pt-2 mt-2">
            <span className="font-bold">Net Profit:</span>
            <span className="font-bold">{formatRupiah(netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border-2 border-green-500 rounded-lg p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700">Income statement submitted successfully!</p>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
          !submitting
            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-xl'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          {submitting ? 'Submitting...' : 'Submit Income Statement'}
        </div>
      </motion.button>
    </form>
  );
}
