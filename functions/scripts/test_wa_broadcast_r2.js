const admin = require('firebase-admin');
const axios = require('axios');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function broadcastRound2ToWhatsApp() {
  const round = 2;
  console.log(`Sending Round ${round} summary to WhatsApp...`);

  // 1. Standings
  const usersSnap = await db.collection('users').get();
  const teams = [];
  usersSnap.forEach(doc => {
    const d = doc.data();
    if (d.teamName && doc.id !== 'admin' && doc.id !== 'system') {
      teams.push({
        id: doc.id,
        teamName: d.teamName,
        points: Number(d.points || 0),
        gf: Number(d.gf || 0),
        ga: Number(d.ga || 0),
        diff: Number((d.gf || 0) - (d.ga || 0)),
        played: Number(d.played || 0)
      });
    }
  });

  teams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.gf - a.gf;
  });

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
  let standingsText = `📊 *טבלת הליגה המעודכנת לאחר מחזור ${round}:*\n`;
  teams.forEach((t, idx) => {
    const icon = medals[idx] || `${idx + 1}.`;
    standingsText += `${icon} *${t.teamName}* | ${t.points} נק' (${t.diff > 0 ? '+' : ''}${t.diff} שערים)\n`;
  });

  // 2. Next Round H2H matches and kickoff time
  const nextRound = round + 1;
  let nextMatchesText = `\n⚔️ *משחקי מחזור ${nextRound} בינינו:*\n`;
  try {
    const fixturesSnap = await db.doc('leagueData/fixtures').get();
    if (fixturesSnap.exists) {
      const roundsData = fixturesSnap.data()?.rounds || [];
      const nextRoundData = roundsData.find(r => r.round === nextRound);
      if (nextRoundData && Array.isArray(nextRoundData.matches)) {
        nextRoundData.matches.forEach(m => {
          const hName = teams.find(t => t.id === m.h)?.teamName || m.h;
          const aName = teams.find(t => t.id === m.a)?.teamName || m.a;
          nextMatchesText += `• *${hName}* 🆚 *${aName}*\n`;
        });
      }
    }
  } catch (e) {
    console.error('Error fetching next round matches:', e);
  }

  // Next round start date from real_fixtures
  let kickoffText = '';
  try {
    const realSnap = await db.doc('leagueData/real_fixtures').get();
    if (realSnap.exists) {
      const realMatches = realSnap.data()?.matches || [];
      const nextRealMatches = realMatches.filter(m => m.round === nextRound);
      if (nextRealMatches.length > 0 && nextRealMatches[0].date) {
        kickoffText = `\n📅 *מועד פתיחת מחזור ${nextRound}:* ${nextRealMatches[0].date}${nextRealMatches[0].time ? ` בשעה ${nextRealMatches[0].time}` : ''}\n`;
      }
    }
  } catch (e) {
    console.error('Error fetching next kickoff:', e);
  }

  // 3. AI Analyst summary (in-memory sort)
  let analystText = '';
  try {
    const postsSnap = await db.collection('social_posts')
      .where('authorName', '==', 'האנליסט AI 🤖')
      .get();
    if (!postsSnap.empty) {
      const posts = postsSnap.docs.map(d => d.data());
      posts.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      const latestPost = posts[0];
      if (latestPost && latestPost.content) {
        analystText = `\n🎙️ *סיכום מחזור ${round} מפי הפרשן (האנליסט AI):*\n${latestPost.content}\n`;
      }
    }
  } catch (e) {
    console.error('Error fetching analyst post:', e);
  }

  const fullMessage = `⚽ *פנטזי לוזון 14 - סיכום מחזור ${round}* ⚽\n\n` +
    `${standingsText}` +
    `${nextMatchesText}` +
    `${kickoffText}` +
    `${analystText}\n` +
    `📱 לצפייה בניקוד המלא והרכבי המחזור הבא:\nhttps://fantasy-luzon.web.app`;

  console.log('Sending message:\n', fullMessage);

  const groupChatId = '120363412136780106@g.us';
  const greenHost = 'https://7107.api.greenapi.com';
  const greenId = '710722713612';
  const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

  const res = await axios.post(`${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`, {
    chatId: groupChatId,
    message: fullMessage
  });

  console.log('✅ WhatsApp broadcast result:', res.data);
}

broadcastRound2ToWhatsApp().catch(console.error);
