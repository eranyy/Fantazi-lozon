import React, { useState } from 'react';
import { Star, Crown } from 'lucide-react';
import { cleanStr, getTeamColors } from '../../utils/teamUtils';
import { Jersey } from '../Jersey';

interface TopPlayersSubTabProps {
  teams: any[];
  topPlayers: any[];
  playersMapByName: Map<string, any>;
}

export const TopPlayersSubTab: React.FC<TopPlayersSubTabProps> = ({
  teams,
  topPlayers,
  playersMapByName,
}) => {
  const [kingsFilter, setKingsFilter] = useState<'points' | 'goals' | 'assists'>('points');

  const effectiveTopPlayers = (() => {
    const playerMap: Record<string, any> = {};

    teams.forEach(user => {
      if (user.id === 'admin' || user.id === 'system') return;
      const teamName = user.teamName || user.id;
      const lineupsByRound = user.lineupsByRound || {};

      Object.keys(lineupsByRound).forEach(rNum => {
        const rData = lineupsByRound[rNum];
        if (rData && Array.isArray(rData.lineup)) {
          const seenInRound = new Set<string>();
          rData.lineup.forEach((p: any) => {
            if (!p || !p.name) return;
            let nameStr = String(p.name).trim();
            let pRealTeam = p.team || p.realTeam || '';

            if (nameStr === 'פרץ') {
              if (pRealTeam.includes('תל אביב') || pRealTeam.includes('ת"א') || user.id === 'pichichi') {
                nameStr = 'דור פרץ'; pRealTeam = 'מכבי ת"א';
              } else if (pRealTeam.includes('באר שבע') || pRealTeam.includes('ב"ש') || user.id === 'holonia') {
                nameStr = 'אליאל פרץ'; pRealTeam = 'הפועל ב"ש';
              } else {
                nameStr = 'דור פרץ'; pRealTeam = 'מכבי ת"א';
              }
            }
            if (nameStr === 'אליאל') {
              nameStr = 'אליאל פרץ'; pRealTeam = 'הפועל ב"ש';
            }

            const key = cleanStr(nameStr);
            if (seenInRound.has(key)) return;
            seenInRound.add(key);

            if (!playerMap[key]) {
              playerMap[key] = {
                name: nameStr,
                team: pRealTeam,
                fantasyTeamName: teamName,
                points: 0,
                goals: 0,
                assists: 0
              };
            } else {
              if (!playerMap[key].team && pRealTeam) playerMap[key].team = pRealTeam;
              if (!playerMap[key].fantasyTeamName && teamName) playerMap[key].fantasyTeamName = teamName;
            }

            playerMap[key].points += Number(p.points || 0);
            playerMap[key].goals += Number(p.goals || p.stats?.goals || 0);
            playerMap[key].assists += Number(p.assists || p.stats?.assists || 0);
          });
        }
      });
    });

    const dynamicList = Object.values(playerMap);
    if (dynamicList.length > 0) return dynamicList;
    return topPlayers;
  })();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 pt-4">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tight drop-shadow-lg flex items-center justify-center gap-3">
          Fantasy Kings <Star className="w-10 h-10 md:w-12 md:h-12 text-yellow-400 fill-current drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        </h2>
        <p className="text-emerald-400 font-black uppercase tracking-[0.2em] md:tracking-widest text-xs md:text-sm mt-3">דירוג השחקנים הלוהטים והמאומתים של העונה (סנכרון בלייב)</p>
      </div>

      {/* 🟢 מסנני מלכים 🟢 */}
      <div className="flex items-center justify-center gap-2 mb-6 max-w-md mx-auto px-2">
        <button
          onClick={() => setKingsFilter('points')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${kingsFilter === 'points' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black border border-yellow-400/50' : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'}`}
        >
          👑 מלך הניקוד
        </button>
        <button
          onClick={() => setKingsFilter('goals')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${kingsFilter === 'goals' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black border border-emerald-400/50' : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'}`}
        >
          ⚽ מלך השערים
        </button>
        <button
          onClick={() => setKingsFilter('assists')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${kingsFilter === 'assists' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black border border-blue-400/50' : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'}`}
        >
          🎯 מלך הבישולים
        </button>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 gap-3 px-2">
        {effectiveTopPlayers.length === 0 ? (
          <div className="text-center bg-slate-900/50 rounded-3xl p-10 border border-slate-800">
            <p className="text-slate-400 font-bold">הנתונים טרם סונכרנו מתחילת המשחקים.</p>
          </div>
        ) : (
          [...effectiveTopPlayers].sort((a, b) => {
            if (kingsFilter === 'goals') return (b.goals || 0) - (a.goals || 0) || (b.points || 0) - (a.points || 0);
            if (kingsFilter === 'assists') return (b.assists || 0) - (a.assists || 0) || (b.points || 0) - (a.points || 0);
            return (b.points || 0) - (a.points || 0) || (b.goals || 0) - (a.goals || 0);
          }).map((player, idx) => {
            const isTop1 = idx === 0;
            const isTop2 = idx === 1;
            const isTop3 = idx === 2;
            
            const matchedPlayer = playersMapByName.get(cleanStr(player.name));
            const displayPosition = matchedPlayer ? matchedPlayer.position : 'N/A';
            const isGK = ['GK', 'שוער'].includes(displayPosition);

            const colors = getTeamColors(player.fantasyTeamName, isGK);

            let bgClass = 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80';
            let rankColor = 'text-slate-500';
            
            if (isTop1) { 
              bgClass = 'bg-gradient-to-r from-yellow-900/60 to-slate-900 border-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.25)]'; 
              rankColor = 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'; 
            }
            else if (isTop2) { 
              bgClass = 'bg-gradient-to-r from-zinc-700/60 to-slate-900 border-zinc-300/60 shadow-[0_0_25px_rgba(212,212,216,0.15)] relative overflow-hidden'; 
              rankColor = 'text-zinc-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]'; 
            }
            else if (isTop3) { 
              bgClass = 'bg-gradient-to-r from-amber-900/40 to-slate-900 border-amber-700/50 shadow-[0_0_15px_rgba(180,83,9,0.1)]'; 
              rankColor = 'text-amber-600 drop-shadow-[0_0_5px_rgba(180,83,9,0.5)]'; 
            }

            return (
              <div key={idx} className={`p-3.5 sm:p-4 md:p-5 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 ${bgClass}`}>
                {isTop2 && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>}
                
                {/* Top/Main Section: Medal, Jersey, Player Name & Team badges */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 relative z-10">
                  <div className="w-7 sm:w-8 md:w-12 text-center shrink-0">
                    <span className={`text-lg sm:text-xl md:text-3xl font-black tabular-nums drop-shadow-md ${rankColor}`}>
                      {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${idx + 1}`}
                    </span>
                  </div>

                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 shrink-0">
                     <Jersey primary={colors.prim} secondary={colors.sec} textColor={colors.text} text={isGK ? '🧤' : (displayPosition && displayPosition !== 'N/A') ? displayPosition : '⚽'} />
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-base sm:text-lg md:text-2xl font-black text-white leading-tight whitespace-nowrap truncate mb-1">{player.name}</h4>
                    
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                       {player.fantasyTeamName && player.fantasyTeamName !== '' ? (
                           <span className="text-[10px] md:text-xs bg-black/40 border border-white/10 px-2 py-0.5 md:py-1 rounded-lg text-slate-300 font-bold flex items-center gap-1 w-fit">
                              <Crown className="w-3 h-3 text-yellow-500 shrink-0" />
                              <span className="truncate">{player.fantasyTeamName}</span>
                           </span>
                       ) : (
                           <span className="text-[10px] md:text-xs bg-black/40 border border-white/10 px-2 py-0.5 md:py-1 rounded-lg text-slate-500 font-bold italic w-fit">
                              שחקן חופשי
                           </span>
                       )}
                       {player.team && player.team !== '' && (
                         <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-800/50 px-2 py-0.5 md:py-1 rounded-lg border border-slate-700 w-fit">
                            {player.team}
                         </span>
                       )}
                       {displayPosition && displayPosition !== 'N/A' && (
                         <span className="text-[10px] md:hidden font-bold text-slate-500 uppercase ml-1">{displayPosition}</span>
                       )}
                    </div>
                  </div>
                </div>

                {/* Stats Badges Section (Goals ⚽, Assists 🎯, Points 🏆) */}
                <div className="shrink-0 flex items-center justify-around sm:justify-end gap-2 md:gap-2.5 relative z-10 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-white/10">
                   {/* ⚽ שערים */}
                   <div className="flex-1 sm:flex-initial flex flex-col items-center justify-center bg-emerald-950/80 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl border border-emerald-500/30 shadow-inner min-w-[65px] md:min-w-[70px]">
                      <span className="text-xs md:text-base font-black text-emerald-400 tabular-nums leading-none">
                         ⚽ {player.goals || 0}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-emerald-300/80 font-bold mt-1">שערים</span>
                   </div>

                   {/* 🎯 בישולים */}
                   <div className="flex-1 sm:flex-initial flex flex-col items-center justify-center bg-blue-950/80 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl border border-blue-500/30 shadow-inner min-w-[65px] md:min-w-[70px]">
                      <span className="text-xs md:text-base font-black text-blue-400 tabular-nums leading-none">
                         🎯 {player.assists || 0}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-blue-300/80 font-bold mt-1">בישולים</span>
                   </div>

                   {/* 🏆 ניקוד */}
                   <div className="flex-1 sm:flex-initial flex flex-col items-center justify-center bg-slate-950 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-slate-800 shadow-inner min-w-[65px] md:min-w-[75px]">
                      <span className={`text-base md:text-2xl font-black tabular-nums leading-none ${isTop1 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : isTop2 ? 'text-zinc-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]'}`}>
                        {player.points}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ניקוד</span>
                   </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
