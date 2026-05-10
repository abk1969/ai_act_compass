// Translates a value: string passes through, {en, fr} object resolves by lang.
// Pure — used by both the React UI and the headless classify module.
export const t = (val, lang) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  return val[lang] ?? val.en ?? val.fr ?? '';
};
