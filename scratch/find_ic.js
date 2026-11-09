const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
lines.slice(0, 1500).forEach((line, idx) => {
  if (line.includes('.ic {') || line.includes('.ic{') || line.includes('.ic ')) {
    console.log((idx + 1) + ': ' + line.trim());
  }
});

