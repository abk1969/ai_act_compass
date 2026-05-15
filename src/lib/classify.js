// Classification logic for EU AI Act risk-tier assignment.
// Pure — no React, no DOM, no globals. Safe to run in node, edge, or browser.
// Source of truth for art. 5 / 6(1) / 6(2) + 6(3) / 50 / 51-55 decisions.
// Tested in classify.test.js — every regulatory branch has an asserting test.

import {
  Eye, Network, GraduationCap, Briefcase,
  Stethoscope, Shield, Plane, Gavel,
} from 'lucide-react';
import { t } from './i18n.js';

export const PROHIBITED_PRACTICES = [
  {
    id: 'a',
    ref: 'art. 5(1)(a)',
    label: { en: 'Subliminal or manipulative techniques', fr: 'Techniques subliminales ou manipulatrices' },
    desc:  {
      en: 'System deploying techniques beyond a person\'s consciousness, or intentionally manipulative/deceptive, materially distorting their behaviour and causing significant harm.',
      fr: 'Système déployant des techniques au-delà de la conscience d\'une personne, ou intentionnellement manipulatrices/trompeuses, altérant matériellement son comportement et causant un préjudice significatif.',
    },
  },
  {
    id: 'b',
    ref: 'art. 5(1)(b)',
    label: { en: 'Exploitation of vulnerabilities', fr: 'Exploitation de vulnérabilités' },
    desc:  {
      en: 'Exploitation of vulnerabilities related to age, disability or social/economic situation of a person or group.',
      fr: 'Exploitation de vulnérabilités liées à l\'âge, au handicap ou à la situation sociale/économique d\'une personne ou d\'un groupe.',
    },
  },
  {
    id: 'c',
    ref: 'art. 5(1)(c)',
    label: { en: 'Social scoring', fr: 'Notation sociale (social scoring)' },
    desc:  {
      en: 'Evaluation or classification of persons based on social behaviour or personal characteristics, leading to detrimental treatment out of context.',
      fr: 'Évaluation ou classification de personnes sur leur comportement social ou caractéristiques personnelles, conduisant à un traitement préjudiciable hors contexte.',
    },
  },
  {
    id: 'd',
    ref: 'art. 5(1)(d)',
    label: { en: 'Individual predictive policing', fr: 'Police prédictive individuelle' },
    desc:  {
      en: 'Risk assessment of a person committing a criminal offence, based solely on profiling or personality traits.',
      fr: 'Évaluation du risque qu\'une personne commette une infraction, fondée uniquement sur le profilage ou des traits de personnalité.',
    },
  },
  {
    id: 'e',
    ref: 'art. 5(1)(e)',
    label: { en: 'Untargeted scraping of facial images', fr: 'Récolte non ciblée d\'images faciales' },
    desc:  {
      en: 'Creation or expansion of facial recognition databases through untargeted scraping from the internet or CCTV footage.',
      fr: 'Création ou expansion de bases de reconnaissance faciale par moisson non ciblée d\'images depuis Internet ou la vidéosurveillance.',
    },
  },
  {
    id: 'f',
    ref: 'art. 5(1)(f)',
    label: { en: 'Emotion recognition in workplace / education', fr: 'Reconnaissance émotionnelle au travail / en éducation' },
    desc:  {
      en: 'Inference of emotions in the workplace or in educational institutions (except for medical or safety reasons).',
      fr: 'Inférence d\'émotions sur le lieu de travail ou en établissement d\'enseignement (sauf raisons médicales ou de sécurité).',
    },
  },
  {
    id: 'g',
    ref: 'art. 5(1)(g)',
    label: { en: 'Biometric categorisation on protected attributes', fr: 'Catégorisation biométrique sur attributs protégés' },
    desc:  {
      en: 'Categorisation of persons via biometrics to deduce race, political opinions, trade union membership, religious/philosophical beliefs, sex life or sexual orientation.',
      fr: 'Catégorisation de personnes par biométrie pour déduire race, opinions politiques, appartenance syndicale, convictions religieuses/philosophiques, vie ou orientation sexuelle.',
    },
  },
  {
    id: 'h',
    ref: 'art. 5(1)(h)',
    label: { en: '"Real-time" remote biometric identification in public spaces by law enforcement', fr: 'Identification biométrique à distance "temps réel" en espace public par les forces de l\'ordre' },
    desc:  {
      en: 'Real-time remote biometric identification in publicly accessible spaces for law enforcement (except strict exceptions in art. 5(2)-(3)).',
      fr: 'Identification biométrique à distance en temps réel dans les espaces accessibles au public à des fins répressives (sauf exceptions strictes art. 5(2)-(3)).',
    },
  },
];

