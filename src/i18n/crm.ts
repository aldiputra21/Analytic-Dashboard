import { Locale } from './commons';

export interface CRMCopy {
  title: string;
  subtitle: string;
  newOpportunity: string;
  newCustomer: string;
  newProposal: string;
  newContract: string;
  newReimburse: string;
  searchPlaceholder: string;
  pipeline: {
    title: string;
    stageLead: string;
    stageQualification: string;
    stageProposal: string;
    stageNegotiation: string;
    stageContract: string;
    empty: string;
  };
  opportunity: {
    id: string;
    title: string;
    customer: string;
    value: string;
    probability: string;
    owner: string;
    expectedCloseDate: string;
    lastActivity: string;
    priority: string;
    industry: string;
    projectCategory: string;
    location: string;
    tags: string;
    description: string;
  };
  leadInfo: {
    title: string;
    source: string;
    referredBy: string;
    initialContactDate: string;
    projectType: string;
    estimatedBudget: string;
    decisionTimeline: string;
    painPoints: string;
    nextFollowUp: string;
    score: string;
    temperature: string;
  };
  qualification: {
    title: string;
    budget: string;
    authority: string;
    need: string;
    timeline: string;
    technicalFit: string;
    budgetFit: string;
    competitors: string;
    score: string;
    goNoGo: string;
    scopeOfWork: string;
    technicalRequirements: string;
  };
  proposal: {
    title: string;
    number: string;
    version: string;
    deadline: string;
    submittedDate: string;
    value: string;
    margin: string;
    technicalScore: string;
    commercialScore: string;
    status: string;
    differentiators: string;
    risks: string;
    presentation: string;
  };
  negotiation: {
    title: string;
    round: string;
    valueComparison: string;
    initialOffer: string;
    currentOffer: string;
    counterOffer: string;
    discount: string;
    targetSignDate: string;
    legalReview: string;
    paymentTerms: string;
    warranty: string;
    penalty: string;
    activeTerms: string;
    dealBreakers: string;
  };
  contract: {
    title: string;
    number: string;
    type: string;
    value: string;
    pm: string;
    dates: string;
    location: string;
    performanceBond: string;
    retention: string;
    milestones: string;
    deliverables: string;
  };
  modals: {
    opportunity: {
      createTitle: string;
      editTitle: string;
      subtitle: string;
      basicInfo: string;
      dealDetails: string;
      leadInfo: string;
      titleLabel: string;
      customerLabel: string;
      contactLabel: string;
      phoneLabel: string;
      emailLabel: string;
      categoryLabel: string;
      industryLabel: string;
      locationLabel: string;
      tagsLabel: string;
      tagPlaceholder: string;
      priorityLabel: string;
      ownerLabel: string;
      expectedCloseLabel: string;
      valueLabel: string;
      probLabel: string;
      descLabel: string;
      sourceLabel: string;
      tempLabel: string;
      referredLabel: string;
      contactDateLabel: string;
      typeLabel: string;
      budgetLabel: string;
      timelineLabel: string;
      painLabel: string;
      followUpLabel: string;
      save: string;
    };
    customer: {
      createTitle: string;
      subtitle: string;
      companySection: string;
      companyName: string;
      parentCompany: string;
      industry: string;
      npwp: string;
      phone: string;
      email: string;
      website: string;
      city: string;
      province: string;
      size: string;
      revenue: string;
      address: string;
      contactsSection: string;
      addContact: string;
      notes: string;
      save: string;
    };
    proposal: {
      createTitle: string;
      subtitle: string;
      basicInfo: string;
      opportunity: string;
      title: string;
      version: string;
      template: string;
      deadline: string;
      method: string;
      commercialSection: string;
      value: string;
      margin: string;
      criteriaSection: string;
      addCriteria: string;
      diffSection: string;
      riskSection: string;
      presentation: string;
      reviewer: string;
      summary: string;
      upload: string;
      saveDraft: string;
      save: string;
    };
    contract: {
      createTitle: string;
      subtitle: string;
      basicInfo: string;
      opportunity: string;
      contractNumber: string;
      type: string;
      title: string;
      value: string;
      pm: string;
      effectiveDate: string;
      expiryDate: string;
      signedDate: string;
      mobilizationDate: string;
      location: string;
      termsSection: string;
      paymentTerms: string;
      warranty: string;
      retention: string;
      penalty: string;
      perfBond: string;
      milestoneSection: string;
      milestoneLabel: string;
      milestoneDate: string;
      deliverableSection: string;
      scopeSection: string;
      upload: string;
      saveDraft: string;
      save: string;
    };
    reimburse: {
      createTitle: string;
      subtitle: string;
      basicInfo: string;
      requester: string;
      project: string;
      activityDate: string;
      approver: string;
      categorySection: string;
      categories: {
        travel: string;
        accommodation: string;
        meals: string;
        transportation: string;
        entertainment: string;
        printing: string;
        other: string;
      };
      description: string;
      receiptSection: string;
      addItem: string;
      itemDescription: string;
      itemDate: string;
      itemAmount: string;
      bankSection: string;
      bankName: string;
      bankAccount: string;
      upload: string;
      notes: string;
      saveDraft: string;
      save: string;
    };
  };
  page: {
    title: string;
    subtitle: string;
    tabs: {
      overview: string;
      pipeline: string;
      customers: string;
      reports: string;
      benchmarking: string;
    };
    stats: {
      pipelineValue: string;
      activeOpp: string;
      winRate: string;
      avgDeal: string;
    };
    charts: {
      pipelineTitle: string;
      revenueTitle: string;
      winLossTitle: string;
      byIndustryTitle: string;
    };
    panels: {
      overview: string;
      activities: string;
      documents: string;
      stageDetails: string;
      leadInfo: string;
      qualification: string;
      proposal: string;
      negotiation: string;
      contract: string;
    };
    fields: {
      owner: string;
      value: string;
      probability: string;
      stage: string;
      status: string;
      priority: string;
      customer: string;
      contact: string;
      lastActivity: string;
      closeDate: string;
      daysInStage: string;
    };
    stages: Record<string, string>;
    priorities: Record<string, string>;
    temperatures: Record<string, string>;
    drawer: {
      overview: string;
      contacts: string;
      children: string;
      backToParent: string;
      parent: string;
      activeOpportunities: string;
      totalValue: string;
      companyInfo: string;
      primaryContact: string;
      keyInformation: string;
      industry: string;
      status: string;
      lastContact: string;
      parentCompany: string;
      viewAll: string;
      primary: string;
    };
    customers: {
      title: string;
      subtitle: string;
      addNew: string;
      searchPlaceholder: string;
      subsidiaryOf: string;
      viewDetails: string;
      lastContact: string;
    };
    proposals: {
      title: string;
      subtitle: string;
      addNew: string;
      searchPlaceholder: string;
      table: {
        proposal: string;
        customer: string;
        value: string;
        status: string;
        submitted: string;
        dueDate: string;
        version: string;
        actions: string;
      };
      total: string;
      submitted: string;
      awarded: string;
    };
    contracts: {
      title: string;
      subtitle: string;
      addNew: string;
      searchPlaceholder: string;
      active: string;
      completed: string;
      paymentIssues: string;
    };
  };
}

