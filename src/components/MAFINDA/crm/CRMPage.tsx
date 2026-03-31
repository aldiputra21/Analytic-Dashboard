import React, { useState } from 'react';
import {
  LayoutDashboard, FolderKanban, Users, FileText, TrendingUp,
  CheckCircle, DollarSign, Search, Plus, Filter, Eye, Edit,
  MoreVertical, Building2, Clock, XCircle, Receipt, Upload,
  FileCheck, AlertCircle, Paperclip, MessageSquare, User, X,
  Download, CheckCircle2, Calendar, Target, Briefcase, Phone,
  Mail, MapPin, Star, ChevronRight, Tag, Percent, Hash,
  Activity, Shield, Handshake, FileSignature, BarChart2, Trash2, ArrowLeft,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { NewOpportunityModal } from './modals/NewOpportunityModal';
import { NewCustomerModal } from './modals/NewCustomerModal';
import { NewProposalModal } from './modals/NewProposalModal';
import { NewContractModal } from './modals/NewContractModal';
import { NewReimburseModal } from './modals/NewReimburseModal';

// ─── Types ────────────────────────────────────────────────────────────────────
type Stage = 'Lead' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Contract';

interface LeadData {
  leadSource: string;
  referredBy?: string;
  initialContactDate: string;
  projectType: string;
  estimatedBudget: string;
  decisionTimeline: string;
  painPoints: string;
  nextFollowUp: string;
  leadScore: number; // 0-100
  leadTemperature: 'Cold' | 'Warm' | 'Hot';
}

interface QualificationData {
  budgetConfirmed: boolean;
  authorityContact: string;
  needsAssessmentDone: boolean;
  timelineConfirmed: boolean;
  technicalFit: number; // 1-5
  budgetFit: number;
  competitorCount: number;
  competitors: string[];
  qualificationScore: number; // 0-100
  goNoGo: 'Go' | 'No-Go' | 'Pending';
  scopeOfWork: string;
  technicalRequirements: string;
}

interface ProposalData {
  proposalNumber: string;
  proposalVersion: string;
  submissionDeadline: string;
  submittedDate?: string;
  proposalValue: string;
  marginPct: number;
  technicalScore: number;
  commercialScore: number;
  proposalStatus: 'Draft' | 'Internal Review' | 'Submitted' | 'Under Evaluation' | 'Revision Required';
  evaluationCriteria: string[];
  keyDifferentiators: string[];
  riskItems: string[];
  presentationDate?: string;
}

interface NegotiationData {
  negotiationRound: number;
  initialOfferValue: string;
  currentOfferValue: string;
  clientCounterOffer?: string;
  discountOffered: number; // %
  keyTermsInDiscussion: string[];
  dealBreakers: string[];
  negotiationStatus: 'Opening' | 'Active' | 'Final Round' | 'Stalled';
  expectedSignDate: string;
  legalReviewStatus: 'Not Started' | 'In Progress' | 'Completed';
  paymentTerms: string;
  warrantyTerms: string;
  penaltyClause: string;
}

interface ContractData {
  contractNumber: string;
  contractType: 'Lump Sum' | 'Unit Price' | 'Cost Plus' | 'Time & Material';
  signedDate?: string;
  effectiveDate: string;
  expiryDate: string;
  contractValue: string;
  paymentMilestones: { milestone: string; pct: number; dueDate: string; status: 'Pending' | 'Invoiced' | 'Paid' }[];
  deliverables: string[];
  contractStatus: 'Draft' | 'Internal Approval' | 'Client Review' | 'Signed' | 'Active' | 'Completed';
  projectManager: string;
  siteLocation: string;
  mobilizationDate?: string;
  retentionPct: number;
  performanceBond: boolean;
  mafindaProjectId?: string;
}

interface Opportunity {
  id: string;
  title: string;
  customer: string;
  customerContact: string;
  contactPhone: string;
  contactEmail: string;
  value: string;
  stage: Stage;
  probability: number;
  owner: string;
  expectedCloseDate: string;
  lastActivity: string;
  status: 'active' | 'won' | 'lost';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  industry: string;
  projectCategory: string;
  location: string;
  daysInStage: number;
  tags: string[];
  // Stage-specific data
  leadData?: LeadData;
  qualificationData?: QualificationData;
  proposalData?: ProposalData;
  negotiationData?: NegotiationData;
  contractData?: ContractData;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'OPP-001', title: 'EPC Pipeline Installation - Pertamina EP Cepu',
    customer: 'PT Pertamina EP', customerContact: 'Ir. Bambang Setiawan',
    contactPhone: '+62 21 3815 1234', contactEmail: 'bambang.s@pertamina.com',
    value: 'Rp 12.500.000.000', stage: 'Lead', probability: 20,
    owner: 'Budi Santoso', expectedCloseDate: '2026-07-15', lastActivity: '2 hari lalu',
    status: 'active', priority: 'High', industry: 'Oil & Gas', projectCategory: 'EPC',
    location: 'Cepu, Jawa Tengah', daysInStage: 8,
    tags: ['EPC', 'Pipeline', 'Upstream'],
    leadData: {
      leadSource: 'Referral - PT Rekayasa Industri',
      referredBy: 'Ir. Hendra Kusuma',
      initialContactDate: '2026-03-20',
      projectType: 'EPC Pipeline 24" x 45 km',
      estimatedBudget: 'Rp 10-15 Miliar',
      decisionTimeline: 'Q3 2026',
      painPoints: 'Existing pipeline aging, kapasitas tidak memadai untuk target produksi 2027',
      nextFollowUp: '2026-04-02',
      leadScore: 72,
      leadTemperature: 'Warm',
    },
  },
  {
    id: 'OPP-002', title: 'Maintenance Services Contract - Chevron Pacific',
    customer: 'Chevron Pacific Indonesia', customerContact: 'John Anderson',
    contactPhone: '+62 21 2995 5000', contactEmail: 'john.anderson@chevron.com',
    value: 'Rp 8.300.000.000', stage: 'Qualification', probability: 45,
    owner: 'Siti Rahma', expectedCloseDate: '2026-05-30', lastActivity: '1 hari lalu',
    status: 'active', priority: 'High', industry: 'Oil & Gas', projectCategory: 'Maintenance',
    location: 'Duri, Riau', daysInStage: 14,
    tags: ['Maintenance', 'Long-term', 'Offshore'],
    qualificationData: {
      budgetConfirmed: true,
      authorityContact: 'VP Operations - Michael Chen',
      needsAssessmentDone: true,
      timelineConfirmed: true,
      technicalFit: 4,
      budgetFit: 4,
      competitorCount: 3,
      competitors: ['PT Timas Suplindo', 'PT Meindo Elang Indah', 'PT Rekayasa Industri'],
      qualificationScore: 78,
      goNoGo: 'Go',
      scopeOfWork: 'Preventive & corrective maintenance untuk 12 wellhead platform, rotating equipment, dan instrument systems',
      technicalRequirements: 'ISO 9001:2015, OHSAS 18001, API 510/570/653 certified personnel, minimum 5 tahun pengalaman offshore maintenance',
    },
  },
  {
    id: 'OPP-003', title: 'Oil & Gas Equipment Supply - TotalEnergies Mahakam',
    customer: 'TotalEnergies EP Indonesie', customerContact: 'Marie Dubois',
    contactPhone: '+62 21 2994 5000', contactEmail: 'marie.dubois@totalenergies.com',
    value: 'Rp 15.700.000.000', stage: 'Proposal', probability: 65,
    owner: 'Ahmad Hidayat', expectedCloseDate: '2026-05-20', lastActivity: '3 hari lalu',
    status: 'active', priority: 'Critical', industry: 'Oil & Gas', projectCategory: 'Supply',
    location: 'Mahakam, Kalimantan Timur', daysInStage: 21,
    tags: ['Equipment', 'Supply', 'Offshore', 'Mahakam'],
    proposalData: {
      proposalNumber: 'PROP-2026-0031',
      proposalVersion: 'v2.1',
      submissionDeadline: '2026-04-10',
      submittedDate: '2026-03-22',
      proposalValue: 'Rp 15.700.000.000',
      marginPct: 18.5,
      technicalScore: 88,
      commercialScore: 82,
      proposalStatus: 'Under Evaluation',
      evaluationCriteria: ['Technical Compliance 40%', 'Commercial 35%', 'HSE Track Record 15%', 'Local Content 10%'],
      keyDifferentiators: ['Sertifikasi API lengkap', 'Delivery time 8 minggu lebih cepat', 'After-sales support 24/7', 'TKDN 42%'],
      riskItems: ['Fluktuasi kurs USD/IDR', 'Lead time impor komponen khusus', 'Kapasitas gudang Balikpapan'],
      presentationDate: '2026-04-05',
    },
  },
  {
    id: 'OPP-004', title: 'Pipeline Inspection & Integrity - Medco E&P',
    customer: 'PT Medco Energi Internasional', customerContact: 'Drs. Sutomo Wibowo',
    contactPhone: '+62 21 2995 3000', contactEmail: 'sutomo@medcoenergi.com',
    value: 'Rp 5.200.000.000', stage: 'Lead', probability: 15,
    owner: 'Dewi Lestari', expectedCloseDate: '2026-08-10', lastActivity: '5 hari lalu',
    status: 'active', priority: 'Medium', industry: 'Oil & Gas', projectCategory: 'Inspection',
    location: 'Rimau Block, Sumatera Selatan', daysInStage: 5,
    tags: ['Inspection', 'Integrity', 'Pipeline'],
    leadData: {
      leadSource: 'Tender Announcement - BPMIGAS',
      initialContactDate: '2026-03-23',
      projectType: 'Pipeline Integrity Assessment & ILI (In-Line Inspection)',
      estimatedBudget: 'Rp 4-6 Miliar',
      decisionTimeline: 'Q4 2026',
      painPoints: 'Regulasi ESDM terbaru mewajibkan integrity assessment setiap 5 tahun, pipeline sudah 7 tahun belum diinspeksi',
      nextFollowUp: '2026-04-05',
      leadScore: 55,
      leadTemperature: 'Cold',
    },
  },
  {
    id: 'OPP-005', title: 'Refinery Maintenance Turnaround - RU IV Cilacap',
    customer: 'Pertamina RU IV Cilacap', customerContact: 'Ir. Kusuma Jaya',
    contactPhone: '+62 282 542 211', contactEmail: 'kusuma.jaya@pertamina.com',
    value: 'Rp 9.800.000.000', stage: 'Contract', probability: 95,
    owner: 'Budi Santoso', expectedCloseDate: '2026-03-30', lastActivity: 'Hari ini',
    status: 'active', priority: 'Critical', industry: 'Refinery', projectCategory: 'Turnaround',
    location: 'Cilacap, Jawa Tengah', daysInStage: 7,
    tags: ['Turnaround', 'Refinery', 'Maintenance'],
    contractData: {
      contractNumber: 'CON-2026-RU4-0012',
      contractType: 'Lump Sum',
      signedDate: '2026-03-28',
      effectiveDate: '2026-04-01',
      expiryDate: '2026-10-01',
      contractValue: 'Rp 9.800.000.000',
      paymentMilestones: [
        { milestone: 'Mobilisasi & Persiapan', pct: 15, dueDate: '2026-04-15', status: 'Pending' },
        { milestone: 'Progress 30%', pct: 25, dueDate: '2026-05-15', status: 'Pending' },
        { milestone: 'Progress 60%', pct: 30, dueDate: '2026-07-01', status: 'Pending' },
        { milestone: 'Mechanical Completion', pct: 20, dueDate: '2026-09-01', status: 'Pending' },
        { milestone: 'Final Acceptance', pct: 10, dueDate: '2026-10-01', status: 'Pending' },
      ],
      deliverables: ['Turnaround Completion Report', 'As-Built Documentation', 'Inspection Certificates', 'Punch List Clearance'],
      contractStatus: 'Signed',
      projectManager: 'Ir. Rudi Hartono',
      siteLocation: 'Pertamina RU IV, Cilacap',
      mobilizationDate: '2026-04-01',
      retentionPct: 5,
      performanceBond: true,
      mafindaProjectId: 'PROJ-2026-0089',
    },
  },
  {
    id: 'OPP-006', title: 'Offshore Platform Services - PHE WMO',
    customer: 'PT Pertamina Hulu Energi', customerContact: 'Dr. Wulan Sari',
    contactPhone: '+62 21 3815 7890', contactEmail: 'wulan.sari@phe.pertamina.com',
    value: 'Rp 18.500.000.000', stage: 'Negotiation', probability: 80,
    owner: 'Siti Rahma', expectedCloseDate: '2026-05-05', lastActivity: '1 hari lalu',
    status: 'active', priority: 'Critical', industry: 'Oil & Gas', projectCategory: 'Offshore Services',
    location: 'West Madura Offshore, Jawa Timur', daysInStage: 18,
    tags: ['Offshore', 'Platform', 'Long-term'],
    negotiationData: {
      negotiationRound: 3,
      initialOfferValue: 'Rp 18.500.000.000',
      currentOfferValue: 'Rp 17.800.000.000',
      clientCounterOffer: 'Rp 17.200.000.000',
      discountOffered: 3.8,
      keyTermsInDiscussion: ['Payment terms NET 45 vs NET 30', 'Mobilization cost sharing', 'Scope of work boundary', 'Penalty clause cap 5% vs 10%'],
      dealBreakers: ['Harga di bawah Rp 17.000.000.000 tidak viable', 'Payment terms lebih dari NET 60'],
      negotiationStatus: 'Final Round',
      expectedSignDate: '2026-04-15',
      legalReviewStatus: 'In Progress',
      paymentTerms: 'NET 30 days after invoice',
      warrantyTerms: '12 bulan setelah mechanical completion',
      penaltyClause: 'Maksimum 5% dari nilai kontrak',
    },
  },
  {
    id: 'OPP-007', title: 'Gas Processing Facility - Medco Natuna',
    customer: 'PT Medco E&P Natuna', customerContact: 'Ir. Agus Prasetyo',
    contactPhone: '+62 21 2995 4000', contactEmail: 'agus.p@medconatuna.com',
    value: 'Rp 32.000.000.000', stage: 'Qualification', probability: 35,
    owner: 'Ahmad Hidayat', expectedCloseDate: '2026-09-30', lastActivity: '4 hari lalu',
    status: 'active', priority: 'Critical', industry: 'Oil & Gas', projectCategory: 'EPC',
    location: 'Natuna, Kepulauan Riau', daysInStage: 10,
    tags: ['Gas Processing', 'EPC', 'Offshore', 'Large Project'],
    qualificationData: {
      budgetConfirmed: false,
      authorityContact: 'CEO - Ir. Bambang Trihatmodjo',
      needsAssessmentDone: true,
      timelineConfirmed: false,
      technicalFit: 3,
      budgetFit: 3,
      competitorCount: 5,
      competitors: ['PT Rekayasa Industri', 'PT Tripatra', 'PT Inti Karya Persada Tehnik', 'Saipem', 'Technip'],
      qualificationScore: 62,
      goNoGo: 'Pending',
      scopeOfWork: 'EPC Gas Processing Facility kapasitas 150 MMSCFD termasuk gas sweetening, dehydration, dan compression',
      technicalRequirements: 'Pengalaman EPC gas processing min 3 proyek >100 MMSCFD, sertifikasi ASME, API, ISO, tenaga ahli bersertifikat internasional',
    },
  },
  {
    id: 'OPP-008', title: 'Subsea Pipeline Repair - Pertamina Hulu Mahakam',
    customer: 'PT Pertamina Hulu Mahakam', customerContact: 'Ir. Dedi Kurniawan',
    contactPhone: '+62 21 3815 9900', contactEmail: 'dedi.k@phm.pertamina.com',
    value: 'Rp 7.600.000.000', stage: 'Proposal', probability: 58,
    owner: 'Dewi Lestari', expectedCloseDate: '2026-06-15', lastActivity: '2 hari lalu',
    status: 'active', priority: 'High', industry: 'Oil & Gas', projectCategory: 'Subsea',
    location: 'Mahakam Delta, Kalimantan Timur', daysInStage: 16,
    tags: ['Subsea', 'Pipeline', 'Repair', 'Offshore'],
    proposalData: {
      proposalNumber: 'PROP-2026-0038',
      proposalVersion: 'v1.2',
      submissionDeadline: '2026-04-20',
      proposalValue: 'Rp 7.600.000.000',
      marginPct: 22.0,
      technicalScore: 85,
      commercialScore: 79,
      proposalStatus: 'Internal Review',
      evaluationCriteria: ['Technical Approach 45%', 'Commercial 30%', 'HSE Plan 15%', 'Schedule 10%'],
      keyDifferentiators: ['ROV capability in-house', 'Pengalaman 8 proyek subsea serupa', 'Mobilisasi cepat dari Balikpapan base'],
      riskItems: ['Cuaca laut Mahakam Delta', 'Ketersediaan DSV (Dive Support Vessel)', 'Izin lingkungan subsea'],
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<Stage, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  Lead:          { color: 'text-slate-700',  bg: 'bg-slate-100',   border: 'border-slate-300',  icon: Target,        label: 'Lead' },
  Qualification: { color: 'text-blue-700',   bg: 'bg-blue-100',    border: 'border-blue-300',   icon: CheckCircle,   label: 'Qualification' },
  Proposal:      { color: 'text-purple-700', bg: 'bg-purple-100',  border: 'border-purple-300', icon: FileText,      label: 'Proposal' },
  Negotiation:   { color: 'text-orange-700', bg: 'bg-orange-100',  border: 'border-orange-300', icon: Handshake,     label: 'Negotiation' },
  Contract:      { color: 'text-emerald-700',bg: 'bg-emerald-100', border: 'border-emerald-300',icon: FileSignature, label: 'Contract' },
};

const PRIORITY_CONFIG: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-600', Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-orange-100 text-orange-700', Critical: 'bg-red-100 text-red-700',
};

const TEMP_CONFIG: Record<string, string> = {
  Cold: 'bg-blue-50 text-blue-600', Warm: 'bg-yellow-50 text-yellow-600', Hot: 'bg-red-50 text-red-600',
};

function fmt(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
}

// ─── Stage Detail Panels ──────────────────────────────────────────────────────
function LeadPanel({ data }: { data: LeadData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Information</h4>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TEMP_CONFIG[data.leadTemperature]}`}>
            {data.leadTemperature}
          </span>
          <span className="text-xs font-bold text-slate-700">Score: {data.leadScore}/100</span>
        </div>
      </div>
      {/* Lead Score Bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Lead Score</span><span>{data.leadScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full ${data.leadScore >= 70 ? 'bg-green-500' : data.leadScore >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
            style={{ width: `${data.leadScore}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Lead Source</div>
          <div className="font-medium text-slate-800">{data.leadSource}</div>
          {data.referredBy && <div className="text-slate-500 mt-0.5">via {data.referredBy}</div>}
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Project Type</div>
          <div className="font-medium text-slate-800">{data.projectType}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Estimated Budget</div>
          <div className="font-medium text-slate-800">{data.estimatedBudget}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Decision Timeline</div>
          <div className="font-medium text-slate-800">{data.decisionTimeline}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Initial Contact</div>
          <div className="font-medium text-slate-800">{data.initialContactDate}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Next Follow-up</div>
          <div className="font-medium text-slate-800">{data.nextFollowUp}</div>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="text-xs font-semibold text-amber-700 mb-1">Pain Points / Kebutuhan</div>
        <div className="text-xs text-amber-800">{data.painPoints}</div>
      </div>
    </div>
  );
}

