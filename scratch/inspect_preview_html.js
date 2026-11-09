const fs = require('fs');
const html = fs.readFileSync('scratch/preview_template.html', 'utf8');
const bodyStart = html.indexOf('<div class="wrap">');
const scriptStart = html.indexOf('<script>');
console.log('--- WRAP HTML ---');
console.log(html.substring(bodyStart, bodyStart + 1500));
console.log('--- WRAP HTML END ---');
console.log(html.substring(scriptStart - 500, scriptStart));

