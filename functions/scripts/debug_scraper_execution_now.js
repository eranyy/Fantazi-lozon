const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');
const cheerio = require('cheerio');

const norm = (str) => String(str || '').toLowerCase().replace(/['"״׳\sאע]/g, '').replace(/יי/g, 'י').replace(/וו/g, 'ו');

async function debugScraperExecution() {
  console.log('=== DEBUGGING LIVE SCRAPER EXECUTION RIGHT NOW ===\n');

  // 1. Check active matches
  const fixturesSnap = await db.doc('leagueData/real_fixtures').get();
  const matches = fixturesSnap.data()?.matches || [];
  const now = new Date();

  const jerusalemDateStr = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
  const parts = jerusalemDateStr.split('.');
  const dStr = (parts[0] || '').padStart(2, '0');
  const mStr = (parts[1] || '').padStart(2, '0');
  const yStr = parts[2] || '2026';

  const todayPadded = `${dStr}/${mStr}/${yStr}`;
  const todayRaw = `${parts[0]}/${parts[1]}/${yStr}`;

  console.log(`Current Date: ${todayPadded} | Time: ${now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem' })}`);

  let isGameLiveNow = false;
  let activeMatchInfo = '';

  for (const m of matches) {
    const mDateNorm = String(m.date || '').replace(/\./g, '/').trim();
    if (mDateNorm === todayPadded || mDateNorm === todayRaw || mDateNorm.includes(todayPadded) || mDateNorm.includes(todayRaw)) {
      const [hourStr, minStr] = String(m.time || '20:00').split(':');
      const matchHour = parseInt(hourStr || '20', 10);
      const matchMin = parseInt(minStr || '0', 10);

      const nowHour = parseInt(now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10);
      const nowMin = parseInt(now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', minute: '2-digit' }), 10);

      const nowTotalMins = nowHour * 60 + nowMin;
      const matchTotalMins = matchHour * 60 + matchMin;

      if (nowTotalMins >= (matchTotalMins - 15) && nowTotalMins <= (matchTotalMins + 210)) {
        isGameLiveNow = true;
        activeMatchInfo = `${m.homeTeam} נגד ${m.awayTeam} (${m.time})`;
        console.log(`  🔥 Active Match Found: ${activeMatchInfo}`);
      }
    }
  }

  if (!isGameLiveNow) {
    console.log('⚠️ Scraper condition evaluated isGameLiveNow = FALSE! Skipping scan.');
    process.exit(0);
  }

  // 2. Fetch all tracked players
  const realPlayersSnap = await db.collection('real_league_players_scoring').get();
  const allTrackedPlayers = [];
  realPlayersSnap.docs.forEach(d => {
    const data = d.data();
    if (data.name) {
      allTrackedPlayers.push({
        name: data.name,
        realTeam: data.realTeam || data.team || '',
        isDrafted: Boolean(data.isDrafted)
      });
    }
  });

  console.log(`Total tracked players: ${allTrackedPlayers.length}`);

  // Function checkAndCreatePending
  const checkAndCreatePending = async (plName, realTeam, eventType, source, desc) => {
    console.log(`Checking event: [${eventType}] player="${plName}" source="${source}"...`);
    const existingSnap = await db.collection('live_pending_events')
      .where('player', '==', plName)
      .where('eventType', '==', eventType)
      .get();

    if (existingSnap.empty) {
      await db.collection('live_pending_events').add({
        player: plName,
        realTeam,
        eventType,
        source,
        description: desc,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  🎉 NEW EVENT CREATED FOR ${plName}! Sending WA notification...`);

      try {
        const groupChatId = '120363412136780106@g.us';
        const greenHost = 'https://7107.api.greenapi.com';
        const greenId = '710722713612';
        const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

        const eventMsg = `🤖 *סוכן הלייב זיהה אירוע חדש במגרשים!* 🏟️⚽\n\n` +
          `• ${desc}\n` +
          `• מקור המידע: *${source}*\n\n` +
          `⚡ *האירוע נרשם במערכת ומוכן לאישור/עדכון בזירה!* 📱\n` +
          `https://fantasy-luzon.web.app`;

        const waRes = await axios.post(`${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`, {
          chatId: groupChatId,
          message: eventMsg
        });
        console.log(`  ✅ WA Notification SENT! Status: ${waRes.status}`);
      } catch (waErr) {
        console.error(`  ❌ WA Error: ${waErr.message}`);
      }
      return true;
    } else {
      console.log(`  ℹ️ Event for ${plName} already exists in DB.`);
    }
    return false;
  };

  // 3. Scrape Sport5
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  try {
    console.log('\nScanning Sport5...');
    const sp5 = await axios.get('https://www.sport5.co.il/', { headers: { 'User-Agent': userAgent }, timeout: 8000 });
    const $ = cheerio.load(sp5.data);
    const textNorm = norm($('body').text());

    for (const pl of allTrackedPlayers) {
      const plNorm = norm(pl.name);
      if (plNorm.length >= 3 && textNorm.includes(plNorm)) {
        if (!['דוד', 'בן', 'חי', 'אלי'].includes(plNorm)) {
          await checkAndCreatePending(pl.name, pl.realTeam, 'goal', 'ספורט 5', `⚽ שער! ${pl.name} (${pl.realTeam})`);
        }
      }
    }
  } catch (err) {
    console.error('Sport5 scan error:', err.message);
  }

  process.exit(0);
}

debugScraperExecution();
