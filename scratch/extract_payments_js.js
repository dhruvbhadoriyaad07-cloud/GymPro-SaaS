const fs = require('fs');
const html = fs.readFileSync('scratch/preview_template.html', 'utf8');

// Find where the gullak script ends and payments script starts
const gullakEnd = html.indexOf('/* PASTE-3-END */');
const scriptEnd = html.lastIndexOf('</script>');

console.log('Gullak end at:', gullakEnd);
if (gullakEnd !== -1) {
  const paymentsJs = html.substring(gullakEnd + 17, scriptEnd);
  console.log('Payments JS length:', paymentsJs.length);
  fs.writeFileSync('scratch/payments_page_logic.js', paymentsJs.trim(), 'utf8');
  console.log('Saved scratch/payments_page_logic.js');
} else {
  console.log('Looking for (function () { after gullak...');
}

