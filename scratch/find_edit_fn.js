const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('handleEditMemberSubmit');
console.log('handleEditMemberSubmit index:', idx);
if (idx !== -1) {
  console.log(html.slice(idx - 100, idx + 2500));
}

