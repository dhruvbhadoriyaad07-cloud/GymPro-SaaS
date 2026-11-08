const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('split-label-cash');
console.log(html.slice(sIdx, sIdx + 1500));

