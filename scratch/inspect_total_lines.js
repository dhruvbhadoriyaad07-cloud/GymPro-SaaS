const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('function total(');
console.log(html.slice(sIdx - 50, sIdx + 450));

