const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
console.log(lines.slice(1650, 1720).join('\n'));

