import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Clock, Flame, X } from 'lucide-react';

export interface FirstMatchInfo {
  homeTeam: string;
  awayTeam: string;
  date: string;
  day: string;
  time: string;
  kickoffMs: number;
}

/**
 * Parses a match date ("DD/MM/YYYY" or "YYYY-MM-DD") and time ("HH:MM")
 * into an epoch timestamp in Israel time (Asia/Jerusalem).
 */
const getIsraelKickoffMs = (dateStr?: string, timeStr?: string, statusStr?: string): number | null => {
  if (!dateStr || !timeStr) return null;
  const dClean = String(dateStr).trim();
  const tClean = String(timeStr).trim();
  const sClean = String(statusStr || '').trim();

  if (!dClean || dClean.includes('נדחה') || sClean.includes('נדחה') || dClean.includes('טרם') || dClean.includes('ייקבע')) {
    return null;
  }

  const timeMatch = tClean.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);

  let day = 0;
  let month = 0;
  let year = 2026;

  const isoMatch = dClean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else {
    const dmyMatch = dClean.match(/(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?/);
    if (!dmyMatch) return null;
    day = parseInt(dmyMatch[1], 10);
    month = parseInt(dmyMatch[2], 10);
    if (dmyMatch[3]) {
      year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
    }
  }

  if (day <= 0 || month <= 0 || month > 12) return null;

  // Represent the target Israel wall-clock time as UTC components for direct comparison against current Israel wall-clock time
  return Date.UTC(year, month - 1, day, hours, minutes, 0);
};

const getNowIsraelUtcEquivalentMs = (): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const y = parseInt(parts.find(p => p.type === 'year')?.value || '2026', 10);
  const m = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
  const d = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
  let hr = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  if (hr === 24) hr = 0;
  const min = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const sec = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);

  return Date.UTC(y, m - 1, d, hr, min, sec);
};

export const useRoundCountdown = (currentRound: number) => {
  const [realFixtures, setRealFixtures] = useState<any[]>([]);
  const [nowMs, setNowMs] = useState<number>(() => getNowIsraelUtcEquivalentMs());

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'leagueData', 'real_fixtures'), (snap) => {
      if (snap.exists() && Array.isArray(snap.data().matches)) {
        setRealFixtures(snap.data().matches);
      }
    });
    return () => unsub();
  }, []);

  const firstMatch = useMemo<FirstMatchInfo | null>(() => {
    if (!realFixtures.length || !currentRound) return null;
    const roundMatches = realFixtures.filter(m => Number(m.round) === Number(currentRound));
    if (!roundMatches.length) return null;

    // If any match in the round is already marked as finished/played with a score, the round has already started
    const anyAlreadyPlayed = roundMatches.some(
      m => m.isPlayed || m.status === 'הסתיים' || (m.homeScore !== null && m.homeScore !== undefined && m.homeScore !== '')
    );
    if (anyAlreadyPlayed) return null;

    let earliest: FirstMatchInfo | null = null;
    for (const m of roundMatches) {
      const kickoffMs = getIsraelKickoffMs(m.date, m.time || m.matchTime, m.status);
      if (kickoffMs !== null) {
        if (!earliest || kickoffMs < earliest.kickoffMs) {
          earliest = {
            homeTeam: m.homeTeam || m.h || '',
            awayTeam: m.awayTeam || m.a || '',
            date: m.date || '',
            day: m.day || '',
            time: m.time || m.matchTime || '',
            kickoffMs
          };
        }
      }
    }
    return earliest;
  }, [realFixtures, currentRound]);

  const diffMs = firstMatch ? firstMatch.kickoffMs - nowMs : -1;
  const isBeforeKickoff = Boolean(firstMatch && diffMs > 0);

  useEffect(() => {
    if (!firstMatch) return;
    const interval = setInterval(() => {
      setNowMs(getNowIsraelUtcEquivalentMs());
    }, 1000);
    return () => clearInterval(interval);
  }, [firstMatch]);

  if (!isBeforeKickoff || !firstMatch) {
    return {
      isBeforeKickoff: false,
      firstMatch: null,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUrgent: false
    };
  }

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isUrgent = totalSeconds <= 7200; // Less than 2 hours to kickoff

  return {
    isBeforeKickoff: true,
    firstMatch,
    days,
    hours,
    minutes,
    seconds,
    isUrgent
  };
};

