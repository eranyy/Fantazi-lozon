const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const canonicalTeamNames = {
    'hamsili': 'חמסילי',
    'harale': 'חראלה',
    'holonia': 'חולוניה',
    'pichichi': 'פיציצי',
    'tampa': 'טמפה',
    'tumali': 'תומאלי'
};

(async () => {
    const currentRound = 2;
    // Cutoff: Tuesday 25/08/2026 00:00 Jerusalem time
    const cutoffDate = new Date('2026-08-24T21:00:00Z').getTime(); 

    const usersSnap = await db.collection('users').get();
    const missingTeams = [];

    usersSnap.docs.forEach(d => {
        const u = d.data();
        if (!u.manager && !canonicalTeamNames[d.id]) return;

        const teamName = u.teamName || u.name || canonicalTeamNames[d.id] || d.id;
        const lastUpdate = u.lastLineupUpdate ? new Date(u.lastLineupUpdate).getTime() : 0;
        const hasRoundLineup = Boolean(u.lineupsByRound?.[currentRound] || lastUpdate > cutoffDate);

        console.log(`Team: ${teamName} (${d.id}), Manager: ${u.manager}, lastUpdate: ${u.lastLineupUpdate || 'NONE'}, Updated for Round 2? ${hasRoundLineup}`);

        if (!hasRoundLineup) {
            const phonesList = [];
            if (u.phone) phonesList.push(u.phone);
            if (u.assistantPhone) phonesList.push(u.assistantPhone);
            if (u.phones && Array.isArray(u.phones)) phonesList.push(...u.phones);

            missingTeams.push({
                id: d.id,
                teamName,
                manager: u.manager || '',
                assistantName: u.assistantName || '',
                phones: Array.from(new Set(phonesList))
            });
        }
    });

    console.log('\nMISSING TEAMS FOR ROUND 2:');
    missingTeams.forEach(t => console.log(`• ${t.teamName} (מנג'ר: ${t.manager}${t.assistantName ? ' & ' + t.assistantName : ''}) - טלפונים: ${t.phones.join(', ')}`));

    process.exit(0);
})();
