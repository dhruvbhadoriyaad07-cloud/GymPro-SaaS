const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Firebase initialization skipped')) {
    console.log(lines.slice(i - 5, i + 15).join('\n'));
    break;
  }
}