// Each carve-out has a unique `id` and an `appliesTo` pointing to the prohibition it gates.
// They coincide today (1:1 mapping) but are kept separate so future carve-outs can gate
// multiple prohibitions or share a target.
export const ART5_CARVEOUTS = [
  {
    id: 'h',
    appliesTo: 'h',
    ref: 'art. 5(2)-(3)',
    label: {
      en: 'Real-time RBI — law enforcement exception',
      fr: 'IBR temps réel — exception forces de l\'ordre',
    },
    desc: {
      en: 'Use is strictly necessary for: (i) targeted search for victims (abduction, trafficking, sexual exploitation) or missing persons; (ii) prevention of specific substantial/imminent threat to life or terrorist attack; (iii) localisation/identification of suspects of Annex II offences punishable by ≥4-year custodial sentence. Requires prior judicial/administrative authorisation + FRIA + Annex VI registration. Counsel verification required.',
      fr: 'Usage strictement nécessaire à : (i) recherche ciblée de victimes (enlèvement, traite, exploitation sexuelle) ou personnes disparues ; (ii) prévention d\'une menace grave et imminente pour la vie ou d\'un acte terroriste ; (iii) localisation/identification de suspects d\'infractions Annexe II passibles d\'une peine ≥ 4 ans. Autorisation judiciaire/administrative préalable + FRIA + enregistrement Annexe VI requis. Vérification juridique requise.',
    },
  },
  {
    id: 'f',
    appliesTo: 'f',
    ref: 'art. 5(1)(f) parenthetical',
    label: {
      en: 'Emotion recognition — medical or safety carve-out',
      fr: 'Reconnaissance émotionnelle — exception médicale ou de sécurité',
    },
    desc: {
      en: 'Workplace/education emotion recognition is not prohibited if intended to be put in place or into the market strictly for medical or safety reasons. Counsel verification required.',
      fr: 'La reconnaissance émotionnelle au travail/en éducation n\'est pas interdite si destinée à être mise en place ou sur le marché strictement pour des raisons médicales ou de sécurité. Vérification juridique requise.',
    },
  },
  {
    id: 'g',
    appliesTo: 'g',
    ref: 'art. 5(1)(g) parenthetical',
    label: {
      en: 'Biometric categorisation — law enforcement / legally acquired dataset',
      fr: 'Catégorisation biométrique — forces de l\'ordre / jeu légalement acquis',
    },
    desc: {
      en: 'Biometric categorisation of sensitive attributes is not prohibited where labelling/filtering of legally acquired biometric datasets is performed in the area of law enforcement. Counsel verification required.',
      fr: 'La catégorisation biométrique d\'attributs sensibles n\'est pas interdite lorsque l\'étiquetage/filtrage de jeux biométriques légalement acquis est effectué dans le cadre de l\'application de la loi. Vérification juridique requise.',
    },
  },
];

