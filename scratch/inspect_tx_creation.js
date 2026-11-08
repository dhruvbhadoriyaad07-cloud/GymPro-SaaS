const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const txMatches = [];
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (/addDoc\(collection\(db,\s*['"]transactions['"]\)/.test(l) || /allTransactions\.push/.test(l) || /allTransactions\.unshift/.test(l)) {
    console.log(`L${i+1}:`);
    console.log(lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 25)).join('\n'));
    console.log('-------------------------');
  }
});

