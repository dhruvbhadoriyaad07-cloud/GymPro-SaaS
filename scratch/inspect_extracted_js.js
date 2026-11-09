const fs = require('fs');
const js = fs.readFileSync('scratch/payments_page_logic.js', 'utf8');
console.log('--- START (500 chars) ---');
console.log(js.substring(0, 500));
console.log('--- END (500 chars) ---');
console.log(js.substring(js.length - 500));

