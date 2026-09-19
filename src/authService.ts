const sanitizeUser = (user: any) => {
  if (!user || typeof user !== 'object') return null;
  const { password, apiKey, pass, secret, token, geminiKey, ...safeUser } = user;
  return safeUser;
};

export const authService = {
  getSession: () => {
    try {
      const session = sessionStorage.getItem('fantasy_user_session');
      if (session) {
        const parsed = JSON.parse(session);
        return sanitizeUser(parsed);
      }
    } catch (e) {
      /* ignore storage error */
    }

    try {
      const local = localStorage.getItem('fantasy_user_session');
      if (local) {
        const parsed = JSON.parse(local);
        const safe = sanitizeUser(parsed);
        try {
          if (safe) {
            sessionStorage.setItem('fantasy_user_session', JSON.stringify(safe));
          }
        } catch (e) {
          /* ignore storage error */
        }
        return safe;
      }
    } catch (e) {
      /* ignore storage error */
    }

    return null;
  },
  login: (user: any, rememberMe: boolean = true) => {
    if (!user) return;
    // Save non-sensitive user data so mobile rehydrates instantly without password prompt
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      teamName: user.teamName,
      role: user.role,
      teamId: user.teamId || user.id
    };

    const sanitized = sanitizeUser(sessionData);

    try {
      sessionStorage.setItem('fantasy_user_session', JSON.stringify(sanitized));
    } catch (e) {
      /* ignore storage quota/security error */
    }

    if (rememberMe) {
      try {
        localStorage.setItem('fantasy_user_session', JSON.stringify(sanitized));
      } catch (e) {
        /* ignore storage quota/security error */
      }
    } else {
      try {
        localStorage.removeItem('fantasy_user_session');
      } catch (e) {
        /* ignore storage errors */
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