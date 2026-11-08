const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all elements with blur or opacity or rounded-full or absolute in body
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (/blur|ambient|backdrop|radial-gradient/i.test(l)) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

