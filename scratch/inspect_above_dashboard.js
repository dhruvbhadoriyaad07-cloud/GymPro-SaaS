const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const dbViewIdx = html.indexOf('id="dashboard-view"');
console.log(html.slice(dbViewIdx - 2000, dbViewIdx));

