const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id=\"dashboard-statistics-section\"');
const eIdx = html.indexOf('id=\"expiring-members-section\"');
console.log(html.slice(sIdx, eIdx));

