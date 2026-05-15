import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import {
  ChevronRight, ChevronLeft, Check, Clock, RefreshCw, BookOpen, Zap,
  ListChecks, Scale, Building2, Users, Briefcase,
  Plane, Network, Copy, Printer, Compass, ArrowRight, Globe,
  AlertCircle,
} from 'lucide-react';
import { t } from './src/lib/i18n.js';
import {
  computeCategory,
  PROHIBITED_PRACTICES,
  ANNEX_III_AREAS,
  ART50_TRIGGERS,
  ART5_CARVEOUTS,
} from './src/lib/classify.js';

/* ============================================================================
 * AI ACT COMPASS — Bilingual Artifact (EN / FR)
 * Source : github.com/abk1969/ai-act-skills (ai-act-compliance v1.2.0)
 * Anchored : Regulation (EU) 2024/1689 + ISO/IEC 42001:2023 + ISO/IEC 27090:2025
 * Default language : EN
 * ========================================================================== */

/* ---------------------------------------------------------------------------
 * I18N HELPERS
 * ------------------------------------------------------------------------- */

const LangContext = createContext('en');
const useLang = () => useContext(LangContext);

/* ---------------------------------------------------------------------------
 * UI STRINGS
 * ------------------------------------------------------------------------- */

const UI = {
  appTitle:        { en: 'AI Act Compass',                          fr: 'AI Act Compass' },
  appSubtitle:     { en: 'Regulation (EU) 2024/1689',               fr: 'Règlement (UE) 2024/1689' },
  restart:         { en: 'Start over',                              fr: 'Recommencer' },
  // Welcome
  welcomeKicker:   { en: 'Qualification tool',                      fr: 'Outil de qualification' },
  welcomeTitle1:   { en: 'Qualify your AI system',                  fr: 'Qualifiez votre système IA' },
  welcomeTitle2:   { en: 'under the EU regulation.',                fr: 'selon le Règlement européen.' },
  welcomeIntro:    {
    en: 'Seven guided steps to determine the risk category of your system under Regulation (EU) 2024/1689, identify your obligations, and generate a tailored compliance roadmap.',
    fr: 'Sept étapes guidées pour déterminer la catégorie de risque de votre système au sens du Règlement (UE) 2024/1689, identifier vos obligations, et générer une feuille de route de conformité personnalisée.',
  },
  feat1Title:      { en: 'Qualification',                           fr: 'Qualification' },
  feat1Desc:       { en: 'Decision motivated by articles',          fr: 'Décision motivée par articles' },
  feat2Title:      { en: 'Quickwins · 30 days',                     fr: 'Quickwins · 30 jours' },
  feat2Desc:       { en: 'Three immediate actions',                 fr: '3 actions immédiates' },
  feat3Title:      { en: 'Checklist by pillar',                     fr: 'Checklist par pilier' },
  feat3Desc:       { en: 'Mapped to ISO 42001 + 27090',             fr: 'Mappée ISO 42001 + 27090' },
  startBtn:        { en: 'Start qualification',                     fr: 'Commencer la qualification' },
  milestonesTitle: { en: 'Regulatory milestones',                   fr: 'Jalons réglementaires' },
  // Navigation
  step:            { en: 'Step',                                    fr: 'Étape' },
  continueBtn:     { en: 'Continue',                                fr: 'Continuer' },
  backBtn:         { en: 'Back',                                    fr: 'Retour' },
  viewVerdict:     { en: 'View verdict',                            fr: 'Voir le verdict' },
  // Steps
  q1Title:         { en: 'What is your regulatory role?',           fr: 'Quel est votre rôle réglementaire ?' },
  q1Sub:           {
    en: 'The AI Act allocates obligations by role across the value chain (art. 3(3)–(8) and art. 25 on role flips).',
    fr: 'L\'AI Act distribue les obligations selon le rôle joué dans la chaîne de valeur (art. 3(3)-(8) et art. 25 sur les bascules de rôle).',
  },
  q2Title:         { en: 'What is the nature of your system?',      fr: 'Quelle est la nature de votre système ?' },
  q2Sub:           {
    en: 'Distinguish an applied AI system (art. 3(1)) from a general-purpose AI model (art. 3(63)). A system may run on top of a third-party GPAI.',
    fr: 'Distinguez système IA applicatif (art. 3(1)) et modèle d\'IA à usage général (art. 3(63)). Un système peut reposer sur un GPAI tiers.',
  },
  q3Title:         { en: 'Prohibited practices — Article 5',        fr: 'Pratiques interdites — article 5' },
  q3Sub:           {
    en: 'Tick any applicable case. A single ticked box triggers an immediate "PROHIBITED" qualification. Otherwise, select "None of the above".',
    fr: 'Cochez tout cas applicable. Une seule case cochée déclenche une qualification immédiate « INTERDIT ». Sinon, sélectionnez « Aucune ».',
  },
  q3None:          { en: 'None of the above practices apply',       fr: 'Aucune des pratiques ci-dessus' },
  q3NoneSub:       { en: 'Continue',                                fr: 'Continuer' },
  q4Title:         { en: 'Safety component of a harmonised product?', fr: 'Composant de sécurité d\'un produit harmonisé ?' },
  q4Sub:           {
    en: 'Is your system a safety component of a product (or the product itself) covered by the Union harmonisation legislation listed in Annex I (machinery, medical devices, toys, motor vehicles, lifts, radio equipment…)?',
    fr: 'Votre système est-il un composant de sécurité d\'un produit (ou produit lui-même) couvert par la législation d\'harmonisation listée à l\'Annexe I (machines, dispositifs médicaux, jouets, automobiles, ascenseurs, équipements radio…) ?',
  },
  yes:             { en: 'Yes',                                     fr: 'Oui' },
  no:              { en: 'No',                                      fr: 'Non' },
  q4YesDesc:       {
    en: 'The product/component is subject to a sectoral regulation listed in Annex I and requires third-party conformity assessment under that regime.',
    fr: 'Le produit/composant est soumis à un règlement sectoriel listé à l\'Annexe I et requiert une évaluation de conformité par tiers selon ce régime.',
  },
  q4NoDesc:        { en: 'My system does not fall within the scope of Annex I.', fr: 'Mon système n\'entre pas dans le champ de l\'Annexe I.' },
  q5Title:         { en: 'Annex III domains',                       fr: 'Domaines de l\'Annexe III' },
  q5Sub:           {
    en: 'Tick any applicable domain. If one or more is ticked, Article 6(3) exceptions will be presented below.',
    fr: 'Cochez tout domaine applicable à votre cas d\'usage. Si un ou plusieurs sont cochés, des exceptions de l\'article 6(3) seront proposées à l\'étape suivante.',
  },
  q5ExceptionsKicker: { en: 'Article 6(3) exceptions',              fr: 'Exceptions article 6(3)' },
  q5ExceptionsTitle: { en: 'Does an exception apply?',              fr: 'Une exception s\'applique-t-elle ?' },
  q5ExceptionsSub: {
    en: 'Even within an Annex III domain, the system may be removed from high-risk if one of the following conditions is satisfied — provided this analysis is documented (art. 6(4)).',
    fr: 'Même dans un domaine de l\'Annexe III, le système peut être retiré du haut risque si l\'une des conditions suivantes est satisfaite — à condition de documenter cette analyse (art. 6(4)).',
  },
  q5ProfilingWarning: {
    en: 'Important — art. 6(3) second subparagraph: an AI system referred to in Annex III shall always be considered high-risk where it performs profiling of natural persons (GDPR art. 4(4)). Profiling systems CANNOT use the derogations below.',
    fr: 'Important — art. 6(3) deuxième alinéa : un système IA visé à l\'Annexe III est toujours considéré comme à haut risque s\'il effectue un profilage de personnes physiques (au sens RGPD art. 4(4)). Les systèmes effectuant un profilage NE PEUVENT PAS bénéficier des dérogations ci-dessous.',
  },
  q5ExceptionsNone: { en: 'No exception applies',                   fr: 'Aucune exception applicable' },
  q6Title:         { en: 'Article 50 — transparency triggers',      fr: 'Article 50 — déclencheurs de transparence' },
  q6Sub:           {
    en: 'Independently of the risk level, art. 50 imposes specific transparency obligations on certain systems. Tick what applies.',
    fr: 'Indépendamment du niveau de risque, l\'art. 50 impose des obligations spécifiques de transparence à certains systèmes. Cochez ce qui s\'applique.',
  },
  q7Title:         { en: 'GPAI with systemic risk?',                fr: 'GPAI à risque systémique ?' },
  q7Sub:           {
    en: 'Relevant only if your system is a GPAI model (cf. step 2). The presumed threshold is 10^25 cumulative floating-point operations at training (art. 51(2)).',
    fr: 'Question pertinente uniquement si votre système est un modèle GPAI (cf. étape 2). Le seuil présomptif est de 10^25 opérations en virgule flottante cumulées à l\'entraînement (art. 51(2)).',
  },
  q7NotApplicable: {
    en: 'This step does not apply to your case (your system is not a GPAI). You may proceed directly to the verdict.',
    fr: 'Cette étape n\'est pas applicable à votre cas (votre système n\'est pas un GPAI). Vous pouvez passer directement au verdict.',
  },
  q7YesTitle:      { en: 'Yes — model with systemic risk',          fr: 'Oui — modèle à risque systémique' },
  q7YesDesc:       {
    en: 'Training compute ≥ 10^25 FLOPs OR designation by the Commission. Reinforced regime (notification, evaluations, red-teaming, cybersecurity, incident reporting).',
    fr: 'Calcul d\'entraînement ≥ 10^25 FLOPs OU désignation par la Commission. Régime renforcé (notification, évaluations, red-teaming, cybersécurité, reporting d\'incidents).',
  },
  q7NoTitle:       { en: 'No — standard GPAI',                      fr: 'Non — GPAI standard' },
  q7NoDesc:        {
    en: 'Model documentation, downstream transparency, copyright policy, public summary of training data.',
    fr: 'Documentation modèle, transparence aval, politique copyright, résumé public des données.',
  },
  // Result
  verdictKicker:   { en: 'Qualification verdict',                   fr: 'Verdict de qualification' },
  cumulativeKicker:{ en: 'Cumulative category(ies)',                fr: 'Catégorie(s) cumulative(s)' },
  justifTitle:     { en: 'Regulatory justification',                fr: 'Justification réglementaire' },
  roleLabel:       { en: 'Role',                                    fr: 'Rôle' },
  natureLabel:     { en: 'Nature',                                  fr: 'Nature' },
  triggersLabel:   { en: 'Identified triggers',                     fr: 'Déclencheurs identifiés' },
  tabQuickwins:    { en: 'Quickwins',                               fr: 'Quickwins' },
  tabChecklist:    { en: 'Checklist',                               fr: 'Checklist' },
  tabTimeline:     { en: 'Timeline',                                fr: 'Timeline' },
  quickwinsIntro:  {
    en: 'Three actions anchored to specific articles and ISO controls, to launch within 30 days.',
    fr: 'Trois actions ancrées sur des articles précis et des contrôles ISO, à engager sous 30 jours.',
  },
  checklistIntro:  {
    en: 'Comprehensive checklist structured by compliance pillar. Click items to mark them as handled.',
    fr: 'Checklist exhaustive structurée par pilier de conformité. Cliquez pour cocher les éléments traités.',
  },
  timelineIntro:   { en: 'Regulatory milestones applicable to your system.', fr: 'Jalons réglementaires applicables à votre système.' },
  cumulativeObligations: { en: 'Cumulative obligations',            fr: 'Obligations cumulatives' },
  newQualification:{ en: 'New qualification',                       fr: 'Nouvelle qualification' },
  copyReport:      { en: 'Copy report',                             fr: 'Copier le rapport' },
  printPdf:        { en: 'Print / PDF',                             fr: 'Imprimer / PDF' },
  reportCopied:    { en: 'Report copied to clipboard',              fr: 'Rapport copié dans le presse-papier' },
  // Print-mode strings
  printCoverKicker:    { en: 'AI ACT COMPASS', fr: 'AI ACT COMPASS' },
  printCoverTitle:     { en: 'Compliance Report', fr: 'Rapport de conformité' },
  printCoverDate:      { en: 'Generated on', fr: 'Généré le' },
  printSectionVerdict: { en: 'Verdict & justification', fr: 'Verdict & justification' },
  printSectionQW:      { en: 'Quickwins · 30 days', fr: 'Quickwins · 30 jours' },
  printSectionCL:      { en: 'Compliance checklist', fr: 'Checklist de conformité' },
  printSectionTL:      { en: 'Regulatory timeline', fr: 'Calendrier réglementaire' },
  printPageOf:         { en: 'of', fr: 'sur' },
  printPopupBlocked:   {
    en: 'Pop-up blocked. The report has been downloaded as an HTML file — open it and use your browser\'s print function to save as PDF.',
    fr: 'Popup bloquée. Le rapport a été téléchargé en HTML — ouvrez-le et utilisez l\'impression du navigateur pour générer le PDF.',
  },
  printNotReady:       { en: 'Report not ready', fr: 'Rapport non prêt' },
  printGenerating:     { en: 'Generating PDF…', fr: 'Génération du PDF…' },
  printError:          {
    en: 'PDF generation failed. Please try again or use Ctrl/Cmd+P.',
    fr: 'Échec de la génération PDF. Réessayez ou utilisez Ctrl/Cmd+P.',
  },
  // Footer
  footerNoticeKicker: { en: 'Notice',                               fr: 'Avis' },
  footerNotice:    {
    en: 'Decision-support tool. This is not a substitute for qualified legal advice or for conformity assessment by a notified body (art. 43).',
    fr: 'Outil d\'aide à la décision. Ne se substitue pas à une analyse juridique qualifiée ni à l\'évaluation de conformité par un organisme notifié (art. 43).',
  },
  // Verdict-page inline disclaimer
  verdictDisclaimerTitle: {
    en: 'Decision-support only',
    fr: 'Aide à la décision uniquement',
  },
  verdictDisclaimer: {
    en: 'Final qualification requires qualified legal counsel and, for most high-risk systems, conformity assessment by a notified body (art. 43). This output is non-binding.',
    fr: 'La qualification finale requiert un conseil juridique qualifié et, pour la plupart des systèmes à haut risque, une évaluation de conformité par un organisme notifié (art. 43). Cette restitution n\'a pas valeur d\'engagement.',
  },
  footerAnchor:    {
    en: 'Normative anchor:',
    fr: 'Ancrage normatif :',
  },
  footerAnchorText:{
    en: ' (AIMS) + ',
    fr: ' (AIMS) + ',
  },
  footerAnchorEnd: {
    en: ' (AI cybersecurity). Source: ',
    fr: ' (cybersécurité IA). Source : ',
  },
  // Quickwin labels
  quickwinDeadlineLabel: { en: 'Deadline', fr: 'Délai' },
  // Report
  reportTitle:     { en: 'AI ACT COMPASS — QUALIFICATION REPORT',   fr: 'AI ACT COMPASS — RAPPORT DE QUALIFICATION' },
  reportPrimary:   { en: 'Primary category',                        fr: 'Catégorie principale' },
  reportCumul:     { en: 'Cumulative category(ies)',                fr: 'Catégorie(s) cumulative(s)' },
  reportRole:      { en: 'Regulatory role',                         fr: 'Rôle réglementaire' },
  reportNature:    { en: 'Nature',                                  fr: 'Nature' },
  reportJustif:    { en: 'JUSTIFICATIONS',                          fr: 'JUSTIFICATIONS' },
  reportQuickwins: { en: 'QUICKWINS (30 DAYS)',                     fr: 'QUICKWINS (30 JOURS)' },
  reportChecklist: { en: 'CHECKLIST',                               fr: 'CHECKLIST' },
  reportRefs:      { en: 'Refs',                                    fr: 'Réf.' },
  reportFooter:    {
    en: 'Decision-support tool. Does not substitute for qualified legal analysis. Anchor: ISO/IEC 42001:2023 + ISO/IEC 27090:2025.',
    fr: 'Outil d\'aide à la décision. Ne se substitue pas à une analyse juridique. Ancrage : ISO/IEC 42001:2023 + ISO/IEC 27090:2025.',
  },
};