export const HeaderRoundBadge: React.FC<{ currentRound: number }> = ({ currentRound }) => {
  const { isBeforeKickoff, days, hours, minutes, seconds, isUrgent } = useRoundCountdown(currentRound);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (!isBeforeKickoff) {
    return (
      <span className="text-[10px] font-black bg-green-500/10 border border-green-500/30 text-green-400 px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-inner">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></span>
        <span>מחזור {currentRound}</span>
      </span>
    );
  }

  return (
    <span
      title={`ספירה לאחור לפתיחת המשחק הראשון של מחזור ${currentRound}`}
      className={`text-[10px] font-black px-2 sm:px-3 py-1 rounded-full tracking-tight flex items-center gap-1.5 shadow-inner transition-colors border ${
        isUrgent
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
          : 'bg-green-500/10 border-green-500/30 text-green-400'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isUrgent ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`}></span>
      <span className="shrink-0">מחזור {currentRound}</span>
      <span className="opacity-40">•</span>
      <span className="font-mono font-black text-[9.5px] sm:text-[10.5px] text-white tabular-nums flex items-center gap-0.5" dir="ltr">
        ⏳ {days > 0 ? `${days}d ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </span>
  );
};

export const RoundCountdownBanner: React.FC<{ currentRound: number }> = ({ currentRound }) => {
  const { isBeforeKickoff, firstMatch, days, hours, minutes, seconds, isUrgent } = useRoundCountdown(currentRound);
  const [dismissedRound, setDismissedRound] = useState<number | null>(null);

  if (!isBeforeKickoff || !firstMatch || dismissedRound === currentRound) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      data-html2canvas-ignore="true"
      className={`relative overflow-hidden rounded-2xl border px-3.5 py-2.5 sm:px-5 sm:py-3 mb-4 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
        isUrgent
          ? 'bg-gradient-to-r from-amber-950/80 via-slate-900/95 to-red-950/80 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
          : 'bg-gradient-to-r from-slate-900/90 via-emerald-950/40 to-slate-900/90 border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
      }`}
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isUrgent
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              {isUrgent ? <Flame className="w-4 h-4 animate-bounce" /> : <Clock className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white">
                  שריקת הפתיחה למחזור {currentRound}
                </span>
                {isUrgent && (
                  <span className="text-[9px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded uppercase">
                    נסגר בקרוב!
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 truncate">
                משחק פותח: <span className="text-slate-200 font-black">{firstMatch.homeTeam} - {firstMatch.awayTeam}</span> ({firstMatch.day ? `${firstMatch.day}, ` : ''}{firstMatch.time})
              </div>
            </div>
          </div>

          <button
            onClick={() => setDismissedRound(currentRound)}
            className="sm:hidden p-1 text-slate-500 hover:text-slate-300 rounded-lg transition-colors shrink-0"
            title="הסתר באנר"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 self-center sm:self-auto">
          <div className="flex items-center gap-1.5" dir="ltr">
            {days > 0 && (
              <>
                <div className="flex flex-col items-center bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 min-w-[42px]">
                  <span className="font-mono text-sm sm:text-base font-black text-white tabular-nums leading-none">{pad(days)}</span>
                  <span className="text-[8px] font-bold text-slate-400 mt-0.5">ימים</span>
                </div>
                <span className="text-slate-600 font-black text-xs">:</span>
              </>
            )}
            <div className="flex flex-col items-center bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 min-w-[42px]">
              <span className="font-mono text-sm sm:text-base font-black text-white tabular-nums leading-none">{pad(hours)}</span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5">שעות</span>
            </div>
            <span className="text-slate-600 font-black text-xs">:</span>
            <div className="flex flex-col items-center bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 min-w-[42px]">
              <span className="font-mono text-sm sm:text-base font-black text-white tabular-nums leading-none">{pad(minutes)}</span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5">דק'</span>
            </div>
            <span className="text-slate-600 font-black text-xs">:</span>
            <div className="flex flex-col items-center bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 min-w-[42px]">
              <span className={`font-mono text-sm sm:text-base font-black tabular-nums leading-none ${isUrgent ? 'text-amber-400' : 'text-emerald-400'}`}>{pad(seconds)}</span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5">שנ'</span>
            </div>
          </div>

          <button
            onClick={() => setDismissedRound(currentRound)}
            className="hidden sm:flex p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors shrink-0 mr-1"
            title="הסתר באנר"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
