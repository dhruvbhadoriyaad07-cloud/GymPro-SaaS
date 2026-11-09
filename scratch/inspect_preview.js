const fs = require('fs');
const html = fs.readFileSync('scratch/preview_template.html', 'utf8');
console.log('File length:', html.length);
const bodyStart = html.indexOf('<div class="wrap">');
const scriptStart = html.indexOf('<script>');
console.log('wrap starts at:', bodyStart, 'script starts at:', scriptStart);

