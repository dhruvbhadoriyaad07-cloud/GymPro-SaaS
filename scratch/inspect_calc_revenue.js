const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('function calculateExpectedRevenue');
console.log('calculateExpectedRevenue index:', idx);
if (idx !== -1) {
  console.log(html.slice(idx, idx + 2500));
}

