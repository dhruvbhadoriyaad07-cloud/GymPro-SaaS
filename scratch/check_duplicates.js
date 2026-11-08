const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all occurrences of "expiring-members-section"
let pos = 0;
while (true) {
  let idx = html.indexOf('id="expiring-members-section"', pos);
  if (idx === -1) break;
  console.log('expiring-members-section found at index:', idx);
  pos = idx + 1;
}

// Find all occurrences of "dashboard-view"
pos = 0;
while (true) {
  let idx = html.indexOf('id="dashboard-view"', pos);
  if (idx === -1) break;
  console.log('dashboard-view found at index:', idx);
  pos = idx + 1;
}

// Check if there are multiple <main> or <body tags
console.log('count of <main>:', (html.match(/<main/g) || []).length);
console.log('count of <body:', (html.match(/<body/g) || []).length);
console.log('count of </html>:', (html.match(/<\/html>/g) || []).length);
console.log('count of <!DOCTYPE:', (html.match(/<!DOCTYPE/gi) || []).length);

