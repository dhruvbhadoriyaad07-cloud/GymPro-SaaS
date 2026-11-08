const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('id="edit-member-expiry"');
console.log(html.slice(idx, idx + 1500));

