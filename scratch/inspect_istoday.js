const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('function isToday');
console.log('isToday index:', idx);
if (idx !== -1) {
  console.log(html.slice(idx, idx + 800));
}

