const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const viewIds = html.match(/id="[^"]*-view"/g) || [];
console.log('View IDs:', viewIds);

