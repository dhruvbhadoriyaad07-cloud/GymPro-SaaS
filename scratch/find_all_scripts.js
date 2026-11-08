const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<script\b[^>]*>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(`Script tag at ${match.index}: ${match[0]}`);
}

