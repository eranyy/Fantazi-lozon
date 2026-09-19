import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDeviceType } from '../utils/deviceUtils';

describe('getDeviceType', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUserAgent = (userAgentString: string) => {
    vi.stubGlobal('navigator', {
      ...global.navigator,
      userAgent: userAgentString,
    });
  };

  it.each([
    // Tablet scenarios
    ['Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1', 'Tablet'],
    ['Mozilla/5.0 (Tablet; rv:26.0) Gecko/26.0 Firefox/26.0', 'Tablet'],
    ['Mozilla/5.0 (Linux; Android 10; SM-T860) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36', 'Tablet'], // Android without 'mobi'

    // Mobile scenarios
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 'Mobile'],
    ['Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36', 'Mobile'], // Android with 'Mobile'
    ['Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 'Mobile'],

    // Desktop (PC) scenarios
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 'Desktop (PC)'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15', 'Desktop (PC)'],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0', 'Desktop (PC)'],
    ['', 'Desktop (PC)'], // Empty user agent
  ])('should return %s for user agent: %s', (userAgent, expectedDeviceType) => {
    mockUserAgent(userAgent);
    expect(getDeviceType()).toBe(expectedDeviceType);
  });
});
