import React, { useState } from 'react';
import { X, Plus, Trash2, Building2, User, DollarSign, Calendar, Target, Tag } from 'lucide-react';
import { useAuth } from '../../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../../i18n/commons';
import { crmI18n } from '../../../../i18n/crm';

type Stage = 'Lead' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Contract';

interface Props { onClose: () => void; }

const CUSTOMERS = [
  'PT Pertamina (Persero)', 'PT Pertamina EP', 'Pertamina RU IV Cilacap',
  'PT Pertamina Hulu Energi', 'PT Pertamina Hulu Mahakam', 'PT Medco Energi Internasional',
  'PT Medco E&P Natuna', 'Chevron Pacific Indonesia', 'TotalEnergies EP Indonesie',
  'PT Rekayasa Industri', 'PT Tripatra Engineers', 'ExxonMobil Indonesia',
];
const OWNERS = ['Budi Santoso', 'Siti Rahma', 'Ahmad Hidayat', 'Dewi Lestari', 'Rudi Hartono'];
const CATEGORIES = ['EPC', 'Maintenance', 'Supply', 'Inspection', 'Offshore Services', 'Subsea', 'Turnaround', 'Consulting'];
const INDUSTRIES = ['Oil & Gas', 'Refinery', 'Petrochemical', 'Mining', 'Power Plant'];
const LEAD_SOURCES = ['Referral', 'Tender Announcement - BPMIGAS', 'Direct Approach', 'Exhibition/Conference', 'Existing Customer', 'Website', 'Cold Call'];