/* ---------------------------------------------------------------------------
 * Annex / Recital labels (language-dependent)
 * ------------------------------------------------------------------------- */
const annex = (n, suffix = '') => ({
  en: `Annex ${n}${suffix}`,
  fr: `Annexe ${n}${suffix}`,
});

/* ---------------------------------------------------------------------------
 * DATA — Roles, Natures, Practices, Domains, Triggers
 * ------------------------------------------------------------------------- */

const ROLES = [
  {
    id: 'fournisseur',
    label: { en: 'Provider', fr: 'Fournisseur' },
    sub:   { en: 'Provider — art. 3(3)', fr: 'Fournisseur — art. 3(3)' },
    desc:  {
      en: 'You develop or have developed an AI system and place it on the market or put it into service under your name.',
      fr: 'Vous développez ou faites développer un système IA et le mettez sur le marché ou en service sous votre nom.',
    },
    icon: Building2,
  },
  {
    id: 'deployeur',
    label: { en: 'Deployer', fr: 'Déployeur' },
    sub:   { en: 'Deployer — art. 3(4)', fr: 'Déployeur — art. 3(4)' },
    desc:  {
      en: 'You use an AI system under your authority in the course of a professional activity.',
      fr: 'Vous utilisez un système IA sous votre autorité dans le cadre d\'une activité professionnelle.',
    },
    icon: Users,
  },
  {
    id: 'importateur',
    label: { en: 'Importer', fr: 'Importateur' },
    sub:   { en: 'Importer — art. 3(6)', fr: 'Importateur — art. 3(6)' },
    desc:  {
      en: 'You place on the Union market an AI system bearing the name of a person established outside the EU.',
      fr: 'Vous mettez sur le marché de l\'Union un système IA portant le nom d\'une personne établie hors UE.',
    },
    icon: Plane,
  },
  {
    id: 'distributeur',
    label: { en: 'Distributor', fr: 'Distributeur' },
    sub:   { en: 'Distributor — art. 3(7)', fr: 'Distributeur — art. 3(7)' },
    desc:  {
      en: 'You make an AI system available on the Union market (other than provider/importer).',
      fr: 'Vous mettez à disposition un système IA sur le marché de l\'Union (autre que fournisseur/importateur).',
    },
    icon: Network,
  },
  {
    id: 'mandataire',
    label: { en: 'Authorised representative', fr: 'Mandataire' },
    sub:   { en: 'Authorised representative — art. 3(5)', fr: 'Mandataire — art. 3(5)' },
    desc:  {
      en: 'You represent a provider established outside the EU under written mandate.',
      fr: 'Vous représentez un fournisseur établi hors UE par mandat écrit.',
    },
    icon: Briefcase,
  },
];

const NATURES = [
  {
    id: 'systeme_ia',
    label: { en: 'AI system', fr: 'Système d\'IA' },
    sub:   { en: 'AI system — art. 3(1)', fr: 'Système d\'IA — art. 3(1)' },
    desc:  {
      en: 'Automated system inferring from inputs how to generate outputs (predictions, content, recommendations, decisions) influencing physical or virtual environments.',
      fr: 'Système automatisé inférant à partir d\'inputs comment générer outputs (prédictions, contenus, recommandations, décisions) influençant des environnements physiques ou virtuels.',
    },
  },
  {
    id: 'gpai',
    label: { en: 'General-purpose AI model (GPAI)', fr: 'Modèle d\'IA à usage général (GPAI)' },
    sub:   { en: 'GPAI model — art. 3(63)', fr: 'GPAI — art. 3(63)' },
    desc:  {
      en: 'Model trained on large amounts of data, displaying significant generality, capable of competently performing a wide range of distinct tasks.',
      fr: 'Modèle entraîné sur grande quantité de données, présentant une généralité significative, capable d\'accomplir un large éventail de tâches distinctes.',
    },
  },
  {
    id: 'systeme_sur_gpai',
    label: { en: 'AI system relying on a GPAI', fr: 'Système IA reposant sur un GPAI' },
    sub:   { en: 'System integrating a GPAI model', fr: 'Système intégrant un modèle GPAI' },
    desc:  {
      en: 'Application built on top of a third-party or proprietary GPAI model (chatbot, agent, copilot, RAG…).',
      fr: 'Application construite au-dessus d\'un modèle GPAI tiers ou propriétaire (chatbot, agent, copilote, RAG…).',
    },
  },
];

const ART6_EXCEPTIONS = [
  {
    id: 'narrow',
    label: { en: 'Narrow procedural task', fr: 'Tâche procédurale étroite' },
    desc:  {
      en: 'The system is intended to perform a narrow procedural task.',
      fr: 'Le système est destiné à accomplir une tâche procédurale étroite.',
    },
  },
  {
    id: 'improve',
    label: { en: 'Improvement of a previously completed human activity', fr: 'Amélioration d\'une activité humaine' },
    desc:  {
      en: 'The system improves the result of a previously completed human activity.',
      fr: 'Le système améliore le résultat d\'une activité humaine déjà accomplie.',
    },
  },
  {
    id: 'pattern',
    label: { en: 'Detection of decision-making patterns', fr: 'Détection de schémas décisionnels' },
    desc:  {
      en: 'The system detects decision-making patterns or deviations from such patterns, without replacing or influencing the human assessment without proper human review.',
      fr: 'Le système détecte des schémas décisionnels ou des écarts par rapport à ces schémas, sans remplacer ni influencer l\'évaluation humaine sans révision humaine appropriée.',
    },
  },
  {
    id: 'preparatory',
    label: { en: 'Preparatory task for an assessment', fr: 'Tâche préparatoire à une évaluation' },
    desc:  {
      en: 'The system performs a preparatory task to an assessment relevant for the use cases listed in Annex III.',
      fr: 'Le système accomplit une tâche préparatoire à une évaluation pertinente pour les usages listés à l\'Annexe III.',
    },
  },
];

/* ---------------------------------------------------------------------------
 * QUICKWINS by category
 * ------------------------------------------------------------------------- */

