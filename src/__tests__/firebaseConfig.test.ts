import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeApp } from 'firebase/app';

// Mock the firebase/app module
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

// Mock the other firebase modules to prevent actual initialization
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
}));
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
}));

describe('firebaseConfig', () => {
  beforeEach(() => {
    vi.resetModules();

    // Stub environment variables for the test
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-auth-domain');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-storage-bucket');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'test-messaging-sender-id');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id');
    vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'test-measurement-id');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('should initialize Firebase with environment variables', async () => {
    // Dynamically import the config file so it uses the stubbed env vars
    await import('../firebaseConfig');

    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project-id',
      storageBucket: 'test-storage-bucket',
      messagingSenderId: 'test-messaging-sender-id',
      appId: 'test-app-id',
      measurementId: 'test-measurement-id',
    });
  });
});
