import { describe, expect, it, vi } from 'vitest';
import { Logger } from './Logger.js';

describe('Logger', () => {
  it('returns the same instance for the same name', () => {
    expect(Logger.get('same')).toBe(Logger.get('same'));
  });

  it('returns different instances for different names', () => {
    expect(Logger.get('a')).not.toBe(Logger.get('b'));
  });

  it('does not log under vitest', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

    Logger.get('quiet').info('should not appear');

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
