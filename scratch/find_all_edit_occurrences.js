const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pos = 0;
while (true) {
  let idx = html.indexOf('handleEditMemberSubmit', pos);
  if (idx === -1) break;
  console.log('Match at', idx);
  console.log(html.slice(Math.max(0, idx - 50), Math.min(html.length, idx + 250)));
  console.log('----------------');
  pos = idx + 'handleEditMemberSubmit'.length;
}

