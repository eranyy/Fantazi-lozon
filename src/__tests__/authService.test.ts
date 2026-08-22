import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../authService';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('returns null when no session exists', () => {
    expect(authService.getSession()).toBeNull();
  });

  it('retrieves session from localStorage', () => {
    const mockUser = { id: 'u1', name: 'ערן', email: 'eran@test.com' };
    authService.login(mockUser);
    
    expect(authService.getSession()).toMatchObject({ id: 'u1', name: 'ערן' });
  });

  it('falls back to sessionStorage if localStorage is empty', () => {
    const mockUser = { id: 'u2', name: 'גיא', email: 'guy@test.com' };
    sessionStorage.setItem('fantasy_user_session', JSON.stringify(mockUser));
    
    expect(authService.getSession()).toMatchObject({ id: 'u2', name: 'גיא' });
  });

  it('clears sessions properly on logout', () => {
    const mockUser = { id: 'u3', name: 'ארז', email: 'erez@test.com' };
    authService.login(mockUser);
    authService.logout();
    
    expect(authService.getSession()).toBeNull();
  });
});
