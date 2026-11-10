const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  'onclick="window.routeToPayments()"',
  'window.routeToPayments = function'
];

let allOk = true;
checks.forEach(c => {
  if (!html.includes(c)) {
    console.error("Missing:", c);
    allOk = false;
  } else {
    console.log("Found:", c);
  }
});

if (allOk) {
  console.log("CASH COLLECTED CARD CLICK VERIFICATION PASSED!");
} else {
  process.exit(1);
}

