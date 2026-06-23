// Mock data for the lawyer view.
// Cross-references the operator view's data (chronology/people/entities live in data.js).

window.LawyerData = (() => {
  // ── A larger document corpus for the Smith matter ─────────────────────
  // Demonstrates the sidebar at realistic scale (50+ docs across folders).
  function smithDocs() {
    const D = [];
    // helpers — applied after all rows pushed
    const pin = (id) => { const r = D.find(x => x.id === id); if (r) r.pinned = true; };
    const view = (id, ago) => { const r = D.find(x => x.id === id); if (r) r.viewedAt = ago; };
    const flag = (id, reason) => { const r = D.find(x => x.id === id); if (r) r.attention = reason; };
    // Primary record
    D.push({ id: 'd-vol10', folderId: 'f-primary', title: 'Royal Commission — Vol. 10 (Automated Debt Recovery)', pages: 4812,
      ingested: '2026-05-15', analysed: '2026-05-16 12:41 AEST', confidence: 0.91,
      docType: 'Commission transcript', primary: true, status: 'analysed', author: 'Cwlth of Australia' });
    D.push({ id: 'd-letters', folderId: 'f-primary', title: 'Letters Patent — Royal Commission instrument', pages: 18,
      ingested: '2026-05-11', analysed: '2026-05-11 10:02', confidence: 0.98,
      docType: 'Statutory instrument', status: 'analysed', author: 'Governor-General' });
    D.push({ id: 'd-tanya', folderId: 'f-primary', title: 'Tanya Day inquest — coroner findings', pages: 312,
      ingested: '2026-05-14', analysed: null, confidence: null,
      docType: 'Coroner report', status: 'queued', author: 'Coroners Court Vic' });
    D.push({ id: 'd-tor', folderId: 'f-primary', title: 'Terms of reference — schedule A (extracted)', pages: 6,
      ingested: '2026-05-11', analysed: '2026-05-11 10:14', confidence: 0.99,
      docType: 'Schedule', status: 'analysed', author: 'Cwlth of Australia' });

    // Authorities
    const auths = [
      ['Pintarich v Deputy Commissioner of Taxation [2018] FCAFC 79', 88, 'FCAFC', 0.97],
      ['Amato v Commonwealth [2019] FCA 1990', 41, 'FCA', 0.96],
      ['Prygodicz v Commonwealth (No 2) [2021] FCA 634', 124, 'FCA', 0.95],
      ['Hopper v Victoria [2019] HCA 21', 64, 'HCA', 0.96],
      ['Plaintiff S157/2002 v Commonwealth [2003] HCA 2', 102, 'HCA', 0.94],
      ['Re Refugee Review Tribunal; Ex parte Aala (2000) 204 CLR 82', 78, 'HCA', 0.93],
      ['Kioa v West (1985) 159 CLR 550', 96, 'HCA', 0.92],
      ['Annetts v McCann (1990) 170 CLR 596', 54, 'HCA', 0.91],
      ['Plaintiff M61 v Commonwealth (2010) 243 CLR 319', 88, 'HCA', 0.93],
    ];
    auths.forEach((a, i) => D.push({ id: 'd-auth'+i, folderId: 'f-authority',
      title: a[0], pages: a[1], ingested: '2026-05-12', analysed: '2026-05-12 11:'+(20+i*4),
      confidence: a[3], docType: 'Authority · ' + a[2], status: 'analysed', author: a[2] }));

    // Pleadings
    const plead = [
      ['Statement of claim — class representative proceeding (filed 2019-09-04)', 'Originating', 'Maddocks'],
      ['Defence — Commonwealth respondent', 'Defence', 'AGS'],
      ['Reply to defence', 'Reply', 'Maddocks'],
      ['Amended statement of claim (FAFA)', 'Amended SoC', 'Maddocks'],
      ['Particulars — Smith Holdings sub-class', 'Particulars', 'Maddocks'],
      ['Notice of motion — settlement approval (Prygodicz No 2)', 'Motion', 'Maddocks'],
      ['Opt-out notice and group definition', 'Notice', 'Maddocks'],
      ['Settlement scheme document', 'Scheme', 'Maddocks'],
      ['Order — settlement approval [2021] FCA 634', 'Order', 'FCA'],
      ['Notice of discontinuance — sub-group 7', 'Discontinuance', 'Maddocks'],
      ['Costs application — applicants', 'Costs', 'Maddocks'],
      ['Reasons for judgment — settlement approval', 'Reasons', 'FCA'],
    ];
    plead.forEach((p, i) => D.push({ id: 'd-plead'+i, folderId: 'f-pleadings',
      title: p[0], pages: 12 + (i*5) % 60,
      ingested: '2026-05-13', analysed: '2026-05-13 14:'+(10+i*3),
      confidence: 0.86 + (i%5)*0.02,
      docType: p[1], status: i === 7 ? 'queued' : 'analysed', author: p[2] }));

    // Correspondence
    const corres = [
      'Letter — applicants\' solicitors to AGS, 2019-04-12',
      'Letter — AGS response, 2019-05-08',
      'Email thread — settlement quantum negotiations (Sep 2019)',
      'Letter — class notice scheme, 2020-01-22',
      'Email — Ombudsman to DHS Secretary, 2017-02-22 (FOI)',
      'Letter — DHS to applicants re. internal review process, 2017-04-10',
      'Email thread — Treasury / DHS quantum discussions (sealed extract)',
      'Letter — Federal Court registrar re. listing, 2020-03-04',
      'Email — Maddocks to Counsel re. evidence schedule, 2020-04-11',
      'Letter — Counsel\'s advice on s 1223 SSA, 2019-06-30 (confidential)',
      'Email — interim distribution mechanics, 2021-08-19',
      'Letter — class member B. Whitney (representative letter), 2020-07-15',
      'Email thread — limitations argument, internal counsel, 2020-09-09',
      'Letter — DHS to ANAO re. report response, 2017-11-30',
      'Email — settlement deed redlines (rev 7), 2020-05-04',
      'Letter — sub-group 4 release variation, 2021-09-22',
      'Email — solicitor file note re. Hon S. Robert evidence, 2023-02-08',
      'Letter — Commissioner\'s direction to witness #14, 2023-02-28',
    ];
    corres.forEach((c, i) => D.push({ id: 'd-cor'+i, folderId: 'f-corres',
      title: c, pages: 2 + (i*3) % 11,
      ingested: '2026-05-13', analysed: i % 7 === 0 ? null : '2026-05-13 16:'+(5+i*2),
      confidence: i % 7 === 0 ? null : 0.78 + (i%6)*0.025,
      docType: c.startsWith('Email') ? 'Email' : 'Letter',
      status: i % 7 === 0 ? 'processing' : 'analysed',
      author: i % 3 === 0 ? 'AGS' : i % 3 === 1 ? 'Maddocks' : 'DHS' }));

    // Exhibits
    const exhibits = [
      'Exhibit A1 — OMCS algorithm spec (DHS-internal, 2014)',
      'Exhibit A2 — IT change logs Jul 2015 (extract)',
      'Exhibit B1 — Schedule of parties (Annexure B)',
      'Exhibit B2 — Schedule 4 financial settlement table',
      'Exhibit C1 — ANAO Performance Audit Report 4 of 2017-18',
      'Exhibit C2 — Ombudsman own-motion report (Mar 2017)',
      'Exhibit D1 — Sample debt recovery letter (de-identified)',
      'Exhibit D2 — Sample income-averaging calculation worksheet',
      'Exhibit E1 — Hansard, 2nd reading Social Services Bill 2015',
      'Exhibit E2 — Hansard, ministerial statement 2017-04-12',
      'Exhibit F1 — DHS Standard Operating Procedure (superseded)',
      'Exhibit F2 — DHS Standard Operating Procedure (current)',
      'Exhibit G1 — Witness statement — Ms M. Strachan',
      'Exhibit G2 — Witness statement — Hon S. Robert MP',
      'Exhibit G3 — Witness statement — Mr T. Brennan',
      'Exhibit G4 — Witness statement — Witness #14 [sealed]',
      'Exhibit H1 — Class member impact survey (N=1,841)',
      'Exhibit H2 — Cohort identification methodology paper',
      'Exhibit I1 — Settlement Deed (executed 29-May-2020)',
      'Exhibit I2 — Settlement Deed (redline, draft 11)',
      'Exhibit J1 — Independent algorithm review (Houck 2019)',
      'Exhibit J2 — Department response to Houck review',
      'Exhibit K1 — Internal email — OMCS go-live readiness',
      'Exhibit K2 — Internal email — supervisor instructions',
    ];
    exhibits.forEach((e, i) => D.push({ id: 'd-ex'+i, folderId: 'f-exhibits',
      title: e, pages: 4 + (i*7) % 84,
      ingested: '2026-05-14', analysed: i === 15 ? null : '2026-05-14 09:'+(2+i*2).toString().padStart(2,'0'),
      confidence: i === 15 ? null : (i === 7 || i === 19 ? 0.62 : 0.84 + (i%5)*0.02),
      docType: e.split(' — ')[0].split(' ')[0] + ' exhibit',
      status: i === 15 ? 'processing' : 'analysed',
      author: 'Tendered' }));

    // Expert reports
    const experts = [
      ['Expert report — Prof. R. Houck on automated decision systems', 188, 0.93],
      ['Expert report — Dr P. Vaughan on statistical methodology', 96, 0.91],
      ['Expert reply — Houck (response to Crown experts)', 41, 0.88],
      ['Joint expert conclave statement', 18, 0.86],
      ['Expert report — Dr S. Mehta on algorithmic fairness', 122, 0.89],
      ['Expert report — Mr K. Yu on damages quantification', 64, 0.92],
    ];
    experts.forEach((x, i) => D.push({ id: 'd-exp'+i, folderId: 'f-experts',
      title: x[0], pages: x[1], ingested: '2026-05-14', analysed: '2026-05-14 11:'+(2+i*5).toString().padStart(2,'0'),
      confidence: x[2], docType: 'Expert report', status: 'analysed',
      author: x[0].match(/Prof\.|Dr|Mr|Ms/) ? x[0].split('—')[1]?.trim() : '—' }));

    // Discovery
    for (let i = 0; i < 11; i++) {
      D.push({ id: 'd-disc'+i, folderId: 'f-discovery',
        title: `Discovery bundle ${String.fromCharCode(65+i)} — ${['DHS', 'Treasury', 'ANAO', 'PMO', 'Centrelink ops', 'IT vendor (DAC)', 'External counsel', 'OAIC', 'PM&C', 'Finance', 'AAT'][i]}`,
        pages: 220 + i * 38, ingested: '2026-05-15',
        analysed: i < 3 ? '2026-05-15 18:'+(10+i*4) : null,
        confidence: i < 3 ? 0.81 + i*0.02 : null,
        docType: 'Discovery bundle',
        status: i < 3 ? 'analysed' : i < 6 ? 'processing' : 'queued',
        author: ['DHS', 'Treasury', 'ANAO', 'PMO', 'Centrelink', 'DAC Pty Ltd', 'AGS', 'OAIC', 'PM&C', 'Finance', 'AAT'][i] });
    }
    // ── User signals ───────────────────────────────────────────────
    pin('d-vol10');                  // primary record is pinned
    pin('d-plead0');                 // class statement of claim
    pin('d-auth0');                  // Pintarich — referenced constantly
    view('d-vol10', 'just now');
    view('d-plead0', '12 min ago');
    view('d-auth0', '2 hours ago');
    view('d-ex2', 'yesterday');      // Schedule of parties
    view('d-cor4', 'yesterday');     // Ombudsman email
    view('d-letters', '3 days ago');
    flag('d-tanya', 'queued');
    flag('d-cor4', 'low confidence (0.62)');
    flag('d-disc3', 'waiting on analysis');
    flag('d-ex15', 'still analysing');
    return D;
  }

  // ── Matters & folders ──────────────────────────────────────────────────
  const matters = [
    {
      id: 'm-smith',
      name: 'Smith Holdings v Commonwealth',
      shortName: 'Smith v Cwlth',
      client: 'Smith Holdings Pty Ltd',
      practice: 'Administrative · Class action',
      lead: 'D. Singh',
      opened: '2024-08-14',
      pinned: true,
      status: 'active',
      docs: smithDocs(),
      folders: [
        { id: 'root',        name: 'All documents',  parentId: null, count: 0  /* recomputed */ },
        { id: 'f-primary',   name: 'Primary record', parentId: 'root', count: 4  },
        { id: 'f-authority', name: 'Authorities',    parentId: 'root', count: 9  },
        { id: 'f-pleadings', name: 'Pleadings',      parentId: 'root', count: 12 },
        { id: 'f-corres',    name: 'Correspondence', parentId: 'root', count: 18 },
        { id: 'f-exhibits',  name: 'Exhibits',       parentId: 'root', count: 24 },
        { id: 'f-experts',   name: 'Expert reports', parentId: 'root', count: 6  },
        { id: 'f-discovery', name: 'Discovery',      parentId: 'root', count: 11 },
      ]
    },
    {
      id: 'm-watershed',
      name: 'Watershed Capital — facility refinance',
      shortName: 'Watershed',
      client: 'Watershed Capital Holdings',
      practice: 'Banking & finance',
      lead: 'P. Hartono',
      opened: '2025-12-02',
      status: 'active',
      docs: [
        { id: 'd-fa', folderId: 'f-w-primary', title: 'Master facility agreement (executed)', pages: 386,
          ingested: '2026-04-22', analysed: '2026-04-22 16:11', confidence: 0.94,
          docType: 'Facility agreement', status: 'analysed', author: 'Watershed/Counsel', primary: true },
        { id: 'd-sec', folderId: 'f-w-primary', title: 'Security deeds bundle', pages: 211,
          ingested: '2026-04-23', analysed: '2026-04-23 09:30', confidence: 0.89,
          docType: 'Security', status: 'analysed', author: 'Watershed/Counsel' },
      ],
      folders: [
        { id: 'root',        name: 'All documents',  parentId: null,   count: 2 },
        { id: 'f-w-primary', name: 'Primary record', parentId: 'root', count: 2 },
      ]
    },
    {
      id: 'm-loch',
      name: 'Loch Estate — testamentary trust',
      shortName: 'Loch',
      client: 'Estate of A. Loch (decd)',
      practice: 'Estates · Trusts',
      lead: 'M. Calderon',
      opened: '2026-02-19',
      status: 'closed',
      docs: [
        { id: 'd-will', folderId: 'f-l-primary', title: 'Last will and codicil (2022)', pages: 24,
          ingested: '2026-02-19', analysed: '2026-02-19 09:14', confidence: 0.99,
          docType: 'Testamentary', status: 'analysed', author: 'A. Loch', primary: true },
      ],
      folders: [
        { id: 'root',        name: 'All documents',  parentId: null,   count: 1 },
        { id: 'f-l-primary', name: 'Primary record', parentId: 'root', count: 1 },
      ]
    },
  ];

  // ── Document references (within & outside the doc) ─────────────────────
  const documentRefs = [
    { id: 'dr1', title: 'OMCS algorithm specification (DHS-internal, 2014)', type: 'internal',
      relevance: 'Defines the income-averaging methodology challenged in the proceeding.',
      cite: 'p. 142, 511, 1043', confidence: 0.94, linked: 'd-vol10:142' },
    { id: 'dr2', title: 'Ombudsman own-motion report (Mar 2017)', type: 'external',
      relevance: 'First external finding that recovery letters were not legally founded.',
      cite: 'p. 904 cross-ref', confidence: 0.93, url: 'https://www.ombudsman.gov.au' },
    { id: 'dr3', title: 'Internal review process — DHS standard operating procedure', type: 'internal',
      relevance: 'Operative procedure during the class period; characterisation now retracted.',
      cite: 'p. 1043 (superseded by Addendum 3 §2)', confidence: 0.62, status: 'superseded' },
    { id: 'dr4', title: 'Schedule 4 — class settlement financial schedule', type: 'internal',
      relevance: 'Authoritative settlement-quantum source. Annexed financial schedule.',
      cite: 'p. 4521', confidence: 0.88, linked: 'd-vol10:4521' },
    { id: 'dr5', title: 'ANAO performance audit — Report 4 of 2017-18', type: 'external',
      relevance: 'Independent audit referenced in Commissioner\u2019s opening statement.',
      cite: 'p. 3041', confidence: 0.95, url: 'https://www.anao.gov.au' },
    { id: 'dr6', title: 'Hansard — 2nd reading Social Services Legis. Amendment Bill 2015', type: 'external',
      relevance: 'Legislative intent of the underlying scheme.',
      cite: 'p. 1402', confidence: 0.91 },
    { id: 'dr7', title: 'Annexure B — Schedule of party roles & tenure', type: 'internal',
      relevance: 'Source for canonical Acting Secretary attribution (contested cf02).',
      cite: 'Annexure B, p. 887', confidence: 0.71, status: 'disputed' },
    { id: 'dr8', title: 'Settlement Deed (executed 29 May 2020)', type: 'external',
      relevance: 'Operative settlement instrument. Binds class members.',
      cite: 'p. 2340', confidence: 0.96 },
  ];

  // ── External authorities (cases/statutes/regs, registry-verified) ──────
  const externalRefs = [
    { id: 'er1', kind: 'case',     citation: 'Pintarich v Deputy Commissioner of Taxation [2018] FCAFC 79',
      title: 'Pintarich — what constitutes a "decision" by automated process',
      bearing: 'Foundational on whether an automated communication carries decisional force. The Commission\u2019s findings on §51 turn substantially on the Pintarich framing.',
      url: 'https://www.austlii.edu.au', verified: true, court: 'FCAFC', year: 2018 },
    { id: 'er2', kind: 'case',     citation: 'Amato v Commonwealth [2019] FCA 1990',
      title: 'Amato — declaratory relief; debts not lawfully founded',
      bearing: 'Direct precedent for the unlawfulness finding. Distinguishable on cohort identification.',
      url: 'https://www.austlii.edu.au', verified: true, court: 'FCA', year: 2019 },
    { id: 'er3', kind: 'case',     citation: 'Prygodicz v Commonwealth (No 2) [2021] FCA 634',
      title: 'Prygodicz — class settlement approval',
      bearing: 'Settled approval principles for the gross-of-costs figure. Authoritative on the Lane C settlement quantum (A$1.873B).',
      url: 'https://www.austlii.edu.au', verified: true, court: 'FCA', year: 2021 },
    { id: 'er4', kind: 'statute',  citation: 'Social Security Act 1991 (Cth) s 1223',
      title: 'Debts due to the Commonwealth',
      bearing: 'Statutory hook the recovery letters purported to engage. The Commission found the requisite formation step was absent.',
      url: 'https://www.legislation.gov.au', verified: true, jurisdiction: 'AU·Cwlth' },
    { id: 'er5', kind: 'statute',  citation: 'Administrative Decisions (Judicial Review) Act 1977 (Cth)',
      title: 'ADJR — judicial review of administrative decisions',
      bearing: 'Threshold for "decision of an administrative character". Engaged with Pintarich question.',
      url: 'https://www.legislation.gov.au', verified: true, jurisdiction: 'AU·Cwlth' },
    { id: 'er6', kind: 'statute',  citation: 'Limitations Act 1969 (NSW) s 14',
      title: 'Limitation periods',
      bearing: 'Six-year limit per cause of action. Doc characterisation consistent.',
      url: 'https://www.legislation.nsw.gov.au', verified: true, jurisdiction: 'NSW' },
    { id: 'er7', kind: 'regulation', citation: 'Public Service Regulations 1999 (Cth)',
      title: 'PS Regs — APS conduct',
      bearing: 'Cited by Commissioner re. APS Code obligations; tangentially relevant to officer-conduct findings.',
      url: 'https://www.legislation.gov.au', verified: true, jurisdiction: 'AU·Cwlth' },
    { id: 'er8', kind: 'article',  citation: 'Carney, "Robo-debt illegality: the seven veils of failure" (2019) 43 UNSWLJ 1056',
      title: 'Carney — illegality and the seven veils',
      bearing: 'Influential commentary; cited in argument but not in findings.',
      url: 'https://www.austlii.edu.au', verified: true, year: 2019 },
  ];

  // ── Suggested prompts ──────────────────────────────────────────────────
  const suggestedPrompts = [
    'Summarise the obligations Smith Holdings had as Borrower.',
    'What was the settlement quantum, and which source is authoritative?',
    'Compare the Acting Secretary claims across the three retrieval lanes.',
    'Draft a one-page advice on limitation exposure.',
    'Find every cited authority on automated decisional force.',
  ];

  // ── Chat history (one prior turn for context) ──────────────────────────
  const chatHistory = [
    { id: 'q1', who: 'user', t: '12:01',
      text: 'What is the authoritative settlement quantum on the record?' },
    { id: 'a1', who: 'assistant', t: '12:01',
      text: 'A$1,873,402,118 — drawn from Schedule 4, row 12 of Volume 10. Lane A (PageIndex prose) returned A$1.2B and Lane B (hybrid OpenSearch) returned A$1.8B; the structured table is the authoritative source per AuthorityRule SR-09. Confidence 0.88.',
      cites: [{ artifact: 'chronology', id: 'e06', label: 'cf01 · settlement quantum' },
              { artifact: 'extrefs',    id: 'er3', label: 'Prygodicz (No 2) [2021] FCA 634' }] },
  ];

  // ── Issue-by-issue legal memo (Australian IRAC format) ─────────────────
  const memo = {
    matter: 'Smith Holdings v Commonwealth',
    drafter: 'Atrium Synthesis Agent · reviewed by Critic',
    drafted: '2026-05-16',
    confidence: 0.86,
    flagged: 2,            // number of issues with unresolved dissent
    issues: [
      {
        n: 1,
        heading: 'Whether automated debt-recovery letters were lawfully founded',
        irac: {
          issue: 'Whether letters issued by the OMCS automated income-averaging algorithm constituted "decisions" within the meaning of s 1223 of the Social Security Act 1991 (Cth) and the ADJR Act, such that they were lawfully founded as debts due to the Commonwealth.',
          rule:  'A debt under s 1223 requires a decision-maker\u2019s exercise of administrative power. Pintarich v Deputy Commissioner of Taxation [2018] FCAFC 79 holds that a communication generated without contemporaneous human consideration lacks the requisite decisional character. Amato v Commonwealth [2019] FCA 1990 applied this in the same statutory setting.',
          application: 'On the evidence in Volume 10, the OMCS algorithm went live on 4 July 2015 and from December 2016 onwards issued letters to approximately 170,000 recipients without contemporaneous officer review. The Commission accepted, by Addendum 3 §2, that the prior characterisation of the internal review process as "robust" was retracted. The Acting Secretary attribution for the relevant period remains disputed (cf02) but is not material to the formation question.',
          conclusion: 'The letters did not satisfy the formation requirements of s 1223 and were not lawfully founded. The Commonwealth\u2019s position is consistent with the Amato declaration and the gross-of-costs settlement reached in Prygodicz (No 2).'
        },
        cites: [
          { artifact: 'extrefs',    id: 'er1', label: 'Pintarich [2018] FCAFC 79' },
          { artifact: 'extrefs',    id: 'er2', label: 'Amato [2019] FCA 1990' },
          { artifact: 'extrefs',    id: 'er4', label: 'Social Security Act s 1223' },
          { artifact: 'chronology', id: 'e01', label: 'OMCS go-live · 2015-07-04' },
          { artifact: 'chronology', id: 'e02', label: 'First mass-issuance · 2016-12-19' },
        ],
        dissent: null,
      },
      {
        n: 2,
        heading: 'Whether class certification is appropriate for the affected cohort',
        irac: {
          issue: 'Whether the class as defined satisfies the commonality and adequacy requirements for representative proceedings.',
          rule:  'Part IVA of the Federal Court of Australia Act 1976 (Cth) requires (a) at least seven persons, (b) the same, similar or related circumstances, and (c) a substantial common issue of law or fact. Prygodicz (No 2) [2021] FCA 634 confirms approval where these are met and where the settlement is fair, reasonable and in the interests of group members.',
          application: 'The cohort spans 2016–2019 and is identified by receipt of an automated letter generated from income-averaged data. The class is large (~170,000) and the common issue of lawful foundation is dispositive. Settlement was reached on 29 May 2020 in the gross-of-costs sum of A$1,873,402,118 per Schedule 4.',
          conclusion: 'Certification is appropriate. The settlement quantum is supported by Schedule 4 (authoritative under SR-09). One issue of internal procedure (Acting Secretary identity) remains in dispute on the record but is not jurisdictional.'
        },
        cites: [
          { artifact: 'extrefs',    id: 'er3', label: 'Prygodicz (No 2) [2021] FCA 634' },
          { artifact: 'chronology', id: 'e06', label: 'Settlement-in-principle · 2019-11-29' },
          { artifact: 'chronology', id: 'e07', label: 'Settlement deed executed · 2020-05-29' },
        ],
        dissent: { note: 'Acting Secretary attribution remains unresolved (cf02). Does not affect this issue but is preserved for completeness.', conf: 0.58 },
      },
      {
        n: 3,
        heading: 'Limitation exposure for late-discovered class members',
        irac: {
          issue: 'Whether class members who first became aware of their cause of action after 2019 are within time under s 14 of the Limitations Act 1969 (NSW).',
          rule:  'Section 14 provides a six-year limitation. Discoverability may extend the period in cases of latent injury or concealment, but the orthodox approach is calendar-based from accrual.',
          application: 'The earliest accrual on the record is December 2016 (first mass-issuance). Class members joining after May 2022 fall outside the orthodox period. The Settlement Deed of 29 May 2020 contains a release clause; whether discoverability extends limitations for late joiners is the live question.',
          conclusion: 'A material subset of late-joining members is at risk on a strict calendar reading. Advice should be sought on a discoverability argument; comparable Australian authorities are limited.'
        },
        cites: [
          { artifact: 'extrefs',    id: 'er6', label: 'Limitations Act 1969 (NSW) s 14' },
          { artifact: 'chronology', id: 'e02', label: 'First mass-issuance · 2016-12-19' },
          { artifact: 'chronology', id: 'e07', label: 'Settlement deed · 2020-05-29' },
        ],
        dissent: { note: 'Insufficient internal authority on discoverability in this context. Flagged for human review.', conf: 0.42 },
      },
    ]
  };

  // ── Detailed memo sections (much longer; outline + 1 drafted) ─────────
  const detailedMemo = {
    matter: 'Smith Holdings v Commonwealth',
    drafted: '2026-05-16 12:38',
    confidence: 0.82,
    estPages: 38,   // 5–10% of 4,812 ⇒ ~240–480 pages; capped to 38 here for demo
    sections: [
      { n: 1, heading: 'Background and procedural posture',
        state: 'drafted', summary: 'Establishment of the Commission, terms of reference, parties of record, factual span of the inquiry.' },
      { n: 2, heading: 'Statutory framework — Social Security Act and ADJR',
        state: 'drafted', summary: 'Operative provisions of s 1223 SSA, the role of the ADJR Act, and the threshold of "decision" engaged.' },
      { n: 3, heading: 'The OMCS algorithm: design, deployment, supervision',
        state: 'drafted', summary: 'Detailed technical and procedural account of the algorithm, from 4 July 2015 deployment through the December 2016 mass-issuance and subsequent supervision changes.' },
      { n: 4, heading: 'Whether the letters were "decisions" — application of Pintarich',
        state: 'drafted',
        summary: 'Full IRAC treatment of the formation question, drawing the Pintarich line and considering Amato.',
        body: true /* this is the one we render in full below */ },
      { n: 5, heading: 'Class certification and the Prygodicz framework',  state: 'drafting' },
      { n: 6, heading: 'Settlement quantum — Schedule 4 as authority',     state: 'drafting' },
      { n: 7, heading: 'Acting Secretary attribution — dispute cf02',      state: 'queued' },
      { n: 8, heading: 'Limitation exposure for late-joining class members', state: 'queued' },
      { n: 9, heading: 'Internal review procedure — supersession by Addendum 3', state: 'queued' },
      { n: 10, heading: 'Ombudsman, ANAO and external oversight findings', state: 'queued' },
      { n: 11, heading: 'Statutory remedies and declaratory relief',       state: 'queued' },
      { n: 12, heading: 'Risk register and unresolved ambiguities',        state: 'gated' },
    ],
  };

  return { matters, documentRefs, externalRefs, suggestedPrompts, chatHistory, memo, detailedMemo };
})();
