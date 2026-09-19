/**
 * Utility to identify device type (Mobile, Tablet, Desktop) based on User-Agent string.
 */
export const getDeviceType = (ua?: string): string => {
  const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) return 'Tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) return 'Mobile';
  return 'Desktop (PC)';
};
