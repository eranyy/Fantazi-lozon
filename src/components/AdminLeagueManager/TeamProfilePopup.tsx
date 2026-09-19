import React from 'react';
import { X, Crown } from 'lucide-react';

const TeamProfilePopup: React.FC<any> = ({ selectedTeamProfile, setSelectedTeamProfile, historySeasons, getHistoricalName }) => {
  if (!selectedTeamProfile) return null;

  let teamTitles = 0;
        let teamRunnerUps = 0;
        let teamCups = 0;
        let teamDoubles = 0;
        const histName = getHistoricalName(selectedTeamProfile.teamName);

        historySeasons.forEach((s: any) => {
            const cName = getHistoricalName(s.champ || '');
            const cupName = getHistoricalName(s.cup || '');
            const rName = getHistoricalName(s.runnerUp || '');

            if (cName === histName) teamTitles++;
            if (rName === histName) teamRunnerUps++;
            if (cupName === histName) teamCups++;
            if (cName === histName && cupName === histName) teamDoubles++;
        });

        const gd = (selectedTeamProfile.gf || 0) - (selectedTeamProfile.ga || 0);

        return (
          <div className="fixed inset-0 z-[5000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedTeamProfile(null)}>
             <div className="bg-[#0f172a] border border-slate-700 rounded-t-[32px] md:rounded-[32px] w-full max-w-sm h-[85vh] md:h-auto md:max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95" onClick={e => e.stopPropagation()}>

                {/* Profile Header */}
                <div className="bg-gradient-to-br from-indigo-900/80 to-blue-900/40 p-8 border-b border-indigo-500/30 text-center relative shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] pointer-events-none rounded-full"></div>

                  {/* התיקון למובייל - X צף גדול ובולט! */}
                  <button onClick={() => setSelectedTeamProfile(null)} className="absolute top-4 right-4 z-[9999] w-10 h-10 bg-slate-800 flex items-center justify-center rounded-full border border-slate-600 text-slate-300 hover:text-white shadow-2xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>

                  <div className="w-20 h-20 bg-slate-950 border-4 border-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)] relative z-10 mt-4">
                      <span className="text-3xl">🛡️</span>
                      {/* מדד העוצמה מרחף על הסמל */}
                      <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white text-xs font-black px-2 py-1 rounded-lg border-2 border-slate-900 shadow-lg flex flex-col items-center leading-none">
                         <span className="text-[8px] uppercase tracking-widest opacity-80">OVR</span>
                         <span>{selectedTeamProfile.powerScore || 50}</span>
                      </div>
                  </div>

                  <h3 className="text-2xl font-black text-white relative z-10 drop-shadow-md">{selectedTeamProfile.teamName}</h3>
                  <p className="text-indigo-300 font-bold text-sm mt-1 uppercase tracking-widest relative z-10">{selectedTeamProfile.manager}</p>
                </div>

                {/* תוכן נגלל - הוספתי פה pb-24 כדי לתת מרווח תחתון ענק במובייל */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-6">
                   {/* Trophy Cabinet */}
                   <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-inner">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" /> ארון תארים היסטורי
                      </h4>
                      <div className="flex justify-center gap-4">
                         <div className="flex flex-col items-center">
                            <span className="text-2xl drop-shadow-md mb-1 opacity-90">🥇</span>
                            <span className="text-white font-black text-lg">{teamTitles}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">אליפויות</span>
                         </div>
                         <div className="w-px bg-slate-800"></div>
                         <div className="flex flex-col items-center">
                            <span className="text-2xl drop-shadow-md mb-1 opacity-90">🥈</span>
                            <span className="text-slate-300 font-black text-lg">{teamRunnerUps}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">סגנויות</span>
                         </div>
                         <div className="w-px bg-slate-800"></div>
                         <div className="flex flex-col items-center">
                            <span className="text-2xl drop-shadow-md mb-1 opacity-90">🏆</span>
                            <span className="text-amber-500 font-black text-lg">{teamCups}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">גביעים</span>
                         </div>
                         {teamDoubles > 0 && (
                             <>
                             <div className="w-px bg-slate-800"></div>
                             <div className="flex flex-col items-center">
                                <span className="text-2xl drop-shadow-md mb-1 opacity-90">🌟</span>
                                <span className="text-purple-400 font-black text-lg">{teamDoubles}</span>
                                <span className="text-[9px] text-slate-500 uppercase font-bold">דאבלים</span>
                             </div>
                             </>
                         )}
                      </div>
                   </div>

                   {/* Current Season Stats */}
                   <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-700/50">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 text-center">נקודות</span>
                         <span className="text-2xl font-black text-blue-400 leading-none">{selectedTeamProfile.points || 0}</span>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-700/50 text-center">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">הפרש שערים</span>
                         <span className={`text-xl font-black leading-none ${gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'text-slate-300'}`} dir="ltr">
                            {gd > 0 ? `+${gd}` : gd}
                         </span>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-700/50 text-center">
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">מאזן (נ-ת-ה)</span>
                         <span className="text-sm font-black text-slate-200 leading-none mt-1 whitespace-nowrap">
                            <span className="text-green-400">{selectedTeamProfile.wins || 0}</span>-<span className="text-yellow-500">{selectedTeamProfile.draws || 0}</span>-<span className="text-red-400">{selectedTeamProfile.losses || 0}</span>
                         </span>
                      </div>
                   </div>

                   {/* Recent Form */}
                   <div className="mb-8">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">מומנטום נוכחי</h4>
                      <div className="flex gap-1.5 w-full">
                          {(!selectedTeamProfile.recentForm || selectedTeamProfile.recentForm.length === 0) ? (
                             <span className="text-xs text-slate-500 font-bold">אין משחקים העונה.</span>
                          ) : (
                             selectedTeamProfile.recentForm.slice(-8).map((char: string, i: number) => (
                                <div key={i} className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${char==='W'?'bg-green-500/20 text-green-400 border border-green-500/30':char==='L'?'bg-red-500/20 text-red-400 border border-red-500/30':'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'}`}>
                                    {char}
                                </div>
                             ))
                          )}
                      </div>
                   </div>

                </div>
             </div>
          </div>
        );
};

export default TeamProfilePopup;
