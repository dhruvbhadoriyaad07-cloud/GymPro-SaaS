const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const mIdx = html.indexOf('const initialMembersData =');
console.log('initialMembersData index:', mIdx);
if (mIdx !== -1) {
  console.log(html.slice(mIdx, mIdx + 3000));
}

