const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectPichichiRows() {
    console.log('=== INSPECTING PICHICHI ROWS IN ARCHIVES ===\n');

    for (let r = 1; r <= 5; r++) {
        const docSnap = await db.collection('round_excel_archives').doc(`round_${r}`).get();
        if (docSnap.exists) {
            const rows = docSnap.data()?.rows || [];
            const teamsFound = new Set();
            let pichichiSum = 0;
            rows.forEach(row => {
                const teamName = row.fantasyTeam || row.fantasyTeamName || row.userId;
                teamsFound.add(teamName);
                if (teamName && (teamName.includes('פיצ') || teamName.includes('pichichi'))) {
                    pichichiSum += Number(row.points || 0);
                }
            });
            console.log(`Round ${r}: Teams found in archive =`, Array.from(teamsFound));
            console.log(`Round ${r}: Pichichi sum =`, pichichiSum);
        }
    }

    process.exit(0);
}

inspectPichichiRows().catch(e => {
    console.error(e);
    process.exit(1);
});
