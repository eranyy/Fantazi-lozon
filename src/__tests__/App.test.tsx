import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(true),
  deleteDoc: vi.fn().mockResolvedValue(true),
  onSnapshot: vi.fn((ref: any, callback: any) => {
    if (typeof callback === 'function') {
      callback({
        exists: () => true,
        data: () => ({ timestamp: Date.now() }),
        empty: false,
        docs: [
          { id: 'hamsili', data: () => ({ id: 'hamsili', teamName: 'חמסילי FC', points: 100, authorName: 'ערן', handle: '@eranyy' }) }
        ]
      });
    }
    return () => {};
  }),
  doc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(true),
  getDocs: vi.fn().mockResolvedValue({ empty: false, docs: [] }),
  addDoc: vi.fn().mockResolvedValue(true),
  serverTimestamp: vi.fn(),
  arrayUnion: vi.fn((val: any) => [val]),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(true)
  }))
}));

// Mock Firebase Messaging
vi.mock('firebase/messaging', () => ({
  getToken: vi.fn().mockResolvedValue('mock-fcm-token'),
  onMessage: vi.fn(() => () => {})
}));

// Mock Firebase Config
vi.mock('../firebaseConfig', () => ({
  db: {},
  messaging: {},
  VAPID_KEY: 'test-vapid-key'
}));

// Mock Auth Service
vi.mock('../authService', () => ({
  authService: {
    getSession: vi.fn(() => ({ id: 'hamsili', name: 'ערן', role: 'ADMIN', email: 'eranyy@gmail.com' })),
    login: vi.fn(),
    logout: vi.fn()
  }
}));

import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders App header and main interface without crashing', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('LUZON 14');
    expect(container.textContent).toContain('חמסילי FC');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('sets app version in localStorage on mount', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(localStorage.getItem('luzon_app_version')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
