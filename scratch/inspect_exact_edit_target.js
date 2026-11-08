const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('window.handleEditMemberSubmit =');
const eIdx = html.indexOf('window.deleteMember =', sIdx);
console.log(html.slice(sIdx - 50, eIdx + 50));

