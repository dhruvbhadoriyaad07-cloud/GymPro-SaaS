const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const lines = html.split('\n');
lines.forEach((l, i) => {
  if (/payments-table-body|renderPayments|payment-table/i.test(l)) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

