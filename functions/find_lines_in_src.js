const fs = require('fs');
const content = fs.readFileSync('C:/Users/user/OneDrive/אפליקציות/Fantazy Luzon/Fantazi-lozon-main/functions/src/index.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('לשירותך') || line.includes('בינגו') || line.includes('תחזית')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
