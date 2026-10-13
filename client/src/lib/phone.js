/**
 * Phone numbers are stored as one string: `+<country code><number>` with no spaces (e.g. `+919876543210`).
 * The server accepts 10-15 digits in total, so these helpers keep the country-code picker, validation
 * and display in step with that rule.
 */

export const DEFAULT_COUNTRY_CODE = '+91';

/** Total digits (country code + number) the server accepts. */
const MIN_TOTAL_DIGITS = 10;
const MAX_TOTAL_DIGITS = 15;
/** Indian mobile numbers: 10 digits, starting with 6-9. */
const INDIA_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const COUNTRY_CODES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'United States / Canada' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+971', name: 'United Arab Emirates' },
  { code: '+966', name: 'Saudi Arabia' },
  { code: '+974', name: 'Qatar' },
  { code: '+968', name: 'Oman' },
  { code: '+965', name: 'Kuwait' },
  { code: '+973', name: 'Bahrain' },
  { code: '+65', name: 'Singapore' },
  { code: '+60', name: 'Malaysia' },
  { code: '+61', name: 'Australia' },
  { code: '+64', name: 'New Zealand' },
  { code: '+49', name: 'Germany' },
  { code: '+33', name: 'France' },
  { code: '+39', name: 'Italy' },
  { code: '+34', name: 'Spain' },
  { code: '+31', name: 'Netherlands' },
  { code: '+353', name: 'Ireland' },
  { code: '+41', name: 'Switzerland' },
  { code: '+46', name: 'Sweden' },
  { code: '+7', name: 'Russia' },
  { code: '+90', name: 'Turkey' },
  { code: '+20', name: 'Egypt' },
  { code: '+27', name: 'South Africa' },
  { code: '+234', name: 'Nigeria' },
  { code: '+254', name: 'Kenya' },
  { code: '+55', name: 'Brazil' },
  { code: '+52', name: 'Mexico' },
  { code: '+81', name: 'Japan' },
  { code: '+82', name: 'South Korea' },
  { code: '+86', name: 'China' },
  { code: '+852', name: 'Hong Kong' },
  { code: '+62', name: 'Indonesia' },
  { code: '+63', name: 'Philippines' },
  { code: '+66', name: 'Thailand' },
  { code: '+84', name: 'Vietnam' },
  { code: '+94', name: 'Sri Lanka' },
  { code: '+977', name: 'Nepal' },
  { code: '+880', name: 'Bangladesh' },
  { code: '+92', name: 'Pakistan' },
];

/** Options for a `<Select>`, India first. */
export const COUNTRY_CODE_OPTIONS = COUNTRY_CODES.map(({ code, name }) => ({ value: code, label: `${code}  ${name}` }));

const codeLength = (code) => code.length - 1;
const countryName = (code) => COUNTRY_CODES.find((country) => country.code === code)?.name ?? code;
/** Longest codes first so `+971` wins over `+97`. */
const CODES_LONGEST_FIRST = COUNTRY_CODES.map(({ code }) => code).sort((a, b) => b.length - a.length);

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

/** Most digits the number box accepts for a country code. */
export const maxNationalDigits = (code) => MAX_TOTAL_DIGITS - codeLength(code);

/**
 * Stored value → `{ code, number }`. Old values without a `+` (a plain 10-digit number) are treated as Indian
 * numbers; a `+` followed by an unknown prefix keeps the default code so nothing is lost.
 */
export function splitPhone(value) {
  const raw = String(value ?? '').replace(/[\s()-]/g, '');
  if (!raw) return { code: DEFAULT_COUNTRY_CODE, number: '' };
  if (!raw.startsWith('+')) return { code: DEFAULT_COUNTRY_CODE, number: onlyDigits(raw) };
  const code = CODES_LONGEST_FIRST.find((candidate) => raw.startsWith(candidate));
  return code ? { code, number: onlyDigits(raw.slice(code.length)) } : { code: DEFAULT_COUNTRY_CODE, number: onlyDigits(raw) };
}

/** `{ code, number }` → stored value. An empty number gives an empty string (so "required" can fire). */
export function joinPhone(code, number) {
  const digits = onlyDigits(number);
  return digits ? `${code}${digits}` : '';
}

/** Validation message for a stored phone value, or `null` when it is fine. */
export function getPhoneError(value) {
  const { code, number } = splitPhone(value);
  if (!number) return 'Phone number is required';
  if (code === DEFAULT_COUNTRY_CODE) {
    return INDIA_MOBILE_REGEX.test(number) ? null : 'Enter a 10-digit mobile number that starts with 6, 7, 8 or 9';
  }
  const min = Math.max(4, MIN_TOTAL_DIGITS - codeLength(code));
  const max = maxNationalDigits(code);
  return number.length >= min && number.length <= max ? null : `Enter a valid ${countryName(code)} phone number`;
}

/** Display form: `+91 98765 43210` for Indian numbers, `+<code> <number>` for the rest. */
export function formatPhone(value) {
  if (!value) return '—';
  const { code, number } = splitPhone(value);
  if (!number) return '—';
  if (code === DEFAULT_COUNTRY_CODE && number.length === 10) return `${code} ${number.slice(0, 5)} ${number.slice(5)}`;
  return `${code} ${number}`;
}