function QualificationPanel({ data }: { data: QualificationData }) {
  const criteria = [
    { label: 'Budget', confirmed: data.budgetConfirmed },
    { label: 'Authority', confirmed: !!data.authorityContact },
    { label: 'Need', confirmed: data.needsAssessmentDone },
    { label: 'Timeline', confirmed: data.timelineConfirmed },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualification (BANT)</h4>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${data.goNoGo === 'Go' ? 'bg-green-100 text-green-700' : data.goNoGo === 'No-Go' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {data.goNoGo}
        </span>
      </div>
      {/* BANT Checklist */}
      <div className="grid grid-cols-4 gap-2">
        {criteria.map((c, i) => (
          <div key={i} className={`rounded-lg p-2.5 text-center border ${c.confirmed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`text-lg mb-0.5 ${c.confirmed ? 'text-green-600' : 'text-red-400'}`}>{c.confirmed ? '✓' : '✗'}</div>
            <div className="text-xs font-semibold text-slate-700">{c.label}</div>
          </div>
        ))}
      </div>
      {/* Fit Scores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Technical Fit</div>
          <div className="flex gap-1">{[1,2,3,4,5].map(s => <div key={s} className={`w-5 h-5 rounded ${s <= data.technicalFit ? 'bg-blue-500' : 'bg-gray-200'}`} />)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Budget Fit</div>
          <div className="flex gap-1">{[1,2,3,4,5].map(s => <div key={s} className={`w-5 h-5 rounded ${s <= data.budgetFit ? 'bg-green-500' : 'bg-gray-200'}`} />)}</div>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-xs">
        <div className="text-slate-400 mb-1">Authority Contact</div>
        <div className="font-medium text-slate-800">{data.authorityContact}</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-xs">
        <div className="text-slate-400 mb-1">Scope of Work</div>
        <div className="text-slate-700">{data.scopeOfWork}</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-xs">
        <div className="text-slate-400 mb-1">Technical Requirements</div>
        <div className="text-slate-700">{data.technicalRequirements}</div>
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs">
        <div className="font-semibold text-orange-700 mb-1">Kompetitor ({data.competitorCount})</div>
        <div className="flex flex-wrap gap-1">
          {data.competitors.map((c, i) => <span key={i} className="px-2 py-0.5 bg-white border border-orange-200 rounded text-orange-700">{c}</span>)}
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Qualification Score</span><span>{data.qualificationScore}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full ${data.qualificationScore >= 70 ? 'bg-green-500' : data.qualificationScore >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
            style={{ width: `${data.qualificationScore}%` }} />
        </div>
      </div>
    </div>
  );
}

function ProposalPanel({ data }: { data: ProposalData }) {
  const statusColor: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700', 'Internal Review': 'bg-blue-100 text-blue-700',
    'Submitted': 'bg-purple-100 text-purple-700', 'Under Evaluation': 'bg-yellow-100 text-yellow-700',
    'Revision Required': 'bg-red-100 text-red-700',
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proposal Details</h4>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[data.proposalStatus] ?? 'bg-gray-100 text-gray-700'}`}>
          {data.proposalStatus}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Nomor Proposal</div>
          <div className="font-medium text-slate-800">{data.proposalNumber} <span className="text-slate-400">{data.proposalVersion}</span></div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Nilai Proposal</div>
          <div className="font-bold text-slate-800">{data.proposalValue}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Deadline Submission</div>
          <div className="font-medium text-slate-800">{data.submissionDeadline}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Tanggal Submit</div>
          <div className="font-medium text-slate-800">{data.submittedDate ?? '—'}</div>
        </div>
      </div>
      {/* Scores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-xs">
          <div className="text-blue-500 mb-1">Technical Score</div>
          <div className="text-2xl font-bold text-blue-700">{data.technicalScore}<span className="text-sm font-normal">/100</span></div>
          <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${data.technicalScore}%` }} />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-xs">
          <div className="text-green-500 mb-1">Commercial Score</div>
          <div className="text-2xl font-bold text-green-700">{data.commercialScore}<span className="text-sm font-normal">/100</span></div>
          <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${data.commercialScore}%` }} />
          </div>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-xs">
        <div className="text-slate-400 mb-1.5 font-semibold">Margin</div>
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold text-slate-800">{data.marginPct}%</div>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${data.marginPct >= 20 ? 'bg-green-500' : data.marginPct >= 15 ? 'bg-yellow-500' : 'bg-red-400'}`}
              style={{ width: `${Math.min(data.marginPct, 40) / 40 * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-xs">
        <div className="text-slate-400 mb-1.5 font-semibold">Key Differentiators</div>
        <ul className="space-y-1">{data.keyDifferentiators.map((d, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span><span className="text-slate-700">{d}</span></li>)}</ul>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
        <div className="text-red-600 mb-1.5 font-semibold">Risk Items</div>
        <ul className="space-y-1">{data.riskItems.map((r, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">⚠</span><span className="text-red-700">{r}</span></li>)}</ul>
      </div>
      {data.presentationDate && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs">
          <div className="text-purple-600 font-semibold">Presentasi Terjadwal: {data.presentationDate}</div>
        </div>
      )}
    </div>
  );
}

function NegotiationPanel({ data }: { data: NegotiationData }) {
  const statusColor: Record<string, string> = {
    'Opening': 'bg-blue-100 text-blue-700', 'Active': 'bg-yellow-100 text-yellow-700',
    'Final Round': 'bg-orange-100 text-orange-700', 'Stalled': 'bg-red-100 text-red-700',
  };
  const legalColor: Record<string, string> = {
    'Not Started': 'bg-gray-100 text-gray-600', 'In Progress': 'bg-yellow-100 text-yellow-700', 'Completed': 'bg-green-100 text-green-700',
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Negotiation — Round {data.negotiationRound}</h4>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[data.negotiationStatus]}`}>{data.negotiationStatus}</span>
      </div>
      {/* Value Comparison */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="text-xs text-slate-400 mb-3 font-semibold">Perbandingan Nilai</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Penawaran Awal</span>
            <span className="font-semibold text-slate-700">{data.initialOfferValue}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Penawaran Saat Ini</span>
            <span className="font-bold text-blue-700">{data.currentOfferValue}</span>
          </div>
          {data.clientCounterOffer && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Counter Offer Klien</span>
              <span className="font-bold text-orange-600">{data.clientCounterOffer}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-slate-500">Diskon Ditawarkan</span>
            <span className="font-bold text-red-600">-{data.discountOffered}%</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Target Tanda Tangan</div>
          <div className="font-medium text-slate-800">{data.expectedSignDate}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Legal Review</div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${legalColor[data.legalReviewStatus]}`}>{data.legalReviewStatus}</span>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Payment Terms</div>
          <div className="font-medium text-slate-800">{data.paymentTerms}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Warranty</div>
          <div className="font-medium text-slate-800">{data.warrantyTerms}</div>
        </div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
        <div className="font-semibold text-yellow-700 mb-1.5">Poin Negosiasi Aktif</div>
        <ul className="space-y-1">{data.keyTermsInDiscussion.map((t, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-yellow-500">•</span><span className="text-yellow-800">{t}</span></li>)}</ul>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
        <div className="font-semibold text-red-700 mb-1.5">Deal Breakers</div>
        <ul className="space-y-1">{data.dealBreakers.map((d, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-red-500">✗</span><span className="text-red-700">{d}</span></li>)}</ul>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-xs">
        <div className="text-slate-400 mb-0.5">Penalty Clause</div>
        <div className="font-medium text-slate-800">{data.penaltyClause}</div>
      </div>
    </div>
  );
}

function ContractPanel({ data }: { data: ContractData }) {
  const statusColor: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700', 'Internal Approval': 'bg-blue-100 text-blue-700',
    'Client Review': 'bg-yellow-100 text-yellow-700', 'Signed': 'bg-green-100 text-green-700',
    'Active': 'bg-emerald-100 text-emerald-700', 'Completed': 'bg-purple-100 text-purple-700',
  };
  const milestoneStatus: Record<string, string> = {
    'Pending': 'bg-gray-100 text-gray-600', 'Invoiced': 'bg-blue-100 text-blue-700', 'Paid': 'bg-green-100 text-green-700',
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Details</h4>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[data.contractStatus]}`}>{data.contractStatus}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Nomor Kontrak</div>
          <div className="font-bold text-slate-800">{data.contractNumber}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Tipe Kontrak</div>
          <div className="font-medium text-slate-800">{data.contractType}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Nilai Kontrak</div>
          <div className="font-bold text-emerald-700">{data.contractValue}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Project Manager</div>
          <div className="font-medium text-slate-800">{data.projectManager}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Efektif — Berakhir</div>
          <div className="font-medium text-slate-800">{data.effectiveDate} → {data.expiryDate}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 mb-0.5">Lokasi Proyek</div>
          <div className="font-medium text-slate-800">{data.siteLocation}</div>
        </div>
      </div>
      <div className="flex gap-3 text-xs">
        <div className={`flex-1 rounded-lg p-2.5 text-center border ${data.performanceBond ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="font-semibold text-slate-700">Performance Bond</div>
          <div className={data.performanceBond ? 'text-green-600' : 'text-gray-400'}>{data.performanceBond ? '✓ Ada' : '✗ Tidak'}</div>
        </div>
        <div className="flex-1 bg-slate-50 rounded-lg p-2.5 text-center border border-slate-200">
          <div className="font-semibold text-slate-700">Retention</div>
          <div className="text-slate-800 font-bold">{data.retentionPct}%</div>
        </div>
        {data.mafindaProjectId && (
          <div className="flex-1 bg-blue-50 rounded-lg p-2.5 text-center border border-blue-200">
            <div className="font-semibold text-blue-700">CFD Project</div>
            <div className="text-blue-600 font-medium">{data.mafindaProjectId}</div>
          </div>
        )}
      </div>
      {/* Payment Milestones */}
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="text-xs font-semibold text-slate-600 mb-2">Payment Milestones</div>
        <div className="space-y-2">
          {data.paymentMilestones.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-1">
                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">{i+1}</span>
                <span className="text-slate-700">{m.milestone}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-500">{m.pct}%</span>
                <span className="text-slate-400">{m.dueDate}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${milestoneStatus[m.status]}`}>{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-xs">
        <div className="text-slate-400 mb-1.5 font-semibold">Deliverables</div>
        <ul className="space-y-1">{data.deliverables.map((d, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500">✓</span><span className="text-slate-700">{d}</span></li>)}</ul>
      </div>
    </div>
  );
}

// ─── Opportunity Detail Drawer ────────────────────────────────────────────────
function OpportunityDetailDrawer({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stage' | 'activities' | 'documents'>('overview');
  const stages: Stage[] = ['Lead', 'Qualification', 'Proposal', 'Negotiation', 'Contract'];
  const currentIdx = stages.indexOf(opp.stage);

  const activities = [
    { title: 'Site Visit ke Fasilitas Klien', date: '2026-03-26', user: 'Budi Santoso', type: 'Visit', note: 'Diskusi kebutuhan teknis dan timeline proyek' },
    { title: 'Follow-up Call', date: '2026-03-24', user: 'Budi Santoso', type: 'Phone', note: 'Konfirmasi deadline submission proposal' },
    { title: 'Kirim Technical Proposal', date: '2026-03-22', user: 'Budi Santoso', type: 'Email', note: 'Dokumen proposal teknis dikirim via email' },
    { title: 'Meeting Internal Review', date: '2026-03-20', user: 'Tim BD', type: 'Meeting', note: 'Review internal sebelum submission' },
  ];
  const docs = [
    { name: 'Technical Proposal v2.1.pdf', size: '4.2 MB', date: '2026-03-22', type: 'pdf' },
    { name: 'Cost Estimation.xlsx', size: '256 KB', date: '2026-03-22', type: 'xlsx' },
    { name: 'Company Profile.pdf', size: '8.1 MB', date: '2026-03-15', type: 'pdf' },
    { name: 'HSE Plan.docx', size: '1.3 MB', date: '2026-03-18', type: 'docx' },
  ];

  const stagePanel = () => {
    if (opp.stage === 'Lead' && opp.leadData) return <LeadPanel data={opp.leadData} />;
    if (opp.stage === 'Qualification' && opp.qualificationData) return <QualificationPanel data={opp.qualificationData} />;
    if (opp.stage === 'Proposal' && opp.proposalData) return <ProposalPanel data={opp.proposalData} />;
    if (opp.stage === 'Negotiation' && opp.negotiationData) return <NegotiationPanel data={opp.negotiationData} />;
    if (opp.stage === 'Contract' && opp.contractData) return <ContractPanel data={opp.contractData} />;
    return <div className="text-sm text-gray-400 py-4 text-center">Data stage belum tersedia</div>;
  };

  const cfg = STAGE_CONFIG[opp.stage];
  const StageIcon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                <StageIcon className="w-3 h-3" />{cfg.label}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_CONFIG[opp.priority]}`}>{opp.priority}</span>
              <span className="text-xs text-gray-400">{opp.id}</span>
            </div>
            <h2 className="text-base font-bold text-gray-900 truncate">{opp.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{opp.customer}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.location}</span>
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{opp.projectCategory}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 ml-4 shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {/* Pipeline Progress */}
        <div className="px-6 py-3 bg-slate-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            {stages.map((s, i) => {
              const c = STAGE_CONFIG[s];
              const Icon = c.icon;
              const done = i < currentIdx;
              const current = i === currentIdx;
              return (
                <div key={s} className="flex-1 flex flex-col items-center relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 z-10 border-2 ${done ? 'bg-green-500 border-green-500 text-white' : current ? `${c.bg} ${c.border} ${c.color}` : 'bg-white border-gray-300 text-gray-400'}`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`text-[10px] font-medium ${current ? c.color : done ? 'text-green-600' : 'text-gray-400'}`}>{s}</div>
                  {i < stages.length - 1 && (
                    <div className={`absolute top-4 left-1/2 w-full h-0.5 ${done ? 'bg-green-400' : 'bg-gray-200'}`} style={{ zIndex: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(['overview', 'stage', 'activities', 'documents'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'stage' ? `${opp.stage} Details` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-blue-500 mb-1">Deal Value</div>
                    <div className="text-sm font-bold text-blue-800">{opp.value}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-green-500 mb-1">Win Probability</div>
                    <div className="text-2xl font-bold text-green-700">{opp.probability}%</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-purple-500 mb-1">Days in Stage</div>
                    <div className="text-2xl font-bold text-purple-700">{opp.daysInStage}</div>
                  </div>
                </div>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {opp.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{tag}</span>
                  ))}
                </div>
                {/* Contact Info */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Contact Person</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{opp.customerContact}</div>
                      <div className="text-xs text-gray-500">{opp.customer}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{opp.contactPhone}</div>
                    <div className="flex items-center gap-2 text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{opp.contactEmail}</div>
                    <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400" />{opp.location}</div>
                  </div>
                </div>
              </div>
              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Key Information</h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { icon: User, label: 'Owner', value: opp.owner },
                      { icon: Calendar, label: 'Expected Close', value: opp.expectedCloseDate },
                      { icon: Clock, label: 'Last Activity', value: opp.lastActivity },
                      { icon: Briefcase, label: 'Category', value: opp.projectCategory },
                      { icon: Activity, label: 'Industry', value: opp.industry },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <div><div className="text-gray-400">{item.label}</div><div className="font-medium text-gray-800">{item.value}</div></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Update Stage</button>
                    <button className="w-full px-3 py-2 border border-gray-300 text-xs rounded-lg hover:bg-gray-50">Schedule Meeting</button>
                    <button className="w-full px-3 py-2 border border-gray-300 text-xs rounded-lg hover:bg-gray-50">Log Activity</button>
                    <button className="w-full px-3 py-2 border border-gray-300 text-xs rounded-lg hover:bg-gray-50">Generate Report</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stage' && (
            <div className="max-w-2xl">
              <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${cfg.bg} border ${cfg.border}`}>
                <StageIcon className={`w-5 h-5 ${cfg.color}`} />
                <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label} Stage Details</span>
              </div>
              {stagePanel()}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a.type}</span>
                        <span className="text-xs text-gray-400">{a.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-0.5">{a.note}</p>
                    <p className="text-xs text-gray-400">by {a.user}</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-blue-600 hover:border-blue-400 hover:bg-blue-50">
                + Log Activity Baru
              </button>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-2">
              {docs.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${d.type === 'pdf' ? 'bg-red-100 text-red-600' : d.type === 'xlsx' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {d.type.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{d.name}</div>
                      <div className="text-xs text-gray-400">{d.size} • {d.date}</div>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              ))}
              <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-blue-600 hover:border-blue-400 hover:bg-blue-50">
                + Upload Dokumen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Opportunities List ───────────────────────────────────────────────────────
function Opportunities({ onViewDetail }: { onViewDetail: (o: Opportunity) => void }) {
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<Stage | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = OPPORTUNITIES.filter(o => {
    const ms = o.title.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    const ss = filterStage === 'all' || o.stage === filterStage;
    const ps = filterPriority === 'all' || o.priority === filterPriority;
    return ms && ss && ps;
  });

  const stageStats = (['Lead', 'Qualification', 'Proposal', 'Negotiation', 'Contract'] as Stage[]).map(s => ({
    stage: s, count: OPPORTUNITIES.filter(o => o.stage === s).length,
    cfg: STAGE_CONFIG[s],
  }));

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Opportunities</h2>
          <p className="text-sm text-gray-500">Pipeline sales dengan detail lengkap per stage</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" />New Opportunity
        </button>
      </div>
      {showNewModal && <NewOpportunityModal onClose={() => setShowNewModal(false)} />}

      {/* Stage Summary Cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {stageStats.map(({ stage, count, cfg }) => {
          const Icon = cfg.icon;
          return (
            <button key={stage} onClick={() => setFilterStage(filterStage === stage ? 'all' : stage)}
              className={`rounded-lg p-3 border-2 text-left transition-all ${filterStage === stage ? `${cfg.bg} ${cfg.border}` : 'bg-white border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${filterStage === stage ? cfg.color : 'text-gray-400'}`} />
                <span className={`text-lg font-bold ${filterStage === stage ? cfg.color : 'text-gray-700'}`}>{count}</span>
              </div>
              <div className={`text-xs font-medium ${filterStage === stage ? cfg.color : 'text-gray-500'}`}>{stage}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <div className="p-4 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari opportunity atau customer..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStage} onChange={e => setFilterStage(e.target.value as Stage | 'all')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Semua Stage</option>
            {(['Lead', 'Qualification', 'Proposal', 'Negotiation', 'Contract'] as Stage[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Semua Priority</option>
            {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Opportunity', 'Customer', 'Value', 'Stage', 'Priority', 'Probability', 'Close Date', 'Owner', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(o => {
                const cfg = STAGE_CONFIG[o.stage];
                const StageIcon = cfg.icon;
                return (
                  <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetail(o)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{o.title}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <span>{o.id}</span>
                        <span>•</span>
                        <span>{o.projectCategory}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{o.daysInStage}d</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div>
                          <div className="text-gray-900 text-xs font-medium max-w-[140px] truncate">{o.customer}</div>
                          <div className="text-xs text-gray-400">{o.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-xs whitespace-nowrap">{o.value}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${cfg.bg} ${cfg.color}`}>
                        <StageIcon className="w-3 h-3" />{o.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_CONFIG[o.priority]}`}>{o.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${o.probability >= 70 ? 'bg-green-500' : o.probability >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                            style={{ width: `${o.probability}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{o.probability}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{o.expectedCloseDate}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{o.owner}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onViewDetail(o)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="More"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Menampilkan {filtered.length} dari {OPPORTUNITIES.length} opportunities</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function CRMDashboard() {
  const metrics = [
    { label: 'Total Pipeline Value', value: 'Rp 109.6 M', change: '+12.5%', icon: DollarSign, color: 'bg-blue-500' },
    { label: 'Active Opportunities', value: String(OPPORTUNITIES.length), change: '+3', icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Proposals Submitted', value: '3', change: '+1', icon: FileText, color: 'bg-orange-500' },
    { label: 'Win Rate', value: '68%', change: '+5%', icon: CheckCircle, color: 'bg-purple-500' },
  ];
  const pipelineData = (['Lead','Qualification','Proposal','Negotiation','Contract'] as Stage[]).map(s => ({
    stage: s, count: OPPORTUNITIES.filter(o => o.stage === s).length,
  }));
  const monthlyData = [
    { month: 'Jan', won: 4, lost: 2 }, { month: 'Feb', won: 5, lost: 1 },
    { month: 'Mar', won: 3, lost: 3 }, { month: 'Apr', won: 6, lost: 2 },
    { month: 'Mei', won: 7, lost: 1 }, { month: 'Jun', won: 5, lost: 2 },
  ];
  const statusData = [
    { name: 'Won', value: 30, color: '#10b981' },
    { name: 'In Progress', value: OPPORTUNITIES.length, color: '#3b82f6' },
    { name: 'Lost', value: 11, color: '#ef4444' },
  ];
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">CRM Dashboard</h2>
        <p className="text-sm text-gray-600">Overview performa pipeline dan status opportunities</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`${m.color} w-11 h-11 rounded-lg flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
                <span className="text-green-600 text-sm font-medium">{m.change}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{m.value}</div>
              <div className="text-sm text-gray-600">{m.label}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Opportunities" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Opportunity Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} dataKey="value">
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Performance</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip /><Legend />
            <Line type="monotone" dataKey="won" stroke="#10b981" name="Won" strokeWidth={2} />
            <Line type="monotone" dataKey="lost" stroke="#ef4444" name="Lost" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Customers ────────────────────────────────────────────────────────────────
interface CustomerData {
  id: string; name: string; industry: string; contact: string; email: string; phone: string;
  location: string; activeOpportunities: number; totalValue: string; lastContact: string;
  parentId?: string | null; parentName?: string | null;
  children?: { id: string; name: string; industry: string; status: string }[];
  address?: string; npwp?: string; status: string;
  contacts?: { name: string; title: string; phone: string; email: string; role: string; isPrimary: boolean }[];
}

const ALL_CUSTOMERS: CustomerData[] = [
  { id: 'CUST-001', name: 'PT Pertamina (Persero)', industry: 'Oil & Gas', contact: 'Ir. Bambang Setiawan', email: 'bambang.s@pertamina.com', phone: '+62 21 3815 1234', location: 'Jakarta Selatan', activeOpportunities: 3, totalValue: 'Rp 28.5 M', lastContact: '2 hari lalu', parentId: null, parentName: null, status: 'Active', address: 'Jl. Medan Merdeka Timur No. 1A, Jakarta Pusat', npwp: '01.000.000.0-000.001',
    children: [
      { id: 'CUST-005', name: 'Pertamina RU IV Cilacap', industry: 'Refinery', status: 'Active' },
      { id: 'CUST-006', name: 'PT Pertamina Hulu Energi', industry: 'Oil & Gas', status: 'Active' },
    ],
    contacts: [
      { name: 'Ir. Bambang Setiawan', title: 'VP Operations', phone: '+62 21 3815 1234', email: 'bambang.s@pertamina.com', role: 'PIC', isPrimary: true },
      { name: 'Siti Rahmadhani', title: 'Procurement Manager', phone: '+62 21 3815 5678', email: 'siti.r@pertamina.com', role: 'Decision Maker', isPrimary: false },
    ],
  },
  { id: 'CUST-002', name: 'Chevron Pacific Indonesia', industry: 'Oil & Gas', contact: 'John Anderson', email: 'john.anderson@chevron.com', phone: '+62 21 2995 5000', location: 'Jakarta Pusat', activeOpportunities: 2, totalValue: 'Rp 15.8 M', lastContact: '1 hari lalu', parentId: null, parentName: null, status: 'Active',
    contacts: [
      { name: 'John Anderson', title: 'Project Director', phone: '+62 21 2995 5000', email: 'john.anderson@chevron.com', role: 'PIC', isPrimary: true },
    ],
  },
  { id: 'CUST-003', name: 'TotalEnergies EP Indonesie', industry: 'Oil & Gas', contact: 'Marie Dubois', email: 'marie.dubois@totalenergies.com', phone: '+62 21 2994 5000', location: 'Jakarta Selatan', activeOpportunities: 1, totalValue: 'Rp 15.7 M', lastContact: '3 hari lalu', parentId: null, parentName: null, status: 'Active',
    contacts: [
      { name: 'Marie Dubois', title: 'Operations Head', phone: '+62 21 2994 5000', email: 'marie.dubois@totalenergies.com', role: 'PIC', isPrimary: true },
    ],
  },
  { id: 'CUST-004', name: 'PT Medco Energi', industry: 'Oil & Gas', contact: 'Drs. Sutomo', email: 'sutomo@medcoenergi.com', phone: '+62 21 2995 3000', location: 'Jakarta Selatan', activeOpportunities: 1, totalValue: 'Rp 5.2 M', lastContact: '5 hari lalu', parentId: null, parentName: null, status: 'Active',
    contacts: [
      { name: 'Drs. Sutomo', title: 'GM Procurement', phone: '+62 21 2995 3000', email: 'sutomo@medcoenergi.com', role: 'PIC', isPrimary: true },
    ],
  },
  { id: 'CUST-005', name: 'Pertamina RU IV Cilacap', industry: 'Refinery', contact: 'Ir. Kusuma Jaya', email: 'kusuma.jaya@pertamina.com', phone: '+62 282 542 211', location: 'Cilacap', activeOpportunities: 2, totalValue: 'Rp 12.3 M', lastContact: 'Hari ini', parentId: 'CUST-001', parentName: 'PT Pertamina (Persero)', status: 'Active', address: 'Jl. MT Haryono 77, Cilacap',
    contacts: [
      { name: 'Ir. Kusuma Jaya', title: 'Plant Manager', phone: '+62 282 542 211', email: 'kusuma.jaya@pertamina.com', role: 'PIC', isPrimary: true },
    ],
  },
  { id: 'CUST-006', name: 'PT Pertamina Hulu Energi', industry: 'Oil & Gas', contact: 'Dr. Wulan Sari', email: 'wulan.sari@phe.pertamina.com', phone: '+62 21 3815 7890', location: 'Jakarta Selatan', activeOpportunities: 1, totalValue: 'Rp 18.5 M', lastContact: '1 hari lalu', parentId: 'CUST-001', parentName: 'PT Pertamina (Persero)', status: 'Active',
    contacts: [
      { name: 'Dr. Wulan Sari', title: 'VP Exploration', phone: '+62 21 3815 7890', email: 'wulan.sari@phe.pertamina.com', role: 'PIC', isPrimary: true },
      { name: 'Agus Pratama', title: 'Technical Lead', phone: '+62 21 3815 7891', email: 'agus.p@phe.pertamina.com', role: 'Technical', isPrimary: false },
    ],
  },
];

function CustomerDetailDrawer({ customer, onClose, onSelectCustomer, onBack }: {
  customer: CustomerData;
  onClose: () => void;
  onSelectCustomer: (id: string) => void;
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'children'>('overview');
  const [prevCustomerId, setPrevCustomerId] = useState(customer.id);
  if (customer.id !== prevCustomerId) {
    setPrevCustomerId(customer.id);
    setActiveTab('overview');
  }

  const tabs: { key: 'overview' | 'contacts' | 'children'; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'contacts', label: 'Kontak', count: customer.contacts?.length ?? 0 },
    { key: 'children', label: 'Anak Perusahaan', count: customer.children?.length ?? 0 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex-1 min-w-0">
            {onBack && (
              <button onClick={onBack}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mb-2 -ml-0.5 group">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Kembali ke Perusahaan Induk
              </button>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {customer.status}
              </span>
              <span className="text-xs text-gray-400">{customer.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-base font-bold text-gray-900 truncate">{customer.name}</h2>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{customer.industry}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{customer.location}</span>
            </div>
            {/* Parent Company Link */}
            {customer.parentId && customer.parentName && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Induk:</span>
                <button
                  onClick={() => onSelectCustomer(customer.parentId!)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1"
                >
                  <Building2 className="w-3 h-3" />
                  {customer.parentName}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 ml-4 shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-blue-500 mb-1">Active Opportunities</div>
                    <div className="text-2xl font-bold text-blue-800">{customer.activeOpportunities}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-green-500 mb-1">Total Value</div>
                    <div className="text-sm font-bold text-green-700">{customer.totalValue}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-purple-500 mb-1">Anak Perusahaan</div>
                    <div className="text-2xl font-bold text-purple-700">{customer.children?.length ?? 0}</div>
                  </div>
                </div>
                {/* Company Info */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Informasi Perusahaan</h3>
                  <div className="space-y-2.5 text-xs">
                    {customer.address && (
                      <div className="flex items-start gap-2 text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" /><span>{customer.address}</span></div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{customer.email}</div>
                    <div className="flex items-center gap-2 text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{customer.phone}</div>
                    {customer.npwp && (
                      <div className="flex items-center gap-2 text-gray-600"><Hash className="w-3.5 h-3.5 text-gray-400" />NPWP: {customer.npwp}</div>
                    )}
                  </div>
                </div>
                {/* Primary Contact */}
                {customer.contacts && customer.contacts.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Primary Contact</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{customer.contacts[0].name}</div>
                        <div className="text-xs text-gray-500">{customer.contacts[0].title} — {customer.contacts[0].role}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Key Information</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Industry</span><span className="text-gray-900 font-medium">{customer.industry}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{customer.status}</span>
                    </div>
                    <div className="flex justify-between"><span className="text-gray-500">Last Contact</span><span className="text-gray-900">{customer.lastContact}</span></div>
                    {customer.parentName && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Perusahaan Induk</span>
                        <button onClick={() => onSelectCustomer(customer.parentId!)} className="text-blue-600 hover:underline font-medium">{customer.parentName}</button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Quick Children Preview */}
                {customer.children && customer.children.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Anak Perusahaan</h3>
                    <div className="space-y-2">
                      {customer.children.slice(0, 3).map(ch => (
                        <button key={ch.id} onClick={() => onSelectCustomer(ch.id)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-colors text-left">
                          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{ch.name}</div>
                            <div className="text-[10px] text-gray-400">{ch.industry}</div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                        </button>
                      ))}
                      {customer.children.length > 3 && (
                        <button onClick={() => setActiveTab('children')}
                          className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
                          Lihat semua ({customer.children.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {customer.contacts && customer.contacts.length > 0 ? customer.contacts.map((ct, i) => (
                <div key={i} className={`border rounded-lg p-4 ${ct.isPrimary ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{ct.name}</div>
                        {ct.title && <div className="text-xs text-gray-500">{ct.title}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        ct.role === 'PIC' ? 'bg-blue-100 text-blue-700' :
                        ct.role === 'Decision Maker' ? 'bg-purple-100 text-purple-700' :
                        ct.role === 'Technical' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{ct.role}</span>
                      {ct.isPrimary && <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">Primary</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 ml-11">
                    {ct.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{ct.phone}</span>}
                    {ct.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" />{ct.email}</span>}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-sm text-gray-400">Tidak ada data kontak</div>
              )}
            </div>
          )}

          {/* Children Tab */}
          {activeTab === 'children' && (
            <div>
              {customer.children && customer.children.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500 mb-4">
                    {customer.name} memiliki {customer.children.length} anak perusahaan
                  </div>
                  {customer.children.map(ch => (
                    <button key={ch.id} onClick={() => onSelectCustomer(ch.id)}
                      className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all text-left group">
                      <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{ch.name}</div>
                        <div className="text-xs text-gray-500">{ch.industry}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{ch.status}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <div className="text-sm text-gray-500 mb-1">Tidak ada anak perusahaan</div>
                  <div className="text-xs text-gray-400">Customer ini belum memiliki anak perusahaan yang terdaftar</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Customers({ onViewDetail }: { onViewDetail: (customer: CustomerData) => void }) {
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const filtered = ALL_CUSTOMERS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-gray-900 mb-1">Customers</h2><p className="text-sm text-gray-600">Kelola hubungan pelanggan dan kontak</p></div>
        <button onClick={() => setShowNewModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />New Customer</button>
      </div>
      {showNewModal && <NewCustomerModal onClose={() => setShowNewModal(false)} />}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative"><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari customer..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filtered.map(c => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                <span className="text-xs text-gray-500">{c.id}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{c.name}</h3>
              <div className="text-xs text-gray-500 mb-1">{c.industry}</div>
              {c.parentName && (
                <div className="flex items-center gap-1 mb-2">
                  <Building2 className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] text-blue-600 font-medium">Anak perusahaan dari {c.parentName}</span>
                </div>
              )}
              <div className="space-y-1.5 mb-3 text-xs text-gray-600">
                <div className="flex items-center gap-2 truncate"><Mail className="w-3 h-3 text-gray-400 shrink-0" /><span className="truncate">{c.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /><span>{c.phone}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-gray-400" /><span>{c.location}</span></div>
              </div>
              <div className="pt-3 border-t border-gray-100 text-xs">
                <div className="flex justify-between mb-1"><span className="text-gray-500">Active Opportunities</span><span className="font-medium text-gray-900">{c.activeOpportunities}</span></div>
                <div className="flex justify-between mb-2"><span className="text-gray-500">Total Value</span><span className="font-medium text-gray-900">{c.totalValue}</span></div>
                <div className="text-gray-400">Last contact: {c.lastContact}</div>
              </div>
              <button onClick={() => onViewDetail(c)} className="w-full mt-3 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5" />View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Proposals ────────────────────────────────────────────────────────────────
function Proposals() {
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const proposals = [
    { id: 'PROP-001', title: 'EPC Pipeline Installation - Pertamina', customer: 'PT Pertamina (Persero)', value: 'Rp 12.5 M', submittedDate: '2026-03-22', dueDate: '2026-04-10', status: 'Submitted', version: '2.1' },
    { id: 'PROP-002', title: 'Maintenance Services - Chevron', customer: 'Chevron Pacific Indonesia', value: 'Rp 8.3 M', submittedDate: '2026-03-18', dueDate: '2026-04-05', status: 'Under Review', version: '1.0' },
    { id: 'PROP-003', title: 'Offshore Platform Services - PHE', customer: 'PT Pertamina Hulu Energi', value: 'Rp 18.5 M', submittedDate: '2026-03-20', dueDate: '2026-04-15', status: 'Submitted', version: '1.2' },
    { id: 'PROP-004', title: 'Pipeline Inspection Project', customer: 'PT Medco Energi', value: 'Rp 5.2 M', submittedDate: null, dueDate: '2026-04-20', status: 'Draft', version: '0.8' },
    { id: 'PROP-005', title: 'Refinery Equipment Supply', customer: 'Pertamina RU IV', value: 'Rp 9.8 M', submittedDate: '2026-03-15', dueDate: '2026-03-30', status: 'Awarded', version: '3.0' },
  ];
  const statusColors: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-800', Submitted: 'bg-blue-100 text-blue-800',
    'Under Review': 'bg-yellow-100 text-yellow-800', Awarded: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800',
  };
  const filtered = proposals.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.customer.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-gray-900 mb-1">Proposals</h2><p className="text-sm text-gray-600">Kelola proposal tender dan penawaran</p></div>
        <button onClick={() => setShowNewModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />New Proposal</button>
      </div>
      {showNewModal && <NewProposalModal onClose={() => setShowNewModal(false)} />}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative"><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari proposal..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Proposal', 'Customer', 'Value', 'Status', 'Submitted', 'Due Date', 'Version', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4"><div className="flex items-start gap-2"><FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /><div><div className="font-medium text-gray-900">{p.title}</div><div className="text-xs text-gray-500">{p.id}</div></div></div></td>
                  <td className="px-5 py-4 text-gray-900">{p.customer}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">{p.value}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[p.status] ?? 'bg-gray-100 text-gray-800'}`}>{p.status}</span></td>
                  <td className="px-5 py-4 text-gray-900">{p.submittedDate ?? '—'}</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-900">{p.dueDate}</span></div></td>
                  <td className="px-5 py-4 text-gray-500">v{p.version}</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-1">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><Download className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 p-4 border-t border-gray-200">
          {[{ label: 'Total Proposals', value: proposals.length, color: 'text-gray-900' }, { label: 'Submitted', value: proposals.filter(p => p.status === 'Submitted').length, color: 'text-blue-600' }, { label: 'Awarded', value: proposals.filter(p => p.status === 'Awarded').length, color: 'text-green-600' }].map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4"><div className="text-xs text-gray-600 mb-1">{s.label}</div><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Contracts ────────────────────────────────────────────────────────────────
function Contracts() {
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const contracts = [
    { id: 'CON-001', title: 'Refinery Maintenance - RU IV Cilacap', customer: 'Pertamina RU IV', value: 'Rp 9.8 M', startDate: '2026-04-01', endDate: '2026-10-01', status: 'Active', pct: 15, payment: 'On Track', manager: 'Budi Santoso' },
    { id: 'CON-002', title: 'Pipeline Maintenance Services', customer: 'PT Pertamina (Persero)', value: 'Rp 7.2 M', startDate: '2026-01-15', endDate: '2026-07-15', status: 'Active', pct: 65, payment: 'On Track', manager: 'Siti Rahma' },
    { id: 'CON-003', title: 'Equipment Supply & Installation', customer: 'Chevron Pacific Indonesia', value: 'Rp 12.5 M', startDate: '2025-11-01', endDate: '2026-05-01', status: 'Active', pct: 85, payment: 'Delayed', manager: 'Ahmad Hidayat' },
    { id: 'CON-004', title: 'Technical Consulting Services', customer: 'TotalEnergies EP Indonesie', value: 'Rp 5.5 M', startDate: '2025-09-01', endDate: '2026-03-01', status: 'Completed', pct: 100, payment: 'Completed', manager: 'Dewi Lestari' },
    { id: 'CON-005', title: 'Offshore Platform Inspection', customer: 'PT Pertamina Hulu Energi', value: 'Rp 6.8 M', startDate: '2026-02-01', endDate: '2026-08-01', status: 'Active', pct: 45, payment: 'On Track', manager: 'Budi Santoso' },
  ];
  const statusColors: Record<string, string> = { Active: 'bg-blue-100 text-blue-800', Completed: 'bg-green-100 text-green-800', 'On Hold': 'bg-yellow-100 text-yellow-800' };
  const paymentColors: Record<string, string> = { 'On Track': 'text-green-600', Delayed: 'text-red-600', Completed: 'text-gray-500' };
  const filtered = contracts.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.customer.toLowerCase().includes(search.toLowerCase()));
  const stats = [
    { label: 'Active Contracts', value: contracts.filter(c => c.status === 'Active').length, color: 'text-blue-600' },
    { label: 'Total Value', value: 'Rp 41.8 M', color: 'text-gray-900' },
    { label: 'Completed', value: contracts.filter(c => c.status === 'Completed').length, color: 'text-green-600' },
    { label: 'Payment Issues', value: contracts.filter(c => c.payment === 'Delayed').length, color: 'text-red-600' },
  ];
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-gray-900 mb-1">Contracts</h2><p className="text-sm text-gray-600">Kelola kontrak aktif dan perjanjian</p></div>
        <button onClick={() => setShowNewModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />New Contract</button>
      </div>
      {showNewModal && <NewContractModal onClose={() => setShowNewModal(false)} />}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <div key={i} className="bg-white border border-gray-200 rounded-lg p-4"><div className="text-xs text-gray-600 mb-1">{s.label}</div><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div></div>)}
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative"><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari kontrak..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Contract', 'Customer', 'Value', 'Duration', 'Progress', 'Status', 'Payment', 'Manager'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4"><div className="flex items-start gap-2"><FileCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" /><div><div className="font-medium text-gray-900">{c.title}</div><div className="text-xs text-gray-500">{c.id}</div></div></div></td>
                  <td className="px-5 py-4 text-gray-900">{c.customer}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">{c.value}</td>
                  <td className="px-5 py-4 text-xs"><div className="text-gray-900">{c.startDate}</div><div className="text-gray-500">to {c.endDate}</div></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><div className="w-16 bg-gray-200 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${c.pct}%` }} /></div><span className="text-xs text-gray-600">{c.pct}%</span></div></td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[c.status] ?? 'bg-gray-100 text-gray-800'}`}>{c.status}</span></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-1">{c.payment === 'Delayed' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}<span className={`text-xs font-medium ${paymentColors[c.payment] ?? 'text-gray-600'}`}>{c.payment}</span></div></td>
                  <td className="px-5 py-4 text-gray-900">{c.manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Approvals ────────────────────────────────────────────────────────────────
function Approvals() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const approvals = [
    { id: '1', type: 'proposal', title: 'Technical Proposal - EPC Project Offshore', requestedBy: 'Ahmad Rizki', requestDate: '2026-03-27', amount: '15500000000', description: 'Approval needed for technical proposal submission to PT Pertamina EP', status: 'pending' as const, approver: 'Director of Operations', priority: 'high' as const, documents: 3 },
    { id: '2', type: 'contract', title: 'Contract Agreement - Maintenance Services', requestedBy: 'Siti Nurhaliza', requestDate: '2026-03-26', amount: '22800000000', description: 'Final contract review and approval for Chevron maintenance project', status: 'pending' as const, approver: 'CEO', priority: 'high' as const, documents: 5 },
    { id: '3', type: 'budget', title: 'Project Budget Allocation - Q2 2026', requestedBy: 'Budi Santoso', requestDate: '2026-03-25', amount: '85000000000', description: 'Budget approval for multiple EPC projects in Q2', status: 'approved' as const, approver: 'CFO', priority: 'medium' as const, documents: 2 },
    { id: '4', type: 'reimburse', title: 'Site Visit Expenses - Total E&P', requestedBy: 'Dewi Lestari', requestDate: '2026-03-24', amount: '8500000', description: 'Travel and accommodation expenses for client site visit', status: 'approved' as const, approver: 'Finance Manager', priority: 'low' as const, documents: 4 },
    { id: '5', type: 'proposal', title: 'Commercial Quotation - Pipeline Installation', requestedBy: 'Ahmad Rizki', requestDate: '2026-03-23', amount: '12300000000', description: 'Pricing approval for pipeline installation tender', status: 'rejected' as const, approver: 'Commercial Director', priority: 'medium' as const, documents: 2 },
  ];
  const typeColors: Record<string, string> = { proposal: 'bg-blue-100 text-blue-700', contract: 'bg-purple-100 text-purple-700', budget: 'bg-green-100 text-green-700', reimburse: 'bg-orange-100 text-orange-700' };
  const statusBadge = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
  const priorityBadge = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-700' };
  const filtered = filter === 'all' ? approvals : approvals.filter(a => a.status === filter);
  const fmtAmt = (v: string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseInt(v));
  return (
    <div className="p-6">
      <div className="mb-6"><h2 className="text-lg font-bold text-gray-900 mb-1">Approval Workflow</h2><p className="text-sm text-gray-600">Review dan approve permintaan yang pending</p></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{ label: 'Total', value: approvals.length, color: 'text-gray-900', f: 'all' as const }, { label: 'Pending', value: approvals.filter(a => a.status === 'pending').length, color: 'text-yellow-600', f: 'pending' as const }, { label: 'Approved', value: approvals.filter(a => a.status === 'approved').length, color: 'text-green-600', f: 'approved' as const }, { label: 'Rejected', value: approvals.filter(a => a.status === 'rejected').length, color: 'text-red-600', f: 'rejected' as const }].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(s.f)}>
            <div className="text-xs text-gray-600 mb-1">{s.label}</div><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-5">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map(a => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${typeColors[a.type]}`}><FileText className="w-5 h-5" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${priorityBadge[a.priority]}`}>{a.priority.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{a.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>By: {a.requestedBy}</span><span>•</span>
                    <span>{new Date(a.requestDate).toLocaleDateString('id-ID')}</span><span>•</span>
                    <span>{a.documents} docs</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge[a.status]}`}>{a.status}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[a.type]}`}>{a.type}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs">
                <div><span className="text-gray-500">Amount: </span><span className="font-semibold text-gray-900">{fmtAmt(a.amount)}</span></div>
                <div><span className="text-gray-500">Approver: </span><span className="text-gray-900">{a.approver}</span></div>
              </div>
              {a.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />Reject</button>
                  <button className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Approve</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reimburse ────────────────────────────────────────────────────────────────
function Reimburse() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const requests = [
    { id: '1', num: 'RMB-2026-0045', by: 'Ahmad Rizki', date: '2026-03-27', category: 'travel', desc: 'Tiket pesawat Jakarta-Balikpapan untuk site visit PT Pertamina EP', amount: '4500000', status: 'pending' as const, project: 'EPC Project - Offshore Platform', receipts: 1, approver: 'Finance Manager' },
    { id: '2', num: 'RMB-2026-0044', by: 'Dewi Lestari', date: '2026-03-24', category: 'accommodation', desc: 'Hotel 3 malam selama meeting klien di Surabaya', amount: '6750000', status: 'approved' as const, project: 'Maintenance Contract - Chevron', receipts: 3, approver: 'Finance Manager', approvalDate: '2026-03-25' },
    { id: '3', num: 'RMB-2026-0043', by: 'Budi Santoso', date: '2026-03-22', category: 'meals', desc: 'Client dinner - diskusi tender pipeline', amount: '3200000', status: 'paid' as const, project: 'Pipeline Installation - Total E&P', receipts: 1, approver: 'Finance Manager', approvalDate: '2026-03-23', paymentDate: '2026-03-26' },
    { id: '4', num: 'RMB-2026-0042', by: 'Siti Nurhaliza', date: '2026-03-20', category: 'transportation', desc: 'Sewa kendaraan untuk site survey - 5 hari', amount: '2500000', status: 'approved' as const, project: 'Engineering Services - ExxonMobil', receipts: 2, approver: 'Finance Manager', approvalDate: '2026-03-21' },
    { id: '5', num: 'RMB-2026-0041', by: 'Ahmad Rizki', date: '2026-03-18', category: 'other', desc: 'Cetak dan jilid dokumen proposal', amount: '850000', status: 'rejected' as const, project: 'Various Projects', receipts: 1, approver: 'Finance Manager', approvalDate: '2026-03-19' },
  ];
  const catColors: Record<string, string> = { travel: 'bg-blue-100 text-blue-700', accommodation: 'bg-purple-100 text-purple-700', meals: 'bg-orange-100 text-orange-700', transportation: 'bg-green-100 text-green-700', other: 'bg-gray-100 text-gray-700' };
  const statusBadge = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', paid: 'bg-blue-100 text-blue-700' };
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const fmtAmt = (v: string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseInt(v));
  const totalAmt = requests.reduce((s, r) => s + parseInt(r.amount), 0);
  const pendingAmt = requests.filter(r => r.status === 'pending').reduce((s, r) => s + parseInt(r.amount), 0);
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-gray-900 mb-1">Reimburse Management</h2><p className="text-sm text-gray-600">Submit dan track permintaan reimbursement</p></div>
        <button onClick={() => setShowNewModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm"><Plus className="w-4 h-4" />New Request</button>
      </div>
      {showNewModal && <NewReimburseModal onClose={() => setShowNewModal(false)} />}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', value: requests.length, color: 'text-gray-900', f: 'all' as const },
          { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'text-yellow-600', f: 'pending' as const },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: 'text-green-600', f: 'approved' as const },
          { label: 'Paid', value: requests.filter(r => r.status === 'paid').length, color: 'text-blue-600', f: 'paid' as const },
          { label: 'Total Amount', value: new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(totalAmt) + ' IDR', color: 'text-gray-900', f: 'all' as const },
          { label: 'Pending Amount', value: new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(pendingAmt) + ' IDR', color: 'text-yellow-600', f: 'pending' as const },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(s.f)}>
            <div className="text-xs text-gray-600 mb-1">{s.label}</div><div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map(r => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><Receipt className="w-5 h-5 text-blue-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{r.num}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColors[r.category] ?? 'bg-gray-100 text-gray-700'}`}>{r.category}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{r.desc}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{r.by}</span><span>•</span>
                    <span>{new Date(r.date).toLocaleDateString('id-ID')}</span><span>•</span>
                    <span>{r.project}</span><span>•</span>
                    <span className="flex items-center gap-1"><Upload className="w-3 h-3" />{r.receipts} receipt(s)</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge[r.status]}`}>{r.status}</span>
                <p className="text-base font-bold text-gray-900">{fmtAmt(r.amount)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span>Approver: {r.approver}</span>
                {'approvalDate' in r && (r as any).approvalDate && <><span>•</span><span>Approved: {new Date((r as any).approvalDate).toLocaleDateString('id-ID')}</span></>}
                {'paymentDate' in r && (r as any).paymentDate && <><span>•</span><span>Paid: {new Date((r as any).paymentDate).toLocaleDateString('id-ID')}</span></>}
              </div>
              {r.status === 'pending' && <button className="text-blue-600 hover:text-blue-700 font-medium">View Details</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main CRMPage ─────────────────────────────────────────────────────────────
type CRMTab = 'dashboard' | 'opportunities' | 'customers' | 'proposals' | 'contracts' | 'approvals' | 'reimburse';

interface CRMPageProps {
  activeTab?: CRMTab;
}

export const CRMPage: React.FC<CRMPageProps> = ({ activeTab = 'dashboard' }) => {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customerHistory, setCustomerHistory] = useState<CustomerData[]>([]);

  const handleSelectCustomerById = (id: string) => {
    const found = ALL_CUSTOMERS.find(c => c.id === id);
    if (found) {
      if (selectedCustomer) {
        setCustomerHistory(prev => [...prev, selectedCustomer]);
      }
      setSelectedCustomer(found);
    }
  };

  const handleCustomerBack = () => {
    const prev = customerHistory[customerHistory.length - 1];
    if (prev) {
      setCustomerHistory(h => h.slice(0, -1));
      setSelectedCustomer(prev);
    }
  };

  const handleCloseCustomer = () => {
    setSelectedCustomer(null);
    setCustomerHistory([]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CRMDashboard />;
      case 'opportunities': return <Opportunities onViewDetail={setSelectedOpp} />;
      case 'customers': return <Customers onViewDetail={setSelectedCustomer} />;
      case 'proposals': return <Proposals />;
      case 'contracts': return <Contracts />;
      case 'approvals': return <Approvals />;
      case 'reimburse': return <Reimburse />;
    }
  };

  return (
    <div className="min-h-full">
      {renderContent()}
      {selectedOpp && <OpportunityDetailDrawer opp={selectedOpp} onClose={() => setSelectedOpp(null)} />}
      {selectedCustomer && (
        <CustomerDetailDrawer
          customer={selectedCustomer}
          onClose={handleCloseCustomer}
          onSelectCustomer={handleSelectCustomerById}
          onBack={customerHistory.length > 0 ? handleCustomerBack : undefined}
        />
      )}
    </div>
  );
};