const QUICKWINS = {
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

/* ---------------------------------------------------------------------------
 * CHECKLIST by category
 * ------------------------------------------------------------------------- */

const _ = (en, fr) => ({ en, fr });

const CHECKLIST = {
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

/* ---------------------------------------------------------------------------
 * TIMELINE
 * ------------------------------------------------------------------------- */

const TIMELINE = [
  { date: '2024-08-01', event: _('Entry into force of Regulation (EU) 2024/1689', 'Entrée en vigueur du Règlement (UE) 2024/1689'), applicableTo: ['ALL'] },
  { date: '2025-02-02', event: _('Art. 5 (prohibitions) + Art. 4 (AI literacy) applicable', 'Art. 5 (interdictions) + Art. 4 (AI literacy) applicables'), applicableTo: ['INTERDIT', 'ALL'] },
  { date: '2025-08-02', event: _('GPAI (chap. V) + governance + partial sanctions applicable', 'GPAI (chap. V) + gouvernance + sanctions partielles applicables'), applicableTo: ['GPAI', 'GPAI_RS'] },
  { date: '2026-08-02', event: _('General application — Annex III high-risk, art. 50 transparency', 'Application générale — haut risque Annexe III, transparence art. 50'), applicableTo: ['HAUT_RISQUE_ANNEXE_III', 'RISQUE_LIMITE', 'RISQUE_MINIMAL'] },
  { date: '2027-08-02', event: _('Annex I high-risk (product-safety pathway) applicable', 'Haut risque Annexe I (chemin produit-sécurité) applicable'), applicableTo: ['HAUT_RISQUE_ANNEXE_I'] },
  { date: '2030-12-31', event: _('Bringing existing large public IT systems into compliance', 'Mise en conformité des grands systèmes IT publics existants'), applicableTo: ['HAUT_RISQUE_ANNEXE_III'] },
];

/* ---------------------------------------------------------------------------
 * CATEGORY METADATA
 * ------------------------------------------------------------------------- */

const CATEGORIES_META = {
  INTERDIT: {
    label: _('Prohibited practice', 'Pratique interdite'),
    sub:   _('Article 5', 'Article 5'),
    bg: '#FBE9E5', border: '#B5443C', accent: '#B5443C', text: '#7A2E29',
    badge: _('Prohibited', 'Interdit'),
    summary: _(
      'The system constitutes a practice prohibited by Article 5. Its placing on the market and use are prohibited in the Union since 2 February 2025.',
      'Le système relève d\'une pratique prohibée par l\'article 5. Sa mise sur le marché et son utilisation sont interdites dans l\'Union depuis le 2 février 2025.'
    ),
  },
  HAUT_RISQUE_ANNEXE_I: {
    label: _('High-risk — product pathway', 'Haut risque — chemin produit'),
    sub:   _('Art. 6(1) + Annex I', 'Art. 6(1) + Annexe I'),
    bg: '#F8E6DD', border: '#CC785C', accent: '#CC785C', text: '#7A4232',
    badge: _('High-risk', 'Haut risque'),
    summary: _(
      'Safety component of a product covered by the Union harmonisation legislation listed in Annex I. Compliance integrated with the existing sectoral regime. Application: 2 August 2027.',
      'Composant de sécurité d\'un produit relevant de la législation d\'harmonisation listée à l\'Annexe I. Conformité intégrée au régime sectoriel existant. Application : 2 août 2027.'
    ),
  },
  HAUT_RISQUE_ANNEXE_III: {
    label: _('High-risk — Annex III pathway', 'Haut risque — chemin Annexe III'),
    sub:   _('Art. 6(2) + Annex III', 'Art. 6(2) + Annexe III'),
    bg: '#F8E6DD', border: '#CC785C', accent: '#CC785C', text: '#7A4232',
    badge: _('High-risk', 'Haut risque'),
    summary: _(
      'System operating in a domain listed in Annex III. Full obligations regime applicable on 2 August 2026: RMS, data governance, Annex IV documentation, human oversight, robustness, transparency, CE marking, post-market.',
      'Système opérant dans un domaine listé à l\'Annexe III. Régime complet d\'obligations applicable au 2 août 2026 : SGR, gouvernance des données, documentation Annexe IV, supervision humaine, robustesse, transparence, marquage CE, post-market.'
    ),
  },
  RISQUE_LIMITE: {
    label: _('Limited risk', 'Risque limité'),
    sub:   _('Art. 50 — transparency', 'Art. 50 — transparence'),
    bg: '#F5E9D2', border: '#C8923A', accent: '#C8923A', text: '#6E5429',
    badge: _('Limited risk', 'Risque limité'),
    summary: _(
      'Targeted transparency obligations: user information, marking of synthetic content, deepfake label. Application: 2 August 2026.',
      'Obligations de transparence ciblées : information de l\'utilisateur, marquage du contenu synthétique, label deepfake. Application : 2 août 2026.'
    ),
  },
  RISQUE_MINIMAL: {
    label: _('Minimal risk', 'Risque minimal'),
    sub:   _('Out of specific regime', 'Hors régime spécifique'),
    bg: '#E5EAD9', border: '#5A7A4F', accent: '#5A7A4F', text: '#384F2F',
    badge: _('Minimal risk', 'Risque minimal'),
    summary: _(
      'No specific material obligation beyond AI literacy (art. 4) and watch on substantial modifications (art. 25). Voluntary codes encouraged.',
      'Pas d\'obligation matérielle spécifique au-delà de l\'AI literacy (art. 4) et de la veille sur les modifications substantielles (art. 25). Codes volontaires encouragés.'
    ),
  },
  GPAI: {
    label: _('Standard GPAI', 'GPAI standard'),
    sub:   _('Art. 53-54', 'Art. 53-54'),
    bg: '#EFE4D8', border: '#815B47', accent: '#815B47', text: '#4D372B',
    badge: 'GPAI',
    summary: _(
      'General-purpose AI model below the systemic-risk threshold. Documentation, downstream transparency, copyright policy, public training-data summary. Applicable since 2 August 2025.',
      'Modèle d\'IA à usage général sous le seuil de risque systémique. Documentation, transparence aval, politique copyright, résumé public des données. Applicable depuis le 2 août 2025.'
    ),
  },
  GPAI_RS: {
    label: _('GPAI with systemic risk', 'GPAI à risque systémique'),
    sub:   _('Art. 51-55', 'Art. 51-55'),
    bg: '#E5D6C5', border: '#5C3F2E', accent: '#5C3F2E', text: '#3A271C',
    badge: _('GPAI — SR', 'GPAI — RS'),
    summary: _(
      'Model exceeding 10^25 cumulative FLOPs or designated by the Commission. Reinforced regime: notification, evaluations, red-teaming, systemic-risk mitigation, cybersecurity, incident reporting.',
      'Modèle dépassant 10^25 FLOPs cumulés ou désigné par la Commission. Régime renforcé : notification, évaluations, red-teaming, atténuation des risques systémiques, cybersécurité, reporting d\'incidents.'
    ),
  },
};

/* ============================================================================
 * SECTION 2 — LOGIC
 * ========================================================================== */

/* ============================================================================
 * SECTION 3 — UI COMPONENTS
 * ========================================================================== */

function LangToggle({ lang, setLang }) {
  return (
    <div className="flex items-center gap-1 border border-rule rounded-full p-0.5 bg-paper">
      {['EN', 'FR'].map(code => {
        const c = code.toLowerCase();
        const active = lang === c;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(c)}
            className={`font-mono text-[10.5px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full transition-colors duration-200 ${
              active ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
            }`}
            aria-label={`Switch to ${code}`}
            aria-pressed={active}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

function Header({ step, totalSteps, onRestart, lang, setLang }) {
  const pct = step === 0 ? 0 : step > totalSteps ? 100 : (step / totalSteps) * 100;
  // Roman numerals for the active step indicator — "II / VII"
  const romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const onResult = step > totalSteps;
  return (
    <header className="border-b border-rule bg-paper/85 backdrop-blur-md sticky top-0 z-20 print:hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between gap-4">
        {/* Wordmark — typographic, no avatar block */}
        <div className="flex items-baseline gap-3">
          <Compass className="w-4 h-4 text-terracotta translate-y-[2px]" strokeWidth={1.6} aria-hidden />
          <div className="leading-none">
            <div className="font-display text-ink text-[19px] tracking-tight" style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 50, 'wght' 480" }}>
              {t(UI.appTitle, lang)}
            </div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-faint mt-1">{t(UI.appSubtitle, lang)}</div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {step > 0 && step <= totalSteps && (
            <div className="hidden md:flex items-baseline gap-2 font-mono text-[10.5px] tracking-[0.22em] uppercase text-ink-faint">
              <span className="text-terracotta">{romans[step]}</span>
              <span>/</span>
              <span>VII</span>
            </div>
          )}
          {step > 0 && (
            <button
              type="button"
              onClick={onRestart}
              className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-ink-muted hover:text-ink transition-colors flex items-center gap-2 rounded-full px-1.5 py-1"
              aria-label={t(UI.restart, lang)}
            >
              <RefreshCw className="w-3 h-3" strokeWidth={1.6} />
              <span className="hidden sm:inline">{t(UI.restart, lang)}</span>
            </button>
          )}
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>
      {step > 0 && step <= totalSteps && (
        <div className="h-[1px] bg-rule-soft relative">
          <div
            className="absolute top-0 left-0 h-full bg-terracotta transition-all duration-700 ease-editorial"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      )}
      {onResult && (
        <div className="h-[2px] bg-ink" aria-hidden />
      )}
    </header>
  );
}

function Footer() {
  const lang = useLang();
  return (
    <footer className="border-t-2 border-ink bg-paper-tint mt-24 print:bg-white print:mt-8 print:break-inside-avoid print:border-t print:border-ink">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 grid md:grid-cols-[140px_1fr] gap-x-10 gap-y-3">
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-muted">
          {t(UI.footerNoticeKicker, lang)}
        </div>
        <div className="text-[12.5px] text-ink-soft leading-[1.7] max-w-2xl">
          <p className="mb-3">{t(UI.footerNotice, lang)}</p>
          <p className="text-ink-muted">
            {t(UI.footerAnchor, lang)}{' '}
            <span className="font-mono text-ink">ISO/IEC&nbsp;42001:2023</span>{t(UI.footerAnchorText, lang)}
            <span className="font-mono text-ink">ISO/IEC&nbsp;27090:2025</span>{t(UI.footerAnchorEnd, lang)}
            <span className="font-mono">github.com/abk1969/ai-act-skills</span>&nbsp;v1.2.0.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FeatureCard({ icon: Icon, title, desc, idx }) {
  return (
    <div className={`border-t border-rule pt-4 reveal stagger-${idx + 4}`}>
      <Icon className="w-4 h-4 text-terracotta mb-3" strokeWidth={1.6} aria-hidden />
      <div className="font-display text-ink text-[17px] leading-[1.2] mb-1.5" style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 50, 'wght' 460" }}>
        {title}
      </div>
      <div className="text-[12.5px] text-ink-muted leading-[1.55]">{desc}</div>
    </div>
  );
}

function Welcome({ onStart }) {
  const lang = useLang();
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-14 md:py-24">
      {/* ============================================================
       * MASTHEAD — issue marker, like a journal cover
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-14 md:mb-20 reveal stagger-1">
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint mb-3 md:mb-0">
          № 01 — 2025
        </div>
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-terracotta">
          {t(UI.welcomeKicker, lang)}
        </div>
      </div>

      {/* ============================================================
       * HERO — asymmetric editorial display
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-14 md:mb-20">
        <div className="hidden md:block"></div>
        <div>
          <h1
            className="font-display text-ink leading-[0.92] tracking-tightest mb-2 reveal stagger-2"
            style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 360",
            }}
          >
            {t(UI.welcomeTitle1, lang)}
          </h1>
          <h1
            className="font-display italic text-ink-muted leading-[0.95] tracking-tight mb-10 reveal stagger-3"
            style={{
              fontSize: 'clamp(40px, 7vw, 84px)',
              fontVariationSettings: "'opsz' 144, 'SOFT' 70, 'wght' 320",
            }}
          >
            {t(UI.welcomeTitle2, lang)}
          </h1>

          {/* Lede paragraph with drop cap — only kicks in at md+ via CSS media query */}
          <div className="reveal stagger-4 max-w-[42rem]">
            <p
              className="text-[18px] md:text-[19px] text-ink-soft leading-[1.55] drop-cap-text"
              style={{ fontVariationSettings: "'opsz' 18, 'SOFT' 45, 'wght' 380" }}
            >
              {t(UI.welcomeIntro, lang)}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
       * THREE PILLARS — hairline-divided, no boxed cards
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-14 md:mb-20">
        <div className="hidden md:block font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint pt-4 border-t border-rule">
          Method
        </div>
        <div className="grid md:grid-cols-3 gap-x-8 gap-y-6">
          <FeatureCard idx={0} icon={Scale} title={t(UI.feat1Title, lang)} desc={t(UI.feat1Desc, lang)} />
          <FeatureCard idx={1} icon={Zap} title={t(UI.feat2Title, lang)} desc={t(UI.feat2Desc, lang)} />
          <FeatureCard idx={2} icon={ListChecks} title={t(UI.feat3Title, lang)} desc={t(UI.feat3Desc, lang)} />
        </div>
      </div>

      {/* ============================================================
       * CTA — generous, with hairline rule above
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-20 reveal stagger-6">
        <div></div>
        <button
          type="button"
          onClick={onStart}
          className="group inline-flex items-center gap-4 bg-ink text-paper pl-7 pr-5 py-4 rounded-full hover:bg-terracotta-deep transition-all duration-500 ease-editorial self-start"
        >
          <span className="font-display text-[16px] tracking-[0.01em]" style={{ fontVariationSettings: "'opsz' 18, 'SOFT' 50, 'wght' 460" }}>
            {t(UI.startBtn, lang)}
          </span>
          <span className="w-7 h-7 rounded-full bg-paper/15 flex items-center justify-center group-hover:bg-paper/25 transition-colors">
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" strokeWidth={2} />
          </span>
        </button>
      </div>

      {/* ============================================================
       * REGULATORY MILESTONES — hanging timeline as marginalia
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 pt-10 border-t-2 border-ink reveal stagger-7">
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint mb-4 md:mb-0">
          {t(UI.milestonesTitle, lang)}
        </div>
        <div className="space-y-3 max-w-2xl">
          {TIMELINE.map((m, i) => {
            const past = new Date(m.date) < new Date();
            return (
              <div key={i} className="grid grid-cols-[110px_1fr] gap-x-5 items-baseline">
                <span className={`font-mono text-[11px] tracking-[0.04em] tabular-nums ${past ? 'text-ink-faint' : 'text-terracotta'}`}>
                  {m.date}
                </span>
                <span className={`text-[14px] leading-[1.55] ${past ? 'text-ink-faint' : 'text-ink-soft'}`} style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50, 'wght' 400" }}>
                  {t(m.event, lang)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuestionFrame({ stepNum, totalSteps, title, subtitle, children, onNext, onBack, canNext, nextLabel }) {
  const lang = useLang();
  const romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const blockedHint = lang === 'en'
    ? 'Make a selection above to continue'
    : 'Sélectionnez une option ci-dessus pour continuer';
  // Reset scroll on every step change so the kicker + question are
  // visible from the start — Playwright's auto-scroll-to-click and
  // the browser's scroll preservation across re-renders would otherwise
  // leave the user/recording mid-page.
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [stepNum]);
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-20" key={`step-${stepNum}`}>
      {/* Step kicker */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-8 md:mb-12 reveal stagger-1">
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint mb-2 md:mb-0">
          {t(UI.step, lang)} {romans[stepNum]} <span className="mx-1.5 text-rule">·</span> {romans[totalSteps]}
        </div>
      </div>{/* numeral marginalia removed — was a stray-looking "I" */}

      {/* Title block */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-12 md:mb-16">
        <div className="hidden md:block"></div>
        <div>
          <h2
            className="font-display text-ink leading-[1.0] tracking-tight mb-5 reveal stagger-2"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontVariationSettings: "'opsz' 96, 'SOFT' 35, 'wght' 380" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-ink-soft leading-[1.6] max-w-[42rem] text-[15.5px] md:text-[16.5px] reveal stagger-3"
              style={{ fontVariationSettings: "'opsz' 16, 'SOFT' 50, 'wght' 380" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-14 md:mb-16">
        <div></div>
        <div className="reveal stagger-4 max-w-[44rem]">{children}</div>
      </div>

      {/* Footer actions */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 pt-6 border-t border-rule">
        <div></div>
        <div className="flex items-center justify-between flex-wrap gap-4 max-w-[44rem]">
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted hover:text-ink transition-colors flex items-center gap-2 rounded-full px-2 py-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.6} />
            {t(UI.backBtn, lang)}
          </button>
          <div className="flex flex-col items-end gap-2">
            {!canNext && (
              <span className="text-[11px] text-ink-muted" aria-live="polite">{blockedHint}</span>
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              aria-disabled={!canNext}
              title={!canNext ? blockedHint : undefined}
              className="group inline-flex items-center gap-3 bg-ink text-paper pl-6 pr-4 py-3 rounded-full hover:bg-terracotta-deep transition-colors duration-500 ease-editorial disabled:bg-paper-deep disabled:text-ink-faint disabled:cursor-not-allowed"
            >
              <span className="font-display text-[14px] tracking-[0.01em]" style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50, 'wght' 460" }}>
                {nextLabel || t(UI.continueBtn, lang)}
              </span>
              <span className="w-6 h-6 rounded-full bg-paper/15 group-disabled:bg-transparent flex items-center justify-center">
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionCard({ selected, onClick, icon: Icon, title, sub, desc, multi = false, ariaLabel }) {
  // Sémantique a11y : si multi → checkbox toggle, sinon → radio
  const role = multi ? 'checkbox' : 'radio';
  const computedAriaLabel = ariaLabel || [
    typeof title === 'string' ? title : '',
    typeof sub === 'string' ? sub : '',
    typeof desc === 'string' ? desc : '',
  ].filter(Boolean).join(' — ');

  return (
    <button
      type="button"
      role={role}
      aria-checked={!!selected}
      aria-label={computedAriaLabel}
      onClick={onClick}
      className={`group relative w-full text-left transition-all duration-300 ease-editorial border-l-2 pl-5 md:pl-6 pr-4 py-4 md:py-5 -ml-5 md:-ml-6 mb-1 ${
        selected
          ? 'border-l-terracotta bg-terracotta-soft/60'
          : 'border-l-rule hover:border-l-ink hover:bg-paper-tint/40'
      }`}
    >
      <div className="flex items-start gap-4 md:gap-5">
        {Icon && (
          <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
            selected
              ? 'bg-terracotta text-paper'
              : 'bg-transparent border border-rule text-ink-muted group-hover:border-ink group-hover:text-ink'
          }`}>
            <Icon className="w-4 h-4" strokeWidth={1.6} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
            <span
              className="font-display text-ink leading-[1.2] text-[17px] md:text-[18px]"
              style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 50, 'wght' 460" }}
            >
              {title}
            </span>
            {sub && (
              <span className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.18em]">{sub}</span>
            )}
          </div>
          {desc && (
            <p
              className="text-[14px] md:text-[14.5px] text-ink-soft leading-[1.6]"
              style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 55, 'wght' 380" }}
            >
              {desc}
            </p>
          )}
        </div>
        <div className="shrink-0 mt-1.5">
          {multi ? (
            <div className={`w-5 h-5 rounded-[3px] border flex items-center justify-center transition-colors duration-200 ${
              selected ? 'bg-terracotta border-terracotta' : 'border-rule group-hover:border-ink'
            }`}>
              {selected && <Check className="w-3 h-3 text-paper" strokeWidth={3} />}
            </div>
          ) : (
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors duration-200 ${
              selected ? 'border-terracotta' : 'border-rule group-hover:border-ink'
            }`}>
              {selected && <div className="w-2.5 h-2.5 bg-terracotta rounded-full" />}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={!!active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-1 py-4 transition-colors border-b-2 whitespace-nowrap mr-7 ${
        active
          ? 'border-ink text-ink'
          : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden />
      <span className="font-mono text-[11px] uppercase tracking-[0.2em]">{children}</span>
    </button>
  );
}

function ChecklistView({ checklist, extraChecklists, checked, onToggle }) {
  const lang = useLang();

  const renderPilier = (p, idx, prefix = '') => (
    <div key={`${prefix}${idx}`} className="mb-9 last:mb-0 print:break-inside-avoid">
      <h4 className="font-display text-ink text-[20px] mb-5 leading-[1.2] flex items-baseline gap-3" style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 40, 'wght' 460" }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-terracotta tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
        <span>{t(p.pilier, lang)}</span>
      </h4>
      <ul className="space-y-2.5">
        {p.items.map((it, i) => {
          const key = `${prefix}${idx}-${i}`;
          return (
            <li key={key} className="grid grid-cols-[18px_1fr] gap-x-3.5 items-baseline group print:break-inside-avoid pb-2.5 border-b border-rule-soft last:border-b-0">
              <button
                type="button"
                role="checkbox"
                aria-checked={!!checked[key]}
                aria-label={`${typeof it.txt === 'string' ? it.txt : t(it.txt, lang)} — ${typeof it.ref === 'string' ? it.ref : t(it.ref, lang)}`}
                onClick={() => onToggle(key)}
                className={`mt-1 w-[14px] h-[14px] rounded-[2px] border flex items-center justify-center transition-colors print:bg-white ${
                  checked[key] ? 'bg-terracotta border-terracotta' : 'border-rule group-hover:border-ink'
                }`}
              >
                {checked[key] && <Check className="w-2 h-2 text-paper" strokeWidth={3.5} />}
              </button>
              <div className="min-w-0">
                <span
                  className={`text-[14.5px] leading-[1.6] ${checked[key] ? 'text-ink-faint line-through' : 'text-ink-soft'}`}
                  style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50, 'wght' 400" }}
                >
                  {t(it.txt, lang)}
                </span>
                <span className="ml-2 font-mono text-[10px] text-ink-faint uppercase tracking-[0.12em] whitespace-nowrap">{t(it.ref, lang)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div>
      <p className="text-[14px] text-ink-muted mb-10 max-w-2xl leading-[1.6] italic print:hidden" style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 60, 'wght' 380" }}>
        {t(UI.checklistIntro, lang)}
      </p>
      {checklist.map((p, i) => renderPilier(p, i))}
      {extraChecklists && extraChecklists.filter(c => c.items.length > 0).map((c, i) => (
        <div key={i} className="mt-12 pt-8 border-t-2 border-ink print:break-before-page">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint mb-6">
            {t(UI.cumulativeObligations, lang)} <span className="mx-2 text-rule">—</span> {t(CATEGORIES_META[c.cat]?.label, lang)}
          </div>
          {c.items.map((p, j) => renderPilier(p, j, `extra-${i}-`))}
        </div>
      ))}
    </div>
  );
}

// Liste des quickwins, réutilisable écran + impression
function QuickwinsList({ items }) {
  const lang = useLang();
  return (
    <div className="divide-y divide-rule">
      {items.map((q, i) => (
        <div key={i} className="grid grid-cols-[40px_1fr] md:grid-cols-[64px_1fr] gap-x-4 md:gap-x-6 py-7 first:pt-0 last:pb-0 print:break-inside-avoid">
          {/* Hanging numeral */}
          <div className="numeral-arabic text-[40px] md:text-[56px] text-terracotta leading-[0.85]" aria-hidden style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 35, 'wght' 320" }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <div className="pt-1">
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <h4
                className="font-display text-ink text-[19px] md:text-[21px] leading-[1.25]"
                style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 40, 'wght' 480" }}
              >
                {t(q.titre, lang)}
              </h4>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta whitespace-nowrap border border-terracotta/40 px-2 py-1 rounded-full">
                {t(UI.quickwinDeadlineLabel, lang)} · {t(q.delai, lang)}
              </span>
            </div>
            <p
              className="text-[14.5px] md:text-[15px] text-ink-soft leading-[1.65] mb-4 max-w-[42rem]"
              style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50, 'wght' 400" }}
            >
              {t(q.action, lang)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {q.refs.map((r, j) => (
                <span key={j} className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.10em] border border-rule px-2 py-1 rounded-sm">
                  {t(r, lang)}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Liste de la timeline, réutilisable écran + impression
function TimelineList({ milestones }) {
  const lang = useLang();
  return (
    <div className="relative pl-8 space-y-7">
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-rule" aria-hidden />
      {milestones.map((m, i) => {
        const past = new Date(m.date) < new Date();
        return (
          <div key={i} className="relative print:break-inside-avoid">
            <div
              className={`absolute -left-[27px] top-[6px] rounded-full transition-colors ${past ? 'w-2 h-2 bg-ink-faint' : 'w-2.5 h-2.5 bg-terracotta ring-4 ring-terracotta-soft'}`}
              aria-hidden
            />
            <div className={`font-mono text-[11px] tabular-nums tracking-[0.04em] mb-1.5 ${past ? 'text-ink-faint' : 'text-terracotta'}`}>{m.date}</div>
            <div
              className={`text-[14.5px] leading-[1.6] ${past ? 'text-ink-faint italic' : 'text-ink-soft'}`}
              style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50, 'wght' 400" }}
            >
              {t(m.event, lang)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Wrapper de section pour le mode impression — page break + en-tête éditorial
function PrintSection({ icon: Icon, title, breakBefore = true, children }) {
  return (
    <section className={`hidden print:block mt-10 ${breakBefore ? 'print:break-before-page' : ''}`}>
      <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-terracotta">
        {Icon && <Icon className="w-5 h-5 text-terracotta" strokeWidth={1.5} aria-hidden />}
        <h2 className="font-display text-2xl text-ink tracking-tight" style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 40, 'wght' 460" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function generateReport(answers, result, lang) {
  const meta = CATEGORIES_META[result.primary];
  const role = ROLES.find(r => r.id === answers.role);
  const lines = [];
  lines.push(t(UI.reportTitle, lang));
  lines.push('=========================================');
  lines.push('');
  lines.push(`${t(UI.reportPrimary, lang)} : ${t(meta.label, lang)} (${t(meta.sub, lang)})`);
  if (result.secondary?.length) {
    lines.push(`${t(UI.reportCumul, lang)} : ${result.secondary.map(s => t(CATEGORIES_META[s]?.label, lang)).join(', ')}`);
  }
  lines.push('');
  lines.push(`${t(UI.reportRole, lang)} : ${role ? t(role.label, lang) + ' — ' + t(role.sub, lang) : '—'}`);
  lines.push(`${t(UI.reportNature, lang)} : ${t(NATURES.find(n => n.id === answers.nature)?.label, lang) || '—'}`);
  lines.push('');
  lines.push(t(UI.reportJustif, lang));
  result.justifications.forEach(j => lines.push(`  - [${j.ref}] ${j.label}`));
  lines.push('');
  lines.push(t(UI.reportQuickwins, lang));
  (QUICKWINS[result.primary] || []).forEach((q, i) => {
    lines.push(`  ${i + 1}. ${t(q.titre, lang)} [${t(q.delai, lang)}]`);
    lines.push(`     ${t(q.action, lang)}`);
    lines.push(`     ${t(UI.reportRefs, lang)} : ${q.refs.map(r => t(r, lang)).join(' | ')}`);
  });
  lines.push('');
  lines.push(t(UI.reportChecklist, lang));
  (CHECKLIST[result.primary] || []).forEach(p => {
    lines.push(`  ## ${t(p.pilier, lang)}`);
    p.items.forEach(it => lines.push(`    [ ] ${t(it.txt, lang)}  (${t(it.ref, lang)})`));
  });
  lines.push('');
  lines.push('---');
  lines.push(t(UI.reportFooter, lang));
  return lines.join('\n');
}

/* ============================================================================
 * SECTION 3.5 — DEDICATED PRINT TEMPLATE
 *
 * Why a separate template?
 * The screen design uses Tailwind, CSS variables, vw-based clamps, marginalia
 * grids, and `max-w-[XXrem]` constraints designed for >1024px viewports.
 * html2pdf forces its own container to `pageSize.inner.width` (178 mm on A4),
 * which is ~672 px @96dpi — narrower than the design's expectations.
 * Trying to coerce the screen DOM to render correctly inside that container
 * caused content overflow and clipping.
 *
 * This template is a clean HTML string built from the same data, with:
 *   - explicit width: 178mm
 *   - all sizes in pt/mm (no vw, no clamp, no rem)
 *   - hex colors inlined from CATEGORIES_META (no CSS-variable indirection)
 *   - simple flex/list layouts (no grid-cols-[140px_1fr] marginalia)
 *   - <style> tag scoped to a unique class (.aac-print)
 *
 * It is rendered into a hidden offscreen sandbox right before html2pdf is
 * invoked, then removed.
 * ========================================================================== */

const htmlEscape = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function buildPrintHTML({ result, answers, lang, today, checked }) {
  const meta = CATEGORIES_META[result.primary];
  const role = ROLES.find(r => r.id === answers.role);
  const nature = NATURES.find(n => n.id === answers.nature);
  const QW = QUICKWINS[result.primary] || [];
  const CL = CHECKLIST[result.primary] || [];
  const extraCL = (result.secondary || []).map(s => ({ cat: s, items: CHECKLIST[s] || [] }));
  const applicableTimeline = TIMELINE.filter(m =>
    m.applicableTo.includes('ALL') ||
    m.applicableTo.includes(result.primary) ||
    (result.secondary && result.secondary.some(s => m.applicableTo.includes(s)))
  );

  // i18n + escape combined
  const tt = (val) => htmlEscape(t(val, lang));
  // refs in justifications and quickwins are sometimes plain strings, sometimes {en,fr}
  const ttRef = (val) => htmlEscape(typeof val === 'string' ? val : t(val, lang));

  // Self-contained CSS — scoped to .aac-print to avoid leakage.
  // All sizes in pt or mm. No vw, no clamp, no rem.
  const css = `
    .aac-print, .aac-print * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Fraunces', Georgia, serif; }
    /* Inner padding gives the left border-l of the verdict band breathing
       room from the page edge so html2pdf's rasterisation doesn't crop it.
       Effective content area: 178 - 6 = 172 mm. */
    .aac-print { width: 178mm; padding: 0 3mm; color: #1A1915; background: #FFFFFF; font-size: 9.5pt; line-height: 1.5; }
    .aac-print .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .aac-print h1, .aac-print h2, .aac-print h3, .aac-print h4 { font-weight: 400; line-height: 1.2; color: #1A1915; }
    .aac-print p { font-size: 10pt; line-height: 1.55; color: #3F3D38; }
    .aac-print ul, .aac-print ol { list-style: none; }

    .aac-print .kicker { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 7pt; letter-spacing: 0.22em; text-transform: uppercase; color: #CC785C; }
    .aac-print .label  { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 6.5pt; letter-spacing: 0.22em; text-transform: uppercase; color: #6E6A60; }
    .aac-print .ref    { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 7pt; color: #6E6A60; }
    .aac-print .ref-tc { color: #CC785C; }

    .aac-print .rule        { display: block; height: 1px;  background: #D9D5C7; margin: 14px 0; border: 0; }
    .aac-print .rule-strong { display: block; height: 2px;  background: #1A1915; margin: 18px 0 14px; border: 0; }

    /* Header / cover */
    .aac-print header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 11pt; border-bottom: 2px solid #1A1915; margin-bottom: 16pt; gap: 12pt; }
    .aac-print header .h-title { font-size: 14.5pt; margin-top: 3pt; letter-spacing: -0.01em; }
    .aac-print header .h-meta  { text-align: right; font-size: 7.5pt; color: #6E6A60; }
    .aac-print header .h-meta .h-meta-strong { color: #1A1915; margin-top: 3pt; }

    /* Verdict band */
    .aac-print .verdict {
      background: ${meta.bg};
      border-left: 4px solid ${meta.border};
      padding: 13pt 14pt;
      margin-bottom: 16pt;
      page-break-inside: avoid;
    }
    .aac-print .verdict .v-label  { font-size: 19pt; line-height: 1.05; color: ${meta.text}; letter-spacing: -0.02em; margin: 5pt 0; }
    .aac-print .verdict .v-sub    { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: ${meta.accent}; }
    .aac-print .verdict .v-badge  { display: inline-block; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 7pt; padding: 3pt 8pt; background: ${meta.accent}; color: #FFFFFF; border-radius: 999px; letter-spacing: 0.18em; text-transform: uppercase; margin: 7pt 0 9pt; }
    .aac-print .verdict .v-summary { font-size: 9.5pt; line-height: 1.55; color: ${meta.text}; }
    .aac-print .verdict .v-cumul   { margin-top: 9pt; padding-top: 7pt; border-top: 1px solid rgba(0,0,0,0.10); }
    .aac-print .verdict .v-pill    { display: inline-block; padding: 2pt 7pt; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 6.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: ${meta.text}; border: 1px solid ${meta.border}; border-radius: 999px; margin: 0 4pt 4pt 0; }

    /* Disclaimer */
    .aac-print .disclaimer { margin-bottom: 16pt; padding: 5pt 11pt; border-left: 2px solid #CC785C; page-break-inside: avoid; }
    .aac-print .disclaimer p { font-style: italic; font-size: 8.5pt; color: #3F3D38; margin-top: 3pt; }

    /* Justification */
    .aac-print .justif { margin-bottom: 20pt; }
    .aac-print .justif .j-meta { display: flex; gap: 22pt; padding-bottom: 7pt; margin-bottom: 11pt; border-bottom: 1px solid #D9D5C7; }
    .aac-print .justif .j-meta > div { flex: 1; }
    .aac-print .justif .j-value { font-size: 11pt; line-height: 1.25; margin: 3pt 0; }
    .aac-print .justif .j-trigger { display: flex; gap: 10pt; align-items: baseline; padding: 3pt 0; }
    .aac-print .justif .j-trigger .j-tref { width: 100px; flex-shrink: 0; }
    .aac-print .justif .j-trigger .j-tlabel { font-size: 9pt; line-height: 1.5; color: #3F3D38; }

    /* Section header — Quickwins / Checklist / Timeline */
    .aac-print .sec { page-break-before: always; break-before: page; padding-top: 8pt; }
    .aac-print .sec.sec-first { page-break-before: auto; break-before: auto; padding-top: 0; }
    .aac-print .sec-title { font-size: 13pt; line-height: 1.2; margin: 4pt 0 11pt; }

    /* Quickwins */
    .aac-print .qw { display: flex; gap: 11pt; padding: 9pt 0; border-top: 1px solid #D9D5C7; page-break-inside: avoid; }
    .aac-print .qw:first-of-type { border-top: 0; padding-top: 0; }
    .aac-print .qw .qw-num { width: 28pt; flex-shrink: 0; font-size: 19pt; color: #CC785C; line-height: 1; font-weight: 400; }
    .aac-print .qw .qw-body { flex: 1; }
    .aac-print .qw .qw-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8pt; flex-wrap: wrap; margin-bottom: 4pt; }
    .aac-print .qw .qw-title { font-size: 11pt; line-height: 1.2; }
    .aac-print .qw .qw-deadline { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 6.5pt; padding: 2pt 7pt; border: 1px solid rgba(204,120,92,0.4); border-radius: 999px; color: #CC785C; letter-spacing: 0.16em; text-transform: uppercase; white-space: nowrap; }
    .aac-print .qw .qw-action { font-size: 9pt; line-height: 1.55; color: #3F3D38; margin: 4pt 0 6pt; }
    .aac-print .qw .qw-refs span { display: inline-block; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 6.5pt; color: #6E6A60; border: 1px solid #D9D5C7; padding: 1pt 5pt; border-radius: 2pt; margin: 0 4pt 2pt 0; letter-spacing: 0.04em; }

    /* Checklist */
    .aac-print .pillar { margin: 13pt 0; page-break-inside: avoid; }
    .aac-print .pillar h4 { font-size: 10.5pt; margin-bottom: 6pt; }
    .aac-print .pillar h4 .pnum { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 7pt; color: #CC785C; letter-spacing: 0.18em; margin-right: 8pt; }
    .aac-print .pillar li { display: flex; gap: 8pt; padding: 4pt 0 5pt; border-bottom: 1px solid #E5E2D5; align-items: baseline; }
    .aac-print .pillar li .cb { flex-shrink: 0; display: inline-block; width: 9pt; height: 9pt; border: 1px solid #D9D5C7; text-align: center; line-height: 8pt; font-size: 7pt; color: #FFFFFF; }
    .aac-print .pillar li.done .cb { background: #CC785C; border-color: #CC785C; }
    .aac-print .pillar li.done .ctxt { color: #9F9A8E; text-decoration: line-through; }
    .aac-print .pillar li .ctxt { font-size: 8.5pt; line-height: 1.5; color: #3F3D38; flex: 1; }
    .aac-print .pillar li .cref { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 6.5pt; color: #9F9A8E; letter-spacing: 0.04em; flex-shrink: 0; }
    .aac-print .extra-cl { margin-top: 17pt; padding-top: 11pt; border-top: 2px solid #1A1915; }
    .aac-print .extra-cl .label { margin-bottom: 8pt; }

    /* Timeline */
    .aac-print .tl-item { padding: 4pt 0 4pt 14pt; position: relative; page-break-inside: avoid; }
    .aac-print .tl-item:before { content: ''; position: absolute; left: 2pt; top: 8pt; width: 5pt; height: 5pt; border-radius: 50%; background: #CC785C; }
    .aac-print .tl-item.past:before { background: #9F9A8E; }
    .aac-print .tl-date { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 7.5pt; color: #CC785C; }
    .aac-print .tl-item.past .tl-date  { color: #9F9A8E; }
    .aac-print .tl-event { font-size: 9pt; line-height: 1.5; color: #3F3D38; }
    .aac-print .tl-item.past .tl-event { color: #9F9A8E; font-style: italic; }
  `;

  // Pieces ──────────────────────────────────────────────────────────────────
  const headerHTML = `
    <header>
      <div>
        <div class="kicker">${tt(UI.printCoverKicker)}</div>
        <h1 class="h-title">${tt(UI.printCoverTitle)}</h1>
        <div class="label" style="margin-top:3pt;">${tt(UI.appSubtitle)}</div>
      </div>
      <div class="h-meta">
        <div>${tt(UI.printCoverDate)} ${htmlEscape(today)}</div>
        ${role   ? `<div class="h-meta-strong">${tt(role.label)}</div>`     : ''}
        ${nature ? `<div>${tt(nature.label)}</div>` : ''}
      </div>
    </header>
  `;

  const verdictHTML = `
    <section class="verdict">
      <div class="kicker" style="color:${meta.text}; opacity:0.7;">${tt(UI.verdictKicker)}</div>
      <h2 class="v-label">${tt(meta.label)}</h2>
      <div class="v-sub">${tt(meta.sub)}</div>
      <div><span class="v-badge">${tt(meta.badge)}</span></div>
      <p class="v-summary">${tt(meta.summary)}</p>
      ${result.secondary && result.secondary.length > 0 ? `
        <div class="v-cumul">
          <div class="kicker" style="color:${meta.text}; opacity:0.7;">${tt(UI.cumulativeKicker)}</div>
          <div style="margin-top:5pt;">
            ${result.secondary.map(s => `<span class="v-pill">${tt(CATEGORIES_META[s]?.label)}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </section>
  `;

  const disclaimerHTML = `
    <section class="disclaimer">
      <div class="kicker">${tt(UI.verdictDisclaimerTitle)}</div>
      <p>${tt(UI.verdictDisclaimer)}</p>
    </section>
  `;

  const justifHTML = `
    <section class="justif">
      <div class="label" style="margin-bottom:10pt;">${tt(UI.justifTitle)}</div>
      <div class="j-meta">
        <div>
          <div class="label">${tt(UI.roleLabel)}</div>
          <div class="j-value">${role ? tt(role.label) : '—'}</div>
          ${role ? `<div class="ref">${tt(role.sub)}</div>` : ''}
        </div>
        <div>
          <div class="label">${tt(UI.natureLabel)}</div>
          <div class="j-value">${nature ? tt(nature.label) : '—'}</div>
          ${nature ? `<div class="ref">${tt(nature.sub)}</div>` : ''}
        </div>
      </div>
      <div class="label" style="margin-bottom:6pt;">${tt(UI.triggersLabel)}</div>
      <ul>
        ${result.justifications.map(j => `
          <li class="j-trigger">
            <span class="j-tref ref ref-tc">${ttRef(j.ref)}</span>
            <span class="j-tlabel">${ttRef(j.label)}</span>
          </li>
        `).join('')}
      </ul>
    </section>
  `;

  const quickwinsHTML = QW.length > 0 ? `
    <section class="sec sec-first">
      <div class="kicker">${tt(UI.printSectionQW)}</div>
      <hr class="rule-strong" />
      ${QW.map((q, i) => `
        <div class="qw">
          <div class="qw-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="qw-body">
            <div class="qw-head">
              <h4 class="qw-title">${tt(q.titre)}</h4>
              <span class="qw-deadline">${tt(UI.quickwinDeadlineLabel)} · ${tt(q.delai)}</span>
            </div>
            <p class="qw-action">${tt(q.action)}</p>
            <div class="qw-refs">${q.refs.map(r => `<span>${ttRef(r)}</span>`).join('')}</div>
          </div>
        </div>
      `).join('')}
    </section>
  ` : '';

  const renderPilier = (p, idx, prefix = '') => `
    <div class="pillar">
      <h4><span class="pnum">${String(idx + 1).padStart(2, '0')}</span>${tt(p.pilier)}</h4>
      <ul>
        ${p.items.map((it, i) => {
          const key = `${prefix}${idx}-${i}`;
          const done = !!checked[key];
          return `
            <li class="${done ? 'done' : ''}">
              <span class="cb">${done ? '✓' : ''}</span>
              <span class="ctxt">${ttRef(it.txt)}</span>
              <span class="cref">${ttRef(it.ref)}</span>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;

  const checklistHTML = (CL.length > 0 || extraCL.some(c => c.items.length > 0)) ? `
    <section class="sec">
      <div class="kicker">${tt(UI.printSectionCL)}</div>
      <hr class="rule-strong" />
      ${CL.map((p, i) => renderPilier(p, i)).join('')}
      ${extraCL.filter(c => c.items.length > 0).map((c, i) => `
        <div class="extra-cl">
          <div class="label">${tt(UI.cumulativeObligations)} — ${tt(CATEGORIES_META[c.cat]?.label)}</div>
          ${c.items.map((p, j) => renderPilier(p, j, `extra-${i}-`)).join('')}
        </div>
      `).join('')}
    </section>
  ` : '';

  const timelineHTML = applicableTimeline.length > 0 ? `
    <section class="sec">
      <div class="kicker">${tt(UI.printSectionTL)}</div>
      <hr class="rule-strong" />
      <ul>
        ${applicableTimeline.map(m => {
          const past = new Date(m.date) < new Date();
          return `
            <li class="tl-item ${past ? 'past' : ''}">
              <div class="tl-date">${htmlEscape(m.date)}</div>
              <div class="tl-event">${tt(m.event)}</div>
            </li>
          `;
        }).join('')}
      </ul>
    </section>
  ` : '';

  // Return BOTH the CSS and the HTML separately so the caller can inject
  // the <style> into <head> (where it can't interfere with html2pdf's
  // pagination) and capture only the .aac-print div.
  return {
    css,
    html: `<div class="aac-print">${headerHTML}${verdictHTML}${disclaimerHTML}${justifHTML}${quickwinsHTML}${checklistHTML}${timelineHTML}</div>`,
  };
}

function Result({ answers, result, onRestart }) {
  const lang = useLang();
  const [tab, setTab] = useState('quickwins');
  // État remonté ici pour qu'il soit partagé entre la vue écran et la vue impression
  const [checked, setChecked] = useState({});
  const toggleChecked = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  // État de génération du PDF (désactive le bouton et change le label)
  const [pdfBusy, setPdfBusy] = useState(false);

  // Scroll to top on mount — without this, the browser preserves the
  // scrollY from the question step, so the Verdict banner (the climax)
  // is initially below the fold.
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, []);

  const meta = CATEGORIES_META[result.primary];
  const QW = QUICKWINS[result.primary] || [];
  const CL = CHECKLIST[result.primary] || [];
  const role = ROLES.find(r => r.id === answers.role);
  const nature = NATURES.find(n => n.id === answers.nature);
  const extraChecklists = result.secondary?.map(s => ({ cat: s, items: CHECKLIST[s] || [] }));

  const applicableTimeline = TIMELINE.filter(m =>
    m.applicableTo.includes('ALL') ||
    m.applicableTo.includes(result.primary) ||
    (result.secondary && result.secondary.some(s => m.applicableTo.includes(s)))
  );

  const handleCopy = async () => {
    const txt = generateReport(answers, result, lang);
    // Tentative API moderne (nécessite un contexte sécurisé HTTPS)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(txt);
        alert(t(UI.reportCopied, lang));
        return;
      }
    } catch (e) {
      // contextes non-sécurisés / permissions refusées : on bascule sur le fallback
    }
    // Fallback execCommand (déprécié mais largement supporté hors HTTPS)
    try {
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      alert(ok ? t(UI.reportCopied, lang) : t(UI.printError, lang));
    } catch (_) {
      alert(t(UI.printError, lang));
    }
  };

  // ────────────────────────────────────────────────────────────
  // PDF EXPORT — uses a dedicated print HTML built from the
  // result data, NOT the screen DOM. See SECTION 3.5 for why.
  //
  // Flow:
  //   1. Build a self-contained HTML string (.aac-print) from the data.
  //   2. Inject it into an offscreen sandbox positioned at left: -10000px.
  //   3. Wait one frame so fonts/layout settle.
  //   4. Run html2pdf on that sandbox. The print HTML is already 178 mm
  //      wide, all pt sizes, all hex colors — no Tailwind, no vw, no
  //      CSS variables — so html2pdf's container fits it 1:1.
  //   5. Cleanup.
  // ────────────────────────────────────────────────────────────
  const handlePrint = async () => {
    if (pdfBusy) return;

    if (!window.html2pdf) {
      // html2pdf not loaded yet → fall back to the popup-print path
      const root = document.getElementById('ai-act-print-root');
      if (root) openPrintPopup(root);
      else      alert(t(UI.printNotReady, lang));
      return;
    }

    setPdfBusy(true);

    // 1. Build print CSS + HTML
    const { css, html } = buildPrintHTML({ result, answers, lang, today, checked });

    // 2. Inject the HTML into a hidden sandbox AND inject the <style> inside
    //    .aac-print itself (as the LAST child, after content) so html2canvas
    //    captures it as part of the cloned subtree. Putting it in document.head
    //    didn't work reliably — the styles weren't always applied to the
    //    html2canvas iframe rendering, leading to wrong layout & a blank
    //    leading region in the canvas.
    const sandbox = document.createElement('div');
    sandbox.innerHTML = html;
    const target = sandbox.querySelector('.aac-print');
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    target.appendChild(styleEl); // <style> as last child of the captured subtree
    sandbox.style.cssText = 'position:fixed; left:-10000px; top:0; pointer-events:none; z-index:-1;';
    document.body.appendChild(sandbox);

    // 3. Wait two frames + a tick so web fonts apply and layout settles.
    //    Also scroll to top — html2canvas in some configurations offsets
    //    its capture by the document scroll position, which produced a
    //    canvas with content stuck to the bottom and blank at the top.
    window.scrollTo(0, 0);
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 200));

    try {
      const filename = `ai-act-compass-${new Date().toISOString().slice(0, 10)}.pdf`;
      await window.html2pdf()
        .from(target)
        .set({
          margin: [18, 16, 20, 16], // mm: top, left, bottom, right
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFFFF',
            letterRendering: true,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
          // Pagination: CSS rules drive it. `.sec { page-break-before: always }`
          // gives Quickwins / Checklist / Timeline their own pages,
          // `.sec-first` opts the first .sec out so the cover/verdict
          // doesn't get separated from the first roadmap section.
          // `page-break-inside: avoid` on items keeps them whole.
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .save();
    } catch (e) {
      console.error('html2pdf failed:', e);
      alert(t(UI.printError, lang));
    } finally {
      if (sandbox.parentNode) sandbox.parentNode.removeChild(sandbox);
      setPdfBusy(false);
    }
  };

  // Fallback : popup auto-imprimante
  const openPrintPopup = (root) => {
    const reportHTML = root.outerHTML;
    const titleSuffix = t(CATEGORIES_META[result.primary].label, lang);
    const manualHint = lang === 'fr'
      ? 'Si l\'impression ne s\'ouvre pas automatiquement, cliquez sur le bouton ou utilisez Ctrl/Cmd+P.'
      : 'If the print dialog does not open automatically, click the button or press Ctrl/Cmd+P.';
    const manualBtnLabel = lang === 'fr' ? 'Enregistrer en PDF' : 'Save as PDF';

    const fullHTML = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<title>AI Act Compass — ${titleSuffix}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,30..100;1,9..144,300..600,30..100&family=JetBrains+Mono:wght@400;500&display=swap">
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root {
    --paper: #FAF9F5; --ink: #1A1915; --ink-soft: #3F3D38; --ink-muted: #6E6A60;
    --terracotta: #CC785C; --rule: #D9D5C7;
  }
  body { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 14, 'SOFT' 50, 'wght' 400; background: var(--paper); color: var(--ink-soft); margin: 0; padding-top: 56px; -webkit-font-smoothing: antialiased; }
  .font-serif, .font-display { font-family: 'Fraunces', Georgia, serif !important; font-variation-settings: 'opsz' 96, 'SOFT' 35, 'wght' 400; color: var(--ink); }
  .font-mono { font-family: 'JetBrains Mono', monospace !important; }
  .print\\:hidden { display: none !important; }
  .hidden.print\\:block { display: block !important; }
  .print\\:block { display: block !important; }
  .print\\:bg-white { background-color: #FFFFFF !important; }
  .print\\:rounded-none { border-radius: 0 !important; }
  .print\\:break-inside-avoid { page-break-inside: avoid; }
  .print\\:break-before-page { page-break-before: always; }
  .toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: var(--ink); color: var(--paper); padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 13px; }
  .toolbar button { background: var(--terracotta); color: var(--paper); border: none; padding: 7px 16px; border-radius: 999px; cursor: pointer; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; }
  @page { size: A4; margin: 18mm 16mm 20mm 16mm; }
  @media print {
    body { padding-top: 0 !important; background: #FFF !important; }
    .toolbar { display: none !important; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <span>${manualHint}</span>
  <button onclick="window.print()">${manualBtnLabel}</button>
</div>
${reportHTML}
<script>
  window.addEventListener('load', function(){
    setTimeout(function(){ try { window.focus(); window.print(); } catch(e) {} }, 1200);
  });
</script>
</body>
</html>`;

    let pw = null;
    try { pw = window.open('', '_blank'); } catch (e) { pw = null; }
    if (pw && pw.document) {
      try {
        pw.document.open(); pw.document.write(fullHTML); pw.document.close();
        return;
      } catch (e) { try { pw.close(); } catch(_){} }
    }
    // Ultime fallback : téléchargement HTML
    try {
      const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-act-compass-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
      alert(t(UI.printPopupBlocked, lang));
    } catch (e) {
      try { window.print(); } catch(_) {}
    }
  };

  const today = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div id="ai-act-print-root" className={`tier-${result.primary} max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14 print:px-0 print:py-0 print:max-w-none`}>

      {/* ============================================================
       * COUVERTURE — visible uniquement à l'impression
       * ========================================================== */}
      <div className="hidden print:block mb-10 pb-6 border-b-2 border-ink">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-terracotta translate-y-[2px]" strokeWidth={1.6} aria-hidden />
            <div>
              <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-terracotta">{t(UI.printCoverKicker, lang)}</div>
              <div className="font-display text-2xl text-ink leading-tight tracking-tight" style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 40, 'wght' 460" }}>
                {t(UI.printCoverTitle, lang)}
              </div>
              <div className="text-[11px] text-ink-muted font-mono mt-0.5">{t(UI.appSubtitle, lang)}</div>
            </div>
          </div>
          <div className="text-right text-[11px] text-ink-muted font-mono">
            <div>{t(UI.printCoverDate, lang)} {today}</div>
            {role && <div className="mt-1 text-ink">{t(role.label, lang)}</div>}
            {nature && <div className="text-ink-muted">{t(nature.label, lang)}</div>}
          </div>
        </div>
      </div>

      {/* ============================================================
       * VERDICT — full-bleed tier-coloured band, editorial display
       * Tier coloration (--t-bg / --t-fg / --t-ink) is set on the
       * outer .tier-XXX wrapper above. No inline hexes.
       * ========================================================== */}
      <div
        className="relative mb-12 md:mb-16 print:break-inside-avoid print:mb-8"
        style={{
          background: 'var(--t-bg)',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* Full-bleed band — escapes the page max-width via negative margin */}
        <div className="absolute inset-y-0 -left-[100vw] -right-[100vw] -z-10 print:hidden" style={{ background: 'var(--t-bg)' }} aria-hidden />

        <div className="grid md:grid-cols-[140px_1fr] gap-x-10 px-0 md:px-0 py-12 md:py-20 print:py-6">
          {/* Marginalia — verdict kicker + tier ref */}
          <div className="mb-6 md:mb-0">
            <div className="font-mono uppercase tracking-[0.22em] text-[10px] mb-3 reveal-fade" style={{ color: 'var(--t-fg)' }}>
              {t(UI.verdictKicker, lang)}
            </div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] reveal-fade stagger-1" style={{ color: 'var(--t-ink)', opacity: 0.7 }}>
              {t(meta.sub, lang)}
            </div>
          </div>

          {/* Main verdict mark */}
          <div>
            <h2
              className="font-display leading-[0.92] mb-6 reveal-mark print:text-3xl"
              style={{
                color: 'var(--t-ink)',
                fontSize: 'clamp(40px, 7.5vw, 84px)',
                fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 380",
                letterSpacing: '-0.025em',
              }}
            >
              {t(meta.label, lang)}
            </h2>

            {/* Tier badge */}
            <div className="inline-flex items-center gap-2 mb-7 reveal-fade stagger-2">
              <span className="block w-8 h-[2px]" style={{ background: 'var(--t-fg)' }} aria-hidden />
              <span
                className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium"
                style={{ color: 'var(--t-fg)' }}
              >
                {t(meta.badge, lang)}
              </span>
            </div>

            {/* Summary — body serif, lede-weight */}
            <p
              className="text-[16px] md:text-[18px] leading-[1.6] max-w-[42rem] reveal-fade stagger-3"
              style={{
                color: 'var(--t-ink)',
                fontVariationSettings: "'opsz' 18, 'SOFT' 45, 'wght' 400",
              }}
            >
              {t(meta.summary, lang)}
            </p>

            {/* Cumulative categories */}
            {result.secondary && result.secondary.length > 0 && (
              <div className="mt-8 pt-5 reveal-fade stagger-4" style={{ borderTop: '1px solid var(--t-rule)' }}>
                <div
                  className="font-mono uppercase tracking-[0.22em] text-[10px] mb-3"
                  style={{ color: 'var(--t-fg)', opacity: 0.85 }}
                >
                  {t(UI.cumulativeKicker, lang)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.secondary.map(s => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full font-mono text-[10.5px] uppercase tracking-[0.14em] border"
                      style={{ borderColor: 'var(--t-fg)', color: 'var(--t-ink)' }}
                    >
                      {t(CATEGORIES_META[s]?.label, lang)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
       * DISCLAIMER — typographic, no boxed alert chrome
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-14 md:mb-20 reveal-fade stagger-5 print:break-inside-avoid">
        <div className="flex items-start gap-2 mb-3 md:mb-0">
          <AlertCircle className="w-3.5 h-3.5 text-terracotta shrink-0 mt-[3px]" strokeWidth={1.8} />
          <span className="font-mono uppercase tracking-[0.22em] text-[10px] text-terracotta">
            {t(UI.verdictDisclaimerTitle, lang)}
          </span>
        </div>
        <p
          className="text-[14px] md:text-[14.5px] text-ink-soft leading-[1.65] max-w-[42rem] italic"
          style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 60, 'wght' 380" }}
        >
          {t(UI.verdictDisclaimer, lang)}
        </p>
      </div>

      {/* ============================================================
       * JUSTIFICATION — editorial dossier with hanging refs
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mb-14 md:mb-20 print:break-inside-avoid reveal stagger-6">
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint mb-4 md:mb-0 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" strokeWidth={1.6} aria-hidden />
          {t(UI.justifTitle, lang)}
        </div>
        <div className="max-w-[44rem]">
          {/* Role + Nature meta line */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5 pb-7 mb-8 border-b border-rule">
            <div>
              <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint mb-1.5">{t(UI.roleLabel, lang)}</div>
              <div className="font-display text-ink text-[18px] leading-[1.25]" style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 50, 'wght' 460" }}>
                {role ? t(role.label, lang) : '—'}
              </div>
              {role && <div className="font-mono text-[10.5px] text-ink-muted uppercase tracking-[0.14em] mt-1">{t(role.sub, lang)}</div>}
            </div>
            <div>
              <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint mb-1.5">{t(UI.natureLabel, lang)}</div>
              <div className="font-display text-ink text-[18px] leading-[1.25]" style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 50, 'wght' 460" }}>
                {nature ? t(nature.label, lang) : '—'}
              </div>
              {nature && <div className="font-mono text-[10.5px] text-ink-muted uppercase tracking-[0.14em] mt-1">{t(nature.sub, lang)}</div>}
            </div>
          </div>

          {/* Triggers as hanging-ref editorial list */}
          <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint mb-4">{t(UI.triggersLabel, lang)}</div>
          <ul className="space-y-3.5">
            {result.justifications.map((j, i) => (
              <li key={i} className="grid grid-cols-[120px_1fr] gap-x-5 items-baseline">
                <span className="font-mono text-[10.5px] text-terracotta uppercase tracking-[0.12em] tabular-nums">{j.ref}</span>
                <span
                  className="text-[14.5px] text-ink-soft leading-[1.6]"
                  style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50, 'wght' 400" }}
                >
                  {j.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ============================================================
       * VUE ÉCRAN — onglets interactifs (cachée à l'impression)
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 print:hidden reveal stagger-7">
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-ink-faint mb-4 md:mb-0 self-start">
          {lang === 'en' ? 'Roadmap' : 'Feuille de route'}
        </div>
        <div>
          {/* Editorial tablist — no card chrome */}
          <div role="tablist" aria-label={lang === 'en' ? 'Compliance views' : 'Vues de conformité'} className="flex border-b border-rule overflow-x-auto mb-10">
            <TabButton active={tab === 'quickwins'} onClick={() => setTab('quickwins')} icon={Zap}>{t(UI.tabQuickwins, lang)}</TabButton>
            <TabButton active={tab === 'checklist'} onClick={() => setTab('checklist')} icon={ListChecks}>{t(UI.tabChecklist, lang)}</TabButton>
            <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')} icon={Clock}>{t(UI.tabTimeline, lang)}</TabButton>
          </div>

          <div className="reveal-fade" key={tab}>
            {tab === 'quickwins' && (
              <div>
                <p
                  className="text-[14.5px] text-ink-muted mb-9 max-w-[42rem] leading-[1.65] italic"
                  style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 60, 'wght' 380" }}
                >
                  {t(UI.quickwinsIntro, lang)}
                </p>
                <QuickwinsList items={QW} />
              </div>
            )}
            {tab === 'checklist' && (
              <ChecklistView checklist={CL} extraChecklists={extraChecklists} checked={checked} onToggle={toggleChecked} />
            )}
            {tab === 'timeline' && (
              <div>
                <p
                  className="text-[14.5px] text-ink-muted mb-9 max-w-[42rem] leading-[1.65] italic"
                  style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 60, 'wght' 380" }}
                >
                  {t(UI.timelineIntro, lang)}
                </p>
                <TimelineList milestones={applicableTimeline} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
       * VUE IMPRESSION — toutes les sections en séquence
       * Cachée à l'écran, déployée uniquement à l'impression.
       * ========================================================== */}
      <PrintSection icon={Zap} title={t(UI.printSectionQW, lang)}>
        <QuickwinsList items={QW} />
      </PrintSection>

      <PrintSection icon={ListChecks} title={t(UI.printSectionCL, lang)}>
        <ChecklistView checklist={CL} extraChecklists={extraChecklists} checked={checked} onToggle={toggleChecked} />
      </PrintSection>

      <PrintSection icon={Clock} title={t(UI.printSectionTL, lang)}>
        <TimelineList milestones={applicableTimeline} />
      </PrintSection>

      {/* ============================================================
       * BARRE D'ACTIONS — écran uniquement
       * ========================================================== */}
      <div className="grid md:grid-cols-[140px_1fr] gap-x-10 mt-16 pt-8 border-t-2 border-ink print:hidden">
        <div></div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            type="button"
            onClick={onRestart}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted hover:text-ink transition-colors flex items-center gap-2 rounded-full px-2 py-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.6} />
            {t(UI.newQualification, lang)}
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 border border-rule hover:border-ink hover:bg-paper-tint px-4 py-2.5 rounded-full transition-all duration-300 ease-editorial"
            >
              <Copy className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.6} />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">{t(UI.copyReport, lang)}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={pdfBusy}
              aria-busy={pdfBusy}
              className="group inline-flex items-center gap-3 bg-ink text-paper pl-5 pr-3 py-2.5 rounded-full hover:bg-terracotta-deep transition-colors duration-500 ease-editorial disabled:opacity-60 disabled:cursor-wait"
            >
              {pdfBusy ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 30" />
                  </svg>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{t(UI.printGenerating, lang)}</span>
                </>
              ) : (
                <>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{t(UI.printPdf, lang)}</span>
                  <span className="w-6 h-6 rounded-full bg-paper/15 flex items-center justify-center group-hover:bg-paper/25 transition-colors">
                    <Printer className="w-3 h-3" strokeWidth={1.8} />
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * SECTION 4 — MAIN APP
 * ========================================================================== */

const TOTAL_STEPS = 7;

export default function App() {
  const [lang, setLang] = useState('en'); // EN by default
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    role: null, nature: null, prohibitions: null, prohibitionCarveOuts: {}, annexI: null,
    annexIII: [], exceptions: null, profiling: false, art50: [], gpaiSystemic: null,
  });

  // Fonts (Fraunces variable + JetBrains Mono) are loaded via @import in
  // src/design/design.css — no runtime injection needed.

  // Charge html2pdf.js depuis cdnjs (génération PDF côté client, pas de popup nécessaire)
  useEffect(() => {
    if (window.html2pdf) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  const result = useMemo(() => computeCategory(answers, lang), [answers, lang]);

  const restart = () => {
    setAnswers({
      role: null, nature: null, prohibitions: null, prohibitionCarveOuts: {}, annexI: null,
      annexIII: [], exceptions: null, profiling: false, art50: [], gpaiSystemic: null,
    });
    setStep(0);
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));
  const goToResultIfProhibited = () => {
    if (answers.prohibitions && answers.prohibitions.length > 0) setStep(TOTAL_STEPS + 1);
    else next();
  };

  return (
    <LangContext.Provider value={lang}>
      <div className="min-h-screen bg-paper text-ink paper-grain">
        {/* Print rules — only @media print remains.
            PDF export uses a dedicated HTML template (see buildPrintHTML
            in SECTION 3.5), NOT the screen DOM, so the sprawling
            .pdf-export-mode shims that used to live here are gone. */}
        <style>{`
          @page { size: A4; margin: 18mm 16mm 20mm 16mm; }
          @media print {
            html, body {
              background: white !important;
              color: var(--ink);
              font-size: 10pt;
              line-height: 1.5;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            *, *::before, *::after { box-shadow: none !important; }
            h1, h2, h3, h4 { break-after: avoid; }
            ul, ol { break-inside: auto; }
            li { break-inside: avoid; }
            a { color: inherit !important; text-decoration: none !important; }
            button { background: transparent; }
          }
        `}</style>

        <Header step={step} totalSteps={TOTAL_STEPS} onRestart={restart} lang={lang} setLang={setLang} />

        <main>
          {step === 0 && <Welcome onStart={next} />}

          {step === 1 && (
            <QuestionFrame
              stepNum={1} totalSteps={TOTAL_STEPS}
              title={t(UI.q1Title, lang)}
              subtitle={t(UI.q1Sub, lang)}
              canNext={!!answers.role}
              onNext={next} onBack={back}
            >
              <div className="space-y-3">
                {ROLES.map(r => (
                  <OptionCard
                    key={r.id}
                    selected={answers.role === r.id}
                    onClick={() => setAnswers({ ...answers, role: r.id })}
                    icon={r.icon}
                    title={t(r.label, lang)}
                    sub={t(r.sub, lang)}
                    desc={t(r.desc, lang)}
                  />
                ))}
              </div>
            </QuestionFrame>
          )}

          {step === 2 && (
            <QuestionFrame
              stepNum={2} totalSteps={TOTAL_STEPS}
              title={t(UI.q2Title, lang)}
              subtitle={t(UI.q2Sub, lang)}
              canNext={!!answers.nature}
              onNext={next} onBack={back}
            >
              <div className="space-y-3">
                {NATURES.map(n => (
                  <OptionCard
                    key={n.id}
                    selected={answers.nature === n.id}
                    onClick={() => setAnswers({ ...answers, nature: n.id })}
                    title={t(n.label, lang)}
                    sub={t(n.sub, lang)}
                    desc={t(n.desc, lang)}
                  />
                ))}
              </div>
            </QuestionFrame>
          )}

          {step === 3 && (
            <QuestionFrame
              stepNum={3} totalSteps={TOTAL_STEPS}
              title={t(UI.q3Title, lang)}
              subtitle={t(UI.q3Sub, lang)}
              canNext={answers.prohibitions !== null}
              onNext={goToResultIfProhibited} onBack={back}
              nextLabel={answers.prohibitions && answers.prohibitions.length > 0 ? t(UI.viewVerdict, lang) : null}
            >
              <div className="space-y-2">
                {PROHIBITED_PRACTICES.map(p => {
                  const sel = (answers.prohibitions || []).includes(p.id);
                  return (
                    <OptionCard
                      key={p.id} multi selected={sel}
                      onClick={() => {
                        const cur = answers.prohibitions || [];
                        const upd = sel ? cur.filter(x => x !== p.id) : [...cur, p.id];
                        setAnswers({ ...answers, prohibitions: upd });
                      }}
                      title={t(p.label, lang)} sub={p.ref} desc={t(p.desc, lang)}
                    />
                  );
                })}
                <div className="pt-4 mt-3 border-t border-rule">
                  <OptionCard
                    multi
                    selected={answers.prohibitions !== null && answers.prohibitions.length === 0}
                    onClick={() => setAnswers({ ...answers, prohibitions: [] })}
                    title={t(UI.q3None, lang)} sub={t(UI.q3NoneSub, lang)}
                  />
                </div>
              </div>
              {(answers.prohibitions || []).some(id => ART5_CARVEOUTS.some(c => c.appliesTo === id)) && (
                <div className="mt-6 space-y-2">
                  <div className="text-sm uppercase tracking-wider opacity-60">
                    {lang === 'en' ? 'Article 5 carve-outs (optional)' : 'Exceptions article 5 (facultatives)'}
                  </div>
                  {ART5_CARVEOUTS
                    .filter(c => (answers.prohibitions || []).includes(c.appliesTo))
                    .map(c => (
                      <OptionCard
                        key={`carveout-${c.id}`}
                        selected={!!(answers.prohibitionCarveOuts || {})[c.id]}
                        onClick={() => setAnswers({
                          ...answers,
                          prohibitionCarveOuts: {
                            ...(answers.prohibitionCarveOuts || {}),
                            [c.id]: !((answers.prohibitionCarveOuts || {})[c.id]),
                          },
                        })}
                        title={t(c.label, lang)}
                        sub={c.ref}
                        desc={t(c.desc, lang)}
                      />
                    ))}
                </div>
              )}
            </QuestionFrame>
          )}

          {step === 4 && (
            <QuestionFrame
              stepNum={4} totalSteps={TOTAL_STEPS}
              title={t(UI.q4Title, lang)}
              subtitle={t(UI.q4Sub, lang)}
              canNext={answers.annexI !== null}
              onNext={next} onBack={back}
            >
              <div className="space-y-3">
                <OptionCard
                  selected={answers.annexI === 'oui'}
                  onClick={() => setAnswers({ ...answers, annexI: 'oui' })}
                  title={t(UI.yes, lang)}
                  sub={lang === 'en' ? 'art. 6(1) + Annex I' : 'art. 6(1) + Annexe I'}
                  desc={t(UI.q4YesDesc, lang)}
                />
                <OptionCard
                  selected={answers.annexI === 'non'}
                  onClick={() => setAnswers({ ...answers, annexI: 'non' })}
                  title={t(UI.no, lang)} desc={t(UI.q4NoDesc, lang)}
                />
              </div>
            </QuestionFrame>
          )}

          {step === 5 && (
            <QuestionFrame
              stepNum={5} totalSteps={TOTAL_STEPS}
              title={t(UI.q5Title, lang)}
              subtitle={t(UI.q5Sub, lang)}
              canNext={answers.annexIII.length === 0 || answers.profiling || (answers.exceptions !== null && answers.exceptions.length > 0)}
              onNext={next} onBack={back}
            >
              <div className="space-y-2">
                {ANNEX_III_AREAS.map(a => {
                  const sel = answers.annexIII.includes(a.id);
                  return (
                    <OptionCard
                      key={a.id} multi selected={sel}
                      onClick={() => {
                        const cur = answers.annexIII;
                        const upd = sel ? cur.filter(x => x !== a.id) : [...cur, a.id];
                        setAnswers({
                          ...answers,
                          annexIII: upd,
                          // Bug C : reset exceptions when no Annex III area is selected
                          exceptions: upd.length === 0 ? null : answers.exceptions,
                        });
                      }}
                      icon={a.icon}
                      title={t(a.label, lang)} sub={t(a.ref, lang)} desc={t(a.desc, lang)}
                    />
                  );
                })}
              </div>

              {answers.annexIII.length > 0 && (
                <div className="mt-12 pt-8 border-t-2 border-ink">
                  <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-terracotta mb-3">{t(UI.q5ExceptionsKicker, lang)}</div>
                  <h3 className="font-display text-ink text-[26px] md:text-[32px] mb-3 leading-[1.1] tracking-tight" style={{ fontVariationSettings: "'opsz' 64, 'SOFT' 35, 'wght' 400" }}>
                    {t(UI.q5ExceptionsTitle, lang)}
                  </h3>
                  <p className="text-[14.5px] text-ink-soft mb-6 max-w-2xl leading-[1.65]" style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50, 'wght' 400" }}>
                    {t(UI.q5ExceptionsSub, lang)}
                  </p>

                  {/* Avertissement art. 6(3) 2e alinéa — profilage = toujours haut risque */}
                  <div className="mb-7 grid grid-cols-[20px_1fr] gap-x-3 pl-4 py-3 border-l-2 border-terracotta bg-terracotta-soft/40">
                    <AlertCircle className="w-4 h-4 text-terracotta shrink-0 mt-0.5" strokeWidth={1.8} aria-hidden />
                    <div className="text-[13px] leading-[1.65] text-ink-soft" style={{ fontVariationSettings: "'opsz' 13, 'SOFT' 55, 'wght' 400" }}>
                      {t(UI.q5ProfilingWarning, lang)}
                    </div>
                  </div>

                  {/* Toggle profilage : si coché, les dérogations sont neutralisées (art. 6(3) 2e al.) */}
                  <div className="mb-4">
                    <OptionCard
                      multi
                      selected={!!answers.profiling}
                      onClick={() => setAnswers({
                        ...answers,
                        profiling: !answers.profiling,
                        // si profilage activé, on force "aucune exception"
                        exceptions: !answers.profiling ? null : answers.exceptions,
                      })}
                      title={lang === 'en'
                        ? 'My system performs profiling of natural persons (GDPR art. 4(4))'
                        : 'Mon système effectue un profilage de personnes physiques (RGPD art. 4(4))'}
                      sub="art. 6(3) 2e alinéa"
                      desc={lang === 'en'
                        ? 'If checked, derogations below are unavailable and the system remains high-risk.'
                        : 'Si coché, les dérogations ci-dessous sont indisponibles et le système reste haut risque.'}
                    />
                  </div>

                  {answers.profiling && (
                    <div className="mb-4 px-4 py-2.5 bg-paper-shade border border-rule rounded text-[12px] text-ink-muted italic font-mono tracking-wide" role="status">
                      {lang === 'en'
                        ? 'Derogations are disabled because profiling has been declared (art. 6(3) 2nd subparagraph).'
                        : 'Les dérogations sont désactivées car un profilage a été déclaré (art. 6(3) 2e alinéa).'}
                    </div>
                  )}
                  <div
                    className={`space-y-2 ${answers.profiling ? 'opacity-40 pointer-events-none' : ''}`}
                    aria-hidden={answers.profiling ? 'true' : 'false'}
                  >
                    {ART6_EXCEPTIONS.map(e => {
                      const cur = answers.exceptions || [];
                      const sel = cur.includes(e.id);
                      return (
                        <OptionCard
                          key={e.id} multi selected={sel}
                          onClick={() => {
                            const base = (answers.exceptions || []).filter(x => x !== 'none');
                            const upd = sel ? base.filter(x => x !== e.id) : [...base, e.id];
                            setAnswers({ ...answers, exceptions: upd.length === 0 ? null : upd });
                          }}
                          title={t(e.label, lang)} desc={t(e.desc, lang)}
                        />
                      );
                    })}
                    <OptionCard
                      multi
                      selected={(answers.exceptions || []).includes('none')}
                      onClick={() => setAnswers({ ...answers, exceptions: ['none'] })}
                      title={t(UI.q5ExceptionsNone, lang)}
                    />
                  </div>
                </div>
              )}
            </QuestionFrame>
          )}

          {step === 6 && (
            <QuestionFrame
              stepNum={6} totalSteps={TOTAL_STEPS}
              title={t(UI.q6Title, lang)}
              subtitle={t(UI.q6Sub, lang)}
              canNext={true}
              onNext={next} onBack={back}
            >
              <div className="space-y-2">
                {ART50_TRIGGERS.map(tr => {
                  const sel = answers.art50.includes(tr.id);
                  return (
                    <OptionCard
                      key={tr.id} multi selected={sel}
                      onClick={() => {
                        const cur = answers.art50;
                        const upd = sel ? cur.filter(x => x !== tr.id) : [...cur, tr.id];
                        setAnswers({ ...answers, art50: upd });
                      }}
                      title={t(tr.label, lang)} sub={tr.ref} desc={t(tr.desc, lang)}
                    />
                  );
                })}
              </div>
            </QuestionFrame>
          )}

          {step === 7 && (
            <QuestionFrame
              stepNum={7} totalSteps={TOTAL_STEPS}
              title={t(UI.q7Title, lang)}
              subtitle={t(UI.q7Sub, lang)}
              canNext={answers.nature !== 'gpai' || answers.gpaiSystemic !== null}
              onNext={() => setStep(TOTAL_STEPS + 1)}
              onBack={back}
              nextLabel={t(UI.viewVerdict, lang)}
            >
              {answers.nature === 'gpai' ? (
                <div className="space-y-3">
                  <OptionCard
                    selected={answers.gpaiSystemic === 'oui'}
                    onClick={() => setAnswers({ ...answers, gpaiSystemic: 'oui' })}
                    title={t(UI.q7YesTitle, lang)}
                    sub="art. 51(1)-(2) + art. 55"
                    desc={t(UI.q7YesDesc, lang)}
                  />
                  <OptionCard
                    selected={answers.gpaiSystemic === 'non'}
                    onClick={() => setAnswers({ ...answers, gpaiSystemic: 'non' })}
                    title={t(UI.q7NoTitle, lang)}
                    sub="art. 53-54"
                    desc={t(UI.q7NoDesc, lang)}
                  />
                </div>
              ) : (
                <div className="border-l-2 border-rule pl-5 py-4 text-[14.5px] text-ink-muted italic" style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 60, 'wght' 380" }}>
                  {t(UI.q7NotApplicable, lang)}
                </div>
              )}
            </QuestionFrame>
          )}

          {step === TOTAL_STEPS + 1 && (
            <Result answers={answers} result={result} onRestart={restart} />
          )}
        </main>

        <Footer />
      </div>
    </LangContext.Provider>
  );
}
