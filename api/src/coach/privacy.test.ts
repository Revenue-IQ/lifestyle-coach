import { describe, expect, it } from 'vitest';
import { redactPersonalDetails } from './privacy';

describe('personal details are removed before storing or sending', () => {
  it('removes email, phone and ID numbers', () => {
    const r = redactPersonalDetails('My name is Priya, email priya.s@example.com, phone 408-555-0199. I can\'t sleep');
    expect(r.redacted).toBe(true);
    expect(r.text).not.toContain('example.com');
    expect(r.text).not.toContain('0199');
    expect(r.text).toContain("I can't sleep");
    expect(redactPersonalDetails('Remember my SSN 123-45-6789 for later').text).toBe('Remember my SSN [ID number removed] for later');
  });
  it('leaves ordinary numbers alone', () => {
    const r = redactPersonalDetails('I sleep about 5 hours and had 3 coffees, the last one at 4pm in 2026');
    expect(r.redacted).toBe(false);
  });
});
