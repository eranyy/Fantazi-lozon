const fs = require('fs');
const path = require('path');

function searchDir(dir, targetStr) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full, targetStr);
    } else if (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.json')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(targetStr)) {
        console.log(`FOUND "${targetStr}" IN FILE: ${full}`);
      }
    }
  }
}

searchDir('C:/Users/user/OneDrive/אפליקציות/Fantazy Luzon/Fantazi-lozon-main', 'לשירותך');
