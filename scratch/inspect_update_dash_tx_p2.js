const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('function updateDashboardTransactions(txList)');
console.log(html.slice(sIdx + 1500, sIdx + 3000));

