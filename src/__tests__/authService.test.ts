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

  it('retrieves session from sessionStorage when present', () => {
    const mockUser = { id: 'u1', name: 'ערן', email: 'eran@test.com' };
    authService.login(mockUser, true);
    
    expect(authService.getSession()).toMatchObject({ id: 'u1', name: 'ערן' });
    expect(sessionStorage.getItem('fantasy_user_session')).toBeTruthy();
  });

  it('sanitizes sensitive fields like password, apiKey, or token during login and getSession', () => {
    const unsafeUser = {
      id: 'u_secret',
      name: 'מנהל סודי',
      email: 'admin@test.com',
      password: 'super_secret_password',
      apiKey: 'AIzaSy12345',
      token: 'jwt_secret_token',
      geminiKey: 'gemini_123'
    };

    authService.login(unsafeUser, true);

    const session = authService.getSession();
    expect(session).toMatchObject({ id: 'u_secret', name: 'מנהל סודי', email: 'admin@test.com' });
    expect(session?.password).toBeUndefined();
    expect(session?.apiKey).toBeUndefined();
    expect(session?.token).toBeUndefined();
    expect(session?.geminiKey).toBeUndefined();

    // Verify storage contents also do not contain password or keys
    const storedStr = sessionStorage.getItem('fantasy_user_session') || '';
    expect(storedStr).not.toContain('super_secret_password');
    expect(storedStr).not.toContain('AIzaSy12345');
  });

  it('migrates legacy session from localStorage to sessionStorage if missing in sessionStorage', () => {
    const mockUser = { id: 'u2', name: 'גיא', email: 'guy@test.com' };
    localStorage.setItem('fantasy_user_session', JSON.stringify(mockUser));
    
    expect(sessionStorage.getItem('fantasy_user_session')).toBeNull();
    const retrieved = authService.getSession();
    expect(retrieved).toMatchObject({ id: 'u2', name: 'גיא' });
    expect(sessionStorage.getItem('fantasy_user_session')).toBeTruthy();
  });

  it('only stores in sessionStorage if rememberMe is false', () => {
    const mockUser = { id: 'u3', name: 'דני', email: 'dani@test.com' };
    authService.login(mockUser, false);

    expect(sessionStorage.getItem('fantasy_user_session')).toBeTruthy();
    expect(localStorage.getItem('fantasy_user_session')).toBeNull();
  });

  it('clears sessions properly on logout', () => {
    const mockUser = { id: 'u4', name: 'ארז', email: 'erez@test.com' };
    authService.login(mockUser);
    authService.logout();
    
    expect(authService.getSession()).toBeNull();
  });

  it('handles storage exception gracefully on login without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const mockUser = { id: 'u5', name: 'אסף', email: 'asaf@test.com' };
    expect(() => authService.login(mockUser)).not.toThrow();
  });

  it('handles storage exception gracefully on logout without throwing', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => authService.logout()).not.toThrow();
  });
});
