export const normalizeText = (value, maxLength, { allowNewlines = false } = {}) => {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/\r\n?/g, '\n').trim();
  const withoutControls = allowNewlines
    ? normalized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    : normalized.replace(/[\u0000-\u001F\u007F\r\n]/g, ' ');
  return withoutControls.slice(0, maxLength);
};

export const isValidEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const normalizeUrl = (value, { allowEmpty = true } = {}) => {
  const normalized = normalizeText(value, 500);
  if (!normalized && allowEmpty) return '';
  if (!normalized) throw new Error('URL is required.');

  const candidate = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
  const parsed = new URL(candidate);
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS URLs are allowed.');
  return parsed.toString();
};

export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
