const fs = require('fs');
const path = require('path');

function searchCaptain(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchCaptain(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('isCaptain') || content.includes('captain') || content.includes('קפטן')) {
        console.log(`FOUND CAPTAIN REFERENCE in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('isCaptain') || line.includes('captain') || line.includes('קפטן')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('=== SEARCHING FOR CAPTAIN REFERENCES IN SRC AND FUNCTIONS ===');
searchCaptain('C:\\Users\\user\\OneDrive\\אפליקציות\\Fantazy Luzon\\Fantazi-lozon-main\\src');
searchCaptain('C:\\Users\\user\\OneDrive\\אפליקציות\\Fantazy Luzon\\Fantazi-lozon-main\\functions\\src');

process.exit(0);
