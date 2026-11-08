const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('<script type="module">');
const eIdx = html.indexOf('</script>', sIdx);

const scriptContent = html.slice(sIdx, eIdx + 9);
console.log('Script length chars:', scriptContent.length);
console.log('Script line count:', scriptContent.split('\n').length);

