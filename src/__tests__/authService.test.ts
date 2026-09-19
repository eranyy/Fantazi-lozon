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
    authService.login(mockUser);
    
    expect(authService.getSession()).toMatchObject({ id: 'u1', email: 'eran@test.com' });
  });

  it('falls back to sessionStorage if localStorage is empty', () => {
    const mockUser = { id: 'u2', name: 'גיא', email: 'guy@test.com' };
    // The previous test manually set the session storage
    sessionStorage.setItem('fantasy_user_session', JSON.stringify({ id: 'u2', email: 'guy@test.com' }));
    
    expect(authService.getSession()).toMatchObject({ id: 'u2', email: 'guy@test.com' });
  });

  it('stores in sessionStorage if rememberMe is false', () => {
    const mockUser = { id: 'u5', name: 'יוסי', email: 'yossi@test.com' };
    authService.login(mockUser, false);

    expect(localStorage.getItem('fantasy_user_session')).toBeNull();
    expect(sessionStorage.getItem('fantasy_user_session')).toBeTruthy();
    expect(authService.getSession()).toMatchObject({ id: 'u5', email: 'yossi@test.com' });
  });

  it('clears sessions properly on logout', () => {
    const mockUser = { id: 'u3', name: 'ארז', email: 'erez@test.com' };
    authService.login(mockUser);
    authService.logout();
    
    expect(authService.getSession()).toBeNull();
  });

  it('handles storage exception gracefully on login without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const mockUser = { id: 'u4', name: 'אסף', email: 'asaf@test.com' };
    expect(() => authService.login(mockUser)).not.toThrow();
  });

  it('handles storage exception gracefully on logout without throwing', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => authService.logout()).not.toThrow();
  });
});
