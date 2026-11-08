const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const pos = content.indexOf('gpPile');
const pre = content.substring(Math.max(0, pos - 15000), pos);
const matches = [...pre.matchAll(/id="([a-zA-Z0-9_-]+(?:view|tab|section|panel))"/gi)];
console.log('View IDs preceding gpPile:', matches.map(m => m[1]));
