const fs = require('fs');
const html = fs.readFileSync('scratch/preview_template.html', 'utf8');

const startTag = '<div id="payments-view"';
const endTag = '</div><!-- ════ End #payments-view ════ -->';

const sIdx = html.indexOf(startTag);
const eIdx = html.indexOf(endTag);

console.log('sIdx:', sIdx, 'eIdx:', eIdx);
if (sIdx !== -1 && eIdx !== -1) {
  const paymentsHtml = html.substring(sIdx, eIdx + endTag.length);
  console.log('Extracted payments HTML length:', paymentsHtml.length);
  fs.writeFileSync('scratch/payments_view_markup.html', paymentsHtml, 'utf8');
  console.log('Saved scratch/payments_view_markup.html');
}