export const ANNEX_III_AREAS = [
  {
    id: 1,
    label: { en: 'Biometrics', fr: 'Biométrie' },
    desc:  {
      en: 'Remote biometric identification, biometric categorisation of sensitive attributes, emotion recognition (excluding prohibited cases under art. 5).',
      fr: 'Identification biométrique à distance, catégorisation biométrique d\'attributs sensibles, reconnaissance émotionnelle (hors interdites art. 5).',
    },
    icon: Eye,
    ref: { en: 'Annex III §1', fr: 'Annexe III §1' },
  },
  {
    id: 2,
    label: { en: 'Critical infrastructure', fr: 'Infrastructures critiques' },
    desc:  {
      en: 'Safety components in the management/operation of critical infrastructure (water, gas, electricity, transport, digital).',
      fr: 'Composants de sécurité dans la gestion/exploitation d\'infrastructures critiques (eau, gaz, électricité, transport, numérique).',
    },
    icon: Network,
    ref: { en: 'Annex III §2', fr: 'Annexe III §2' },
  },
  {
    id: 3,
    label: { en: 'Education and vocational training', fr: 'Éducation et formation professionnelle' },
    desc:  {
      en: 'Determining access, evaluating learning outcomes, assessing the appropriate level, monitoring exams.',
      fr: 'Détermination d\'accès, évaluation de résultats, évaluation du niveau approprié, surveillance d\'examens.',
    },
    icon: GraduationCap,
    ref: { en: 'Annex III §3', fr: 'Annexe III §3' },
  },
  {
    id: 4,
    label: { en: 'Employment, workers management, access to self-employment', fr: 'Emploi, gestion du personnel, accès à l\'auto-emploi' },
    desc:  {
      en: 'Recruitment, candidate targeting, decisions on terms of employment, promotions, terminations, task allocation, performance monitoring.',
      fr: 'Recrutement, ciblage de candidats, prise de décision sur conditions de travail, promotions, résiliations, allocation de tâches, suivi de performance.',
    },
    icon: Briefcase,
    ref: { en: 'Annex III §4', fr: 'Annexe III §4' },
  },
  {
    id: 5,
    label: { en: 'Access to essential services', fr: 'Accès aux services essentiels' },
    desc:  {
      en: 'Eligibility for public benefits, credit scoring (excluding fraud detection), life/health insurance pricing, dispatching emergencies, medical triage.',
      fr: 'Évaluation d\'éligibilité aux prestations publiques, scoring de crédit (sauf détection de fraude), tarification vie/santé, dispatch d\'urgences, triage médical.',
    },
    icon: Stethoscope,
    ref: { en: 'Annex III §5', fr: 'Annexe III §5' },
  },
  {
    id: 6,
    label: { en: 'Law enforcement', fr: 'Application de la loi' },
    desc:  {
      en: 'Victimisation risk assessment, polygraphs, evaluation of evidence reliability, profiling in investigations.',
      fr: 'Évaluation du risque de victimisation, polygraphes, évaluation de fiabilité des preuves, profilage dans le cadre d\'enquêtes.',
    },
    icon: Shield,
    ref: { en: 'Annex III §6', fr: 'Annexe III §6' },
  },
  {
    id: 7,
    label: { en: 'Migration, asylum, border control', fr: 'Migration, asile, contrôle aux frontières' },
    desc:  {
      en: 'Polygraphs, risk assessment (security, irregularity, health), processing asylum/visa applications, identification in border checks.',
      fr: 'Polygraphes, évaluation de risques (sécurité, irrégularité, santé), traitement de demandes d\'asile/visa, identification dans le cadre des contrôles.',
    },
    icon: Plane,
    ref: { en: 'Annex III §7', fr: 'Annexe III §7' },
  },
  {
    id: 8,
    label: { en: 'Administration of justice and democratic processes', fr: 'Justice et processus démocratiques' },
    desc:  {
      en: 'Assistance in interpreting facts or law, ADR, influence on the outcome of elections or referenda, voting behaviour.',
      fr: 'Aide à l\'interprétation de faits ou du droit, ADR, influence sur l\'issue d\'élections ou de référendums, comportement de vote.',
    },
    icon: Gavel,
    ref: { en: 'Annex III §8', fr: 'Annexe III §8' },
  },
];

