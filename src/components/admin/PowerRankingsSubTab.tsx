import React from 'react';
import { TrendingUp, Info } from 'lucide-react';

interface PowerRankingsSubTabProps {
  powerRankedTeams: any[];
  getPowerBarColor: (score: number) => string;
}

export const PowerRankingsSubTab: React.FC<PowerRankingsSubTabProps> = ({
  powerRankedTeams,
  getPowerBarColor,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 pt-4">
      <div className="text-center mb-6">
        <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tight drop-shadow-lg flex items-center justify-center gap-3">
          Power Ranking <TrendingUp className="w-10 h-10 text-purple-500" />
        </h2>
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-3">האלגוריתם שקובע מי המנג'ר החם של הרגע</p>
      </div>

      <div className="bg-slate-900/60 p-4 md:p-5 rounded-3xl border border-purple-500/20 mb-10 max-w-3xl mx-auto shadow-inner text-right backdrop-blur-sm">
         <h4 className="text-purple-400 font-black text-sm mb-3 flex items-center gap-2">
           <Info className="w-4 h-4" /> איך מחושב הציון? (הנוסחה המדעית)
         </h4>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] md:text-xs">
           <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
             <span className="text-yellow-400 font-black text-sm block mb-1">45%</span>
             <span className="text-slate-300 font-bold leading-tight block">אחוזי הצלחה (נקודות ביחס למקסימום)</span>
           </div>
           <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
             <span className="text-green-400 font-black text-sm block mb-1">25%</span>
             <span className="text-slate-300 font-bold leading-tight block">מומנטום (כושר ב-5 המשחקים האחרונים)</span>
           </div>
           <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
             <span className="text-blue-400 font-black text-sm block mb-1">20%</span>
             <span className="text-slate-300 font-bold leading-tight block">פער שערים כולל (זכות פחות חובה)</span>
           </div>
           <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
             <span className="text-red-400 font-black text-sm block mb-1">10%</span>
             <span className="text-slate-300 font-bold leading-tight block">כוח אש התקפי (ממוצע שערי זכות)</span>
           </div>
         </div>
      </div>
      
      <div className="flex flex-col gap-4 max-w-3xl mx-auto px-2">
         {powerRankedTeams.map((t, idx) => {
           const isTop = idx === 0;
           const barColor = getPowerBarColor(t.powerScore);
           
           return (
             <div key={t.id} className={`p-4 md:p-5 rounded-3xl border relative overflow-hidden flex items-center gap-4 md:gap-6 ${isTop ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'bg-zinc-900/80 border-white/5 hover:border-white/10'}`}>
                
                <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-[0.02] -rotate-45 transform translate-x-4 -translate-y-4"></div>

                <div className="flex flex-col items-center justify-center w-6 shrink-0">
                   <span className={`text-xs font-black uppercase tracking-widest ${isTop ? 'text-purple-400' : 'text-zinc-600'}`}>Rank</span>
                   <span className={`text-2xl md:text-3xl font-black ${isTop ? 'text-white' : 'text-zinc-500'}`}>#{idx + 1}</span>
                </div>

                <div className={`w-14 h-14 md:w-16 md:h-16 shrink-0 flex flex-col items-center justify-center rounded-2xl border-2 shadow-inner ${isTop ? 'bg-purple-500/20 border-purple-400 text-purple-400' : 'bg-zinc-950 border-zinc-700 text-white'}`}>
                    <span className="text-[10px] md:text-xs font-bold -mb-1 opacity-70">OVR</span>
                    <span className="text-xl md:text-3xl font-black tabular-nums leading-tight">{t.powerScore}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <h4 className="text-lg md:text-xl font-black text-white truncate">{t.teamName}</h4>
                       {isTop && <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-md font-black animate-pulse">🔥 HOT</span>}
                    </div>
                    <div className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-widest mb-3 truncate">{t.manager}</div>
                    
                    <div className="w-full h-1.5 md:h-2 bg-zinc-950 rounded-full overflow-hidden flex shadow-inner">
                        <div style={{width: `${t.powerScore}%`}} className={`h-full bg-gradient-to-l ${barColor}`}></div>
                    </div>
                </div>

                <div className="hidden sm:flex flex-col gap-2 shrink-0 text-left pl-2 border-l border-zinc-800">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-right mb-0.5">כושר נוכחי (5 אחרונים)</div>
                    <div className="flex gap-1 justify-end">
                        {t.formStr.length === 0 ? <span className="text-xs text-zinc-600 font-bold">אין נתונים</span> : 
                         t.formStr.map((char: string, i: number) => (
                            <span key={i} className={`w-5 h-5 rounded-[4px] flex items-center justify-center text-[10px] font-black shadow-sm ${char==='W'?'bg-green-500/20 text-green-400 border border-green-500/30':char==='L'?'bg-red-500/20 text-red-400 border border-red-500/30':'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'}`}>
                                {char}
                            </span>
                        ))}
                    </div>
                </div>

             </div>
           );
         })}
      </div>
    </div>
  );
};
