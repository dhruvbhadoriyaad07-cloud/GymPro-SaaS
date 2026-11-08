// Simulation of User Scenario:
// 10 members: 5 paid (total 8500), 5 not paid (total 7500 expected)

const allMembers = [
  // 5 paid members
  { id: 'm1', name: 'Member 1', amount: 1500, dueAmount: 1500 },
  { id: 'm2', name: 'Member 2', amount: 2000, dueAmount: 2000 },
  { id: 'm3', name: 'Member 3', amount: 2000, dueAmount: 2000 },
  { id: 'm4', name: 'Member 4', amount: 1500, dueAmount: 1500 },
  { id: 'm5', name: 'Member 5', amount: 1500, dueAmount: 1500 },
  // 5 unpaid members (total 7500 expected: 5 * 1500 = 7500)
  { id: 'm6', name: 'Member 6', amount: 1500, dueAmount: 1500 },
  { id: 'm7', name: 'Member 7', amount: 1500, dueAmount: 1500 },
  { id: 'm8', name: 'Member 8', amount: 1500, dueAmount: 1500 },
  { id: 'm9', name: 'Member 9', amount: 1500, dueAmount: 1500 },
  { id: 'm10', name: 'Member 10', amount: 1500, dueAmount: 1500 }
];

const allTransactions = [
  // 5 paid transactions totaling 8500
  { memberId: 'm1', name: 'Member 1', amount: 1500 },
  { memberId: 'm2', name: 'Member 2', amount: 2000 },
  { memberId: 'm3', name: 'Member 3', amount: 2000 },
  { memberId: 'm4', name: 'Member 4', amount: 1500 },
  { memberId: 'm5', name: 'Member 5', amount: 1500 }
];

function total(list = allTransactions) {
  const targetList = Array.isArray(list) ? list : (allTransactions || []);
  return targetList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

function calculateExpectedRevenue() {
  const membersList = (typeof allMembers !== 'undefined' && Array.isArray(allMembers)) ? allMembers : [];
  const txList = (typeof allTransactions !== 'undefined' && Array.isArray(allTransactions)) ? allTransactions : [];

  let expected = 0;
  membersList.forEach(m => {
    expected += (Number(m.amount) || Number(m.dueAmount) || 1500);
  });

  const collected = txList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpected = Math.max(expected, collected);
  return totalExpected === 0 ? 10000 : totalExpected;
}

const expectedRevenue = calculateExpectedRevenue();
const actualCollected = total(allTransactions);
const remaining = Math.max(0, expectedRevenue - actualCollected);

console.log('Expected Revenue:', expectedRevenue); // Should be 16000
console.log('Actual Collected:', actualCollected); // Should be 8500
console.log('Remaining:', remaining);               // Should be 7500

if (expectedRevenue === 16000 && actualCollected === 8500 && remaining === 7500) {
  console.log('\nSUCCESS: Scenario math works 100% perfectly!');
} else {
  console.error('\nFAIL: Numbers do not match!');
  process.exit(1);
}

