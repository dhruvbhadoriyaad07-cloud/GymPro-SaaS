const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Check all element IDs accessed in calculateAndRenderStats, updateDashboardMembers, updateDashboardTransactions
const accessedIds = [];
const regex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
while ((match = regex.exec(html)) !== null) {
  if (!accessedIds.includes(match[1])) {
    accessedIds.push(match[1]);
  }
}

console.log('Total unique getElementById in index.html:', accessedIds.length);
const missingInDom = accessedIds.filter(id => !html.includes(`id=\"${id}\"`));
console.log('Missing in DOM:', missingInDom);

