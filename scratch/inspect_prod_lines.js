const fs = require('fs');
const js = fs.readFileSync('scratch/production_payments_logic.js', 'utf8');
const lines = js.split('\n');
console.log('Lines 1 to 80:');
console.log(lines.slice(0, 80).join('\n'));

