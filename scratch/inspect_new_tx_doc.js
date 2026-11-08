const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
console.log(lines.slice(4520, 4570).join('\n'));

