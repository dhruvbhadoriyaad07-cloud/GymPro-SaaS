const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('class="stats"');
console.log('index of stats:', idx);
if (idx !== -1) {
  console.log(html.slice(idx - 200, idx + 1500));
}

// Also search for any SVG or image or logo in dashboard-view
const dbViewIdx = html.indexOf('id="dashboard-view"');
console.log('index of dashboard-view:', dbViewIdx);
if (dbViewIdx !== -1) {
  console.log(html.slice(dbViewIdx, dbViewIdx + 1200));
}

