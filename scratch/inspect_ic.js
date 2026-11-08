const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const icMatches = html.match(/\.ic\b[^{]*\{[^}]*\}/g) || [];
console.log('ic CSS:', icMatches);
const stMatches = html.match(/\.st\b[^{]*\{[^}]*\}/g) || [];
console.log('st CSS:', stMatches);

