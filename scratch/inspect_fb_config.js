const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const fcIdx = html.indexOf('const firebaseConfig =');
console.log('firebaseConfig index:', fcIdx);
if (fcIdx !== -1) {
  console.log(html.slice(fcIdx, fcIdx + 1500));
}

