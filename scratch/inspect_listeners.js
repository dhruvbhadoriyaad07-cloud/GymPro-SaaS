const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const flIdx = html.indexOf('function initFirestoreListeners');
console.log('initFirestoreListeners index:', flIdx);
if (flIdx !== -1) {
  console.log(html.slice(flIdx, flIdx + 2500));
}

