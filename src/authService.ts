export const authService = {
  getSession: () => {
    try {
      const local = localStorage.getItem('fantasy_user_session');
      if (local) return JSON.parse(local);
    } catch (e) {
      /* ignore */
    }

    try {
      const session = sessionStorage.getItem('fantasy_user_session');
      if (session) return JSON.parse(session);
    } catch (e) {
      /* ignore */
    }

    return null;
  },
  login: (user: any, rememberMe: boolean = true) => {
    // We only store the ID and Email securely, to avoid XSS storing the full user object including role
    const sessionData = { id: user.id, email: user.email };

    try {
      if (rememberMe) {
        localStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
        sessionStorage.removeItem('fantasy_user_session');
      } else {
        sessionStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
        localStorage.removeItem('fantasy_user_session');
      }
    } catch (e) {
      /* ignore */
    }

    try {
      localStorage.removeItem('fantasy_user');
      sessionStorage.removeItem('fantasy_user');
    } catch (e) {
      /* ignore */
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