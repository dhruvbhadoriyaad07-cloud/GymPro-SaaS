const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id="dashboard-statistics-section"');
console.log(html.slice(sIdx, sIdx + 3000));