export const ART50_TRIGGERS = [
  {
    id: 'interaction',
    ref: 'art. 50(1)',
    label: { en: 'Direct interaction with natural persons', fr: 'Interaction directe avec personnes physiques' },
    desc:  {
      en: 'Chatbot, conversational agent, voice assistant, augmented IVR.',
      fr: 'Chatbot, agent conversationnel, assistant vocal, IVR augmenté.',
    },
  },
  {
    id: 'biocat_emotion',
    ref: 'art. 50(3)',
    label: { en: 'Biometric categorisation or emotion recognition', fr: 'Catégorisation biométrique ou reconnaissance émotionnelle' },
    desc:  {
      en: 'Non-prohibited system informing persons of their exposure to such a system.',
      fr: 'Système non interdit informant les personnes de leur exposition à un tel système.',
    },
  },
  {
    id: 'genai_media',
    ref: 'art. 50(2) + 50(4)',
    label: { en: 'Generation or manipulation of image, audio, video (deepfakes)', fr: 'Génération ou manipulation d\'images, audio, vidéo (deepfakes)' },
    desc:  {
      en: 'Synthetic content: machine-readable marking + deepfake label if deceptive.',
      fr: 'Contenu synthétique : marquage machine-readable + label deepfake si trompeur.',
    },
  },
  {
    id: 'genai_text',
    ref: 'art. 50(4) §2',
    label: { en: 'Generation of text on matters of public interest', fr: 'Génération de texte d\'intérêt public' },
    desc:  {
      en: 'Text published to inform the public on matters of public interest — labelling required (except where human review/edit applies).',
      fr: 'Texte publié pour informer le public sur des sujets d\'intérêt public — étiquetage requis (sauf supervision/édition humaine).',
    },
  },
];

