const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const mIdx = html.indexOf('const initialMembersData =');
const mEnd = html.indexOf('const initialTransactionsData =');
// Only extract initialMembersData array
const scriptContent = html.slice(mIdx, mEnd);

const fn = new Function(scriptContent + '; return initialMembersData;');
const initialMembersData = fn();

const now = new Date();
now.setHours(0, 0, 0, 0);

let activeCount = 0;
let inactiveCount = 0;

initialMembersData.forEach(m => {
  const expDateStr = m.expiryDate || m.expiry;
  let isExpired = false;
  if (expDateStr) {
    const expDate = new Date(expDateStr);
    expDate.setHours(0, 0, 0, 0);
    if (expDate.getTime() < now.getTime()) isExpired = true;
  }
  if (m.status === 'inactive' || m.status === 'expired' || isExpired) {
    inactiveCount++;
  } else {
    activeCount++;
  }
});

console.log('Total members:', initialMembersData.length);
console.log('Active members:', activeCount);
console.log('Inactive members:', inactiveCount);

function daysLeft(dateStr) {
  if (!dateStr) return 999;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

let countToday = 0;
let countWeek = 0;
let countMonth = 0;
initialMembersData.forEach(m => {
  const days = daysLeft(m.expiryDate || m.expiry);
  if (days === 0) countToday++;
  if (days >= 0 && days <= 7) countWeek++;
  if (days >= 0 && days <= 30) countMonth++;
});

console.log('countToday:', countToday, 'countWeek:', countWeek, 'countMonth:', countMonth);
