const fs = require('fs');
const js = fs.readFileSync('scratch/production_payments_logic.js', 'utf8');
const lines = js.split('\n');
console.log('Total lines:', lines.length);
console.log('Lines 81 to 180:');
console.log(lines.slice(80, 180).join('\n'));

