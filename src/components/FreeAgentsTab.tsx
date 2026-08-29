import React, { useState, useEffect } from 'react';
import { Search, Trophy, Flame, UserCheck, ShieldAlert, Star, Filter } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

interface FreeAgentPlayer {
  id: string;
  name: string;
  realTeam: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  points: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  isDrafted: boolean;
  ownerTeam?: string;
  ownerManager?: string;
}

const POS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  GK: { bg: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400', text: 'text-yellow-400', label: 'שוער' },
  DEF: { bg: 'bg-blue-500/20 border-blue-500/40 text-blue-400', text: 'text-blue-400', label: 'הגנה' },
  MID: { bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', text: 'text-emerald-400', label: 'קישור' },
  FWD: { bg: 'bg-red-500/20 border-red-500/40 text-red-400', text: 'text-red-400', label: 'התקפה' }
};

export const FreeAgentsTab: React.FC<{ users?: any[]; isAdmin?: boolean }> = ({ users = [], isAdmin = true }) => {
  const [players, setPlayers] = useState<FreeAgentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'FREE_ONLY' | 'DRAFTED'>('ALL');
  const [editingPlayer, setEditingPlayer] = useState<FreeAgentPlayer | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const availableFantasyTeams = [
    { id: 'FREE', name: '🆓 שחקן חופשי (ללא קבוצה)' },
    { id: 'tumali', name: 'תומאלי (אלי ותום)' },
    { id: 'hamsili', name: 'חמסילי (ערן ואסף)' },
    { id: 'harale', name: 'חראלה (גיא)' },
    { id: 'holonia', name: 'חולוניה (ארז)' },
    { id: 'pichichi', name: 'פיצ\'יצי (שלומי)' },
    { id: 'tampa', name: 'טמפה (יינון)' }
  ];

  const handleSavePlayerAssignment = async (targetTeamId: string) => {
    if (!editingPlayer) return;
    setSavingEdit(true);
    try {
      const { doc, setDoc, updateDoc } = await import('firebase/firestore');

      if (targetTeamId === 'FREE') {
        // Mark as free in real_league_players_scoring
        await setDoc(doc(db, 'real_league_players_scoring', editingPlayer.id), {
          isDrafted: false,
          ownerTeam: null,
          ownerManager: null
        }, { merge: true });
      } else {
        // Find target user in Firestore and assign player
        const targetTeam = availableFantasyTeams.find(t => t.id === targetTeamId);
        const targetUserDoc = users.find(u => 
          u.id === targetTeamId || 
          String(u.teamName || '').toLowerCase().includes(targetTeamId) ||
          String(u.name || '').toLowerCase().includes(targetTeamId)
        );

        if (targetUserDoc) {
          const newPlayerObj = {
            id: editingPlayer.id,
            name: editingPlayer.name,
            team: editingPlayer.realTeam,
            position: editingPlayer.position,
            points: editingPlayer.points,
            isStarting: false
          };

          const currentLineup = targetUserDoc.published_lineup || targetUserDoc.lineup || [];
          const exists = currentLineup.some((p: any) => p.name === editingPlayer.name || p.id === editingPlayer.id);

          if (!exists) {
            const updatedLineup = [...currentLineup, newPlayerObj];
            await updateDoc(doc(db, 'users', targetUserDoc.id), {
              lineup: updatedLineup,
              published_lineup: updatedLineup
            });
          }
        }

        // Also update real_league_players_scoring
        await setDoc(doc(db, 'real_league_players_scoring', editingPlayer.id), {
          isDrafted: true,
          ownerTeam: targetTeam?.name || targetTeamId,
          ownerManager: targetUserDoc?.manager || ''
        }, { merge: true });
      }

      setEditingPlayer(null);
    } catch (err) {
      console.error('Error updating player assignment:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    // 1. Listen to real_league_players_scoring from Firestore
    const unsub = onSnapshot(collection(db, 'real_league_players_scoring'), snap => {
      const list: FreeAgentPlayer[] = [];

      // Collect all drafted player names/IDs across all fantasy managers
      const draftedSet = new Map<string, { team: string; manager: string }>();
      users.forEach(u => {
        const squad = u.published_lineup || u.lineup || u.squad || [];
        if (Array.isArray(squad)) {
          squad.forEach((pl: any) => {
            const normName = String(pl.name || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');
            draftedSet.set(normName, {
              team: u.teamName || u.name || 'קבוצת פנטזי',
              manager: u.manager || u.assistantName || ''
            });
          });
        }
      });

      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const normName = String(data.name || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');
        
        let draftInfo = draftedSet.get(normName);
        if (!draftInfo) {
          for (const [k, v] of draftedSet.entries()) {
            if (k.length >= 3 && (normName.includes(k) || k.includes(normName))) {
              draftInfo = v;
              break;
            }
          }
        }

        const isDrafted = Boolean(data.isDrafted || draftInfo);
        const ownerTeam = data.ownerTeam || draftInfo?.team;
        const ownerManager = data.ownerManager || draftInfo?.manager;

        list.push({
          id: docSnap.id,
          name: data.name || docSnap.id,
          realTeam: data.realTeam || data.team || 'ליגת WINNER',
          position: data.position || 'MID',
          points: Number(data.points) || 0,
          goals: Number(data.goals) || 0,
          assists: Number(data.assists) || 0,
          yellowCards: Number(data.yellowCards) || 0,
          redCards: Number(data.redCards) || 0,
          isDrafted,
          ownerTeam,
          ownerManager
        });
      });

      // Sort by points descending
      list.sort((a, b) => b.points - a.points);
      setPlayers(list);
      setLoading(false);
    });

    return () => unsub();
  }, [users]);

  const filteredPlayers = players.filter(pl => {
    const matchesSearch = pl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pl.realTeam.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPos = selectedPos === 'ALL' || pl.position === selectedPos;
    const matchesMode = filterMode === 'ALL' ? true :
                        filterMode === 'FREE_ONLY' ? !pl.isDrafted :
                        pl.isDrafted;

    return matchesSearch && matchesPos && matchesMode;
  });

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/80 via-zinc-900 to-indigo-900/80 p-6 rounded-2xl border border-emerald-500/30 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                מציאות חלון ההעברות ⚽
                <span className="text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono">
                  ליגת העל במציאות
                </span>
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                דירוג ניקוד הפנטזי של כל שחקני ליגת העל – אתר שחקנים חופשיים לוהטים לקראת חלון החילופים!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-800">
            <button
              onClick={() => setFilterMode('FREE_ONLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'FREE_ONLY' ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🆓 שחקנים חופשיים
            </button>
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌐 כל שחקני הליגה
            </button>
            <button
              onClick={() => setFilterMode('DRAFTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'DRAFTED' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🔒 בסגלי המנג'רים
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Position Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute right-3.5 top-3.5 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חפש שחקן חופשי או קבוצה במציאות (למשל: שועה, מכבי חיפה)..."
            className="w-full pl-4 pr-11 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Position Filter */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 overflow-x-auto">
          {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map(pos => (
            <button
              key={pos}
              onClick={() => setSelectedPos(pos)}
              className={`flex-1 min-w-[50px] py-2 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                selectedPos === pos
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {pos === 'ALL' ? 'הכל' : POS_BADGES[pos]?.label || pos}
            </button>
          ))}
        </div>
      </div>

      {/* Player List Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>טוען את נתוני שחקני ליגת העל במציאות...</span>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <p className="text-lg font-semibold text-white mb-1">
            {filterMode === 'FREE_ONLY' ? 'כל השחקנים בבסיס הנתונים כרגע תפוסים ע"י מנג\'רים!' : 'לא נמצאו שחקנים מתאימים'}
          </p>
          <p className="text-sm text-zinc-400">
            {filterMode === 'FREE_ONLY' 
              ? 'לחץ על הכפתור "🌐 כל שחקני הליגה" למעלה לצפייה בדירוג השחקנים המלא עם שיוך הקבוצות!'
              : 'נסה לשנות את מילות החיפוש או פילטר העמדה'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((pl, idx) => {
            const badge = POS_BADGES[pl.position] || POS_BADGES['MID'];
            return (
              <div
                key={pl.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  pl.isDrafted
                    ? 'bg-zinc-900/40 border-zinc-800/80 opacity-75'
                    : 'bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 border-zinc-800 hover:border-emerald-500/50 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400 border border-zinc-700">
                      #{idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight flex items-center gap-1.5">
                        {pl.name}
                        {!pl.isDrafted && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-normal">
                            חופשי 🆓
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{pl.realTeam}</p>
                    </div>
                  </div>

                  {/* Points Badge */}
                  <div className="text-left">
                    <div className="text-xl font-extrabold text-emerald-400 tracking-tight leading-none">
                      {pl.points}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium mt-0.5">נק' פנטזי</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                  {/* Position Badge */}
                  <span className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold ${badge.bg}`}>
                    {badge.label}
                  </span>

                  {/* Stats Summary */}
                  <div className="flex items-center gap-3 text-zinc-400 text-xs">
                    {pl.goals > 0 && <span className="text-emerald-400 font-medium">⚽ {pl.goals} שערים</span>}
                    {pl.assists > 0 && <span className="text-blue-400 font-medium">🎯 {pl.assists} בישולים</span>}
                    {pl.goals === 0 && pl.assists === 0 && <span>טרם צבר שער/בישול</span>}
                  </div>
                </div>

                {/* Draft Status Indicator & Quick Edit Button */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
                  {pl.isDrafted && pl.ownerTeam ? (
                    <div className="text-amber-400/90 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>שייך ל-<strong>{pl.ownerTeam}</strong> ({pl.ownerManager})</span>
                    </div>
                  ) : (
                    <span className="text-zinc-500">שחקן חופשי בליגה</span>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => setEditingPlayer(pl)}
                      className="bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white px-2 py-1 rounded text-[10px] font-semibold transition-all border border-zinc-700"
                    >
                      ✏️ ערוך שיוך
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Quick Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-emerald-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right dir-rtl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              ✏️ עריכת שיוך קבוצה: <span className="text-emerald-400">{editingPlayer.name}</span>
            </h3>
            <p className="text-xs text-zinc-400">
              בחר לאיזו קבוצת פנטזי השחקן שייך, או סמן אותו כ"שחקן חופשי":
            </p>

            <div className="space-y-2">
              {availableFantasyTeams.map(t => (
                <button
                  key={t.id}
                  disabled={savingEdit}
                  onClick={() => handleSavePlayerAssignment(t.id)}
                  className="w-full text-right p-3 rounded-xl bg-zinc-800/80 hover:bg-emerald-600/30 border border-zinc-700 hover:border-emerald-500 font-semibold text-sm text-white transition-all flex items-center justify-between"
                >
                  <span>{t.name}</span>
                  <span className="text-xs text-zinc-400">בחר ➡️</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setEditingPlayer(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeAgentsTab;
