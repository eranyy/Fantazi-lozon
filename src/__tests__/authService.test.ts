import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../authService';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns null when no session exists', () => {
    expect(authService.getSession()).toBeNull();
  });

  it('retrieves session from localStorage', () => {
    const mockUser = { id: 'u1', name: 'ערן', email: 'eran@test.com' };
    authService.login(mockUser, true);
    
    expect(authService.getSession()).toMatchObject({ id: 'u1', name: 'ערן' });
  });

  it('falls back to sessionStorage if localStorage is empty', () => {
    const mockUser = { id: 'u2', name: 'גיא', email: 'guy@test.com' };
    sessionStorage.setItem('fantasy_user_session', JSON.stringify(mockUser));
    
    expect(authService.getSession()).toMatchObject({ id: 'u2', name: 'גיא' });
  });

  it('clears sessions properly on logout', () => {
    const mockUser = { id: 'u3', name: 'ארז', email: 'erez@test.com' };
    authService.login(mockUser, true);
    authService.logout();
    
    expect(authService.getSession()).toBeNull();
  });

  describe('error paths', () => {
    const mockUser = { id: 'u4', name: 'טסט', email: 'test@test.com' };

    it('login continues gracefully if localStorage.setItem throws', () => {
      let callCount = 0;
      const originalSetItem = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
        if (callCount === 0) {
          callCount++;
          throw new Error('QuotaExceededError');
        }
        callCount++;
        // Calling the unmocked method to actually store the data in JSDOM
        vi.mocked(originalSetItem).call(this, key, value);
      });

      // Should not throw
      expect(() => authService.login(mockUser, true)).not.toThrow();

      // Verify sessionStorage was still populated since it's the second call
      expect(sessionStorage.getItem('fantasy_user_session')).toBeTruthy();
    });

    it('login continues gracefully if sessionStorage.setItem throws', () => {
      let callCount = 0;
      const originalSetItem = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
        if (callCount === 1) {
          callCount++;
          throw new Error('Disabled');
        }
        callCount++;
        // Calling the unmocked method to actually store the data in JSDOM
        vi.mocked(originalSetItem).call(this, key, value);
      });

      expect(() => authService.login(mockUser, true)).not.toThrow();

      // Verify localStorage was still populated
      expect(localStorage.getItem('fantasy_user_session')).toBeTruthy();
    });

    it('logout continues gracefully if Storage.removeItem throws', () => {
      // Mock Storage.prototype.removeItem to always throw
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Disabled');
      });

      expect(() => authService.logout()).not.toThrow();
    });
  });
});
