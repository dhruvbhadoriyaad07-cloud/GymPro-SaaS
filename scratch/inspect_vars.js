const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const amIdx = html.indexOf('allMembers =');
console.log('allMembers declaration index:', amIdx);
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (/\b(?:let|var|const)\s+allMembers\b|\b(?:let|var|const)\s+allTransactions\b/.test(l)) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

