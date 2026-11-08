const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Mock helpers
function iso(d = new Date()) {
  return d.toISOString().split('T')[0];
}
function today() {
  return new Date();
}
function isToday(t) {
  if (!t) return false;
  const todayStr = iso(today());
  const txDate = t.d || t.date;
  if (!txDate) return false;
  if (typeof txDate === 'string') return txDate.startsWith(todayStr);
  return false;
}

global.iso = iso;
global.today = today;
global.isToday = isToday;

// Set up allTransactions with today transactions and past transactions
global.allTransactions = [
  { name: 'Priya', amount: 1500, type: 'New Membership', date: iso(today()) },
  { name: 'Karan', amount: 1500, type: 'Renewal', date: iso(today()) },
  { name: 'Old Historical 1', amount: 50000, type: 'New Membership', date: '2025-01-01' },
  { name: 'Old Historical 2', amount: 45000, type: 'Renewal', date: '2025-02-01' }
];

global.allMembers = [];

const sIdx = html.indexOf('function calculateExpectedRevenue() {');
const eIdx = html.indexOf('function getNeonModeBadge(mode) {', sIdx);
const fnCode = html.slice(sIdx, eIdx);
eval(fnCode);

const rev = calculateExpectedRevenue();
console.log('Calculated expected revenue with 95k historical txs:', rev);

if (rev < 20000) {
  console.log('SUCCESS: Historical transactions correctly ignored!');
} else {
  console.error('FAILURE: Historical transactions still included!');
  process.exit(1);
}

