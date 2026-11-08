const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const tIdx = html.indexOf('const initialTransactionsData =');
console.log('initialTransactionsData index:', tIdx);
if (tIdx !== -1) {
  console.log(html.slice(tIdx, tIdx + 2000));
}

