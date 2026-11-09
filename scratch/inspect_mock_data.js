const fs = require('fs');
const js = fs.readFileSync('scratch/payments_page_logic.js', 'utf8');
const lines = js.split('\n');
console.log('Lines 1 to 40:');
console.log(lines.slice(0, 40).join('\n'));

