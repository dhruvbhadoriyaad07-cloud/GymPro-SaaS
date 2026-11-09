const fs = require('fs');
const html = fs.readFileSync('scratch/preview_template.html', 'utf8');
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
console.log('Script length:', scriptEnd - scriptStart);
console.log(html.substring(scriptStart, scriptStart + 1000));
console.log('--- SCRIPT END PREVIEW ---');
console.log(html.substring(scriptEnd - 1000, scriptEnd + 9));

