const fs = require('fs');
const html = fs.readFileSync('scratch/payments_view_markup.html', 'utf8');
const lines = html.split('\n');
console.log('Lines count:', lines.length);
console.log('First 30 lines:');
console.log(lines.slice(0, 30).join('\n'));
console.log('Last 20 lines:');
console.log(lines.slice(lines.length - 20).join('\n'));