export const crmI18n: Record<Locale, CRMCopy> = {
  id: {
    title: 'CRM Dashboard',
    subtitle: 'Kelola pipeline B2B, pelanggan, dan kontrak dalam satu tempat.',
    newOpportunity: 'Opportunity Baru',
    newCustomer: 'Pelanggan Baru',
    newProposal: 'Proposal Baru',
    newContract: 'Kontrak Baru',
    newReimburse: 'Reimburse Baru',
    searchPlaceholder: 'Cari opportunity, customer, atau owner...',
    pipeline: {
      title: 'Opportunity Pipeline',
      stageLead: 'Lead',
      stageQualification: 'Kualifikasi',
      stageProposal: 'Proposal',
      stageNegotiation: 'Negosiasi',
      stageContract: 'Kontrak',
      empty: 'Tidak ada opportunity di stage ini',
    },
    opportunity: {
      id: 'ID',
      title: 'Judul',
      customer: 'Customer',
      value: 'Nilai',
      probability: 'Probabilitas',
      owner: 'Owner',
      expectedCloseDate: 'Estimasi Closing',
      lastActivity: 'Aktivitas Terakhir',
      priority: 'Prioritas',
      industry: 'Industri',
      projectCategory: 'Kategori',
      location: 'Lokasi',
      tags: 'Tags',
      description: 'Deskripsi',
    },
    leadInfo: {
      title: 'Informasi Lead',
      source: 'Sumber Lead',
      referredBy: 'Referral',
      initialContactDate: 'Kontak Pertama',
      projectType: 'Tipe Proyek',
      estimatedBudget: 'Estimasi Budget',
      decisionTimeline: 'Timeline Keputusan',
      painPoints: 'Pain Points / Kebutuhan',
      nextFollowUp: 'Follow-up Berikutnya',
      score: 'Skor Lead',
      temperature: 'Temperatur',
    },
    qualification: {
      title: 'Kualifikasi (BANT)',
      budget: 'Budget',
      authority: 'Otoritas',
      need: 'Kebutuhan',
      timeline: 'Timeline',
      technicalFit: 'Kesesuaian Teknis',
      budgetFit: 'Kesesuaian Budget',
      competitors: 'Kompetitor',
      score: 'Skor Kualifikasi',
      goNoGo: 'Keputusan Go/No-Go',
      scopeOfWork: 'Lingkup Kerja',
      technicalRequirements: 'Persyaratan Teknis',
    },
    proposal: {
      title: 'Detail Proposal',
      number: 'Nomor Proposal',
      version: 'Versi',
      deadline: 'Deadline Submission',
      submittedDate: 'Tanggal Submit',
      value: 'Nilai Proposal',
      margin: 'Margin',
      technicalScore: 'Skor Teknis',
      commercialScore: 'Skor Komersial',
      status: 'Status Proposal',
      differentiators: 'Differentiators Utama',
      risks: 'Item Risiko',
      presentation: 'Presentasi',
    },
    negotiation: {
      title: 'Negosiasi',
      round: 'Ronde',
      valueComparison: 'Perbandingan Nilai',
      initialOffer: 'Penawaran Awal',
      currentOffer: 'Penawaran Saat Ini',
      counterOffer: 'Counter Offer Klien',
      discount: 'Diskon',
      targetSignDate: 'Target Tanda Tangan',
      legalReview: 'Legal Review',
      paymentTerms: 'Payment Terms',
      warranty: 'Garansi',
      penalty: 'Penalty Clause',
      activeTerms: 'Poin Negosiasi Aktif',
      dealBreakers: 'Deal Breakers',
    },
    contract: {
      title: 'Detail Kontrak',
      number: 'Nomor Kontrak',
      type: 'Tipe Kontrak',
      value: 'Nilai Kontrak',
      pm: 'Project Manager',
      dates: 'Efektif — Berakhir',
      location: 'Lokasi Proyek',
      performanceBond: 'Performance Bond',
      retention: 'Retention',
      milestones: 'Payment Milestones',
      deliverables: 'Deliverables',
    },
    modals: {
      opportunity: {
        createTitle: 'New Opportunity',
        editTitle: 'Edit Opportunity',
        subtitle: 'Tambah opportunity baru ke pipeline',
        basicInfo: 'Info Dasar',
        dealDetails: 'Detail Deal',
        leadInfo: 'Info Lead',
        titleLabel: 'Judul Opportunity',
        customerLabel: 'Customer',
        contactLabel: 'Contact Person',
        phoneLabel: 'Phone',
        emailLabel: 'Email',
        categoryLabel: 'Kategori Proyek',
        industryLabel: 'Industri',
        locationLabel: 'Lokasi Proyek',
        tagsLabel: 'Tags',
        tagPlaceholder: 'Tambah tag (Enter)',
        priorityLabel: 'Prioritas',
        ownerLabel: 'Owner',
        expectedCloseLabel: 'Expected Close Date',
        valueLabel: 'Estimasi Nilai (IDR)',
        probLabel: 'Win Probability',
        descLabel: 'Deskripsi',
        sourceLabel: 'Lead Source',
        tempLabel: 'Lead Temperature',
        referredLabel: 'Referred By',
        contactDateLabel: 'Initial Contact Date',
        typeLabel: 'Tipe Proyek',
        budgetLabel: 'Estimasi Budget Klien',
        timelineLabel: 'Decision Timeline',
        painLabel: 'Pain Points / Kebutuhan Klien',
        followUpLabel: 'Next Follow-up',
        save: 'Simpan Opportunity',
      },
      customer: {
        createTitle: 'New Customer',
        subtitle: 'Tambah data pelanggan baru',
        companySection: 'Informasi Perusahaan',
        companyName: 'Nama Perusahaan',
        parentCompany: 'Perusahaan Induk',
        industry: 'Industri',
        npwp: 'NPWP',
        phone: 'Phone Kantor',
        email: 'Email Perusahaan',
        website: 'Website',
        city: 'Kota',
        province: 'Provinsi',
        size: 'Ukuran Perusahaan',
        revenue: 'Estimasi Revenue Tahunan',
        address: 'Alamat Lengkap',
        contactsSection: 'Contact Persons',
        addContact: 'Tambah Contact',
        notes: 'Catatan',
        save: 'Simpan Customer',
      },
      proposal: {
        createTitle: 'New Proposal',
        subtitle: 'Buat proposal baru untuk opportunity',
        basicInfo: 'Informasi Dasar',
        opportunity: 'Opportunity',
        title: 'Judul Proposal',
        version: 'Versi',
        template: 'Template',
        deadline: 'Deadline Submission',
        method: 'Metode Submission',
        commercialSection: 'Nilai Komersial',
        value: 'Nilai Proposal (IDR)',
        margin: 'Target Margin (%)',
        criteriaSection: 'Kriteria Evaluasi',
        addCriteria: 'Tambah Kriteria',
        diffSection: 'Key Differentiators',
        riskSection: 'Risk Items',
        presentation: 'Tanggal Presentasi',
        reviewer: 'Internal Reviewer',
        summary: 'Executive Summary',
        upload: 'Upload Dokumen',
        saveDraft: 'Simpan Draft',
        save: 'Buat Proposal',
      },
      contract: {
        createTitle: 'New Contract',
        subtitle: 'Buat kontrak baru dari opportunity yang won',
        basicInfo: 'Informasi Kontrak',
        opportunity: 'Opportunity',
        contractNumber: 'Nomor Kontrak',
        type: 'Tipe Kontrak',
        title: 'Judul Kontrak',
        value: 'Nilai Kontrak (IDR)',
        pm: 'Project Manager',
        effectiveDate: 'Tanggal Efektif',
        expiryDate: 'Tanggal Berakhir',
        signedDate: 'Tanggal Tanda Tangan',
        mobilizationDate: 'Tanggal Mobilisasi',
        location: 'Lokasi Proyek',
        termsSection: 'Terms & Conditions',
        paymentTerms: 'Payment Terms',
        warranty: 'Warranty (bulan)',
        retention: 'Retention (%)',
        penalty: 'Penalty Cap (%)',
        perfBond: 'Performance Bond diperlukan',
        milestoneSection: 'Payment Milestones',
        milestoneLabel: 'Nama milestone',
        milestoneDate: 'Due Date',
        deliverableSection: 'Deliverables',
        scopeSection: 'Scope of Work',
        upload: 'Upload Dokumen Kontrak',
        saveDraft: 'Simpan Draft',
        save: 'Buat Kontrak',
      },
      reimburse: {
        createTitle: 'New Reimbursement Request',
        subtitle: 'Ajukan permintaan penggantian biaya',
        basicInfo: 'Informasi Pengajuan',
        requester: 'Pemohon',
        project: 'Proyek / Kegiatan',
        activityDate: 'Tanggal Kegiatan',
        approver: 'Approver',
        categorySection: 'Kategori Biaya',
        categories: {
          travel: '✈ Travel',
          accommodation: '🏨 Akomodasi',
          meals: '🍽 Makan & Minum',
          transportation: '🚗 Transportasi',
          entertainment: '🎭 Entertainment',
          printing: '🖨 Cetak & ATK',
          other: '📦 Lainnya',
        },
        description: 'Deskripsi Kegiatan',
        receiptSection: 'Rincian Biaya',
        addItem: 'Tambah Item',
        itemDescription: 'Deskripsi item',
        itemDate: 'Tanggal',
        itemAmount: 'Jumlah (IDR)',
        bankSection: 'Informasi Rekening',
        bankName: 'Nama Bank',
        bankAccount: 'Nomor Rekening',
        upload: 'Upload Bukti / Kwitansi',
        notes: 'Catatan Tambahan',
        saveDraft: 'Simpan Draft',
        save: 'Ajukan Reimburse',
      },
    },
    page: {
      title: 'CRM Dashboard',
      subtitle: 'Pantau pipeline penjualan, leads, dan performa akun pelanggan',
      tabs: {
        overview: 'Ringkasan',
        pipeline: 'Pipeline',
        customers: 'Pelanggan',
        reports: 'Laporan',
        benchmarking: 'Benchmarking',
      },
      stats: {
        pipelineValue: 'Total Nilai Pipeline',
        activeOpp: 'Opportunity Aktif',
        winRate: 'Win Rate (%)',
        avgDeal: 'Rata-rata Deal',
      },
      charts: {
        pipelineTitle: 'Pipeline per Tahap',
        revenueTitle: 'Proyeksi Pendapatan',
        winLossTitle: 'Analisis Win/Loss',
        byIndustryTitle: 'Distribusi per Industri',
      },
      panels: {
        overview: 'Ringkasan',
        activities: 'Aktivitas',
        documents: 'Dokumen',
        stageDetails: 'Detail Tahap',
        leadInfo: 'Informasi Lead',
        qualification: 'Kualifikasi (BANT)',
        proposal: 'Detail Proposal',
        negotiation: 'Negosiasi',
        contract: 'Detail Kontrak',
      },
      fields: {
        owner: 'Sales Owner',
        value: 'Nilai Deal',
        probability: 'Probabilitas',
        stage: 'Tahap Pipeline',
        status: 'Status',
        priority: 'Prioritas',
        customer: 'Pelanggan',
        contact: 'Kontak Utama',
        lastActivity: 'Aktivitas Terakhir',
        closeDate: 'Target Closing',
        daysInStage: 'Hari di Tahap Ini',
      },
      stages: {
        Lead: 'Lead',
        Qualification: 'Kualifikasi',
        Proposal: 'Proposal',
        Negotiation: 'Negosiasi',
        Contract: 'Kontrak',
      },
      priorities: {
        Low: 'Rendah',
        Medium: 'Sedang',
        High: 'Tinggi',
        Critical: 'Kritis',
      },
      temperatures: {
        Cold: 'Cold',
        Warm: 'Warm',
        Hot: 'Hot',
      },
      drawer: {
        overview: 'Overview',
        contacts: 'Kontak',
        children: 'Anak Perusahaan',
        backToParent: 'Kembali ke Perusahaan Induk',
        parent: 'Induk',
        activeOpportunities: 'Active Opportunities',
        totalValue: 'Total Value',
        companyInfo: 'Informasi Perusahaan',
        primaryContact: 'Primary Contact',
        keyInformation: 'Key Information',
        industry: 'Industri',
        status: 'Status',
        lastContact: 'Aktivitas Terakhir',
        parentCompany: 'Perusahaan Induk',
        viewAll: 'Lihat semua',
        primary: 'Primary',
      },
      customers: {
        title: 'Pelanggan',
        subtitle: 'Kelola hubungan pelanggan dan kontak',
        addNew: 'Pelanggan Baru',
        searchPlaceholder: 'Cari customer...',
        subsidiaryOf: 'Anak perusahaan dari',
        viewDetails: 'Lihat Detail',
        lastContact: 'Kontak terakhir',
      },
      proposals: {
        title: 'Proposal',
        subtitle: 'Pantau status penawaran dan deadline submission',
        addNew: 'Proposal Baru',
        searchPlaceholder: 'Cari proposal...',
        table: {
          proposal: 'Proposal',
          customer: 'Customer',
          value: 'Nilai',
          status: 'Status',
          submitted: 'Dikirim',
          dueDate: 'Deadline',
          version: 'Versi',
          actions: 'Aksi',
        },
        total: 'Total Proposal',
        submitted: 'Telah Dikirim',
        awarded: 'Diterima',
      },
      contracts: {
        title: 'Kontrak',
        subtitle: 'Kelola kontrak aktif dan monitoring milestone',
        addNew: 'Kontrak Baru',
        searchPlaceholder: 'Cari kontrak...',
        active: 'Kontrak Aktif',
        completed: 'Selesai',
        paymentIssues: 'Masalah Pembayaran',
      },
    },
  },
  en: {
    title: 'CRM Dashboard',
    subtitle: 'Manage B2B pipelines, customers, and contracts in one place.',
    newOpportunity: 'New Opportunity',
    newCustomer: 'New Customer',
    newProposal: 'New Proposal',
    newContract: 'New Contract',
    newReimburse: 'New Reimbursement',
    searchPlaceholder: 'Search opportunities, customers, or owners...',
    pipeline: {
      title: 'Opportunity Pipeline',
      stageLead: 'Lead',
      stageQualification: 'Qualification',
      stageProposal: 'Proposal',
      stageNegotiation: 'Negotiation',
      stageContract: 'Contract',
      empty: 'No opportunities in this stage',
    },
    opportunity: {
      id: 'ID',
      title: 'Title',
      customer: 'Customer',
      value: 'Value',
      probability: 'Probability',
      owner: 'Owner',
      expectedCloseDate: 'Expected Close',
      lastActivity: 'Last Activity',
      priority: 'Priority',
      industry: 'Industry',
      projectCategory: 'Category',
      location: 'Location',
      tags: 'Tags',
      description: 'Description',
    },
    leadInfo: {
      title: 'Lead Information',
      source: 'Lead Source',
      referredBy: 'Referred By',
      initialContactDate: 'Initial Contact',
      projectType: 'Project Type',
      estimatedBudget: 'Estimated Budget',
      decisionTimeline: 'Decision Timeline',
      painPoints: 'Pain Points / Needs',
      nextFollowUp: 'Next Follow-up',
      score: 'Lead Score',
      temperature: 'Temperature',
    },
    qualification: {
      title: 'Qualification (BANT)',
      budget: 'Budget',
      authority: 'Authority',
      need: 'Need',
      timeline: 'Timeline',
      technicalFit: 'Technical Fit',
      budgetFit: 'Budget Fit',
      competitors: 'Competitors',
      score: 'Qualification Score',
      goNoGo: 'Go/No-Go Decision',
      scopeOfWork: 'Scope of Work',
      technicalRequirements: 'Technical Requirements',
    },
    proposal: {
      title: 'Proposal Details',
      number: 'Proposal Number',
      version: 'Version',
      deadline: 'Submission Deadline',
      submittedDate: 'Submitted Date',
      value: 'Proposal Value',
      margin: 'Margin',
      technicalScore: 'Technical Score',
      commercialScore: 'Commercial Score',
      status: 'Proposal Status',
      differentiators: 'Key Differentiators',
      risks: 'Risk Items',
      presentation: 'Presentation',
    },
    negotiation: {
      title: 'Negotiation',
      round: 'Round',
      valueComparison: 'Value Comparison',
      initialOffer: 'Initial Offer',
      currentOffer: 'Current Offer',
      counterOffer: 'Client Counter Offer',
      discount: 'Discount',
      targetSignDate: 'Target Sign Date',
      legalReview: 'Legal Review',
      paymentTerms: 'Payment Terms',
      warranty: 'Warranty',
      penalty: 'Penalty Clause',
      activeTerms: 'Active Negotiation Terms',
      dealBreakers: 'Deal Breakers',
    },
    contract: {
      title: 'Contract Details',
      number: 'Contract Number',
      type: 'Contract Type',
      value: 'Contract Value',
      pm: 'Project Manager',
      dates: 'Effective — Expiry',
      location: 'Site Location',
      performanceBond: 'Performance Bond',
      retention: 'Retention',
      milestones: 'Payment Milestones',
      deliverables: 'Deliverables',
    },
    modals: {
      opportunity: {
        createTitle: 'New Opportunity',
        editTitle: 'Edit Opportunity',
        subtitle: 'Add new opportunity to pipeline',
        basicInfo: 'Basic Info',
        dealDetails: 'Deal Details',
        leadInfo: 'Lead Info',
        titleLabel: 'Opportunity Title',
        customerLabel: 'Customer',
        contactLabel: 'Contact Person',
        phoneLabel: 'Phone',
        emailLabel: 'Email',
        categoryLabel: 'Project Category',
        industryLabel: 'Industry',
        locationLabel: 'Project Location',
        tagsLabel: 'Tags',
        tagPlaceholder: 'Add tag (Enter)',
        priorityLabel: 'Priority',
        ownerLabel: 'Owner',
        expectedCloseLabel: 'Expected Close Date',
        valueLabel: 'Estimated Value (IDR)',
        probLabel: 'Win Probability',
        descLabel: 'Description',
        sourceLabel: 'Lead Source',
        tempLabel: 'Lead Temperature',
        referredLabel: 'Referred By',
        contactDateLabel: 'Initial Contact Date',
        typeLabel: 'Project Type',
        budgetLabel: 'Client Budget Estimate',
        timelineLabel: 'Decision Timeline',
        painLabel: 'Client Pain Points / Needs',
        followUpLabel: 'Next Follow-up',
        save: 'Save Opportunity',
      },
      customer: {
        createTitle: 'New Customer',
        subtitle: 'Add new customer data',
        companySection: 'Company Information',
        companyName: 'Company Name',
        parentCompany: 'Parent Company',
        industry: 'Industry',
        npwp: 'Tax ID (NPWP)',
        phone: 'Office Phone',
        email: 'Company Email',
        website: 'Website',
        city: 'City',
        province: 'Province',
        size: 'Company Size',
        revenue: 'Annual Revenue Estimate',
        address: 'Full Address',
        contactsSection: 'Contact Persons',
        addContact: 'Add Contact',
        notes: 'Notes',
        save: 'Save Customer',
      },
      proposal: {
        createTitle: 'New Proposal',
        subtitle: 'Create a new proposal for an opportunity',
        basicInfo: 'Basic Information',
        opportunity: 'Opportunity',
        title: 'Proposal Title',
        version: 'Version',
        template: 'Template',
        deadline: 'Submission Deadline',
        method: 'Submission Method',
        commercialSection: 'Commercial Value',
        value: 'Proposal Value (IDR)',
        margin: 'Target Margin (%)',
        criteriaSection: 'Evaluation Criteria',
        addCriteria: 'Add Criteria',
        diffSection: 'Key Differentiators',
        riskSection: 'Risk Items',
        presentation: 'Presentation Date',
        reviewer: 'Internal Reviewer',
        summary: 'Executive Summary',
        upload: 'Upload Document',
        saveDraft: 'Save Draft',
        save: 'Create Proposal',
      },
      contract: {
        createTitle: 'New Contract',
        subtitle: 'Create a new contract from a won opportunity',
        basicInfo: 'Contract Information',
        opportunity: 'Opportunity',
        contractNumber: 'Contract Number',
        type: 'Contract Type',
        title: 'Contract Title',
        value: 'Contract Value (IDR)',
        pm: 'Project Manager',
        effectiveDate: 'Effective Date',
        expiryDate: 'Expiry Date',
        signedDate: 'Signed Date',
        mobilizationDate: 'Mobilization Date',
        location: 'Project Location',
        termsSection: 'Terms & Conditions',
        paymentTerms: 'Payment Terms',
        warranty: 'Warranty (months)',
        retention: 'Retention (%)',
        penalty: 'Penalty Cap (%)',
        perfBond: 'Performance Bond required',
        milestoneSection: 'Payment Milestones',
        milestoneLabel: 'Milestone name',
        milestoneDate: 'Due Date',
        deliverableSection: 'Deliverables',
        scopeSection: 'Scope of Work',
        upload: 'Upload Contract Documents',
        saveDraft: 'Save Draft',
        save: 'Create Contract',
      },
      reimburse: {
        createTitle: 'New Reimbursement Request',
        subtitle: 'Submit a request for cost reimbursement',
        basicInfo: 'Request Information',
        requester: 'Requester',
        project: 'Project / Activity',
        activityDate: 'Activity Date',
        approver: 'Approver',
        categorySection: 'Expense Category',
        categories: {
          travel: '✈ Travel',
          accommodation: '🏨 Accommodation',
          meals: '🍽 Meals & Drinks',
          transportation: '🚗 Transportation',
          entertainment: '🎭 Entertainment',
          printing: '🖨 Printing & Stationery',
          other: '📦 Other',
        },
        description: 'Activity Description',
        receiptSection: 'Expense Details',
        addItem: 'Add Item',
        itemDescription: 'Item description',
        itemDate: 'Date',
        itemAmount: 'Amount (IDR)',
        bankSection: 'Bank Account Information',
        bankName: 'Bank Name',
        bankAccount: 'Account Number',
        upload: 'Upload Evidence / Receipts',
        notes: 'Additional Notes',
        saveDraft: 'Save Draft',
        save: 'Submit Reimburse',
      },
    },
    page: {
      title: 'CRM Dashboard',
      subtitle: 'Monitor sales pipeline, leads, and customer account performance',
      tabs: {
        overview: 'Overview',
        pipeline: 'Pipeline',
        customers: 'Customers',
        reports: 'Reports',
        benchmarking: 'Benchmarking',
      },
      stats: {
        pipelineValue: 'Total Pipeline Value',
        activeOpp: 'Active Opportunities',
        winRate: 'Win Rate (%)',
        avgDeal: 'Average Deal Size',
      },
      charts: {
        pipelineTitle: 'Pipeline by Stage',
        revenueTitle: 'Revenue Projection',
        winLossTitle: 'Win/Loss Analysis',
        byIndustryTitle: 'Distribution by Industry',
      },
      panels: {
        overview: 'Overview',
        activities: 'Activities',
        documents: 'Documents',
        stageDetails: 'Stage Details',
        leadInfo: 'Lead Information',
        qualification: 'Qualification (BANT)',
        proposal: 'Proposal Details',
        negotiation: 'Negotiation',
        contract: 'Contract Details',
      },
      fields: {
        owner: 'Sales Owner',
        value: 'Deal Value',
        probability: 'Probability',
        stage: 'Pipeline Stage',
        status: 'Status',
        priority: 'Priority',
        customer: 'Customer',
        contact: 'Primary Contact',
        lastActivity: 'Last Activity',
        closeDate: 'Expected Close',
        daysInStage: 'Days in Stage',
      },
      stages: {
        Lead: 'Lead',
        Qualification: 'Qualification',
        Proposal: 'Proposal',
        Negotiation: 'Negotiation',
        Contract: 'Contract',
      },
      priorities: {
        Low: 'Low',
        Medium: 'Medium',
        High: 'High',
        Critical: 'Critical',
      },
      temperatures: {
        Cold: 'Cold',
        Warm: 'Warm',
        Hot: 'Hot',
      },
      drawer: {
        overview: 'Overview',
        contacts: 'Contacts',
        children: 'Subsidiaries',
        backToParent: 'Back to Parent Company',
        parent: 'Parent',
        activeOpportunities: 'Active Opportunities',
        totalValue: 'Total Value',
        companyInfo: 'Company Information',
        primaryContact: 'Primary Contact',
        keyInformation: 'Key Information',
        industry: 'Industry',
        status: 'Status',
        lastContact: 'Last Activity',
        parentCompany: 'Parent Company',
        viewAll: 'View all',
        primary: 'Primary',
      },
      customers: {
        title: 'Customers',
        subtitle: 'Manage customer relationships and contacts',
        addNew: 'New Customer',
        searchPlaceholder: 'Search customers...',
        subsidiaryOf: 'Subsidiary of',
        viewDetails: 'View Details',
        lastContact: 'Last contact',
      },
      proposals: {
        title: 'Proposals',
        subtitle: 'Monitor proposal status and submission deadlines',
        addNew: 'New Proposal',
        searchPlaceholder: 'Search proposals...',
        table: {
          proposal: 'Proposal',
          customer: 'Customer',
          value: 'Value',
          status: 'Status',
          submitted: 'Submitted',
          dueDate: 'Due Date',
          version: 'Version',
          actions: 'Actions',
        },
        total: 'Total Proposals',
        submitted: 'Submitted',
        awarded: 'Awarded',
      },
      contracts: {
        title: 'Contracts',
        subtitle: 'Manage active contracts and milestone monitoring',
        addNew: 'New Contract',
        searchPlaceholder: 'Search contracts...',
        active: 'Active Contracts',
        completed: 'Completed',
        paymentIssues: 'Payment Issues',
      },
    },
  },
};
