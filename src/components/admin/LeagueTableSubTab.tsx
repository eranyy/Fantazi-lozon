import React from 'react';
import { Crown, Image as ImageIcon } from 'lucide-react';

interface LeagueTableSubTabProps {
  sortedTable: any[];
  minGa: number;
  powerRankedTeams: any[];
  shareTableAsImage: () => void;
  setSelectedTeamProfile: (profile: any) => void;
}

export const LeagueTableSubTab: React.FC<LeagueTableSubTabProps> = ({
  sortedTable,
  minGa,
  powerRankedTeams,
  shareTableAsImage,
  setSelectedTeamProfile,
}) => {
  return (
    <div className="space-y-4">
      <div id="league-table-capture" className="bg-zinc-900/60 backdrop-blur-2xl rounded-[32px] md:rounded-[40px] border border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2 relative">
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-transparent p-6 md:p-8 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <div>
             <h3 className="text-3xl font-black text-white italic flex items-center gap-3">League Table<Crown className="w-6 h-6 text-yellow-500 hidden sm:block" /></h3>
             <p className="text-zinc-400 text-sm font-bold mt-1">הטבלה הרשמית והמעודכנת של לוזון 13</p>
           </div>
           <div className="flex items-center gap-3 w-full sm:w-auto" data-html2canvas-ignore="true">
             <button onClick={shareTableAsImage} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/50 px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 font-black text-sm"><ImageIcon className="w-4 h-4" /><span>שתף תמונה</span></button>
           </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead className="bg-black/40 text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap border-b border-zinc-800">
              <tr>
                <th className="p-3 md:p-5 w-10 text-center">#</th>
                <th className="p-3 md:p-5 text-right min-w-[120px]">מועדון</th>
                <th className="p-3 md:p-5 text-center">מש'</th>
                <th className="p-3 md:p-5 text-center bg-blue-500/10 text-blue-400 w-16 md:w-20 rounded-t-xl" title="נקודות">Pts</th>
                <th className="p-3 md:p-5 text-center" title="הפרש שערים">GD</th>
                <th className="p-3 md:p-5 text-center text-green-500/70">נ'</th>
                <th className="p-3 md:p-5 text-center text-yellow-500/70">ת'</th>
                <th className="p-3 md:p-5 text-center text-red-500/70">ה'</th>
                <th className="p-3 md:p-5 text-center hidden md:table-cell" title="שערי זכות">זכות</th>
                <th className="p-3 md:p-5 text-center hidden md:table-cell" title="שערי חובה">חובה</th>
                <th className="p-3 md:p-5 text-center table-cell" data-html2canvas-ignore="true" title="5 משחקים אחרונים">מומנטום</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm md:text-base">
              {sortedTable.map((t, i) => {
                const gd = (t.gf || 0) - (t.ga || 0); const isTop1 = i === 0; const isTop2 = i === 1; const isTop3 = i === 2; const isRelegation = i >= sortedTable.length - 2; 
                
                const rf = (t.recentForm && t.recentForm.length > 0) ? t.recentForm : (t.form || []);
                const isFire = rf.length >= 3 && rf.slice(-3).every((r: string) => r === 'W');
                const isClown = rf.length >= 3 && rf.slice(-3).every((r: string) => r === 'L');
                const isWall = minGa !== -1 && (t.ga || 0) === minGa && (t.played || 0) > 0;

                const pTeam = powerRankedTeams.find(pt => pt.id === t.id);
                const powerScore = pTeam ? pTeam.powerScore : 50;

                let rowClass = 'hover:bg-zinc-800/80 transition-colors group cursor-pointer'; 
                let rankClass = 'text-zinc-500';
                
                if (isTop1) { 
                  rowClass += ' bg-yellow-500/5 hover:bg-yellow-500/15'; 
                  rankClass = 'text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]'; 
                }
                else if (isTop2) { 
                  rowClass += ' bg-zinc-400/5 hover:bg-zinc-400/15'; 
                  rankClass = 'text-zinc-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]'; 
                }
                else if (isTop3) { 
                  rowClass += ' bg-amber-600/5 hover:bg-amber-600/15'; 
                  rankClass = 'text-amber-500 drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]'; 
                }
                else if (isRelegation) { rowClass += ' bg-red-950/20 hover:bg-red-950/40'; rankClass = 'text-red-500/50'; }
                
                return (
                  <tr key={t.id} className={rowClass} onClick={() => setSelectedTeamProfile({ ...t, powerScore, recentForm: pTeam?.formStr })}>
                    <td className={`p-3 md:p-5 text-center font-black ${rankClass}`}>{isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : i + 1}</td>
                    <td className="p-3 md:p-5 relative">
                      <div className="flex items-center gap-1.5">
                         <div className={`font-black text-base md:text-lg transition-colors ${isTop1 ? 'text-yellow-400' : 'text-white group-hover:text-blue-400'}`}>{t.teamName}</div>
                         {isFire && <span title="On Fire! 3 ניצחונות רצופים" className="text-sm drop-shadow-md animate-pulse">🔥</span>}
                         {isClown && <span title="שק חבטות - 3 הפסדים רצופים" className="text-sm drop-shadow-md">🤡</span>}
                         {isWall && <span title="הגנת ברזל - ספגה הכי מעט בליגה" className="text-sm drop-shadow-md">🛡️</span>}
                      </div>
                      <div className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-wide mt-0.5">{t.manager}</div>
                      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block text-slate-600 text-[10px] whitespace-nowrap">פרופיל 🔍</div>
                    </td>
                    <td className="p-3 md:p-5 text-center font-bold text-zinc-400">{t.played || 0}</td>
                    <td className={`p-3 md:p-5 text-center font-black text-xl md:text-2xl tabular-nums ${isTop1 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-600/10 text-blue-400'}`}>{t.points || 0}</td>
                    <td className="p-3 md:p-5 text-center" dir="ltr"><div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-xs font-black ${gd > 0 ? 'bg-green-500/10 text-green-400' : gd < 0 ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{gd > 0 ? `+${gd}` : gd}</div></td>
                    <td className="p-3 md:p-5 text-center font-black text-green-500/80">{t.wins || 0}</td>
                    <td className="p-3 md:p-5 text-center font-black text-yellow-500/80">{t.draws || 0}</td>
                    <td className="p-3 md:p-5 text-center font-black text-red-500/80">{t.losses || 0}</td>
                    <td className="p-3 md:p-5 text-center font-mono text-zinc-300 hidden md:table-cell">{t.gf || 0}</td>
                    <td className="p-3 md:p-5 text-center font-mono text-zinc-500 hidden md:table-cell">{t.ga || 0}</td>
                    <td className="p-3 md:p-5 text-center table-cell" data-html2canvas-ignore="true">
                      <div className="flex gap-1 justify-center">
                         {rf.length === 0 ? <span className="text-[10px] text-zinc-600">אין</span> : rf.slice(-5).map((char: string, k: number) => (
                             <span key={k} className={`w-3 h-3 md:w-4 md:h-4 rounded-[3px] flex items-center justify-center text-[7px] md:text-[9px] font-black shadow-sm ${char==='W'?'bg-green-500/20 text-green-400':char==='L'?'bg-red-500/20 text-red-400':'bg-yellow-500/20 text-yellow-500'}`}>{char}</span>
                         ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-black/60 p-4 border-t border-zinc-800 flex flex-wrap justify-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 mx-4 mb-4 rounded-xl">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]"></span> אלופה</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span> סגנית</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500/50"></span> סכנת ירידה</div>
          <div className="flex items-center gap-1"><span className="text-sm">🔥</span> רצף ניצחונות (3+)</div>
          <div className="flex items-center gap-1"><span className="text-sm">🤡</span> רצף הפסדים (3+)</div>
          <div className="flex items-center gap-1"><span className="text-sm">🛡️</span> הגנת ברזל</div>
        </div>
      </div>
    </div>
  );
};
