const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (/logo/i.test(l)) {
    console.log(`L${i+1}: ${l}`);
  }
});

