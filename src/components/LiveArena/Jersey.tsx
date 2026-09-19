import React from 'react';

export const Jersey = ({ primary, secondary, textColor, text }: { primary: string, secondary: string, textColor: string, text: string }) => {
  const gradId = `grad-arena-${primary.replace('#', '')}-${secondary.replace('#', '')}`;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_8px_rgba(0,0,0,0.7)]">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
      </defs>
      <path d="M 35 10 C 35 25, 65 25, 65 10 L 90 20 L 95 45 L 75 50 L 75 95 C 75 98, 25 98, 25 95 L 25 50 L 5 45 L 10 20 Z" fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
      <text x="50" y="62" fontSize="26" fontFamily="system-ui, sans-serif" fontWeight="900" fill={textColor} textAnchor="middle" dominantBaseline="middle" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.5)' }}>{text}</text>
    </svg>
  );
};
