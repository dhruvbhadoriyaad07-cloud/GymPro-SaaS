const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('function updateFirebaseStatus');
console.log(html.slice(sIdx, sIdx + 1500));

