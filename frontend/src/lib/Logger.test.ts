import { describe, expect, it, vi } from 'vitest';
import { Logger } from './Logger';

describe('Logger', () => {
  it('returns the same instance for the same name', () => {
    expect(Logger.get('Same')).toBe(Logger.get('Same'));
  });

  it('returns different instances for different names', () => {
    expect(Logger.get('A')).not.toBe(Logger.get('B'));
  });

  it('does not log in test mode', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

    Logger.get('Quiet').info('should not appear');

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
