export const authService = {
  getSession: () => {
    try {
      const local = localStorage.getItem('fantasy_user_session');
      if (local) return JSON.parse(local);
    } catch (e) {
      /* ignore storage error */
    }

    try {
      const session = sessionStorage.getItem('fantasy_user_session');
      if (session) return JSON.parse(session);
    } catch (e) {
      /* ignore storage error */
    }

    return null;
  },
  login: (user: any, _rememberMe: boolean = true) => {
    // Save only non-sensitive identifiers so mobile rehydrates safely
    const sessionData = {
      id: user.id,
      email: user.email
    };

    if (_rememberMe) {
      try {
        localStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
      } catch (e) {
        /* ignore storage quota/security error */
      }
    } else {
      try {
        sessionStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
      } catch (e) {
        /* ignore storage quota/security error */
      }
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
