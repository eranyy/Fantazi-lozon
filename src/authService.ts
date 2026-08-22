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

    // Always store permanently in localStorage for PWA and Mobile browsers
    try {
      localStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
    } catch (e) { /* ignore */ }

    try {
      sessionStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
    } catch (e) { /* ignore */ }

    // Clean up old legacy keys
    try {
      localStorage.removeItem('fantasy_user');
    } catch (e) { /* ignore */ }

    try {
      sessionStorage.removeItem('fantasy_user');
    } catch (e) { /* ignore */ }
  },
  logout: () => {
    try {
      localStorage.removeItem('fantasy_user_session');
    } catch (e) { /* ignore */ }

    try {
      sessionStorage.removeItem('fantasy_user_session');
    } catch (e) { /* ignore */ }

    try {
      localStorage.removeItem('fantasy_user');
    } catch (e) { /* ignore */ }

    try {
      sessionStorage.removeItem('fantasy_user');
    } catch (e) { /* ignore */ }
  }
};