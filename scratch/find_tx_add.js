const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('collection(db, "transactions")') || line.includes("collection(db, 'transactions')")) {
    console.log((idx + 1) + ': ' + line.trim());
  }
});

