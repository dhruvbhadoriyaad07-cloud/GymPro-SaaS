const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('function updateDashboardTransactions(txList)');
const eIdx = html.indexOf('function renderTable(filter)', sIdx);
console.log(html.slice(sIdx, eIdx));

