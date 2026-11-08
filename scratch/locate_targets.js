const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

function findRange(pattern, len = 20) {
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      console.log(`Matched at line ${i+1}:`);
      console.log(lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + len)).join('\n'));
      console.log('-------------------------------------------');
      break;
    }
  }
}

console.log('1. Ambient lighting backdrop:');
findRange(/AMBIENT RADIAL LIGHTING BACKDROP/, 12);

console.log('2. .st::after:');
findRange(/\.st::after\s*\{/, 15);

console.log('3. updateFirebaseStatus:');
findRange(/function updateFirebaseStatus/, 25);

console.log('4. initialMembersData:');
findRange(/const initialMembersData =/, 15);

console.log('5. initialTransactionsData:');
findRange(/const initialTransactionsData =/, 20);

console.log('6. initDemoState:');
findRange(/function initDemoState/, 15);

