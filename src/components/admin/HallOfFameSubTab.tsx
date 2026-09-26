import React from 'react';
import { Crown, Trophy, Medal } from 'lucide-react';

interface HallOfFameSubTabProps {
  sortedAllTimeStats: any[];
}

export const HallOfFameSubTab: React.FC<HallOfFameSubTabProps> = ({ sortedAllTimeStats }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="text-center space-y-3 pt-6">
        <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 italic tracking-tighter drop-shadow-xl filter drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">HALL OF FAME</h2>
        <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-xs md:text-sm">מורשת אליפויות לוזון</p>
      </div>
      <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[40px] border border-yellow-500/20 p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <h3 className="text-xl md:text-2xl font-black text-white mb-10 text-center relative z-10 flex items-center justify-center gap-3"><Crown className="w-6 h-6 text-yellow-500" /> טבלת המעוטרות بكل הזמנים</h3>
        <div className="flex flex-wrap justify-center items-end gap-4 md:gap-8 relative z-10">
          {sortedAllTimeStats.map((team, idx) => {
            let borderClass = 'border-white/5'; let bgClass = 'bg-zinc-950/80'; let badge = null; let scaleClass = 'scale-100'; let nameClass = 'text-white';
            if (idx === 0) { borderClass = 'border-yellow-400 shadow-[0_10px_40px_rgba(250,204,21,0.2)]'; bgClass = 'bg-gradient-to-b from-yellow-900/40 to-black'; badge = '🥇'; scaleClass = 'scale-110 z-20 md:mx-6 mb-4'; nameClass = 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600'; } 
            else if (idx === 1) { borderClass = 'border-slate-400 shadow-[0_10px_30px_rgba(148,163,184,0.1)]'; bgClass = 'bg-gradient-to-b from-slate-800/50 to-black'; badge = '🥈'; scaleClass = 'scale-105 z-10 md:mx-2 mb-2'; nameClass = 'text-slate-200'; } 
            else if (idx === 2) { borderClass = 'border-amber-700 shadow-[0_10px_30px_rgba(180,83,9,0.1)]'; bgClass = 'bg-gradient-to-b from-amber-950/40 to-black'; badge = '🥉'; scaleClass = 'scale-105 z-10 md:mx-2 mb-2'; nameClass = 'text-amber-500'; }
            return (
              <div key={idx} className={`${bgClass} border-2 ${borderClass} ${scaleClass} px-6 py-6 rounded-[32px] flex flex-col items-center min-w-[140px] md:min-w-[160px] transition-transform relative group hover:-translate-y-2 duration-300`}>
                {badge && <div className="absolute -top-6 text-4xl drop-shadow-2xl group-hover:scale-110 transition-transform">{badge}</div>}
                <span className={`font-black text-xl md:text-2xl mb-4 mt-2 ${nameClass}`}>{team.name}</span>
                <div className="flex gap-4 w-full justify-center mt-2">
                  <div className="flex flex-col items-center bg-black/40 px-3 py-2 rounded-xl border border-white/5 w-16" title="אליפויות">
                     <span className="text-yellow-500 text-xl mb-1 drop-shadow-md"><Trophy className="w-5 h-5 fill-current"/></span>
                     <span className="text-white font-black text-lg">{team.titles}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/40 px-3 py-2 rounded-xl border border-white/5 w-16" title="גביעים">
                     <span className="text-slate-400 text-xl mb-1 drop-shadow-md"><Medal className="w-5 h-5"/></span>
                     <span className="text-white font-black text-lg">{team.cups}</span>
                  </div>
                  {team.doubles > 0 && (
                      <div className="flex flex-col items-center bg-purple-900/40 px-3 py-2 rounded-xl border border-purple-500/30 w-16" title="דאבלים">
                         <span className="text-purple-400 text-xl mb-1 drop-shadow-md">🌟</span>
                         <span className="text-white font-black text-lg">{team.doubles}</span>
                      </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
