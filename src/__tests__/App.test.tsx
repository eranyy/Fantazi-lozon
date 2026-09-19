import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import App from '../App';
import { authService } from '../authService';
import { UserRole } from '../types';

// Mock dependencies
vi.mock('../firebaseConfig', () => ({
  db: {},
  messaging: {},
  VAPID_KEY: 'test-vapid-key'
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn((_ref, callback) => {
    // Call callback immediately with empty docs for teams and settings
    callback({
      docs: [],
      exists: () => false,
      data: () => ({})
    });
    return vi.fn(); // unsubscribe
  }),
  setDoc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true })),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  arrayUnion: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve())
  }))
}));

vi.mock('firebase/messaging', () => ({
  getToken: vi.fn(),
  onMessage: vi.fn(() => vi.fn()) // returns unsubscribe function
}));

vi.mock('../authService', () => ({
  authService: {
    getSession: vi.fn(),
    logout: vi.fn()
  }
}));

// Mock child components to avoid rendering their complex logic
vi.mock('../components/LoginScreen', () => ({
  default: ({ onLogin }: any) => (
    <div data-testid="login-screen">
      <button onClick={() => onLogin({ id: '1', name: 'Test User', role: 'USER' })}>
        Simulate Login
      </button>
    </div>
  )
}));
vi.mock('../components/SocialFeed', () => ({ default: () => <div data-testid="social-feed" /> }));
vi.mock('../components/LiveArena', () => ({ default: () => <div data-testid="live-arena" /> }));
vi.mock('../components/LineupManager', () => ({ default: () => <div data-testid="lineup-manager" /> }));
vi.mock('../components/FixturesTab', () => ({ default: () => <div data-testid="fixtures-tab" /> }));
vi.mock('../AdminLeagueManager', () => ({ default: () => <div data-testid="admin-league-manager" /> }));
vi.mock('../AdminSettings', () => ({ default: () => <div data-testid="admin-settings" /> }));
vi.mock('../components/CupTab', () => ({ default: () => <div data-testid="cup-tab" /> }));
vi.mock('../components/FreeAgentsTab', () => ({ default: () => <div data-testid="free-agents-tab" /> }));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub window.confirm to always return true for testing logout
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('renders loading state initially', async () => {
    vi.mocked(authService.getSession).mockReturnValue(null);
    render(<App />);
    expect(screen.getByText(/LUZON 14/)).toBeInTheDocument();

    // wait for state update inside useEffect to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  });

  it('renders LoginScreen when not logged in', async () => {
    vi.mocked(authService.getSession).mockReturnValue(null);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    });
  });

  it('renders main layout and default tab when logged in', async () => {
    vi.mocked(authService.getSession).mockReturnValue({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER
    });

    render(<App />);

    await waitFor(() => {
      // SocialFeed is the default 'home' tab
      expect(screen.getByTestId('social-feed')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('navigates to different tabs', async () => {
    vi.mocked(authService.getSession).mockReturnValue({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER
    });

    render(<App />);

    // Wait for the home tab to render first
    await waitFor(() => {
      expect(screen.getByTestId('social-feed')).toBeInTheDocument();
    });

    // Click on 'הרכב' (Lineup) tab
    fireEvent.click(screen.getByText('הרכב'));
    await waitFor(() => {
      expect(screen.getByTestId('lineup-manager')).toBeInTheDocument();
      expect(screen.queryByTestId('social-feed')).not.toBeInTheDocument();
    });

    // Click on 'זירה' (Live Arena) tab
    fireEvent.click(screen.getByText('זירה'));
    await waitFor(() => {
      expect(screen.getByTestId('live-arena')).toBeInTheDocument();
      expect(screen.queryByTestId('lineup-manager')).not.toBeInTheDocument();
    });
  });

  it('logs out successfully when confirmed', async () => {
    vi.mocked(authService.getSession).mockReturnValue({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('התנתק')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('התנתק'));

    expect(window.confirm).toHaveBeenCalledWith('להתנתק מהמערכת?');
    expect(authService.logout).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    });
  });
});
