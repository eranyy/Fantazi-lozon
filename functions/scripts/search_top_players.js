const fs = require('fs');
const path = require('path');

function searchFile(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchFile(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('topPlayers') || content.includes('topScorers') || content.includes('topAssists')) {
        console.log(`FOUND IN FILE: ${fullPath}`);
      }
    }
  }
}

searchFile('C:\\Users\\user\\OneDrive\\אפליקציות\\Fantazy Luzon\\Fantazi-lozon-main\\src');
process.exit(0);
