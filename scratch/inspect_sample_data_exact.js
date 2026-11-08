const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('// ── Initial Sample Data (used in demo mode & seeder) ─');
const eIdx = html.indexOf('const activities = [');
console.log('Target length:', eIdx - sIdx);
console.log(html.slice(sIdx, sIdx + 400));
console.log('--- END PART ---');
console.log(html.slice(eIdx - 200, eIdx));

