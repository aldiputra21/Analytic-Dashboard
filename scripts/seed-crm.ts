// seed-crm.ts — Seed CRM schema with demo data
// Run with: npx tsx seed-crm.ts
//
// Pre-requisites:
//   - PostgreSQL schema must be created (drizzle-kit push)
//   - public.users and public.corporates must have data (run init-and-seed.ts or migration first)
//
// Seeds:
//   - 8 customers (with 2 parent-child relationships)
//   - 16 contacts (2 per customer)
//   - 12 opportunities across all pipeline stages
//   - 24 interactions
//   - Stage transitions for advanced opportunities
//   - 4 qualifications
//   - 4 proposals (with documents)
//   - 4 cost estimations
//   - 3 contracts
//   - 6 competitors
//   - 4 sales targets
//   - Opportunity value histories

import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import { db } from '../src/db/connection';
import { users, corporates } from '../src/db/schema/public';
import {
  customers,
  contacts,
  interactions,
  opportunities,
  opportunityValueHistory,
  stageTransitions,
  competitors,
  qualifications,
  proposals,
  proposalDocuments,
  proposalVersions,
  costEstimations,
  contracts,
  contractDocuments,
  salesTargets,
} from '../src/db/schema/crm';
import { sql } from 'drizzle-orm';

// ============================================================================
// Helper
// ============================================================================

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🚀 Seeding CRM data...\n');

  // --- Lookup existing users & corporates ---
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  const allCorps = await db.select({ id: corporates.id, code: corporates.code }).from(corporates);

  if (allUsers.length === 0 || allCorps.length === 0) {
    console.error('❌ No users or corporates found. Run init-and-seed.ts first.');
    process.exit(1);
  }

  const userAdmin = allUsers.find((u) => u.email.includes('admin'))!;
  const userFinance = allUsers.find((u) => u.email.includes('finance'))!;
  const userBanking = allUsers.find((u) => u.email.includes('banking'))!;
  const userOwner = allUsers.find((u) => u.email.includes('owner'))!;

  const corpASI = allCorps.find((c) => c.code === 'ASI')!;
  const corpTSI = allCorps.find((c) => c.code === 'TSI')!;

  // --- Clean existing CRM data (idempotent re-run) ---
  console.log('🗑️  Clearing existing CRM data...');
  await db.execute(sql`TRUNCATE TABLE
    crm.contract_documents,
    crm.contracts,
    crm.proposal_versions,
    crm.proposal_documents,
    crm.proposals,
    crm.cost_estimations,
    crm.qualifications,
    crm.competitors,
    crm.stage_transitions,
    crm.opportunity_value_history,
    crm.interactions,
    crm.opportunities,
    crm.sales_targets,
    crm.contacts,
    crm.customers
    CASCADE`);

  // =========================================================================
  // 1. Customers
  // =========================================================================
  console.log('🏢 Seeding customers...');

  const [custPertamina] = await db
    .insert(customers)
    .values({
      companyName: 'PT Pertamina (Persero)',
      industry: 'Oil & Gas',
      address: 'Jl. Medan Merdeka Timur 1A, Jakarta 10110',
      npwp: '01.001.634.2-091.000',
      status: 'Active',
      createdBy: userAdmin.id,
    })
    .returning();

  const [custPertaminaEP] = await db
    .insert(customers)
    .values({
      companyName: 'PT Pertamina EP',
      industry: 'Oil & Gas',
      address: 'Menara Standard Chartered, Jl. Prof. Dr. Satrio No.164, Jakarta',
      npwp: '01.070.596.4-073.000',
      parentCustomerId: custPertamina.id,
      status: 'Active',
      createdBy: userAdmin.id,
    })
    .returning();

  const [custPLN] = await db
    .insert(customers)
    .values({
      companyName: 'PT PLN (Persero)',
      industry: 'Energy & Utilities',
      address: 'Jl. Trunojoyo Blok M-I/135, Kebayoran Baru, Jakarta 12160',
      npwp: '01.000.013.1-093.000',
      status: 'Active',
      createdBy: userAdmin.id,
    })
    .returning();

  const [custPLNNusantaraPower] = await db
    .insert(customers)
    .values({
      companyName: 'PT PLN Nusantara Power',
      industry: 'Energy & Utilities',
      address: 'Jl. KS Tubun I No.2, Jakarta 11420',
      npwp: '01.061.371.4-093.000',
      parentCustomerId: custPLN.id,
      status: 'Active',
      createdBy: userAdmin.id,
    })
    .returning();

  const [custVale] = await db
    .insert(customers)
    .values({
      companyName: 'PT Vale Indonesia Tbk',
      industry: 'Mining',
      address: 'Pacific Century Place Lt.20, SCBD Lot 10, Jakarta',
      npwp: '01.060.476.4-091.000',
      status: 'Active',
      createdBy: userFinance.id,
    })
    .returning();

  const [custFreeport] = await db
    .insert(customers)
    .values({
      companyName: 'PT Freeport Indonesia',
      industry: 'Mining',
      address: 'Plaza 89, Jl. HR Rasuna Said Kav X-7 No.6, Jakarta',
      npwp: '01.061.078.3-091.000',
      status: 'Active',
      createdBy: userFinance.id,
    })
    .returning();

  const [custChevron] = await db
    .insert(customers)
    .values({
      companyName: 'PT Chevron Pacific Indonesia',
      industry: 'Oil & Gas',
      address: 'Sentral Senayan II, Jl. Asia Afrika No.8, Jakarta 10270',
      npwp: '01.001.716.4-091.000',
      status: 'Active',
      createdBy: userBanking.id,
    })
    .returning();

  const [custAntam] = await db
    .insert(customers)
    .values({
      companyName: 'PT Aneka Tambang Tbk',
      industry: 'Mining',
      address: 'Gedung Aneka Tambang, Jl. Letjen TB Simatupang No.1, Jakarta',
      npwp: '01.000.692.3-091.000',
      status: 'Active',
      createdBy: userBanking.id,
    })
    .returning();

  const allCustomers = [custPertamina, custPertaminaEP, custPLN, custPLNNusantaraPower, custVale, custFreeport, custChevron, custAntam];
  console.log(`   ✅ ${allCustomers.length} customers created`);

  // =========================================================================
  // 2. Contacts (2 per customer)
  // =========================================================================
  console.log('👤 Seeding contacts...');

  const contactData = [
    { cust: custPertamina, name: 'Budi Hartono', title: 'VP Procurement', phone: '021-3815111', email: 'budi.hartono@pertamina.com', role: 'Decision_Maker', isPrimary: true },
    { cust: custPertamina, name: 'Dewi Sartika', title: 'Manager O&M', phone: '021-3815222', email: 'dewi.sartika@pertamina.com', role: 'Technical', isPrimary: false },
    { cust: custPertaminaEP, name: 'Ahmad Fauzi', title: 'Senior Manager Procurement', phone: '021-5228000', email: 'ahmad.fauzi@pertamina-ep.com', role: 'PIC', isPrimary: true },
    { cust: custPertaminaEP, name: 'Rina Widiastuti', title: 'Engineer', phone: '021-5228111', email: 'rina.w@pertamina-ep.com', role: 'Technical', isPrimary: false },
    { cust: custPLN, name: 'Hendra Saputra', title: 'Director of Operations', phone: '021-7261122', email: 'hendra.s@pln.co.id', role: 'Decision_Maker', isPrimary: true },
    { cust: custPLN, name: 'Siti Nurhaliza', title: 'Procurement Staff', phone: '021-7261133', email: 'siti.n@pln.co.id', role: 'PIC', isPrimary: false },
    { cust: custPLNNusantaraPower, name: 'Joko Prasetyo', title: 'Plant Manager PLTU Paiton', phone: '0335-551111', email: 'joko.p@plnnp.co.id', role: 'PIC', isPrimary: true },
    { cust: custPLNNusantaraPower, name: 'Wati Susanti', title: 'Maintenance Supervisor', phone: '0335-551222', email: 'wati.s@plnnp.co.id', role: 'Technical', isPrimary: false },
    { cust: custVale, name: 'David Tobing', title: 'Head of Contracts', phone: '021-5246247', email: 'david.t@vale.com', role: 'Decision_Maker', isPrimary: true },
    { cust: custVale, name: 'Lisa Permata', title: 'Project Engineer', phone: '021-5246200', email: 'lisa.p@vale.com', role: 'Technical', isPrimary: false },
    { cust: custFreeport, name: 'Michael Tanujaya', title: 'VP Supply Chain', phone: '021-5242811', email: 'michael.t@freeport.com', role: 'Decision_Maker', isPrimary: true },
    { cust: custFreeport, name: 'Agus Widodo', title: 'Site Maintenance Manager', phone: '0901-3001', email: 'agus.w@freeport.com', role: 'Technical', isPrimary: false },
    { cust: custChevron, name: 'Robert Siahaan', title: 'Procurement Lead', phone: '021-2934000', email: 'robert.s@chevron.com', role: 'PIC', isPrimary: true },
    { cust: custChevron, name: 'Mei Lin', title: 'Operations Manager Riau', phone: '0761-840000', email: 'mei.lin@chevron.com', role: 'Technical', isPrimary: false },
    { cust: custAntam, name: 'Bambang Sutrisno', title: 'GM Procurement', phone: '021-7891234', email: 'bambang.s@antam.com', role: 'Decision_Maker', isPrimary: true },
    { cust: custAntam, name: 'Novia Rahayu', title: 'Contract Specialist', phone: '021-7891235', email: 'novia.r@antam.com', role: 'PIC', isPrimary: false },
  ];

  await db.insert(contacts).values(
    contactData.map((c) => ({
      customerId: c.cust.id,
      name: c.name,
      title: c.title,
      phone: c.phone,
      email: c.email,
      role: c.role,
      isPrimary: c.isPrimary,
    }))
  );
  console.log(`   ✅ ${contactData.length} contacts created`);

  // =========================================================================
  // 3. Opportunities (12 — across all 6 pipeline stages + mixed statuses)
  // =========================================================================
  console.log('💼 Seeding opportunities...');

  const oppData: Array<typeof opportunities.$inferInsert> = [
    // Lead stage (2)
    {
      name: 'Maintenance Service PLTU Paiton Unit 9',
      customerId: custPLNNusantaraPower.id,
      corporateId: corpTSI.id,
      stage: 'Lead',
      status: 'Active',
      estimatedValue: '2500000000',
      probability: 10,
      assignedTo: userFinance.id,
      description: 'Annual maintenance service contract for PLTU Paiton Unit 9. Initial lead from industry exhibition.',
      createdBy: userFinance.id,
      createdAt: daysAgo(5),
    },
    {
      name: 'Equipment Supply - Antam Smelter Project',
      customerId: custAntam.id,
      corporateId: corpASI.id,
      stage: 'Lead',
      status: 'Active',
      estimatedValue: '1800000000',
      probability: 10,
      assignedTo: userBanking.id,
      description: 'Supply of industrial equipment for new nickel smelter facility in Halmahera.',
      createdBy: userBanking.id,
      createdAt: daysAgo(3),
    },
    // Qualification stage (2)
    {
      name: 'Turnaround Maintenance Kilang Cilacap 2026',
      customerId: custPertamina.id,
      corporateId: corpTSI.id,
      stage: 'Qualification',
      status: 'Active',
      estimatedValue: '15000000000',
      probability: 25,
      assignedTo: userAdmin.id,
      description: 'Major turnaround maintenance project for Pertamina RU IV Cilacap refinery. Scope includes CDU, RFCC, and utility systems.',
      createdBy: userAdmin.id,
      createdAt: daysAgo(20),
    },
    {
      name: 'Pipeline Inspection & Repair - Chevron Riau',
      customerId: custChevron.id,
      corporateId: corpASI.id,
      stage: 'Qualification',
      status: 'Active',
      estimatedValue: '4200000000',
      probability: 25,
      assignedTo: userFinance.id,
      description: 'Pipeline integrity inspection and repair services for Chevron Riau operations.',
      createdBy: userFinance.id,
      createdAt: daysAgo(15),
    },
    // Tender stage (2)
    {
      name: 'O&M Service Contract - PLTU Suralaya',
      customerId: custPLN.id,
      corporateId: corpTSI.id,
      stage: 'Tender',
      status: 'Active',
      estimatedValue: '8500000000',
      probability: 40,
      assignedTo: userAdmin.id,
      description: 'Operation & maintenance service for PLN PLTU Suralaya for 3-year period.',
      tenderName: 'Tender O&M PLTU Suralaya 2026-2029',
      tenderEstimatedValue: '9000000000',
      tenderAnnouncementDate: daysAgo(10),
      createdBy: userAdmin.id,
      createdAt: daysAgo(30),
    },
    {
      name: 'Mechanical Works - Vale Sorowako Smelter',
      customerId: custVale.id,
      corporateId: corpASI.id,
      stage: 'Tender',
      status: 'Active',
      estimatedValue: '6200000000',
      probability: 40,
      assignedTo: userBanking.id,
      description: 'Mechanical maintenance and fabrication works for Vale Sorowako nickel smelter.',
      tenderName: 'Vale Mechanical Works Package 2026',
      tenderEstimatedValue: '7000000000',
      tenderAnnouncementDate: daysAgo(8),
      createdBy: userBanking.id,
      createdAt: daysAgo(25),
    },
    // Proposal stage (2)
    {
      name: 'Shutdown Maintenance - Pertamina EP Limau Field',
      customerId: custPertaminaEP.id,
      corporateId: corpTSI.id,
      stage: 'Proposal',
      status: 'Active',
      estimatedValue: '3800000000',
      probability: 55,
      assignedTo: userFinance.id,
      description: 'Planned shutdown maintenance for surface facilities at Pertamina EP Limau field.',
      tenderName: 'Shutdown Maintenance Limau 2026',
      createdBy: userFinance.id,
      createdAt: daysAgo(40),
    },
    {
      name: 'Electrical Works - Freeport Concentrating',
      customerId: custFreeport.id,
      corporateId: corpASI.id,
      stage: 'Proposal',
      status: 'Active',
      estimatedValue: '5500000000',
      probability: 55,
      assignedTo: userAdmin.id,
      description: 'Electrical installation and maintenance for Freeport concentrating plant expansion.',
      createdBy: userAdmin.id,
      createdAt: daysAgo(35),
    },
    // Negotiation stage (2)
    {
      name: 'Tank Maintenance - Pertamina RU VI Balongan',
      customerId: custPertamina.id,
      corporateId: corpTSI.id,
      stage: 'Negotiation',
      status: 'Active',
      estimatedValue: '7200000000',
      probability: 75,
      assignedTo: userAdmin.id,
      description: 'Storage tank inspection, repair and maintenance at Pertamina RU VI Balongan.',
      createdBy: userAdmin.id,
      createdAt: daysAgo(60),
    },
    {
      name: 'Scaffolding Services - PLN Nusantara Power',
      customerId: custPLNNusantaraPower.id,
      corporateId: corpASI.id,
      stage: 'Negotiation',
      status: 'Active',
      estimatedValue: '1500000000',
      probability: 75,
      assignedTo: userBanking.id,
      description: 'Scaffolding erection and dismantling services for multiple power plant outages.',
      createdBy: userBanking.id,
      createdAt: daysAgo(50),
    },
    // Contract stage — Won (1)
    {
      name: 'Piping Fabrication - Chevron Duri Steam Flood',
      customerId: custChevron.id,
      corporateId: corpTSI.id,
      stage: 'Contract',
      status: 'Won',
      estimatedValue: '9800000000',
      probability: 100,
      assignedTo: userFinance.id,
      description: 'Piping fabrication and installation for Chevron Duri steam flood facility expansion.',
      closedAt: daysAgo(10),
      closedBy: userOwner.id,
      createdBy: userFinance.id,
      createdAt: daysAgo(90),
    },
    // Lost (1)
    {
      name: 'Civil Works - Antam RKEF Project',
      customerId: custAntam.id,
      corporateId: corpASI.id,
      stage: 'Proposal',
      status: 'Lost',
      estimatedValue: '4000000000',
      probability: 0,
      assignedTo: userBanking.id,
      description: 'Civil and structural works for Antam RKEF project in Halmahera.',
      closeReason: 'Competitor offered significantly lower price with local resource advantage.',
      closeCategory: 'Harga',
      closedAt: daysAgo(7),
      closedBy: userOwner.id,
      createdBy: userBanking.id,
      createdAt: daysAgo(70),
    },
  ];

  const insertedOpps = [];
  for (const opp of oppData) {
    const [inserted] = await db.insert(opportunities).values(opp as typeof opportunities.$inferInsert).returning();
    insertedOpps.push(inserted);
  }
  console.log(`   ✅ ${insertedOpps.length} opportunities created`);

  // =========================================================================
  // 4. Stage Transitions (for opportunities past Lead)
  // =========================================================================
  console.log('🔄 Seeding stage transitions...');

  const stages = ['Lead', 'Qualification', 'Tender', 'Proposal', 'Negotiation', 'Contract'];
  let transitionCount = 0;

  for (const opp of insertedOpps) {
    const stageIdx = stages.indexOf(opp.stage!);
    // Build transition history up to current stage
    for (let i = 0; i <= stageIdx; i++) {
      await db.insert(stageTransitions).values({
        opportunityId: opp.id,
        fromStage: i === 0 ? null : stages[i - 1],
        toStage: stages[i],
        transitionedBy: opp.assignedTo!,
        transitionedAt: new Date(opp.createdAt!.getTime() + i * 5 * 86400000),
        notes: i === 0 ? 'Initial creation' : `Moved to ${stages[i]}`,
      });
      transitionCount++;
    }
  }
  console.log(`   ✅ ${transitionCount} stage transitions created`);

  // =========================================================================
  // 5. Interactions
  // =========================================================================
  console.log('📞 Seeding interactions...');

  const interactionData: Array<typeof interactions.$inferInsert> = [];

  // Customer-level interactions
  for (const cust of [custPertamina, custPLN, custVale, custFreeport]) {
    interactionData.push(
      {
        entityId: cust.id,
        entityType: 'customer',
        type: 'Visit',
        interactionDate: daysAgo(45),
        summary: `Initial courtesy visit to ${cust.companyName}. Discussed potential collaboration areas.`,
        nextAction: 'Send company profile and capability presentation.',
        nextActionDate: daysAgo(40),
        createdBy: userAdmin.id,
      },
      {
        entityId: cust.id,
        entityType: 'customer',
        type: 'Email',
        interactionDate: daysAgo(40),
        summary: `Sent company profile, portfolio, and HSE documentation to procurement team.`,
        createdBy: userFinance.id,
      }
    );
  }

  // Opportunity-level interactions
  for (const opp of insertedOpps.slice(0, 8)) {
    interactionData.push(
      {
        entityId: opp.id,
        entityType: 'opportunity',
        type: 'Meeting',
        interactionDate: new Date(opp.createdAt!.getTime() + 2 * 86400000),
        summary: `Kick-off meeting for ${opp.name}. Discussed scope, timeline, and resource requirements.`,
        nextAction: 'Prepare technical proposal and cost estimation.',
        nextActionDate: new Date(opp.createdAt!.getTime() + 10 * 86400000),
        createdBy: opp.assignedTo!,
      },
      {
        entityId: opp.id,
        entityType: 'opportunity',
        type: 'Phone',
        interactionDate: new Date(opp.createdAt!.getTime() + 7 * 86400000),
        summary: `Follow-up call regarding ${opp.name}. Client confirmed interest and timeline.`,
        createdBy: opp.assignedTo!,
      }
    );
  }

  await db.insert(interactions).values(interactionData);
  console.log(`   ✅ ${interactionData.length} interactions created`);

  // =========================================================================
  // 6. Qualifications (for Tender+ opportunities)
  // =========================================================================
  console.log('✅ Seeding qualifications...');

  const qualOpps = insertedOpps.filter(
    (o) => stages.indexOf(o.stage!) >= stages.indexOf('Tender')
  );

  const qualInserted = [];
  for (const opp of qualOpps) {
    const isAdvanced = stages.indexOf(opp.stage!) >= stages.indexOf('Proposal');
    const [q] = await db
      .insert(qualifications)
      .values({
        opportunityId: opp.id,
        version: 1,
        technicalCapabilityScore: 7 + Math.floor(Math.random() * 3),
        resourceAvailabilityScore: 6 + Math.floor(Math.random() * 4),
        contractValueScore: 7 + Math.floor(Math.random() * 3),
        estimatedMarginScore: 5 + Math.floor(Math.random() * 4),
        riskScore: 4 + Math.floor(Math.random() * 4),
        feasibilityScore: String(65 + Math.floor(Math.random() * 25)),
        recommendation: 'Proceed',
        status: isAdvanced ? 'Approved' : 'Draft',
        notes: `Qualification assessment for ${opp.name}. Technical capability and resource availability are strong.`,
        createdBy: userOwner.id,
      })
      .returning();
    qualInserted.push(q);
  }
  console.log(`   ✅ ${qualInserted.length} qualifications created`);

  // =========================================================================
  // 7. Proposals (for Proposal+ opportunities)
  // =========================================================================
  console.log('📄 Seeding proposals...');

  const proposalOpps = insertedOpps.filter(
    (o) => stages.indexOf(o.stage!) >= stages.indexOf('Proposal') && o.status !== 'Lost'
  );

  const proposalInserted = [];
  for (const opp of proposalOpps) {
    const isNegotiating = stages.indexOf(opp.stage!) >= stages.indexOf('Negotiation');
    const [p] = await db
      .insert(proposals)
      .values({
        opportunityId: opp.id,
        version: 'v1.0',
        title: `Technical & Commercial Proposal - ${opp.name}`,
        content: `Comprehensive proposal covering scope of work, methodology, timeline, resource plan, and commercial terms for ${opp.name}.`,
        status: isNegotiating ? 'Submitted' : 'In_Review',
        submissionDeadline: new Date(opp.createdAt!.getTime() + 30 * 86400000),
        submittedAt: isNegotiating ? new Date(opp.createdAt!.getTime() + 25 * 86400000) : undefined,
        submittedBy: isNegotiating ? opp.assignedTo! : undefined,
        submissionMethod: isNegotiating ? 'E-Procurement Portal' : undefined,
        createdBy: opp.assignedTo!,
      })
      .returning();
    proposalInserted.push(p);

    // Add proposal documents
    await db.insert(proposalDocuments).values([
      {
        proposalId: p.id,
        fileName: `Proposal_${opp.name?.replace(/\s+/g, '_').substring(0, 30)}_Technical.pdf`,
        filePath: `/uploads/proposals/${p.id}/technical.pdf`,
        fileSize: 2500000 + Math.floor(Math.random() * 3000000),
        fileType: 'pdf',
        uploadedBy: opp.assignedTo!,
      },
      {
        proposalId: p.id,
        fileName: `Proposal_${opp.name?.replace(/\s+/g, '_').substring(0, 30)}_Commercial.xlsx`,
        filePath: `/uploads/proposals/${p.id}/commercial.xlsx`,
        fileSize: 500000 + Math.floor(Math.random() * 1000000),
        fileType: 'xlsx',
        uploadedBy: opp.assignedTo!,
      },
    ]);

    // Add proposal version snapshot
    await db.insert(proposalVersions).values({
      proposalId: p.id,
      version: 'v1.0',
      snapshot: { title: p.title, status: p.status, content: p.content },
      createdBy: opp.assignedTo!,
    });
  }
  console.log(`   ✅ ${proposalInserted.length} proposals (with documents & versions) created`);

  // =========================================================================
  // 8. Cost Estimations (for Tender+ non-lost opportunities)
  // =========================================================================
  console.log('💰 Seeding cost estimations...');

  const costOpps = insertedOpps.filter(
    (o) => stages.indexOf(o.stage!) >= stages.indexOf('Tender') && o.status !== 'Lost'
  );

  for (const opp of costOpps) {
    const value = Number(opp.estimatedValue);
    const materialPct = 0.3 + Math.random() * 0.1;
    const laborPct = 0.25 + Math.random() * 0.1;
    const equipPct = 0.1 + Math.random() * 0.05;
    const subconPct = 0.05 + Math.random() * 0.05;
    const overheadPct = 0.05 + Math.random() * 0.03;
    const totalCostPct = materialPct + laborPct + equipPct + subconPct + overheadPct;
    const totalCost = Math.round(value * totalCostPct);
    const margin = ((value - totalCost) / value) * 100;

    await db.insert(costEstimations).values({
      opportunityId: opp.id,
      version: 1,
      materialCost: String(Math.round(value * materialPct)),
      laborCost: String(Math.round(value * laborPct)),
      equipmentCost: String(Math.round(value * equipPct)),
      subcontractorCost: String(Math.round(value * subconPct)),
      overheadCost: String(Math.round(value * overheadPct)),
      totalCost: String(totalCost),
      opportunityValue: String(value),
      marginPercentage: String(Math.round(margin * 100) / 100),
      notes: `Cost estimation for ${opp.name}`,
      createdBy: opp.assignedTo!,
    });
  }
  console.log(`   ✅ ${costOpps.length} cost estimations created`);

  // =========================================================================
  // 9. Competitors
  // =========================================================================
  console.log('🏁 Seeding competitors...');

  const competitorNames = [
    'PT Rekayasa Industri',
    'PT Wika Gedung',
    'PT Elnusa Tbk',
    'PT Wijaya Karya Tbk',
    'PT PP Engineering',
    'PT Krakatau Engineering',
  ];

  let compCount = 0;
  for (const opp of insertedOpps.filter((o) => stages.indexOf(o.stage!) >= stages.indexOf('Tender'))) {
    const numComps = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numComps; i++) {
      const compName = competitorNames[(compCount + i) % competitorNames.length];
      const oppValue = Number(opp.estimatedValue);
      const bidVariation = 0.85 + Math.random() * 0.25;

      await db.insert(competitors).values({
        opportunityId: opp.id,
        competitorName: compName,
        estimatedBidValue: String(Math.round(oppValue * bidVariation)),
        notes: `${compName} is known to be bidding on this project.`,
        createdBy: opp.assignedTo!,
      });
      compCount++;
    }
  }
  console.log(`   ✅ ${compCount} competitors created`);

  // =========================================================================
  // 10. Opportunity Value History
  // =========================================================================
  console.log('📈 Seeding opportunity value history...');

  let valHistCount = 0;
  for (const opp of insertedOpps.filter((o) => stages.indexOf(o.stage!) >= stages.indexOf('Qualification'))) {
    const currentValue = Number(opp.estimatedValue);
    const initialValue = Math.round(currentValue * (0.8 + Math.random() * 0.15));

    if (initialValue !== currentValue) {
      await db.insert(opportunityValueHistory).values({
        opportunityId: opp.id,
        oldValue: String(initialValue),
        newValue: String(currentValue),
        changedBy: opp.assignedTo!,
        changedAt: new Date(opp.createdAt!.getTime() + 10 * 86400000),
      });
      valHistCount++;
    }
  }
  console.log(`   ✅ ${valHistCount} value history records created`);

  // =========================================================================
  // 11. Contracts (for Won opportunities)
  // =========================================================================
  console.log('📝 Seeding contracts...');

  const wonOpps = insertedOpps.filter((o) => o.status === 'Won');
  const contractInserted = [];

  for (const opp of wonOpps) {
    const [c] = await db
      .insert(contracts)
      .values({
        opportunityId: opp.id,
        contractNumber: `CTR-${new Date().getFullYear()}-${String(contractInserted.length + 1).padStart(4, '0')}`,
        title: `Contract - ${opp.name}`,
        customerId: opp.customerId!,
        value: opp.estimatedValue!,
        startDate: daysAgo(5),
        endDate: new Date(Date.now() + 365 * 86400000),
        scopeOfWork: opp.description,
        status: 'Active',
        signedAt: daysAgo(8),
        signedBy: 'Director of Operations',
        createdBy: opp.assignedTo!,
      })
      .returning();
    contractInserted.push(c);

    // Add contract document
    await db.insert(contractDocuments).values({
      contractId: c.id,
      fileName: `Contract_${c.contractNumber}.pdf`,
      filePath: `/uploads/contracts/${c.id}/signed_contract.pdf`,
      fileSize: 5000000 + Math.floor(Math.random() * 3000000),
      version: 1,
      uploadedBy: opp.assignedTo!,
    });
  }
  console.log(`   ✅ ${contractInserted.length} contracts (with documents) created`);

  // =========================================================================
  // 12. Sales Targets
  // =========================================================================
  console.log('🎯 Seeding sales targets...');

  const salesUsers = [userAdmin, userFinance, userBanking, userOwner];
  const currentYear = new Date().getFullYear();

  for (const u of salesUsers) {
    await db.insert(salesTargets).values({
      userId: u.id,
      period: String(currentYear),
      targetRevenue: String(20000000000 + Math.floor(Math.random() * 10000000000)),
      targetDeals: 5 + Math.floor(Math.random() * 5),
      setBy: userOwner.id,
    });
  }
  console.log(`   ✅ ${salesUsers.length} sales targets created`);

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n📊 CRM Seed Summary');
  const counts = [
    'crm.customers', 'crm.contacts', 'crm.opportunities', 'crm.interactions',
    'crm.stage_transitions', 'crm.qualifications', 'crm.proposals',
    'crm.proposal_documents', 'crm.proposal_versions', 'crm.cost_estimations',
    'crm.competitors', 'crm.opportunity_value_history', 'crm.contracts',
    'crm.contract_documents', 'crm.sales_targets',
  ];

  for (const t of counts) {
    const res = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${t}`));
    console.log(`   ${t}: ${res.rows[0].count} rows`);
  }

  console.log('\n🎉 CRM seed complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ CRM seed failed:', err);
  process.exit(1);
});
