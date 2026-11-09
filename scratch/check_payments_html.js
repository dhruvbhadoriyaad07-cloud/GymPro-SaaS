const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const pos = content.lastIndexOf('id="payments-total-counter"');
console.log(content.substring(pos - 1000, pos));
