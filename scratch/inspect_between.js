const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const mIdx = html.indexOf('const initialMembersData =');
const tIdx = html.indexOf('const initialTransactionsData =');
console.log(html.slice(mIdx + 2000, tIdx));

