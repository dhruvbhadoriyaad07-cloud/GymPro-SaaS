const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function initDemoState')) {
    console.log(lines.slice(i - 2, i + 30).join('\n'));
    break;
  }
}

