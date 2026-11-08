const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const fnIdx = html.indexOf('function updateDashboardTransactions');
console.log('updateDashboardTransactions index:', fnIdx);
if (fnIdx !== -1) {
  console.log(html.slice(fnIdx, fnIdx + 2000));
}

const fnMIdx = html.indexOf('function updateDashboardMembers');
console.log('updateDashboardMembers index:', fnMIdx);
if (fnMIdx !== -1) {
  console.log(html.slice(fnMIdx, fnMIdx + 2000));
}

