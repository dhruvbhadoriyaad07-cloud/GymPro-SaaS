// Test overwriting existing transaction amount
let allTransactions = [
  { id: 'tx-1', name: 'Sahil', memberId: 'GYM-0099', amount: 1500, mode: 'UPI', type: 'New Membership', date: '2026-11-07', time: '01:05 PM' },
  { id: 'tx-2', name: 'Priya Nair', memberId: 'GYM-0042', amount: 1500, mode: 'Cash', type: 'New Membership', date: '2026-11-07', time: '11:14 AM' }
];

let allMembers = [
  { id: 'doc-sahil', memberId: 'GYM-0099', name: 'Sahil', plan: '1 Month', amount: 1500, dueAmount: 1500, status: 'active' }
];

const docId = 'doc-sahil';
const name = 'Sahil';
const amount = 2500;

// Logic from prompt:
const memberIdx = allMembers.findIndex(m => (m.id === docId || m.memberId === docId));
const existingMember = memberIdx !== -1 ? allMembers[memberIdx] : null;
const targetMemberId = existingMember?.memberId || docId;

// Find the member's most recent transaction based on memberId or name
const targetTx = allTransactions.find(t => {
  const matchId = (targetMemberId && t.memberId === targetMemberId) || (docId && (t.memberId === docId || t.id === docId));
  const matchName = t.name && name && t.name.trim().toLowerCase() === name.trim().toLowerCase();
  return matchId || matchName;
});

console.log('Found transaction before:', targetTx);

if (targetTx) {
  // Force an overwrite of the amount field in that specific transaction record
  targetTx.amount = amount;
}

console.log('Found transaction after:', targetTx);
console.log('allTransactions[0].amount:', allTransactions[0].amount);

if (allTransactions[0].amount === 2500) {
  console.log('PASS: Transaction amount overwritten directly to 2500!');
} else {
  console.error('FAIL!');
}

