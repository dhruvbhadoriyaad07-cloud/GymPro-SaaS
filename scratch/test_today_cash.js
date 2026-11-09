const assert = require('assert');

// Simulate date utilities
function iso(d = new Date()) {
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const currentTodayStr = '2026-11-08';

function isToday(t) {
  if (!t) return false;
  const todayStr = currentTodayStr;
  const txDate = t.d || t.date;
  if (!txDate) return false;
  if (typeof txDate === 'string') return txDate.startsWith(todayStr);
  if (txDate instanceof Date) return iso(txDate) === todayStr;
  if (txDate && txDate.seconds) return iso(new Date(txDate.seconds * 1000)) === todayStr;
  return false;
}

const allTransactions = [
  { id: 'tx-1', name: 'Sahil', type: 'New Membership', date: '2026-11-08', d: '2026-11-08', time: '09:42 AM', mode: 'Cash', amount: 1500 },
  { id: 'tx-2', name: 'Dhruv Singh Bhadoriya', type: 'New Membership', date: '2026-11-08', d: '2026-11-08', time: '09:41 AM', mode: 'UPI', amount: 1500 },
  { id: 'tx-3', name: 'Mohit', type: 'New Membership', date: '2026-10-05', d: '2026-10-05', time: '12:00 PM', mode: 'UPI', amount: 1500 }
];

const total = function(list) {
  return (list || allTransactions || []).filter(t => isToday(t)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

const by = function(mode, list) {
  const modeLower = (mode || '').toLowerCase().trim();
  return (list || allTransactions || [])
    .filter(t => isToday(t) && (t.mode || '').toLowerCase().trim() === modeLower)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

const todayTxList = allTransactions.filter(t => isToday(t));
const totalCashToday = total(todayTxList);
const cashToday = by('Cash', todayTxList);
const upiToday = by('UPI', todayTxList);

console.log('Today tx count:', todayTxList.length);
console.log('Total Cash Today:', totalCashToday);
console.log('Cash Today:', cashToday);
console.log('UPI Today:', upiToday);

assert.strictEqual(todayTxList.length, 2, 'Should only have 2 transactions for today');
assert.strictEqual(totalCashToday, 3000, 'Total today cash should be 3000, not 4500');
assert.strictEqual(cashToday, 1500, 'Cash today should be 1500');
assert.strictEqual(upiToday, 1500, 'UPI today should be 1500');

// All-time transactions in ledger
console.log('Total all-time tx count for ledger:', allTransactions.length);
assert.strictEqual(allTransactions.length, 3, 'Ledger should keep all 3 transactions');

console.log('Test PASSED!');

