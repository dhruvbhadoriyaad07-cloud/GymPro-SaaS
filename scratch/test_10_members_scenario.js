const fs = require('fs');

const test10Members = [
  // 5 Active / Paid:
  { id: 'm1', name: 'Paid 1', plan: '1 Month', amount: 1500, expiryDate: '2026-12-08', status: 'active' },
  { id: 'm2', name: 'Paid 2', plan: '1 Month', amount: 1500, expiryDate: '2026-12-08', status: 'active' },
  { id: 'm3', name: 'Paid 3', plan: '1 Month', amount: 1500, expiryDate: '2026-12-08', status: 'active' },
  { id: 'm4', name: 'Paid 4', plan: '1 Month', amount: 1500, expiryDate: '2026-12-08', status: 'active' },
  { id: 'm5', name: 'Paid 5 (2 months)', plan: '2 Months', amount: 2500, expiryDate: '2027-01-08', status: 'active' },
  // 5 Unpaid / Expired:
  { id: 'm6', name: 'Unpaid 1', plan: '1 Month', amount: 1500, expiryDate: '2026-11-01', status: 'expired' },
  { id: 'm7', name: 'Unpaid 2', plan: '1 Month', amount: 1500, expiryDate: '2026-11-01', status: 'expired' },
  { id: 'm8', name: 'Unpaid 3', plan: '1 Month', amount: 1500, expiryDate: '2026-11-01', status: 'expired' },
  { id: 'm9', name: 'Unpaid 4', plan: '1 Month', amount: 1500, expiryDate: '2026-11-01', status: 'expired' },
  { id: 'm10', name: 'Unpaid 5', plan: '1 Month', amount: 1500, expiryDate: '2026-11-01', status: 'expired' }
];

const PRICES = { '1 Month': 1500, 'Monthly': 1500, '2 Months': 2500, '3 Months': 4000, 'Quarterly': 4000, '6 Months': 7500, '1 Year': 12000, 'Yearly': 12000, 'Annual': 12000, 'Walk-in': 300 };
function fee(m) { return Number(m.amount) || Number(m.dueAmount) || PRICES[m.plan] || 1500; }
function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function expOf(m) {
  var v = m.expiryDate || m.planExpiryDate || m.expiry; if (!v) return null;
  var d = typeof v.toDate === 'function' ? v.toDate() : v.seconds ? new Date(v.seconds * 1000) : new Date(v);
  if (isNaN(d.getTime())) return null; d.setHours(0, 0, 0, 0); return d;
}
function daysLeft(m) { var e = expOf(m); return e ? Math.round((e - today()) / 864e5) : null; }
function state(m) {
  var d = daysLeft(m), s = String(m.status || '').toLowerCase();
  if (s === 'expired' || s === 'inactive' || d === null || d < 0) return 'x';
  return d <= 7 ? 'e' : 'a';
}

let expected = 0, collected = 0;
test10Members.forEach(m => {
  const f = fee(m);
  expected += f;
  if (state(m) !== 'x') collected += f;
});

console.log('10 Members Scenario:');
console.log('Expected:', expected, '(Target: 16000)');
console.log('Collected:', collected, '(Target: 8500)');
console.log('Remaining:', expected - collected, '(Target: 7500)');

if (expected === 16000 && collected === 8500 && (expected - collected) === 7500) {
  console.log('>>> 10-MEMBER SCENARIO 100% PASSED!');
} else {
  console.error('>>> 10-MEMBER SCENARIO FAILED!');
}

