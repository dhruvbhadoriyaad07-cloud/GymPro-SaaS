const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('function updateDashboardTransactions');
console.log(html.slice(idx + 1800, idx + 4000));

