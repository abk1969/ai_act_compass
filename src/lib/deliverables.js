// Compliance-deliverables data — QUICKWINS (30-day actionable items) and
// CHECKLIST (pillar-by-pillar conformity items) keyed by risk category.
// Pure data — imported by the React UI for screen + clipboard + PDF rendering,
// and by tests for regression-protecting the regulatorily-significant entries.

const _ = (en, fr) => ({ en, fr });

export const QUICKWINS = {
  INTERDIT: [
    {
      titre: { en: 'Cease placing on the market or use immediately', fr: 'Cesser immédiatement la mise sur le marché ou l\'utilisation' },
      delai: { en: 'Immediate', fr: 'Immédiat' },
      refs:  ['art. 5', { en: 'art. 99(3) — fines up to €35M or 7% of worldwide turnover', fr: 'art. 99(3) — sanction jusqu\'à 35 M€ ou 7% CA mondial' }],
      action:{ en: 'Freeze commercialisation, withdraw the system, document the decision and notify stakeholders.', fr: 'Geler la commercialisation, retirer le système, documenter la décision et notifier les parties prenantes.' },
    },
    {
      titre: { en: 'Assess functional redesign or pivot', fr: 'Évaluer une refonte fonctionnelle ou un pivot' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 5(1)', { en: 'recitals 28-44', fr: 'considérants 28-44' }],
      action:{ en: 'Examine whether redesign (purpose change, removal of prohibited features) enables requalification to limited or minimal risk.', fr: 'Étudier si une reconception (changement de finalité, retrait des fonctionnalités prohibées) permet une requalification en risque limité ou minimal.' },
    },
    {
      titre: { en: 'Audit other AI systems in the portfolio', fr: 'Audit des autres systèmes IA du parc' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['ISO 42001 cl. 6.1.4', 'art. 5'],
      action:{ en: 'Map all AI systems to verify no other case falls under art. 5.', fr: 'Cartographier tous les systèmes IA pour vérifier qu\'aucun autre cas ne tombe sous l\'art. 5.' },
    },
  ],
  HAUT_RISQUE_ANNEXE_I: [
    {
      titre: { en: 'Map applicable harmonisation legislation', fr: 'Cartographier la législation d\'harmonisation applicable' },
      delai: { en: '15 days', fr: '15 jours' },
      refs:  ['art. 6(1)', { en: 'Annex I sections A & B', fr: 'Annexe I sections A & B' }],
      action:{ en: 'Identify the precise sectoral regulation (machinery, medical devices, toys, motor vehicles…) and the corresponding notified body.', fr: 'Identifier précisément le règlement sectoriel (machines, dispositifs médicaux, jouets, automobiles…) et l\'organisme notifié associé.' },
    },
    {
      titre: { en: 'Initiate Annex IV technical documentation', fr: 'Lancer la documentation technique Annexe IV' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 11', { en: 'Annex IV', fr: 'Annexe IV' }, 'ISO 42001 A.6.2.5'],
      action:{ en: 'Open the technical file — it will integrate with existing product documentation (art. 8).', fr: 'Initier le dossier technique — il sera intégré à la documentation produit existante (art. 8).' },
    },
    {
      titre: { en: 'Initiate quality management system', fr: 'Initier le système de gestion de la qualité' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 17', 'ISO 42001 cl. 4-10'],
      action:{ en: 'Define quality policy, risk management process, documented controls — leverage ISO 42001 if already certified ISO 9001/13485.', fr: 'Définir politique qualité, processus de gestion des risques, contrôles documentés — leverage ISO 42001 si déjà certifié ISO 9001/13485.' },
    },
  ],
  HAUT_RISQUE_ANNEXE_III: [
    {
      titre: { en: 'Launch the risk management system (art. 9)', fr: 'Lancer le système de gestion des risques (art. 9)' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 9', 'ISO/IEC 23894:2023', 'ISO 42001 A.5.2'],
      action:{ en: 'Iterative cycle: identification → estimation → evaluation → treatment measures, documented across the lifecycle.', fr: 'Cycle itératif : identification → estimation → évaluation → mesures de traitement, documenté tout au long du cycle de vie.' },
    },
    {
      titre: { en: 'Frame data governance (art. 10)', fr: 'Cadrer la gouvernance des données (art. 10)' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 10', 'ISO 42001 A.7', 'ISO/IEC 5259-1 to -5'],
      action:{ en: 'Document collection practices, bias review, representativeness, quality, traceability of training/validation/test datasets.', fr: 'Documenter pratiques de collecte, examen biais, représentativité, qualité, traçabilité des jeux d\'entraînement / validation / test.' },
    },
    {
      titre: { en: 'Initiate FRIA if public-sector deployer or essential services', fr: 'Engager la FRIA si déployeur secteur public ou services essentiels' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 27', 'ISO/IEC 42005:2025'],
      action:{ en: 'Fundamental rights impact assessment before first use, to be updated on each material modification.', fr: 'Évaluation d\'impact sur les droits fondamentaux avant première utilisation, à mettre à jour à chaque modification matérielle.' },
    },
  ],
  RISQUE_LIMITE: [
    {
      titre: { en: 'Define disclosure wording (art. 50)', fr: 'Définir le wording de divulgation (art. 50)' },
      delai: { en: '15 days', fr: '15 jours' },
      refs:  ['art. 50(1)-(4)', 'ISO 42001 A.8'],
      action:{ en: 'Draft "You are interacting with an AI" notices, deepfake labels, C2PA metadata — at the latest at the first interaction point.', fr: 'Rédiger les mentions « Vous interagissez avec une IA », labels deepfake, métadonnées C2PA — au plus tard au premier point d\'interaction.' },
    },
    {
      titre: { en: 'Implement machine-readable marking of synthetic content', fr: 'Implémenter le marquage machine-readable du contenu synthétique' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 50(2)', 'ISO/IEC 27090 § GenAI'],
      action:{ en: 'Watermarking / C2PA signature / Content Credentials for any generated or substantially modified content.', fr: 'Watermarking / signature C2PA / Content Credentials pour tout contenu généré ou substantiellement modifié.' },
    },
    {
      titre: { en: 'AI literacy programme — art. 4', fr: 'Programme AI literacy art. 4' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  [{ en: 'art. 4 — applicable since 2025-02-02', fr: 'art. 4 — applicable depuis 2025-02-02' }, 'ISO 42001 A.4'],
      action:{ en: 'Appropriate measures to ensure a sufficient level of AI literacy among personnel and third parties operating the system.', fr: 'Mesures appropriées pour assurer un niveau suffisant de maîtrise de l\'IA chez le personnel et tiers opérant le système.' },
    },
  ],
  RISQUE_MINIMAL: [
    {
      titre: { en: 'AI literacy programme — art. 4', fr: 'Programme AI literacy art. 4' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  [{ en: 'art. 4 — applicable since 2025-02-02', fr: 'art. 4 — applicable depuis 2025-02-02' }],
      action:{ en: 'Cross-cutting obligation applicable to all AI systems regardless of risk level.', fr: 'Obligation transverse applicable à tous les systèmes IA, indépendamment du niveau de risque.' },
    },
    {
      titre: { en: 'Voluntary adherence to a code of conduct', fr: 'Adhésion volontaire à un code de conduite' },
      delai: { en: '60 days', fr: '60 jours' },
      refs:  ['art. 95', 'ISO 42001 cl. 5.2'],
      action:{ en: 'Voluntary codes encouraged by art. 95 — option to demonstrate mature posture even outside high-risk.', fr: 'Codes facultatifs encouragés par l\'art. 95 — option pour démontrer une posture mature même hors haut risque.' },
    },
    {
      titre: { en: 'Watch substantial modifications (art. 25)', fr: 'Veille des modifications substantielles (art. 25)' },
      delai: { en: 'Continuous', fr: 'Continu' },
      refs:  ['art. 25', 'art. 3(23)'],
      action:{ en: 'Any substantial modification or change of purpose may flip the system into high-risk, and may even make you a new provider.', fr: 'Toute modification substantielle ou changement de finalité peut faire basculer le système en haut risque, voire faire de vous un nouveau fournisseur.' },
    },
  ],
  GPAI: [
    {
      titre: { en: 'Build model documentation (Annex XI)', fr: 'Constituer la documentation modèle (Annexe XI)' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 53', { en: 'Annex XI', fr: 'Annexe XI' }],
      action:{ en: 'Description, training data, training process, evaluations, energy consumption, etc. — to be provided to downstream providers.', fr: 'Description, données d\'entraînement, processus d\'entraînement, évaluations, consommation énergétique, etc. — à fournir aux fournisseurs en aval.' },
    },
    {
      titre: { en: 'Copyright compliance policy — art. 53(1)(c)', fr: 'Politique de respect du droit d\'auteur (art. 53(1)(c))' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 53(1)(c)', 'directive 2019/790 art. 4(3)'],
      action:{ en: 'Policy to identify and respect rights reservations (TDM opt-out) — including scraped content.', fr: 'Politique pour identifier et respecter les réservations de droits (opt-out TDM) — y compris contenus scrappés.' },
    },
    {
      titre: { en: 'Public summary of training data', fr: 'Résumé public des données d\'entraînement' },
      delai: { en: '60 days', fr: '60 jours' },
      refs:  ['art. 53(1)(d)'],
      action:{ en: 'Sufficiently detailed summary per AI Office template — public.', fr: 'Résumé suffisamment détaillé selon modèle du Bureau IA — public.' },
    },
  ],
  GPAI_RS: [
    {
      titre: { en: 'Notification to AI Office within 2 weeks of crossing threshold', fr: 'Notification au Bureau IA dans les 2 semaines après franchissement du seuil' },
      delai: { en: 'Immediate', fr: 'Immédiat' },
      refs:  ['art. 52(1)'],
      action:{ en: 'Mandatory notification as soon as the 10^25 cumulative FLOPs criterion or any other art. 51 criterion is met.', fr: 'Notification obligatoire dès que le critère 10^25 FLOPs cumulés ou tout autre critère art. 51 est atteint.' },
    },
    {
      titre: { en: 'Model evaluation + adversarial testing', fr: 'Évaluation du modèle + tests adversariaux' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 55(1)(a)', 'ISO/IEC 27090 § Foundation models'],
      action:{ en: 'State of the art: structured red-teaming, robustness benchmarks, systemic risk evaluation.', fr: 'État de l\'art : red-teaming structuré, benchmarks de robustesse, évaluation des risques systémiques.' },
    },
    {
      titre: { en: 'Cybersecurity by design + incident reporting', fr: 'Cybersecurity by design + reporting d\'incidents' },
      delai: { en: '30 days', fr: '30 jours' },
      refs:  ['art. 55(1)(d)', 'ISO/IEC 27090', 'OWASP LLM Top 10'],
      action:{ en: 'Physical and cyber protection of model and infrastructure; serious incident reporting to AI Office without undue delay.', fr: 'Protection physique et cybersécurité du modèle et de l\'infrastructure ; reporting d\'incidents graves au Bureau IA sans retard injustifié.' },
    },
  ],
};

// Identifies the art. 27 FRIA quickwin so it can be gated by computeRoleNotes.
// Keep this in sync with QUICKWINS.HAUT_RISQUE_ANNEXE_III; if other quickwins
// ever cite art. 27 for unrelated reasons, this predicate needs tightening.
export const isFriaItem = (item) => (item.refs || []).some(r => r === 'art. 27');

export const CHECKLIST = {
  INTERDIT: [
    { pilier: _('Decision', 'Décision'), items: [
      { ref: 'art. 5', txt: _('Cease placing on the market and use', 'Cesser la mise sur le marché et l\'utilisation') },
      { ref: 'art. 5', txt: _('Document the decision and notify stakeholders', 'Documenter la décision et la notifier aux parties prenantes') },
      { ref: 'art. 99(3)', txt: _('Assess exposure to fines (up to €35M or 7% turnover)', 'Évaluer l\'exposition aux sanctions (jusqu\'à 35 M€ ou 7% CA)') },
    ]},
    { pilier: _('Redesign or withdrawal', 'Refonte ou retrait'), items: [
      { ref: _('recitals 28-44', 'considérants 28-44'), txt: _('Examine possible functional redesign', 'Étudier la possibilité d\'une reconception fonctionnelle') },
      { ref: 'ISO 42001 A.5', txt: _('Conduct residual impact assessment (other systems)', 'Mener une évaluation d\'impact résiduel (autres systèmes)') },
    ]},
  ],
  HAUT_RISQUE_ANNEXE_I: [
    { pilier: _('Product-safety conformity', 'Conformité produit-sécurité'), items: [
      { ref: 'art. 6(1)', txt: _('Identify applicable Annex I harmonisation regulation', 'Identifier le règlement d\'harmonisation Annexe I applicable') },
      { ref: 'art. 8', txt: _('Integration with existing product documentation', 'Intégration dans la documentation produit existante') },
      { ref: 'art. 43', txt: _('Conformity assessment — notified body path if required', 'Évaluation de conformité — chemin organisme notifié si requis') },
    ]},
    { pilier: _('Technical documentation', 'Documentation technique'), items: [
      { ref: _('art. 11 + Annex IV', 'art. 11 + Annexe IV'), txt: _('Complete technical file', 'Dossier technique complet') },
      { ref: 'art. 12', txt: _('Automatic logs (record keeping)', 'Logs automatiques (record keeping)') },
      { ref: 'art. 18', txt: _('10-year retention', 'Conservation 10 ans') },
    ]},
    { pilier: _('AIMS / quality', 'AIMS / qualité'), items: [
      { ref: 'art. 17 + ISO 42001 cl. 4-10', txt: _('Documented quality management system', 'Système de gestion qualité documenté') },
      { ref: 'ISO 42001 A.6', txt: _('Lifecycle controls', 'Contrôles cycle de vie') },
      { ref: 'ISO 42001 A.10', txt: _('Third-party management', 'Gestion des tiers') },
    ]},
    { pilier: _('Marking and declaration', 'Marquage et déclaration'), items: [
      { ref: 'art. 47', txt: _('EU declaration of conformity', 'Déclaration UE de conformité') },
      { ref: 'art. 48', txt: _('CE marking', 'Marquage CE') },
      { ref: 'art. 49', txt: _('Registration in EU database (with exceptions)', 'Enregistrement dans la base UE (sauf exceptions)') },
    ]},
    { pilier: _('Post-market', 'Post-market'), items: [
      { ref: 'art. 72', txt: _('Post-market monitoring plan', 'Plan de surveillance post-marché') },
      { ref: 'art. 73(2)-(4)', txt: _('Serious incident reporting procedure — 15 d default, 10 d if death/serious health harm, 2 d if widespread infringement or critical-infra disruption', 'Procédure de signalement d\'incidents graves — 15 j par défaut, 10 j si décès / préjudice grave santé, 2 j si infraction généralisée ou perturbation d\'infrastructure critique') },
    ]},
  ],
  HAUT_RISQUE_ANNEXE_III: [
    { pilier: _('Risk management', 'Gestion des risques'), items: [
      { ref: 'art. 9', txt: _('Iterative risk management system across the lifecycle', 'Système de gestion des risques itératif sur tout le cycle de vie') },
      { ref: 'ISO/IEC 23894:2023', txt: _('Documented AI risk methodology', 'Méthodologie risque IA documentée') },
      { ref: 'ISO 42001 A.5.2', txt: _('AIMS impact assessment', 'Évaluation d\'impact AIMS') },
      { ref: 'art. 9(9)', txt: _('Specific measures for minors if applicable', 'Mesures spécifiques pour mineurs si applicable') },
    ]},
    { pilier: _('Data and governance', 'Données et gouvernance'), items: [
      { ref: 'art. 10(2)', txt: _('Documented collection, preparation, examination practices', 'Pratiques de collecte, préparation, examen documentées') },
      { ref: 'art. 10(3)', txt: _('Relevant, representative, complete, accurate data', 'Données pertinentes, représentatives, complètes, exactes') },
      { ref: 'art. 10(5)', txt: _('Special-category processing — legal basis + safeguards', 'Traitement de catégories particulières — base légale + sauvegardes') },
      { ref: 'ISO/IEC 5259-1 to -5', txt: _('Data quality for AI', 'Qualité des données pour l\'IA') },
    ]},
    { pilier: _('Technical documentation', 'Documentation technique'), items: [
      { ref: _('art. 11 + Annex IV', 'art. 11 + Annexe IV'), txt: _('Technical documentation before placing on market', 'Documentation technique avant mise sur le marché') },
      { ref: 'art. 12', txt: _('Automatic logs (record keeping)', 'Logs automatiques (record keeping)') },
      { ref: 'art. 13', txt: _('Instructions for use to deployer', 'Notice d\'utilisation (instructions for use) au déployeur') },
    ]},
    { pilier: _('Human oversight and robustness', 'Supervision humaine et robustesse'), items: [
      { ref: 'art. 14', txt: _('Human oversight measures — interface, "stop button", interpretation', 'Mesures de supervision humaine — interface, "stop button", interprétation') },
      { ref: 'art. 15', txt: _('Accuracy, robustness, cybersecurity — appropriate level', 'Précision, robustesse, cybersécurité — niveau approprié') },
      { ref: 'ISO/IEC 24029', txt: _('Robustness assessment of neural networks', 'Évaluation de robustesse des réseaux de neurones') },
      { ref: 'ISO/IEC 27090', txt: _('AI cybersecurity mitigations (data poisoning, evasion, etc.)', 'Mitigations cybersécurité IA (data poisoning, evasion, etc.)') },
    ]},
    { pilier: _('Transparency and information', 'Transparence et information'), items: [
      { ref: 'art. 13', txt: _('Complete instructions to deployer (characteristics, capabilities, limits)', 'Notice complète au déployeur (caractéristiques, capacités, limites)') },
      { ref: 'art. 26(11)', txt: _('Information of persons subject to a decision', 'Information des personnes faisant l\'objet d\'une décision') },
      { ref: 'art. 86', txt: _('Right to explanation of an individual decision', 'Droit à l\'explication d\'une décision individuelle') },
    ]},
    { pilier: _('AIMS and quality', 'AIMS et qualité'), items: [
      { ref: 'art. 17', txt: _('Quality management system', 'Système de gestion qualité') },
      { ref: 'ISO/IEC 42001:2023', txt: _('AIMS certification — preferred path', 'Certification AIMS — voie privilégiée') },
      { ref: 'ISO 42001 A.6', txt: _('38 Annex A controls (impact, lifecycle, data, info, usage, third parties)', '38 contrôles Annexe A (impact, lifecycle, données, info, usage, tiers)') },
    ]},
    { pilier: _('FRIA and deployment', 'FRIA et déploiement'), items: [
      { ref: 'art. 27', txt: _('FRIA for public deployers or essential services (before first use)', 'FRIA pour déployeurs publics ou services essentiels (avant 1ère utilisation)') },
      { ref: 'ISO/IEC 42005:2025', txt: _('AIMS impact assessment methodology', 'Méthodologie d\'évaluation d\'impact AIMS') },
      { ref: 'art. 26', txt: _('Deployer obligations (training, oversight, monitoring)', 'Obligations déployeur (formation, supervision, suivi)') },
    ]},
    { pilier: _('Conformity and marking', 'Conformité et marquage'), items: [
      { ref: 'art. 43', txt: _('Conformity assessment (Annex VI self-assessment or Annex VII notified body)', 'Évaluation de conformité (auto-évaluation Annexe VI ou organisme notifié Annexe VII)') },
      { ref: 'art. 47', txt: _('EU declaration of conformity', 'Déclaration UE de conformité') },
      { ref: 'art. 48', txt: _('CE marking', 'Marquage CE') },
      { ref: 'art. 49', txt: _('EU database registration', 'Enregistrement base UE') },
    ]},
    { pilier: _('Post-market and incidents', 'Post-market et incidents'), items: [
      { ref: 'art. 72', txt: _('PMM plan proportionate to purpose and risks', 'Plan PMM proportionné à la finalité et aux risques') },
      { ref: 'art. 73(2)-(4)', txt: _('Serious incident reporting — 15 days default (art. 73(2)); 10 days if death or serious health harm (art. 73(4)); 2 days if widespread infringement or critical-infrastructure disruption (art. 73(3))', 'Reporting d\'incidents graves — 15 jours par défaut (art. 73(2)) ; 10 jours si décès ou préjudice grave santé (art. 73(4)) ; 2 jours si infraction généralisée ou perturbation d\'infrastructure critique (art. 73(3))') },
      { ref: 'art. 19', txt: _('Log retention ≥ 6 months (unless otherwise specified)', 'Conservation des logs ≥ 6 mois (sauf disposition contraire)') },
    ]},
    { pilier: _('AI literacy', 'AI literacy'), items: [
      { ref: 'art. 4', txt: _('Sufficient level among personnel and third parties — applicable since 2025-02-02', 'Niveau suffisant chez personnel et tiers — applicable depuis 2025-02-02') },
    ]},
  ],
  RISQUE_LIMITE: [
    { pilier: _('Transparency (art. 50)', 'Transparence (art. 50)'), items: [
      { ref: 'art. 50(1)', txt: _('Clear "you are interacting with an AI" notice at the latest at first contact', 'Information claire « vous interagissez avec une IA » au plus tard au 1er contact') },
      { ref: 'art. 50(2)', txt: _('Machine-readable marking of synthetic content (watermarking, C2PA)', 'Marquage machine-readable du contenu synthétique (watermarking, C2PA)') },
      { ref: 'art. 50(3)', txt: _('Inform subjects of biometric categorisation or emotion recognition', 'Information du sujet de catégorisation biométrique ou reconnaissance émotionnelle') },
      { ref: 'art. 50(4)', txt: _('"Deepfake" label on manipulated image/audio/video content', 'Label « deepfake » sur contenus image/audio/vidéo manipulés') },
      { ref: 'art. 50(4) §2', txt: _('Synthetic public-interest text labelling (except human-edited)', 'Étiquetage du texte synthétique d\'intérêt public (sauf édition humaine)') },
      { ref: 'art. 50(5)', txt: _('Transparency information must be clear, distinguishable, and provided at the latest at first interaction/exposure; where applicable, comply with accessibility requirements under Directive 2019/882/EU (European Accessibility Act)', 'Information de transparence : claire, distinguable, fournie au plus tard à la 1ʳᵉ interaction/exposition ; lorsque applicable, conforme aux exigences d\'accessibilité de la directive 2019/882/UE (European Accessibility Act)') },
    ]},
    { pilier: _('AI literacy', 'AI literacy'), items: [
      { ref: 'art. 4', txt: _('AI literacy programme applicable since 2025-02-02', 'Programme AI literacy applicable depuis 2025-02-02') },
    ]},
    { pilier: _('Recommended best practices', 'Bonnes pratiques recommandées'), items: [
      { ref: 'art. 95', txt: _('Voluntary adherence to code of conduct', 'Adhésion volontaire à un code de conduite') },
      { ref: 'ISO/IEC 42001 A.8', txt: _('Information to interested parties', 'Information aux parties prenantes') },
    ]},
  ],
  RISQUE_MINIMAL: [
    { pilier: _('Cross-cutting obligations', 'Obligations transverses'), items: [
      { ref: 'art. 4', txt: _('AI literacy — sufficient level among personnel and third parties (since 2025-02-02)', 'AI literacy — niveau suffisant chez personnel et tiers (depuis 2025-02-02)') },
      { ref: 'art. 25', txt: _('Watch substantial modifications (may flip into high-risk)', 'Veille des modifications substantielles (peut faire basculer en haut risque)') },
    ]},
    { pilier: _('Recommendations', 'Recommandations'), items: [
      { ref: 'art. 95', txt: _('Voluntary code of conduct encouraged', 'Code de conduite volontaire encouragé') },
      { ref: 'ISO/IEC 42001', txt: _('Optional AIMS approach to demonstrate mature posture', 'Démarche AIMS optionnelle pour montrer une posture mature') },
    ]},
  ],
  GPAI: [
    { pilier: _('Model documentation', 'Documentation modèle'), items: [
      { ref: _('art. 53(1)(a) + Annex XI', 'art. 53(1)(a) + Annexe XI'), txt: _('Model technical documentation (description, training, evaluations, energy)', 'Documentation technique du modèle (description, entraînement, évaluations, énergie)') },
      { ref: _('art. 53(1)(b) + Annex XII', 'art. 53(1)(b) + Annexe XII'), txt: _('Information to downstream providers integrating the model', 'Information aux fournisseurs en aval intégrant le modèle') },
    ]},
    { pilier: _('Copyright and data', 'Droit d\'auteur et données'), items: [
      { ref: 'art. 53(1)(c)', txt: _('Copyright compliance policy (incl. TDM opt-out from directive 2019/790)', 'Politique de respect du droit d\'auteur (incl. opt-out TDM directive 2019/790)') },
      { ref: 'art. 53(1)(d)', txt: _('Detailed public summary of training data', 'Résumé public détaillé des données d\'entraînement') },
    ]},
    { pilier: _('GPAI code of practice', 'Code de bonnes pratiques GPAI'), items: [
      { ref: 'art. 56', txt: _('Adherence to GPAI Code (published) — pathway to presumption of compliance', 'Adhésion au Code GPAI (publié) — voie de présomption de conformité') },
    ]},
    { pilier: _('Open source exemption', 'Exemption open source'), items: [
      { ref: 'art. 53(2)', txt: _('Open-source models under free licence — partial exemptions (except systemic risk)', 'Modèles open source sous licence libre — exemptions partielles (sauf risque systémique)') },
    ]},
  ],
  GPAI_RS: [
    { pilier: _('Notification', 'Notification'), items: [
      { ref: 'art. 52(1)', txt: _('Notification to AI Office within 2 weeks of crossing threshold', 'Notification au Bureau IA dans les 2 semaines après franchissement du seuil') },
      { ref: 'art. 51', txt: _('Criteria: 10^25 cumulative FLOPs OR Commission designation', 'Critères : 10^25 FLOPs cumulés OU désignation Commission') },
    ]},
    { pilier: _('Evaluation and red-teaming', 'Évaluation et red-teaming'), items: [
      { ref: 'art. 55(1)(a)', txt: _('Model evaluation per standardised protocols (red-teaming included)', 'Évaluation du modèle selon protocoles standardisés (red-teaming inclus)') },
      { ref: 'ISO/IEC 27090 § Foundation models', txt: _('Threat taxonomy specific to foundation models', 'Threat taxonomy spécifique modèles de fondation') },
      { ref: 'OWASP LLM Top 10', txt: _('Coverage of applicative risks', 'Couverture des risques applicatifs') },
    ]},
    { pilier: _('Systemic risks and incidents', 'Risques systémiques et incidents'), items: [
      { ref: 'art. 55(1)(b)', txt: _('Assessment and mitigation of systemic risks', 'Évaluation et atténuation des risques systémiques') },
      { ref: 'art. 55(1)(c)', txt: _('Tracking, documentation, serious-incident reporting to AI Office', 'Suivi, documentation, reporting d\'incidents graves au Bureau IA') },
    ]},
    { pilier: _('Cybersecurity', 'Cybersécurité'), items: [
      { ref: 'art. 55(1)(d)', txt: _('Adequate cybersecurity level (model + infrastructure)', 'Niveau adéquat de cybersécurité (modèle + infrastructure)') },
      { ref: 'ISO/IEC 27090', txt: _('AI cybersecurity mitigations', 'Mitigations cybersécurité IA') },
    ]},
    { pilier: _('Additional documentation', 'Documentation supplémentaire'), items: [
      { ref: 'art. 55', txt: _('Enriched documentation — evaluations, measures, internal governance', 'Documentation enrichie — évaluations, mesures, gouvernance interne') },
    ]},
  ],
};
