const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('function calculateExpectedRevenue');
console.log(html.slice(idx + 1500, idx + 3500));

