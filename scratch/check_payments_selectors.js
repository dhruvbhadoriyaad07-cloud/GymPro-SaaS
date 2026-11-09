const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
lines.slice(1080, 1450).forEach((line, idx) => {
  if (line.includes('#payments-view')) {
    console.log((1080 + idx + 1) + ': ' + line.trim());
  }
});

