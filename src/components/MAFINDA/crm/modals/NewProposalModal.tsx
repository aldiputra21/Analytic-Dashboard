import React, { useState } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../financial/useAuth';
import { commonsI18n } from '../../../../i18n/commons';
import { crmI18n } from '../../../../i18n/crm';

interface Props { onClose: () => void; }

const OPPORTUNITIES = [
  'OPP-003 — Oil & Gas Equipment Supply - TotalEnergies Mahakam',
  'OPP-008 — Subsea Pipeline Repair - Pertamina Hulu Mahakam',
  'OPP-001 — EPC Pipeline Installation - Pertamina EP Cepu',
  'OPP-004 — Pipeline Inspection & Integrity - Medco E&P',
];
const TEMPLATES = ['Technical Proposal - EPC', 'Technical Proposal - Maintenance', 'Commercial Quotation', 'Feasibility Study', 'Custom'];
const SUBMISSION_METHODS = ['Email', 'Portal e-Procurement', 'Hard Copy', 'Courier', 'Hand Delivery'];

export function NewProposalModal({ onClose }: Props) {
  const { language } = useAuth();
  const t = commonsI18n[language];
  const tc = crmI18n[language];
  const [form, setForm] = useState({
    opportunityId: '', title: '', version: 'v1.0', template: '',
    submissionDeadline: '', submissionMethod: 'Email',
    proposalValue: '', marginPct: '', currency: 'IDR',
    technicalApproach: '', executiveSummary: '',
    evaluationCriteria: ['Technical Compliance', 'Commercial', 'HSE Track Record', 'Local Content (TKDN)'],
    newCriteria: '',
    keyDifferentiators: [''] as string[],
    riskItems: [''] as string[],
    presentationDate: '',
    internalReviewer: '',
    notes: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addListItem = (key: 'keyDifferentiators' | 'riskItems') =>
    set(key, [...form[key], '']);
  const updateListItem = (key: 'keyDifferentiators' | 'riskItems', i: number, v: string) =>
    set(key, form[key].map((x, j) => j === i ? v : x));
  const removeListItem = (key: 'keyDifferentiators' | 'riskItems', i: number) =>
    set(key, form[key].filter((_, j) => j !== i));

  const addCriteria = () => {
    if (form.newCriteria.trim()) {
      set('evaluationCriteria', [...form.evaluationCriteria, form.newCriteria.trim()]);
      set('newCriteria', '');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <div>
            <h2 className="text-base font-bold text-gray-900">{tc.modals.proposal.createTitle}</h2>
            <p className="text-xs text-gray-500">{tc.modals.proposal.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{tc.modals.proposal.basicInfo}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.opportunity} <span className="text-red-500">*</span></label>
                <select value={form.opportunityId} onChange={e => set('opportunityId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{language === 'id' ? 'Pilih opportunity...' : 'Select opportunity...'}</option>
                  {OPPORTUNITIES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.title} <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Technical & Commercial Proposal - EPC Pipeline Installation" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.version}</label>
                <input value={form.version} onChange={e => set('version', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="v1.0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.template}</label>
                <select value={form.template} onChange={e => set('template', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{language === 'id' ? 'Pilih template...' : 'Select template...'}</option>
                  {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.deadline} <span className="text-red-500">*</span></label>
                <input type="date" value={form.submissionDeadline} onChange={e => set('submissionDeadline', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.method}</label>
                <select value={form.submissionMethod} onChange={e => set('submissionMethod', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                   {SUBMISSION_METHODS.map(m => (
                    <option key={m} value={m}>
                      {language === 'id' 
                        ? (m === 'Email' ? 'Email' : m === 'Portal e-Procurement' ? 'Portal e-Procurement' : m === 'Hard Copy' ? 'Hard Copy' : m === 'Courier' ? 'Kurir' : 'Antar Langsung')
                        : m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Commercial */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{tc.modals.proposal.commercialSection}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.value} <span className="text-red-500">*</span></label>
                <input value={form.proposalValue} onChange={e => set('proposalValue', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 15700000000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.margin}</label>
                <input type="number" min={0} max={100} value={form.marginPct} onChange={e => set('marginPct', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 18.5" />
              </div>
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{tc.modals.proposal.criteriaSection}</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.evaluationCriteria.map((c, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {c}
                  <button onClick={() => set('evaluationCriteria', form.evaluationCriteria.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={form.newCriteria} onChange={e => set('newCriteria', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={language === 'id' ? 'Tambah kriteria evaluasi...' : 'Add evaluation criteria...'} />
              <button onClick={addCriteria} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">+ {t.add}</button>
            </div>
          </div>

          {/* Key Differentiators */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{tc.modals.proposal.diffSection}</h3>
              <button onClick={() => addListItem('keyDifferentiators')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />{t.add}
              </button>
            </div>
            <div className="space-y-2">
              {form.keyDifferentiators.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-green-500 mt-2.5 text-sm">✓</span>
                  <input value={d} onChange={e => updateListItem('keyDifferentiators', i, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Sertifikasi API lengkap" />
                  {form.keyDifferentiators.length > 1 && (
                    <button onClick={() => removeListItem('keyDifferentiators', i)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{tc.modals.proposal.riskSection}</h3>
              <button onClick={() => addListItem('riskItems')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />{t.add}
              </button>
            </div>
            <div className="space-y-2">
              {form.riskItems.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-amber-500 mt-2.5 text-sm">⚠</span>
                  <input value={r} onChange={e => updateListItem('riskItems', i, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Fluktuasi kurs USD/IDR" />
                  {form.riskItems.length > 1 && (
                    <button onClick={() => removeListItem('riskItems', i)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Presentation & Reviewer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.presentation}</label>
              <input type="date" value={form.presentationDate} onChange={e => set('presentationDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.reviewer}</label>
              <input value={form.internalReviewer} onChange={e => set('internalReviewer', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama reviewer internal" />
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.proposal.summary}</label>
            <textarea value={form.executiveSummary} onChange={e => set('executiveSummary', e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={language === 'id' ? 'Ringkasan eksekutif proposal...' : 'Executive summary of the proposal...'} />
          </div>

          {/* Upload */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{tc.modals.proposal.upload}</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{language === 'id' ? 'Drag & drop atau klik untuk upload' : 'Drag & drop or click to upload'}</p>
              <p className="text-xs text-gray-400 mt-1">{language === 'id' ? 'PDF, DOCX, XLSX — maks 50MB per file' : 'PDF, DOCX, XLSX — max 50MB per file'}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600">{tc.modals.proposal.saveDraft}</button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">{t.cancel}</button>
            <button onClick={onClose} className="px-6 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700">✓ {tc.modals.proposal.save}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
