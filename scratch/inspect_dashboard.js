const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Search for the section around dashboard-view and stats
const dbViewIdx = html.indexOf('id="dashboard-view"');
console.log(html.slice(dbViewIdx - 500, dbViewIdx + 2500));

