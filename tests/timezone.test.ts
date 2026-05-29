import { describe, expect, it } from 'vitest';
import { resolveLocalDateTime } from '../lib/server/time';

describe('timezone DST handling', () => {
  it('spring-forward invalid local time resolves forward', () => {
    const dt = resolveLocalDateTime('2026-03-29', '02:30', 'Europe/Berlin');
    expect(dt.isValid).toBe(true);
    expect(dt.toFormat('HH:mm')).not.toBe('02:30');
  });

  it('fall-back ambiguous local time resolves to earlier offset', () => {
    const dt = resolveLocalDateTime('2026-10-25', '02:30', 'Europe/Berlin');
    expect(dt.isValid).toBe(true);
    expect(dt.offset).toBe(120);
  });
});
