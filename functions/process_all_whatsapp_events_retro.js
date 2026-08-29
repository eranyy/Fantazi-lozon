const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const norm = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '').replace(/יי/g, 'י').replace(/וו/g, 'ו');

async function processRetroEvents() {
  console.log('=== RETROACTIVE UPDATE FOR MATCHDAY 2 WHATSAPP EVENTS ===\n');

  // List of events reported in WhatsApp chat:
  const eventsToApply = [
    { searchName: 'קמבודי', eventType: 'goal', desc: 'שער ע"י קמבודי (הפועל פ"ת)' },
    { searchName: 'סאנייה', eventType: 'goal', desc: 'שער ע"י סאנייה (קרית שמונה)' },
    { searchName: 'שי בן דוד', eventType: 'assist', desc: 'בישול ע"י שי בן דוד (קרית שמונה)' },
    { searchName: 'אווסו', eventType: 'goal', desc: 'שער ע"י אווסו (מכבי פ"ת)' }
  ];

  const usersSnap = await db.collection('users').get();
  
  for (const ev of eventsToApply) {
    const sNorm = norm(ev.searchName);
    console.log(`🔍 Processing event: ${ev.desc} (search: "${ev.searchName}")`);

    let matchedUser = null;
    let matchedPlayer = null;

    usersSnap.docs.forEach(doc => {
      const u = doc.data();
      const squad = u.squad || [];
      squad.forEach(pl => {
        const pNorm = norm(pl.name);
        if (pNorm.includes(sNorm) || sNorm.includes(pNorm) || (sNorm.includes('בנדוד') && pNorm.includes('בנדוד'))) {
          matchedUser = { id: doc.id, data: u };
          matchedPlayer = pl;
        }
      });
    });

    if (matchedUser && matchedPlayer) {
      console.log(`  ✅ MATCHED! Player: "${matchedPlayer.name}" (${matchedPlayer.realTeam || matchedPlayer.team}) | Fantasy Team: ${matchedUser.data.teamName} (${matchedUser.data.manager})`);

      const pos = String(matchedPlayer.position || matchedPlayer.pos || 'MID').toUpperCase();
      const isDef = pos === 'DEF' || pos.includes('הגנה') || pos.includes('בלם') || pos.includes('מגן');
      const isGk = pos === 'GK' || pos.includes('שוער');

      let pts = 0;
      if (ev.eventType === 'goal') pts = isGk ? 10 : isDef ? 8 : 5;
      else if (ev.eventType === 'assist') pts = isGk ? 6 : isDef ? 4 : 3;

      const lineup = matchedUser.data.lineup || [];
      const isInLineup = lineup.some(pl => norm(pl.name) === norm(matchedPlayer.name) || pl.id === matchedPlayer.id);

      // Update lineup
      const updatedLineup = lineup.map(pl => {
        if (norm(pl.name) === norm(matchedPlayer.name) || pl.id === matchedPlayer.id) {
          const stats = pl.stats || {};
          const currentGoals = stats.goals || 0;
          const currentAssists = stats.assists || 0;
          return {
            ...pl,
            points: Math.max(pts + 1, (Number(pl.points) || 0) + pts),
            stats: {
              ...stats,
              started: true,
              played60: true,
              goals: ev.eventType === 'goal' ? Math.max(1, currentGoals + 1) : currentGoals,
              assists: ev.eventType === 'assist' ? Math.max(1, currentAssists + 1) : currentAssists
            }
          };
        }
        return pl;
      });

      // Update squad
      const updatedSquad = (matchedUser.data.squad || []).map(pl => {
        if (norm(pl.name) === norm(matchedPlayer.name) || pl.id === matchedPlayer.id) {
          const stats = pl.stats || {};
          return {
            ...pl,
            points: Math.max(pts + 1, (Number(pl.points) || 0) + pts),
            stats: {
              ...stats,
              started: true,
              played60: true,
              goals: ev.eventType === 'goal' ? Math.max(1, stats.goals || 0) : (stats.goals || 0),
              assists: ev.eventType === 'assist' ? Math.max(1, stats.assists || 0) : (stats.assists || 0)
            }
          };
        }
        return pl;
      });

      await db.collection('users').doc(matchedUser.id).set({
        lineup: updatedLineup,
        published_lineup: updatedLineup,
        squad: updatedSquad
      }, { merge: true });

      console.log(`  ⚡ UPDATED FIRESTORE: ${matchedPlayer.name} in team ${matchedUser.data.teamName} (+${pts} pts, InLineup: ${isInLineup})\n`);
    } else {
      console.log(`  ℹ️ "${ev.searchName}" is a Free Agent (un-drafted player) or not found in fantasy squads.\n`);
    }
  }

  process.exit(0);
}

processRetroEvents();
