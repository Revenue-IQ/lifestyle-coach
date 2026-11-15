/**
 * Personal details the coach must never echo or keep (rule from the teammates'
 * prompt, 2026-11-15). Removed from the person's message before it is stored or
 * sent to the model, so neither can repeat them. No humour.
 */
const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const PHONE = /(?<!\d)(\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}(?!\d)/g;

export function redactPersonalDetails(text: string): { text: string; redacted: boolean } {
  let out = text.replace(SSN, '[ID number removed]');
  out = out.replace(EMAIL, '[email removed]');
  out = out.replace(PHONE, '[phone number removed]');
  return { text: out, redacted: out !== text };
}
