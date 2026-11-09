const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Verify Card 5 HTML
const cardHtmlChecks = [
  '<span>EXPIRED MEMBERS</span>',
  '<h1 id="kpi-expired-count">0</h1>',
  '<span id="kpi-expired-delta">● Total inactive plans</span>',
  'onclick="window.routeToExpiredMembers()"'
];

let ok = true;
cardHtmlChecks.forEach(check => {
  if (!html.includes(check)) {
    console.error("FAIL: Missing in HTML:", check);
    ok = false;
  } else {
    console.log("PASS: Found in HTML:", check);
  }
});

// 2. Verify JS logic
const jsChecks = [
  'document.getElementById(\'kpi-expired-count\')',
  'window.routeToExpiredMembers = function'
];

jsChecks.forEach(check => {
  if (!html.includes(check)) {
    console.error("FAIL: Missing in JS:", check);
    ok = false;
  } else {
    console.log("PASS: Found in JS:", check);
  }
});

if (ok) {
  console.log("\nALL EXPIRED CARD VERIFICATION CHECKS PASSED!");
} else {
  process.exit(1);
}

