const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const mIdx = html.indexOf('const initialMembersData = [');
const mEnd = html.indexOf('];', mIdx);
const mStr = html.slice(mIdx, mEnd + 2).replace('const initialMembersData', 'var initialMembersData');
eval(mStr);

const today = new Date();
today.setHours(0, 0, 0, 0);

let activeCount = 0;
let inactiveCount = 0;

initialMembersData.forEach(m => {
  const expDateStr = m.expiryDate || m.expiry;
  let isExpired = false;
  if (expDateStr) {
    const expDate = new Date(expDateStr);
    expDate.setHours(0, 0, 0, 0);
    if (expDate.getTime() < today.getTime()) isExpired = true;
  }
  if (m.status === 'inactive' || m.status === 'expired' || isExpired) {
    inactiveCount++;
  } else {
    activeCount++;
  }
});

console.log('Total members in sample data:', initialMembersData.length);
console.log('Active members:', activeCount);
console.log('Inactive members:', inactiveCount);

