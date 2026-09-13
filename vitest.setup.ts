import { vi } from 'vitest';

vi.mock('firebase/messaging', async () => {
  const actual = await vi.importActual('firebase/messaging');
  return {
    ...actual,
    getMessaging: vi.fn(() => ({})),
    isSupported: vi.fn().mockResolvedValue(false),
  };
});
