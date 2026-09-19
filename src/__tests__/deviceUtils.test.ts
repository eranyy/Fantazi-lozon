import { describe, it, expect } from 'vitest';
import { getDeviceType } from '../utils/deviceUtils';

describe('deviceUtils - getDeviceType', () => {
  it('identifies Mobile devices correctly', () => {
    const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
    const androidMobileUA = 'Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.119 Mobile Safari/537.36';

    expect(getDeviceType(iphoneUA)).toBe('Mobile');
    expect(getDeviceType(androidMobileUA)).toBe('Mobile');
  });

  it('identifies Tablet devices correctly', () => {
    const ipadUA = 'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    const androidTabletUA = 'Mozilla/5.0 (Linux; Android 9; SM-T510) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36';

    expect(getDeviceType(ipadUA)).toBe('Tablet');
    expect(getDeviceType(androidTabletUA)).toBe('Tablet');
  });

  it('identifies Desktop (PC) devices correctly', () => {
    const macDesktopUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36';
    const windowsDesktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

    expect(getDeviceType(macDesktopUA)).toBe('Desktop (PC)');
    expect(getDeviceType(windowsDesktopUA)).toBe('Desktop (PC)');
  });

  it('defaults to Desktop (PC) for empty or undefined user-agent', () => {
    expect(getDeviceType('')).toBe('Desktop (PC)');
    expect(getDeviceType()).toBe('Desktop (PC)');
  });
});