export function NewOpportunityModal({ onClose }: Props) {
  const { language } = useAuth();
  const t = commonsI18n[language];
  const tc = crmI18n[language];
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Basic
    title: '', customer: '', customerContact: '', contactPhone: '', contactEmail: '',
    stage: 'Lead' as Stage, priority: 'Medium', owner: '', expectedCloseDate: '',
    projectCategory: '', industry: 'Oil & Gas', location: '', tags: [] as string[], tagInput: '',
    // Value
    value: '', probability: 20,
    // Lead specific
    leadSource: '', referredBy: '', initialContactDate: '', projectType: '',
    estimatedBudget: '', decisionTimeline: '', painPoints: '', nextFollowUp: '', leadTemperature: 'Cold',
    // Description
    description: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      set('tags', [...form.tags, form.tagInput.trim()]);
      set('tagInput', '');
    }
  };

  const STAGE_PROB: Record<Stage, number> = { Lead: 20, Qualification: 40, Proposal: 60, Negotiation: 80, Contract: 95 };

  const handleStageChange = (s: Stage) => {
    set('stage', s);
    set('probability', STAGE_PROB[s]);
  };

  const steps = [tc.modals.opportunity.basicInfo, tc.modals.opportunity.dealDetails, tc.modals.opportunity.leadInfo];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-base font-bold text-gray-900">{tc.modals.opportunity.createTitle}</h2>
            <p className="text-xs text-gray-500">{tc.modals.opportunity.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-1">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i + 1)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${step === i + 1 ? 'bg-blue-600 text-white' : step > i + 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.titleLabel} <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. EPC Pipeline Installation - PT Pertamina EP" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.customerLabel} <span className="text-red-500">*</span></label>
                  <select value={form.customer} onChange={e => set('customer', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{language === 'id' ? 'Pilih customer...' : 'Select customer...'}</option>
                    {CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.contactLabel}</label>
                  <input value={form.customerContact} onChange={e => set('customerContact', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={language === 'id' ? 'Nama contact person' : 'Contact person name'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.phoneLabel}</label>
                  <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+62 21 ..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.emailLabel}</label>
                  <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@company.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.categoryLabel}</label>
                  <select value={form.projectCategory} onChange={e => set('projectCategory', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{language === 'id' ? 'Pilih kategori...' : 'Select category...'}</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.industryLabel}</label>
                  <select value={form.industry} onChange={e => set('industry', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.locationLabel}</label>
                <input value={form.location} onChange={e => set('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Cepu, Jawa Tengah" />
              </div>
              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.tagsLabel}</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {form.tags.map((t, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {t}<button onClick={() => set('tags', form.tags.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={form.tagInput} onChange={e => set('tagInput', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={tc.modals.opportunity.tagPlaceholder} />
                  <button onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">+ Add</button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stage <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(['Lead','Qualification','Proposal','Negotiation','Contract'] as Stage[]).map(s => (
                      <button key={s} onClick={() => handleStageChange(s)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 text-left transition-colors ${form.stage === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        {language === 'id' 
                          ? (s === 'Lead' ? 'Lead' : s === 'Qualification' ? 'Kualifikasi' : s === 'Proposal' ? 'Proposal' : s === 'Negotiation' ? 'Negosiasi' : 'Kontrak')
                          : s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.priorityLabel}</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Low','Medium','High','Critical'].map(p => (
                        <button key={p} onClick={() => set('priority', p)}
                          className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-colors ${form.priority === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                          {language === 'id' 
                            ? (p === 'Low' ? 'Rendah' : p === 'Medium' ? 'Menengah' : p === 'High' ? 'Tinggi' : 'Kritis')
                            : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.ownerLabel} <span className="text-red-500">*</span></label>
                    <select value={form.owner} onChange={e => set('owner', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">{language === 'id' ? 'Pilih owner...' : 'Select owner...'}</option>
                      {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.expectedCloseLabel}</label>
                    <input type="date" value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.valueLabel}</label>
                  <input value={form.value} onChange={e => set('value', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 12500000000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.probLabel}: {form.probability}%</label>
                  <input type="range" min={0} max={100} step={5} value={form.probability}
                    onChange={e => set('probability', Number(e.target.value))}
                    className="w-full accent-blue-600 mt-2" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.descLabel}</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={language === 'id' ? 'Deskripsi singkat opportunity...' : 'Brief description of the opportunity...'} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                {language === 'id' 
                  ? 'Isi informasi lead untuk membantu analisis dan scoring opportunity ini.' 
                  : 'Fill in lead information to help analyze and score this opportunity.'}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.sourceLabel}</label>
                  <select value={form.leadSource} onChange={e => set('leadSource', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{language === 'id' ? 'Pilih sumber...' : 'Select source...'}</option>
                    {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.tempLabel}</label>
                  <div className="flex gap-2">
                    {['Cold','Warm','Hot'].map(t => (
                      <button key={t} onClick={() => set('leadTemperature', t)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-colors ${form.leadTemperature === t ? (t === 'Cold' ? 'border-blue-500 bg-blue-50 text-blue-700' : t === 'Warm' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-gray-200 hover:border-gray-300'}`}>
                        {language === 'id' ? (t === 'Cold' ? 'Dingin' : t === 'Warm' ? 'Hangat' : 'Panas') : t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.referredLabel}</label>
                  <input value={form.referredBy} onChange={e => set('referredBy', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={language === 'id' ? 'Nama referral (jika ada)' : 'Referral name (if any)'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.contactDateLabel}</label>
                  <input type="date" value={form.initialContactDate} onChange={e => set('initialContactDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.typeLabel}</label>
                  <input value={form.projectType} onChange={e => set('projectType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. EPC Pipeline 24 inch x 45 km" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.budgetLabel}</label>
                  <input value={form.estimatedBudget} onChange={e => set('estimatedBudget', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Rp 10-15 Miliar" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.timelineLabel}</label>
                  <input value={form.decisionTimeline} onChange={e => set('decisionTimeline', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Q3 2026" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.followUpLabel}</label>
                  <input type="date" value={form.nextFollowUp} onChange={e => set('nextFollowUp', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{tc.modals.opportunity.painLabel}</label>
                <textarea value={form.painPoints} onChange={e => set('painPoints', e.target.value)} rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={language === 'id' ? 'Jelaskan masalah atau kebutuhan yang dihadapi klien...' : 'Explain the problems or needs faced by the client...'} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button onClick={() => step > 1 && setStep(step - 1)}
            className={`px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 ${step === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={step === 1}>
            ← {t.back}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">{t.cancel}</button>
            {step < 3
              ? <button onClick={() => setStep(step + 1)} className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">{language === 'id' ? 'Lanjut' : 'Next'} →</button>
              : <button onClick={onClose} className="px-6 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">✓ {tc.modals.opportunity.save}</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