export function computeCategory(answers, lang) {
  const justifications = [];
  const categories = [];

  if (answers.prohibitions && answers.prohibitions.length > 0) {
    const carveOuts = answers.prohibitionCarveOuts || {};
    const interdictedRefs = [];
    const carvedOutRefs = [];
    answers.prohibitions.forEach(id => {
      const p = PROHIBITED_PRACTICES.find(x => x.id === id);
      const co = carveOuts[id] ? ART5_CARVEOUTS.find(c => c.appliesTo === id) : null;
      if (co) {
        carvedOutRefs.push({ ref: co.ref, label: t(co.label, lang) });
      } else {
        interdictedRefs.push({ ref: p.ref, label: t(p.label, lang) });
      }
    });
    if (interdictedRefs.length > 0) {
      return { primary: 'INTERDIT', secondary: null, justifications: interdictedRefs };
    }
    carvedOutRefs.forEach(j => justifications.push(j));
  }

  // Important : un système qui REPOSE sur un GPAI tiers (`systeme_sur_gpai`) n'est PAS lui-même
  // soumis aux obligations art. 53–55 — celles-ci visent le FOURNISSEUR du modèle GPAI.
  // Sauf modification substantielle (art. 25) requalifiant l'intégrateur en provider GPAI,
  // l'intégrateur reste sous régime système IA classique (+ art. 50 si applicable).
  const isGPAIProvider = answers.nature === 'gpai';
  const isGPAI_RS = isGPAIProvider && answers.gpaiSystemic === 'oui';
  const isOnGPAI = answers.nature === 'systeme_sur_gpai';

  if (answers.annexI === 'oui') {
    justifications.push({
      ref: lang === 'en' ? 'art. 6(1) + Annex I' : 'art. 6(1) + Annexe I',
      label: lang === 'en' ? 'Safety component of a harmonised product' : 'Composant de sécurité de produit harmonisé',
    });
    categories.push('HAUT_RISQUE_ANNEXE_I');
  }

  const annex3Areas = answers.annexIII || [];
  const exceptions = answers.exceptions || [];
  const inAnnexIII = annex3Areas.length > 0;
  // art. 6(3) 2e alinéa : profilage de personnes physiques = pas de dérogation possible
  const profilingBlocksException = !!answers.profiling;
  const hasException = !profilingBlocksException && exceptions.length > 0 && !exceptions.includes('none');

  if (inAnnexIII && !hasException) {
    annex3Areas.forEach(id => {
      const a = ANNEX_III_AREAS.find(x => x.id === id);
      if (a) justifications.push({ ref: t(a.ref, lang), label: t(a.label, lang) });
    });
    if (profilingBlocksException) {
      justifications.push({
        ref: 'art. 6(3) 2e al.',
        label: lang === 'en'
          ? 'Profiling of natural persons — derogations of art. 6(3) cannot apply; system remains high-risk'
          : 'Profilage de personnes physiques — dérogations art. 6(3) inapplicables ; système maintenu en haut risque',
      });
    }
    categories.push('HAUT_RISQUE_ANNEXE_III');
  } else if (inAnnexIII && hasException) {
    // Trace les zones Annexe III examinées pour audit, puis la dérogation art. 6(3) appliquée.
    annex3Areas.forEach(id => {
      const a = ANNEX_III_AREAS.find(x => x.id === id);
      if (a) justifications.push({ ref: t(a.ref, lang), label: t(a.label, lang) });
    });
    justifications.push({
      ref: 'art. 6(3)',
      label: lang === 'en'
        ? 'Exception applicable — system removed from high-risk (art. 6(4) documentation required)'
        : 'Exception applicable — système retiré du haut risque (documentation art. 6(4) requise)',
    });
  }

  const triggers = answers.art50 || [];
  if (triggers.length > 0) {
    triggers.forEach(id => {
      const tr = ART50_TRIGGERS.find(x => x.id === id);
      if (tr) justifications.push({ ref: tr.ref, label: t(tr.label, lang) });
    });
    categories.push('RISQUE_LIMITE');
  }

  if (isGPAIProvider) {
    if (isGPAI_RS) categories.push('GPAI_RS');
    else categories.push('GPAI');
  } else if (isOnGPAI) {
    // Information non-bloquante : rappeler que les obligations GPAI restent côté fournisseur du modèle,
    // sauf si l'utilisateur opère une modification substantielle (art. 25) le requalifiant.
    justifications.push({
      ref: 'art. 25 + art. 53',
      label: lang === 'en'
        ? 'System integrates a third-party GPAI model — GPAI obligations (art. 53–55) bind the model provider, not the integrator (unless substantial modification under art. 25 triggers a provider flip).'
        : 'Système intégrant un modèle GPAI tiers — les obligations GPAI (art. 53–55) pèsent sur le fournisseur du modèle, pas sur l\'intégrateur (sauf modification substantielle art. 25 requalifiant en provider).',
    });
  }

  if (categories.length === 0) {
    // Préserve les justifications déjà accumulées (zones Annexe III examinées,
    // dérogation art. 6(3), note GPAI tiers) ; n'ajoute le message générique que si la liste est vide.
    if (justifications.length === 0) {
      justifications.push({
        ref: lang === 'en' ? 'analysis' : 'analyse',
        label: lang === 'en' ? 'No material-obligation trigger identified' : 'Aucun déclencheur d\'obligation matérielle identifié',
      });
    }
    return { primary: 'RISQUE_MINIMAL', secondary: null, justifications };
  }

  const order = ['HAUT_RISQUE_ANNEXE_I', 'HAUT_RISQUE_ANNEXE_III', 'GPAI_RS', 'GPAI', 'RISQUE_LIMITE'];
  const sorted = categories.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return { primary: sorted[0], secondary: sorted.slice(1), justifications };
}
