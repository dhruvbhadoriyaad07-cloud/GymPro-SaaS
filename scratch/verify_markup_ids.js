const fs = require('fs');
const html = fs.readFileSync('scratch/payments_view_markup.html', 'utf8');

const requiredIds = [
  'pay-kpis',
  'squid-pot-status',
  'stage',
  'gpPile',
  'squid-expected-revenue',
  'squid-pot-collected',
  'squid-remaining-revenue',
  'squid-pot-percentage',
  'squid-members-count',
  'pay-trend',
  'pay-range',
  'pay-mix',
  'pay-pending',
  'pl-modes',
  'pl-type',
  'pl-q',
  'pl-count',
  'pl-rows',
  'pl-foot',
  'pay-quick',
  'pay-quick-form'
];

requiredIds.forEach(id => {
  const found = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  console.log(`${id}: ${found}`);
});

