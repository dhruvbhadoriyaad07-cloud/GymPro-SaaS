const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('function calculateExpectedRevenue() {');
const eIdx = html.indexOf('function getNeonModeBadge(mode) {', sIdx);
console.log(html.slice(sIdx, eIdx));

