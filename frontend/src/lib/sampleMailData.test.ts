import { describe, expect, it } from 'vitest';
import { ALL_MAIL_CATEGORY_ID } from '../context/MailDataContext';
import { SAMPLE_MESSAGES } from './sampleMailData';

describe('SAMPLE_MESSAGES', () => {
  it('is non-empty and every message is in the placeholder category', () => {
    expect(SAMPLE_MESSAGES.length).toBeGreaterThan(0);
    expect(SAMPLE_MESSAGES.every((m) => m.categoryId === ALL_MAIL_CATEGORY_ID)).toBe(true);
  });

  it('is sorted newest first', () => {
    const dates = SAMPLE_MESSAGES.map((m) => m.date);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it('has unique uids', () => {
    const uids = SAMPLE_MESSAGES.map((m) => m.uid);
    expect(new Set(uids).size).toBe(uids.length);
  });
});
