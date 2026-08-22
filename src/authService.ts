export const authService = {
  getSession: () => {
    try {
      const local = localStorage.getItem('fantasy_user_session');
      if (local) return JSON.parse(local);
    } catch (e) { /* ignore */ }

    try {
      const session = sessionStorage.getItem('fantasy_user_session');
      if (session) return JSON.parse(session);
    } catch (e) { /* ignore */ }

    return null;
  },
  login: (user: any, _rememberMe: boolean = true) => {
    // Save full user data so mobile rehydrates instantly without password prompt
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      teamName: user.teamName,
      role: user.role,
      teamId: user.teamId || user.id
    };

    try {
      localStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
    } catch (e) {
      /* ignore storage quota/security error */
    }

    try {
      sessionStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
    } catch (e) {
      /* ignore storage quota/security error */
    }

    try {
      localStorage.removeItem('fantasy_user');
      sessionStorage.removeItem('fantasy_user');
    } catch (e) {
      /* ignore storage errors */
    }
  },
  logout: () => {
    try {
      localStorage.removeItem('fantasy_user_session');
      sessionStorage.removeItem('fantasy_user_session');
      localStorage.removeItem('fantasy_user');
      sessionStorage.removeItem('fantasy_user');
    } catch (e) {
      /* ignore storage errors */
    }
  }
};