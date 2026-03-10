import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, AlertCircle, CheckCircle2, Calculator } from 'lucide-react';

interface BalanceSheetData {
  companyId: string;
  period: string;
  // Current Assets
  kas: number;
  piutang: number;
  persediaan: number;
  currentAssetsLainLain: number;
  // Fixed Assets
  tanahBangunan: number;
  mesinPeralatan: number;
  kendaraan: number;
  akumulasiPenyusutan: number;
  // Other Assets
  otherAssets: number;
  // Current Liabilities
  hutangUsaha: number;
  hutangBank: number;
  currentLiabilitiesLainLain: number;
  // Long Term Liabilities
  hutangJangkaPanjang: number;
  // Equity
  modal: number;
  labaDitahan: number;
  deviden: number;
}

interface Props {
  companyId: string;
  onSubmit: (data: BalanceSheetData) => Promise<void>;
  initialData?: Partial<BalanceSheetData>;
}

export default function BalanceSheetForm({ companyId, onSubmit, initialData }: Props) {
  const [formData, setFormData] = useState<BalanceSheetData>({
    companyId,
    period: new Date().toISOString().slice(0, 7),
    kas: 0,
    piutang: 0,
    persediaan: 0,
    currentAssetsLainLain: 0,
    tanahBangunan: 0,
    mesinPeralatan: 0,
    kendaraan: 0,
    akumulasiPenyusutan: 0,
    otherAssets: 0,
    hutangUsaha: 0,
    hutangBank: 0,
    currentLiabilitiesLainLain: 0,
    hutangJangkaPanjang: 0,
    modal: 0,
    labaDitahan: 0,
    deviden: 0,
    ...initialData
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate totals
  const currentAssets = formData.kas + formData.piutang + formData.persediaan + formData.currentAssetsLainLain;
  const fixedAssets = formData.tanahBangunan + formData.mesinPeralatan + formData.kendaraan - formData.akumulasiPenyusutan;
  const totalAssets = currentAssets + fixedAssets + formData.otherAssets;

  const currentLiabilities = formData.hutangUsaha + formData.hutangBank + formData.currentLiabilitiesLainLain;
  const totalLiabilities = currentLiabilities + formData.hutangJangkaPanjang;
  const totalEquity = formData.modal + formData.labaDitahan + formData.deviden;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const difference = totalAssets - totalLiabilitiesAndEquity;
  const tolerance = totalAssets * 0.0001;
  const isBalanced = Math.abs(difference) <= tolerance;

  const handleChange = (field: keyof BalanceSheetData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBalanced) {
      setError('Balance sheet equation does not balance. Please check your entries.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit balance sheet');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const InputField = ({ label, field, section }: { label: string; field: keyof BalanceSheetData; section: string }) => (
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

      {/* Assets Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">💰</span>
          ASSETS (ASET)
        </h3>

        {/* Current Assets */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 bg-blue-50 px-3 py-2 rounded">Current Assets (Aset Lancar)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Kas" field="kas" section="assets" />
            <InputField label="Piutang" field="piutang" section="assets" />
            <InputField label="Persediaan" field="persediaan" section="assets" />
            <InputField label="Lain-lain" field="currentAssetsLainLain" section="assets" />
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">Subtotal: {formatRupiah(currentAssets)}</p>
          </div>
        </div>

        {/* Fixed Assets */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 bg-green-50 px-3 py-2 rounded">Fixed Assets (Aset Tetap)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Tanah & Bangunan" field="tanahBangunan" section="assets" />
            <InputField label="Mesin & Peralatan" field="mesinPeralatan" section="assets" />
            <InputField label="Kendaraan" field="kendaraan" section="assets" />
            <InputField label="Akumulasi Penyusutan" field="akumulasiPenyusutan" section="assets" />
          </div>
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Subtotal: {formatRupiah(fixedAssets)}</p>
          </div>
        </div>

        {/* Other Assets */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-3 bg-purple-50 px-3 py-2 rounded">Other Assets (Aset Lain-lain)</h4>
          <InputField label="Other Assets" field="otherAssets" section="assets" />
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
          <p className="text-lg font-bold text-white">TOTAL ASSETS: {formatRupiah(totalAssets)}</p>
        </div>
      </div>

      {/* Liabilities Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          LIABILITIES (KEWAJIBAN)
        </h3>

        {/* Current Liabilities */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 bg-orange-50 px-3 py-2 rounded">Current Liabilities (Kewajiban Jangka Pendek)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Hutang Usaha" field="hutangUsaha" section="liabilities" />
            <InputField label="Hutang Bank" field="hutangBank" section="liabilities" />
            <InputField label="Lain-lain" field="currentLiabilitiesLainLain" section="liabilities" />
          </div>
          <div className="mt-3 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm font-semibold text-orange-900">Subtotal: {formatRupiah(currentLiabilities)}</p>
          </div>
        </div>

        {/* Long Term Liabilities */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-3 bg-red-50 px-3 py-2 rounded">Long Term Liabilities (Kewajiban Jangka Panjang)</h4>
          <InputField label="Hutang Jangka Panjang" field="hutangJangkaPanjang" section="liabilities" />
        </div>

        <div className="p-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg">
          <p className="text-lg font-bold text-white">TOTAL LIABILITIES: {formatRupiah(totalLiabilities)}</p>
        </div>
      </div>

      {/* Equity Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">💼</span>
          EQUITY (EKUITAS)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <InputField label="Modal" field="modal" section="equity" />
          <InputField label="Laba Ditahan" field="labaDitahan" section="equity" />
          <InputField label="Deviden" field="deviden" section="equity" />
        </div>

        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
          <p className="text-lg font-bold text-white">TOTAL EQUITY: {formatRupiah(totalEquity)}</p>
        </div>
      </div>

      {/* Balance Check */}
      <div className={`rounded-xl p-6 shadow-lg ${isBalanced ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Calculator className={`w-6 h-6 ${isBalanced ? 'text-green-600' : 'text-red-600'}`} />
          <h3 className="text-lg font-bold text-gray-900">Balance Check</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Total Assets:</span>
            <span className="font-semibold">{formatRupiah(totalAssets)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Total Liabilities + Equity:</span>
            <span className="font-semibold">{formatRupiah(totalLiabilitiesAndEquity)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-gray-300 pt-2">
            <span className="text-gray-700 font-bold">Difference:</span>
            <span className={`font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(Math.abs(difference))}
            </span>
          </div>
        </div>

        {isBalanced ? (
          <div className="mt-4 flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Balance sheet is balanced! ✓</span>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Balance sheet is not balanced. Please adjust your entries.</span>
          </div>
        )}
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
          <p className="text-green-700">Balance sheet submitted successfully!</p>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={!isBalanced || submitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
          isBalanced && !submitting
            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-xl'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          {submitting ? 'Submitting...' : 'Submit Balance Sheet'}
        </div>
      </motion.button>
    </form>
  );
}
