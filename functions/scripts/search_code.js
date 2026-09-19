const fs = require('fs');
const path = require('path');

function searchFiles(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath, pattern);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(pattern)) {
        console.log(`FOUND "${pattern}" in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes(pattern)) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('=== SEARCHING FOR "VS" IN SRC ===');
searchFiles('C:\\Users\\user\\OneDrive\\אפליקציות\\Fantazy Luzon\\Fantazi-lozon-main\\src', 'VS');

console.log('\n=== SEARCHING FOR "משחקי ליגת העל" IN SRC ===');
searchFiles('C:\\Users\\user\\OneDrive\\אפליקציות\\Fantazy Luzon\\Fantazi-lozon-main\\src', 'משחקי ליגת העל');

process.exit(0);
