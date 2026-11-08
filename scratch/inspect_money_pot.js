const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('initPaymentsTab');
console.log(html.slice(sIdx - 100, sIdx + 2000));

