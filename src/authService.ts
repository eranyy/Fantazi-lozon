export const authService = {
  getSession: () => {
    // קודם בודק אם יש "זכור אותי" (localStorage)
    const local = localStorage.getItem('fantasy_user_session');
    if (local) return JSON.parse(local);
    
    // אם אין, בודק אם יש סשן זמני
    const session = sessionStorage.getItem('fantasy_user_session');
    if (session) return JSON.parse(session);
    
    return null;
  },
  login: (user: any, rememberMe: boolean) => {
    // We only store the ID and Email securely, to avoid XSS storing the full user object including role
    const sessionData = { id: user.id, email: user.email };

    if (rememberMe) {
      localStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
      sessionStorage.removeItem('fantasy_user_session');
    } else {
      sessionStorage.setItem('fantasy_user_session', JSON.stringify(sessionData));
      localStorage.removeItem('fantasy_user_session');
    }

    // Clean up old insecure session data if present
    localStorage.removeItem('fantasy_user');
    sessionStorage.removeItem('fantasy_user');
  },
  logout: () => {
    localStorage.removeItem('fantasy_user_session');
    sessionStorage.removeItem('fantasy_user_session');

    // Clean up old insecure session data if present
    localStorage.removeItem('fantasy_user');
    sessionStorage.removeItem('fantasy_user');
  }
};