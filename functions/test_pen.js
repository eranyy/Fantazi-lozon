const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function testPenaltyParsing(p) {
    const goalKeywords = ['כבש', 'כובש', 'הבקיע', 'הבקיעה', 'שער', 'שערים', 'גול', 'גולים', 'צמד'];
    const assistKeywords = ['בישל', 'מבשל', 'בישול', 'בישולים'];
    const yellowKeywords = ['צהוב', 'צהובים', 'מוזהב'];
    const redKeywords = ['אדום', 'אדומים', 'מורחק'];
    const penWonKeywords = ['סחט פנדל', 'סחיטת פנדל', 'יצר פנדל', 'יצירת פנדל', 'סחט', 'יצר'];
    const penConcededKeywords = ['גרם לפנדל', 'גרימת פנדל', 'הכשיל לפנדל'];
    const penSavedKeywords = ['עצר פנדל', 'עצירת פנדל'];
    const penMissedKeywords = ['החמיץ פנדל', 'החמצת פנדל', 'החטיא פנדל', 'החטאת פנדל'];
    const ownGoalKeywords = ['עצמי', 'שער עצמי'];
    const concededKeywords = ['ספג', 'ספגה', 'סופג', 'סופגת', 'קיבלה', 'חטפה', 'חטף'];
    const cancelKeywords = ['ביטול', 'בוטל', 'נפסל', 'בטל', 'ביטל', 'נפסלה', 'בוטלה', 'VAR', 'var'];

    const isCancel = cancelKeywords.some(kw => p.includes(kw));
    let isGoal = goalKeywords.some(kw => p.includes(kw));
    let isAssist = assistKeywords.some(kw => p.includes(kw));
    let isYellow = yellowKeywords.some(kw => p.includes(kw));
    let isRed = redKeywords.some(kw => p.includes(kw));
    let isPenWon = penWonKeywords.some(kw => p.includes(kw));
    let isPenConceded = penConcededKeywords.some(kw => p.includes(kw));
    let isPenSaved = penSavedKeywords.some(kw => p.includes(kw)) || (p.includes('עצר') && p.includes('פנדל'));
    let isPenMissed = penMissedKeywords.some(kw => p.includes(kw)) || ((p.includes('החמיץ') || p.includes('החטיא')) && p.includes('פנדל'));
    let isOwnGoal = ownGoalKeywords.some(kw => p.includes(kw));
    let isConceded = concededKeywords.some(kw => p.includes(kw));

    let ptsAdd = 0;
    if (isCancel) {
        if (isPenWon) ptsAdd = -2;
        else if (isPenConceded) ptsAdd = 2;
        else if (isPenSaved) ptsAdd = -3;
        else if (isPenMissed) ptsAdd = 3;
    } else {
        if (isPenWon) ptsAdd = 2;
        else if (isPenConceded) ptsAdd = -2;
        else if (isPenSaved) ptsAdd = 3;
        else if (isPenMissed) ptsAdd = -3;
    }

    console.log(`Prompt: "${p}"`);
    console.log(`isPenWon: ${isPenWon}, isPenConceded: ${isPenConceded}, isPenSaved: ${isPenSaved}, isPenMissed: ${isPenMissed}`);
    console.log(`Points Add: ${ptsAdd}`);
}

(async () => {
    await testPenaltyParsing('לוזון סוקלר סחט פנדל');
    await testPenaltyParsing('לוזון סוקלר החמיץ פנדל');
    await testPenaltyParsing('לוזון עמוס עצר פנדל');
    await testPenaltyParsing('לוזון דוידזאדה גרם לפנדל');
    process.exit(0);
})();
