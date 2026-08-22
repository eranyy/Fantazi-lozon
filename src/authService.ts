export const authService = {
  getSession: () => {
    try {
      const local = localStorage.getItem('fantasy_user_session');
      if (local) return JSON.parse(local);
    } catch (e) {
      // Ignore JSON parse errors and proceed
    }

    try {
      const session = sessionStorage.getItem('fantasy_user_session');
      if (session) return JSON.parse(session);
    } catch (e) {
      // Ignore JSON parse errors and proceed
    }

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

    // Always store permanently in localStorage for PWA and Mobile browsers
    localStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
    sessionStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));

    // Clean up old legacy keys
    localStorage.removeItem('fantasy_user');
    sessionStorage.removeItem('fantasy_user');
  },
  logout: () => {
    localStorage.removeItem('fantasy_user_session');
    sessionStorage.removeItem('fantasy_user_session');
    localStorage.removeItem('fantasy_user');
    sessionStorage.removeItem('fantasy_user');
  }
};