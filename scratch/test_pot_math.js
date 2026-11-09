const fs = require('fs');
const js = fs.readFileSync('scratch/production_payments_logic.js', 'utf8');

// Let's test the pot calculation in isolation
const testMembers = [
  { id: 'GYM-1586', memberId: 'GYM-1586', name: 'Mohit', phone: '+91 7584691238', plan: '1 Month', amount: 1500, expiryDate: '2026-11-05', status: 'expired' },
  { id: 'GYM-7257', memberId: 'GYM-7257', name: 'Sahil', phone: '+91 7584569325', plan: '1 Month', amount: 1500, expiryDate: '2026-12-08', status: 'active' },
  { id: 'GYM-5152', memberId: 'GYM-5152', name: 'Dhruv Singh Bhadoriya', phone: '+91 8269583846', plan: '1 Month', amount: 1500, expiryDate: '2026-12-08', status: 'active' }
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
testMembers.forEach(m => {
  const f = fee(m);
  expected += f;
  const st = state(m);
  console.log(`Member ${m.name}: fee=${f}, daysLeft=${daysLeft(m)}, status=${m.status}, state=${st}`);
  if (st !== 'x') collected += f;
});

console.log(`Expected: ${expected}, Collected: ${collected}, Remaining: ${expected - collected}`);

