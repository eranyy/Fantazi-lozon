import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from './authService';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getSession', () => {
    it('should return null when no user is stored', () => {
      expect(authService.getSession()).toBeNull();
    });

    it('should prefer localStorage over sessionStorage when both exist', () => {
      const localUser = { id: 1, name: 'Local User' };
      const sessionUser = { id: 2, name: 'Session User' };

      localStorage.setItem('fantasy_user', JSON.stringify(localUser));
      sessionStorage.setItem('fantasy_user', JSON.stringify(sessionUser));

      expect(authService.getSession()).toEqual(localUser);
    });

    it('should return user from sessionStorage if localStorage is empty', () => {
      const sessionUser = { id: 2, name: 'Session User' };

      sessionStorage.setItem('fantasy_user', JSON.stringify(sessionUser));

      expect(authService.getSession()).toEqual(sessionUser);
    });
  });

  describe('login', () => {
    const mockUser = { id: 1, name: 'Test User' };

    it('should store in localStorage and clear sessionStorage when rememberMe is true', () => {
      sessionStorage.setItem('fantasy_user', JSON.stringify({ old: 'session' }));

      authService.login(mockUser, true);

      expect(localStorage.getItem('fantasy_user')).toEqual(JSON.stringify(mockUser));
      expect(sessionStorage.getItem('fantasy_user')).toBeNull();
    });

    it('should store in sessionStorage and clear localStorage when rememberMe is false', () => {
      localStorage.setItem('fantasy_user', JSON.stringify({ old: 'local' }));

      authService.login(mockUser, false);

      expect(sessionStorage.getItem('fantasy_user')).toEqual(JSON.stringify(mockUser));
      expect(localStorage.getItem('fantasy_user')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should remove user from both localStorage and sessionStorage', () => {
      const mockUser = { id: 1, name: 'Test User' };
      localStorage.setItem('fantasy_user', JSON.stringify(mockUser));
      sessionStorage.setItem('fantasy_user', JSON.stringify(mockUser));

      authService.logout();

      expect(localStorage.getItem('fantasy_user')).toBeNull();
      expect(sessionStorage.getItem('fantasy_user')).toBeNull();
    });
  });
});
