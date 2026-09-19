const fs = require('fs');

function findLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('מלך') || line.includes('מלכים') || line.includes('שערים') || line.includes('בישולים')) {
      console.log(`${filePath} L${idx + 1}: ${line.trim()}`);
    }
  });
}

findLines('C:\\Users\\user\\OneDrive\\אפליקציות\\Fantazy Luzon\\Fantazi-lozon-main\\src\\AdminLeagueManager.tsx');
findLines('C:\\Users\\user\\OneDrive\\אפליקציות\\Fantazy Luzon\\Fantazi-lozon-main\\src\\AdminSettings.tsx');
findLines('C:\\Users\\user\\OneDrive\\אפליקציות\\Fantazy Luzon\\Fantazi-lozon-main\\src\\components\\SocialFeed.tsx');

process.exit(0);
