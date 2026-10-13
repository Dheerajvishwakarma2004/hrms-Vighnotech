const numberFormatter = new Intl.NumberFormat();

/** 1284 → "1,284" in the user's locale. */
export function formatCount(value) {
  return numberFormatter.format(value ?? 0);
}

/** `pluralize(1, 'day')` → "1 day", `pluralize(1284, 'day')` → "1,284 days". */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

/** Fallback download name for a person's resume: " Jane  Doe" → "Jane_Doe_Resume.pdf". */
export function resumeFileName(fullName = '') {
  return `${fullName.trim().replace(/\s+/g, '_')}_Resume.pdf`;
}
