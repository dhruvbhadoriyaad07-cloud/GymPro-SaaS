const fs = require('fs');
const js = fs.readFileSync('scratch/production_payments_logic.js', 'utf8');
const lines = js.split('\n');
console.log('Lines 181 to end:');
console.log(lines.slice(180).join('\n'));

