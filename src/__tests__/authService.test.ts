import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../authService';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getSession', () => {
    it('returns data from localStorage when available', () => {
      const mockSession = { id: '123', email: 'test@test.com' };
      localStorage.setItem('fantasy_user_session', JSON.stringify(mockSession));

      const session = authService.getSession();
      expect(session).toEqual(mockSession);
    });

    it('falls back to sessionStorage when localStorage is empty', () => {
      const mockSession = { id: '456', email: 'fallback@test.com' };
      sessionStorage.setItem('fantasy_user_session', JSON.stringify(mockSession));

      const session = authService.getSession();
      expect(session).toEqual(mockSession);
    });

    it('returns null when both storages are empty', () => {
      const session = authService.getSession();
      expect(session).toBeNull();
    });
  });

  describe('login', () => {
    it('stores session in localStorage when rememberMe is true', () => {
      const user = { id: 'user1', email: 'user1@test.com' };
      authService.login(user, true);

      const localData = localStorage.getItem('fantasy_user_session');
      const sessionData = sessionStorage.getItem('fantasy_user_session');

      expect(localData).toBeTruthy();
      expect(JSON.parse(localData!)).toEqual({ id: 'user1', email: 'user1@test.com' });
      expect(sessionData).toBeNull();
    });

    it('stores session in sessionStorage when rememberMe is false', () => {
      const user = { id: 'user2', email: 'user2@test.com' };
      authService.login(user, false);

      const localData = localStorage.getItem('fantasy_user_session');
      const sessionData = sessionStorage.getItem('fantasy_user_session');

      expect(sessionData).toBeTruthy();
      expect(JSON.parse(sessionData!)).toEqual({ id: 'user2', email: 'user2@test.com' });
      expect(localData).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears both storages', () => {
      localStorage.setItem('fantasy_user_session', JSON.stringify({ id: '1' }));
      sessionStorage.setItem('fantasy_user_session', JSON.stringify({ id: '2' }));
      localStorage.setItem('fantasy_user', 'old');
      sessionStorage.setItem('fantasy_user', 'old');

      authService.logout();

      expect(localStorage.getItem('fantasy_user_session')).toBeNull();
      expect(sessionStorage.getItem('fantasy_user_session')).toBeNull();
      expect(localStorage.getItem('fantasy_user')).toBeNull();
      expect(sessionStorage.getItem('fantasy_user')).toBeNull();
    });
  });
});
