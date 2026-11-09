const fs = require('fs');
const js = fs.readFileSync('scratch/payments_page_logic.js', 'utf8');
const logicIdx = js.indexOf('/* ===================== PAYMENTS PAGE LOGIC =====================');
console.log('Logic starts at:', logicIdx);
const productionPaymentsJs = js.substring(logicIdx);
fs.writeFileSync('scratch/production_payments_logic.js', productionPaymentsJs, 'utf8');
console.log('Saved scratch/production_payments_logic.js, length:', productionPaymentsJs.length);

