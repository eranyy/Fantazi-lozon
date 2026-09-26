import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { Trophy, ScrollText, Medal, Flame, Star, TrendingUp, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';

import { DEFAULT_SEASONS } from './constants/leagueConstants';
import { cleanStr, getHistoricalName, getTeamColors } from './utils/teamUtils';

import { TopPlayersSubTab } from './components/admin/TopPlayersSubTab';
import { PredictorSubTab } from './components/admin/PredictorSubTab';
import { PowerRankingsSubTab } from './components/admin/PowerRankingsSubTab';
import { LeagueTableSubTab } from './components/admin/LeagueTableSubTab';
import { LeagueRulesSubTab } from './components/admin/LeagueRulesSubTab';
import { HallOfFameSubTab } from './components/admin/HallOfFameSubTab';
import { SpicyRecordsSubTab } from './components/admin/SpicyRecordsSubTab';
import { TeamProfileModal } from './components/admin/TeamProfileModal';

export { cleanStr, getHistoricalName, getTeamColors };

const AdminLeagueManager: React.FC<any> = ({ inline, initialSubTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'rules' | 'hof' | 'records' | 'power' | 'top_players' | 'predictor'>(initialSubTab || 'table');
  const [teams, setTeams] = useState<any[]>([]);
  const [historySeasons, setHistorySeasons] = useState<any[]>(DEFAULT_SEASONS);
  const [topPlayers, setTopPlayers] = useState<any[]>([]); 
  const [allPlayersDB, setAllPlayersDB] = useState<any[]>([]); 

  const playersMapByName = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of allPlayersDB) {
      if (p.name) map.set(cleanStr(p.name), p);
    }
    return map;
  }, [allPlayersDB]);

  const [predictorStandings, setPredictorStandings] = useState<any[]>([]);
  const [whatsappPolls, setWhatsappPolls] = useState<any[]>([]);
  const [selectedPredictorRound, setSelectedPredictorRound] = useState<number>(2);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [spicyRecords, setSpicyRecords] = useState({ blowoutWins: [] as any[], blowoutLosses: [] as any[], biggestVictims: [] as any[] });
  
  const [selectedTeamProfile, setSelectedTeamProfile] = useState<any | null>(null);

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, "users"), (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    
    const unsubHistory = onSnapshot(doc(db, "leagueData", "history"), (docSnap) => {
      if(docSnap.exists() && docSnap.data().seasons) setHistorySeasons(docSnap.data().seasons);
    });

    const unsubRecords = onSnapshot(doc(db, "leagueData", "records"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const bwObj = data.blowoutWins || {};
        const bwArr = Object.keys(bwObj).map(k => ({ team: k, count: bwObj[k] })).sort((a, b) => b.count - a.count);
        const blObj = data.blowoutLosses || {};
        const blArr = Object.keys(blObj).map(k => ({ team: k, count: blObj[k] })).sort((a, b) => b.count - a.count);
        const bvObj = data.biggestVictims || {};
        const bvArr = Object.keys(bvObj).map(k => {
          const parts = k.split('_vs_');
          return { predator: parts[0], prey: parts[1], count: bvObj[k] };
        }).sort((a, b) => b.count - a.count);
        setSpicyRecords({ blowoutWins: bwArr.slice(0, 5), blowoutLosses: blArr.slice(0, 5), biggestVictims: bvArr.slice(0, 5) });
      }
    });

    const unsubTopPlayers = onSnapshot(doc(db, "leagueData", "top_players"), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data()?.players) && docSnap.data().players.length > 0) {
            setTopPlayers(docSnap.data().players);
        }
    });

    const unsubPredictor = onSnapshot(doc(db, "leagueData", "predictor_standings"), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data()?.standings)) {
            setPredictorStandings(docSnap.data().standings);
        }
    });

    const unsubPolls = onSnapshot(collection(db, "whatsapp_polls"), (snap) => {
        setWhatsappPolls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubScoring = onSnapshot(collection(db, "real_league_players_scoring"), (snap) => {
        const list: any[] = [];
        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.name) {
                list.push({
                    name: data.name,
                    team: data.realTeam || data.team || '',
                    fantasyTeamName: data.ownerTeam || (data.isDrafted ? 'בסגל מנג\'ר' : ''),
                    position: data.position || 'MID',
                    points: Number(data.points) || 0,
                    goals: Number(data.goals) || 0,
                    assists: Number(data.assists) || 0
                });
            }
        });
        
        const isSamePlayer = (aName: string, aTeam: string, bName: string, bTeam: string) => {
            if (cleanStr(aName) !== cleanStr(bName)) return false;
            if (!aTeam || !bTeam) return true;
            const cA = cleanStr(aTeam);
            const cB = cleanStr(bTeam);
            return cA === cB || cA.includes(cB) || cB.includes(cA);
        };

        teams.forEach(team => {
            if (team.teamName && !team.teamName.toUpperCase().includes('ADMIN')) {
                const squadPool: any[] = [...(team.squad || team.players || [])];
                const lineupsByRound = team.lineupsByRound || {};
                Object.keys(lineupsByRound).forEach(r => {
                    if (Array.isArray(lineupsByRound[r]?.lineup)) squadPool.push(...lineupsByRound[r].lineup);
                    if (Array.isArray(lineupsByRound[r]?.subsOut)) squadPool.push(...lineupsByRound[r].subsOut);
                });

                squadPool.forEach((p: any) => {
                    if (p && p.name) {
                        const pTeam = p.realTeam || p.team || '';
                        const existing = list.find(l => isSamePlayer(l.name, l.team, p.name, pTeam));
                        if (existing) {
                            if (!existing.fantasyTeamName) existing.fantasyTeamName = team.teamName;
                        } else {
                            list.push({
                                name: p.name,
                                team: pTeam,
                                fantasyTeamName: team.teamName,
                                position: p.position || 'MID',
                                points: Number(p.points) || 0,
                                goals: Number(p.goals) || 0,
                                assists: Number(p.assists) || 0
                            });
                        }
                    }
                });
            }
        });

        const uniqueMap: Record<string, any> = {};
        list.forEach(item => {
          let cleanKey = cleanStr(item.name);
          if (cleanKey === 'פרץ') {
            if (item.team?.includes('ת"א') || item.team?.includes('תל אביב')) cleanKey = 'דור פרץ';
            else if (item.team?.includes('ב"ש') || item.team?.includes('באר שבע')) cleanKey = 'אליאל פרץ';
          }
          if (!uniqueMap[cleanKey]) {
            uniqueMap[cleanKey] = { ...item };
          } else {
            uniqueMap[cleanKey].points = Math.max(uniqueMap[cleanKey].points, item.points);
            uniqueMap[cleanKey].goals = Math.max(uniqueMap[cleanKey].goals, item.goals);
            uniqueMap[cleanKey].assists = Math.max(uniqueMap[cleanKey].assists, item.assists);
            if (!uniqueMap[cleanKey].team && item.team) uniqueMap[cleanKey].team = item.team;
            if (!uniqueMap[cleanKey].fantasyTeamName && item.fantasyTeamName) uniqueMap[cleanKey].fantasyTeamName = item.fantasyTeamName;
          }
        });

        const finalList = Object.values(uniqueMap).sort((a, b) => b.points - a.points || b.goals - a.goals);
        if (finalList.length > 0) setTopPlayers(finalList);
    });

    const unsubPlayersDB = onSnapshot(collection(db, "players"), (snapshot) => {
        setAllPlayersDB(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubTeams(); unsubHistory(); unsubRecords(); unsubTopPlayers(); unsubPredictor(); unsubPolls(); unsubScoring(); unsubPlayersDB(); };
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'success') => { 
      setToast({msg, type}); 
      if (type !== 'info') setTimeout(() => setToast(null), 5000); 
  };

  const activeTeams = [...teams].filter(t => {
      if (t.id === 'admin' || t.id === 'system') return false;
      if (!t.teamName) return false;
      const cleanName = t.teamName.trim().toLowerCase();
      if (cleanName === '') return false;
      if (cleanName.includes('admin') || cleanName.includes('אדמין') || cleanName === 'system') return false;
      return true;
  });

  const sortedTable = [...activeTeams].sort((a, b) => {
      const aPts = a.points || 0; const bPts = b.points || 0;
      if (bPts !== aPts) return bPts - aPts;
      return ((b.gf || 0) - (b.ga || 0)) - ((a.gf || 0) - (a.ga || 0));
  });

  const powerRankedTeams = [...activeTeams].map(t => {
      let pScore = 50;
      if (t.played && t.played > 0) {
          const maxPts = t.played * 3;
          const ptsScore = (t.points / maxPts) * 45; 
          
          let formScore = 12.5;
          const rawForm = (t.recentForm && t.recentForm.length > 0) ? t.recentForm : (t.form || []);
          if (rawForm.length > 0) {
              const last5 = rawForm.slice(-5);
              let fPts = 0;
              last5.forEach((res: string) => {
                  if (res === 'W') fPts += 5;
                  if (res === 'D') fPts += 2;
              });
              formScore = (fPts / (last5.length * 5)) * 25; 
          }

          const gdPerGame = ((t.gf || 0) - (t.ga || 0)) / t.played;
          let gdScore = 10 + gdPerGame; 
          gdScore = Math.max(0, Math.min(20, gdScore)); 

          const gfPerGame = (t.gf || 0) / t.played;
          let xScore = (gfPerGame / 50) * 10; 
          xScore = Math.max(0, Math.min(10, xScore)); 

          pScore = Math.round(ptsScore + formScore + gdScore + xScore);
          pScore = Math.max(1, Math.min(99, pScore)); 
      }
      
      const rawForm = (t.recentForm && t.recentForm.length > 0) ? t.recentForm : (t.form || []);
      const formStr = rawForm.slice(-5);
      return { ...t, powerScore: pScore, formStr };
  }).sort((a, b) => b.powerScore - a.powerScore);

  const getPowerBarColor = (score: number) => {
    if (score >= 85) return 'from-purple-500 to-pink-500';
    if (score >= 65) return 'from-green-400 to-emerald-600';
    if (score >= 45) return 'from-yellow-400 to-orange-500';
    return 'from-red-500 to-rose-700';
  };

  const playedTeams = sortedTable.filter(t => (t.played || 0) > 0);
  const minGa = playedTeams.length > 0 ? Math.min(...playedTeams.map(t => t.ga || 0)) : -1;

  const shareTableAsImage = async () => {
    const el = document.getElementById('league-table-capture');
    if (!el) return;
    showMessage('מייצר תמונה ברמת ליגת האלופות... 📸', 'info');
    
    try {
      const scrollContainer = el.querySelector('.overflow-x-auto');
      const targetWidth = scrollContainer ? scrollContainer.scrollWidth + 40 : el.offsetWidth;

      const canvas = await html2canvas(el, { 
        backgroundColor: '#0f172a', 
        scale: 2, 
        useCORS: true,
        windowWidth: targetWidth, 
        onclone: (clonedDoc) => {
          const container = clonedDoc.getElementById('league-table-capture');
          if (container) {
            container.style.width = `${targetWidth}px`;
            container.style.maxWidth = 'none';
            container.style.overflow = 'visible';
          }
          
          const tableWrapper = clonedDoc.querySelector('.overflow-x-auto');
          if (tableWrapper) {
            (tableWrapper as HTMLElement).style.width = `${targetWidth}px`;
            (tableWrapper as HTMLElement).style.maxWidth = 'none';
            (tableWrapper as HTMLElement).style.overflow = 'visible';
          }

          const blurs = clonedDoc.querySelectorAll('.backdrop-blur-md, .backdrop-blur-xl, .backdrop-blur-2xl');
          blurs.forEach(b => {
              b.classList.remove('backdrop-blur-md', 'backdrop-blur-xl', 'backdrop-blur-2xl');
              (b as HTMLElement).style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
          });
          const ignores = clonedDoc.querySelectorAll('[data-html2canvas-ignore="true"]');
          ignores.forEach(ig => (ig as HTMLElement).style.display = 'none');
        }
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'Luzon14_Table.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'טבלת פנטזי לוזון 14', text: '🏆 טבלת פנטזי לוזון 14 - תמונת מצב רותחת! 🔥' });
          setToast(null);
        } else {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            showMessage('התמונה הועתקה! פתח ווצאפ והדבק (Ctrl+V) 📋', 'success');
          } catch {
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'Luzon14_Table.png'; link.click();
            showMessage('התמונה ירדה למחשב! צרף אותה לווצאפ 📥', 'success');
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      showMessage('שגיאה ביצירת התמונה', 'error');
    }
  };

  const allTimeMap: Record<string, {name: string, titles: number, cups: number, doubles: number}> = {};
  historySeasons.forEach(s => {
    const cName = getHistoricalName(s.champ || '');
    const cupName = getHistoricalName(s.cup || '');

    if (cName) {
      if(!allTimeMap[cName]) allTimeMap[cName] = {name: cName, titles:0, cups:0, doubles:0};
      allTimeMap[cName].titles += 1;
    }
    if (cupName) {
      if(!allTimeMap[cupName]) allTimeMap[cupName] = {name: cupName, titles:0, cups:0, doubles:0};
      allTimeMap[cupName].cups += 1;
    }
    if (cName && cupName && cName === cupName) {
      allTimeMap[cName].doubles += 1;
    }
  });
  
  const sortedAllTimeStats = Object.values(allTimeMap).sort((a, b) => {
    if (b.titles !== a.titles) return b.titles - a.titles;
    return b.cups - a.cups;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center pt-20 h-full gap-4 opacity-50">
      <div className="w-12 h-12 border-[4px] border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="font-black text-blue-500 tracking-widest uppercase">Loading Table...</div>
    </div>
  );

  return (
    <div className={`space-y-6 md:space-y-8 font-sans ${inline ? '' : 'p-4 md:p-8'}`} dir="rtl">
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] p-5 text-center font-black rounded-2xl border shadow-2xl animate-in slide-in-from-top-10 backdrop-blur-xl min-w-[320px] max-w-md ${toast.type === 'error' ? 'bg-red-950/95 text-red-400 border-red-500/50 shadow-red-900/50' : toast.type === 'info' ? 'bg-blue-950/95 text-blue-400 border-blue-500/50 shadow-blue-900/50' : 'bg-green-950/95 text-green-400 border-green-500/50 shadow-green-900/50'}`}>
          {toast.msg}
        </div>
      )}
      
      <div className="bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 flex max-w-4xl mx-auto shadow-inner overflow-x-auto custom-scrollbar relative z-30">
        <button onClick={() => setActiveSubTab('table')} className={`flex-1 min-w-[70px] md:min-w-[90px] py-3 px-2 rounded-xl text-[11px] md:text-sm font-black transition-all flex justify-center items-center gap-1 md:gap-1.5 whitespace-nowrap ${activeSubTab === 'table' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border border-blue-500/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}><Trophy className="w-3 h-3 md:w-4 md:h-4" /> טבלה</button>
        <button onClick={() => setActiveSubTab('top_players')} className={`flex-1 min-w-[80px] md:min-w-[100px] py-3 px-2 rounded-xl text-[11px] md:text-sm font-black transition-all flex justify-center items-center gap-1 md:gap-1.5 whitespace-nowrap ${activeSubTab === 'top_players' ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg border border-emerald-500/50' : 'text-zinc-500 hover:text-emerald-400/70 hover:bg-white/5'}`}><Star className="w-3 h-3 md:w-4 md:h-4" /> מלכים</button>
        <button onClick={() => setActiveSubTab('predictor')} className={`flex-1 min-w-[80px] md:min-w-[100px] py-3 px-2 rounded-xl text-[11px] md:text-sm font-black transition-all flex justify-center items-center gap-1 md:gap-1.5 whitespace-nowrap ${activeSubTab === 'predictor' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg border border-violet-500/50' : 'text-zinc-500 hover:text-violet-400/70 hover:bg-white/5'}`}><Sparkles className="w-3 h-3 md:w-4 md:h-4" /> נביאים</button>
        <button onClick={() => setActiveSubTab('power')} className={`flex-1 min-w-[80px] md:min-w-[100px] py-3 px-2 rounded-xl text-[11px] md:text-sm font-black transition-all flex justify-center items-center gap-1 md:gap-1.5 whitespace-nowrap ${activeSubTab === 'power' ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg border border-purple-500/50' : 'text-zinc-500 hover:text-purple-400/70 hover:bg-white/5'}`}><TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> עוצמה</button>
        <button onClick={() => setActiveSubTab('rules')} className={`flex-1 min-w-[70px] md:min-w-[90px] py-3 px-2 rounded-xl text-[11px] md:text-sm font-black transition-all flex justify-center items-center gap-1 md:gap-1.5 whitespace-nowrap ${activeSubTab === 'rules' ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}><ScrollText className="w-3 h-3 md:w-4 md:h-4" /> תקנון</button>
        <button onClick={() => setActiveSubTab('hof')} className={`flex-1 min-w-[80px] md:min-w-[100px] py-3 px-2 rounded-xl text-[11px] md:text-sm font-black transition-all flex justify-center items-center gap-1 md:gap-1.5 whitespace-nowrap ${activeSubTab === 'hof' ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-lg border border-yellow-400' : 'text-zinc-500 hover:text-yellow-500/70 hover:bg-white/5'}`}><Medal className="w-3 h-3 md:w-4 md:h-4" /> תהילה</button>
        <button onClick={() => setActiveSubTab('records')} className={`flex-1 min-w-[90px] md:min-w-[110px] py-3 px-2 rounded-xl text-[11px] md:text-sm font-black transition-all flex justify-center items-center gap-1 md:gap-1.5 whitespace-nowrap ${activeSubTab === 'records' ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg border border-red-500/50' : 'text-zinc-500 hover:text-red-400/70 hover:bg-white/5'}`}><Flame className="w-3 h-3 md:w-4 md:h-4" /> פיקנטריה</button>
      </div>

      {activeSubTab === 'top_players' && (
        <TopPlayersSubTab
          teams={teams}
          topPlayers={topPlayers}
          playersMapByName={playersMapByName}
        />
      )}

      {activeSubTab === 'predictor' && (
        <PredictorSubTab
          predictorStandings={predictorStandings}
          whatsappPolls={whatsappPolls}
          selectedPredictorRound={selectedPredictorRound}
          setSelectedPredictorRound={setSelectedPredictorRound}
        />
      )}

      {activeSubTab === 'power' && (
        <PowerRankingsSubTab
          powerRankedTeams={powerRankedTeams}
          getPowerBarColor={getPowerBarColor}
        />
      )}

      {activeSubTab === 'table' && (
        <LeagueTableSubTab
          sortedTable={sortedTable}
          minGa={minGa}
          powerRankedTeams={powerRankedTeams}
          shareTableAsImage={shareTableAsImage}
          setSelectedTeamProfile={setSelectedTeamProfile}
        />
      )}

      {activeSubTab === 'rules' && (
        <LeagueRulesSubTab />
      )}

      {activeSubTab === 'hof' && (
        <HallOfFameSubTab
          sortedAllTimeStats={sortedAllTimeStats}
        />
      )}

      {activeSubTab === 'records' && (
        <SpicyRecordsSubTab
          spicyRecords={spicyRecords}
        />
      )}

      <TeamProfileModal
        selectedTeamProfile={selectedTeamProfile}
        setSelectedTeamProfile={setSelectedTeamProfile}
        historySeasons={historySeasons}
      />
    </div>
  );
};

export default AdminLeagueManager;