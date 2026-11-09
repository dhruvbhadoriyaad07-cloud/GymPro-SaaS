const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
let inside = false;
let divCount = 0;
let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!inside && line.includes('id="payments-view"')) {
    inside = true;
    startLine = i + 1;
    divCount = (line.match(/<div\b/g) || []).length - (line.match(/<\/div>/g) || []).length;
    continue;
  }
  if (inside) {
    divCount += (line.match(/<div\b/g) || []).length - (line.match(/<\/div>/g) || []).length;
    if (divCount <= 0) {
      endLine = i + 1;
      break;
    }
  }
}

console.log(`payments-view from line ${startLine} to line ${endLine}`);

