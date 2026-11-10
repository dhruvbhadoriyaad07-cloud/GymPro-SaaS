const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  'onclick="window.routeToExpiringSoon()"',
  'window.routeToExpiringSoon = function',
  "switchView('members')",
  "filterMembersByStatus('soon')"
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
  console.log("EXPIRING SOON -> MEMBERS TAB VERIFICATION PASSED!");
} else {
  process.exit(1);
}
