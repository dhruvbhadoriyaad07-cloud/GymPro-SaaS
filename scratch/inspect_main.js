const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const mainIdx = html.indexOf('<main');
console.log(html.slice(mainIdx, mainIdx + 1200));

