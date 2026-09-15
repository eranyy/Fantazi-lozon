import { describe, it, expect } from 'vitest';
import { VAPID_KEY, db, auth, messaging, functions } from '../firebaseConfig';

describe('firebaseConfig', () => {
  it('exports a valid non-empty VAPID_KEY', () => {
    expect(VAPID_KEY).toBeDefined();
    expect(typeof VAPID_KEY).toBe('string');
    expect(VAPID_KEY.length).toBeGreaterThan(10);
  });

  it('exports initialized Firebase core services', () => {
    expect(db).toBeDefined();
    expect(auth).toBeDefined();
    expect(functions).toBeDefined();
    // messaging is either an instance or null if Push is unsupported in test env
    expect(messaging === null || typeof messaging === 'object').toBe(true);
  });
});
