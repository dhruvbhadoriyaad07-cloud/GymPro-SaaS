const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const startMarker = '<div id="payments-view"';
const endMarker = '</div><!-- ════ End #payments-view ════ -->';

const startPos = html.indexOf(startMarker);
const endPos = html.indexOf(endMarker);

console.log('Start index:', startPos);
console.log('End index:', endPos);

const snippetBefore = html.substring(startPos - 120, startPos);
console.log('Snippet before:\n', snippetBefore);

const snippetAfter = html.substring(endPos + endMarker.length, endPos + endMarker.length + 120);
console.log('Snippet after:\n', snippetAfter);

