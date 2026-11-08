const assert = require('assert');

// 1. Plan prices & calculateExpectedRevenue
const planPrices = { '1 Month': 1500, 'Monthly': 1500, '2 Months': 2500, '3 Months': 4000, 'Quarterly': 4000, '6 Months': 7500, '1 Year': 12000, 'Yearly': 12000, 'Annual': 12000, 'Walk-in': 300 };

global.allMembers = [
  // 5 Active (Paid) = 4 * 1500 + 1 * 2500 = 8500
  { id: 'm1', name: 'Member 1', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm2', name: 'Member 2', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm3', name: 'Member 3', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm4', name: 'Member 4', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm5', name: 'Member 5', plan: '2 Months', amount: 2500, status: 'active' },
  // 5 Unpaid (Inactive / Expired / Pending) = 5 * 1500 = 7500
  { id: 'm6', name: 'Member 6', plan: '1 Month', amount: 1500, status: 'inactive' },
  { id: 'm7', name: 'Member 7', plan: '1 Month', amount: 1500, status: 'expired' },
  { id: 'm8', name: 'Member 8', plan: '1 Month', amount: 1500, status: 'pending' },
  { id: 'm9', name: 'Member 9', plan: '1 Month', amount: 1500, status: 'unpaid' },
  { id: 'm10', name: 'Member 10', plan: '1 Month', amount: 1500, status: 'inactive' }
];

global.allTransactions = [
  { id: 'tx1', memberId: 'm1', name: 'Member 1', amount: 1500, mode: 'UPI', type: 'New Membership' },
  { id: 'tx2', memberId: 'm2', name: 'Member 2', amount: 1500, mode: 'Cash', type: 'New Membership' },
  { id: 'tx3', memberId: 'm3', name: 'Member 3', amount: 1500, mode: 'UPI', type: 'New Membership' },
  { id: 'tx4', memberId: 'm4', name: 'Member 4', amount: 1500, mode: 'Card', type: 'Renewal' },
  { id: 'tx5', memberId: 'm5', name: 'Member 5', amount: 2500, mode: 'UPI', type: 'New Membership' }
];

global.window = global;

window.calculateExpectedRevenue = function() {
  const planPrices = { '1 Month': 1500, 'Monthly': 1500, '2 Months': 2500, '3 Months': 4000, 'Quarterly': 4000, '6 Months': 7500, '1 Year': 12000, 'Yearly': 12000, 'Annual': 12000, 'Walk-in': 300 };
  const membersList = (typeof allMembers !== 'undefined' && Array.isArray(allMembers)) ? allMembers : [];
  
  let expected = 0;
  let collected = 0;

  membersList.forEach(m => {
    // Get the specific saved amount, or fallback to the plan's standard price
    let fee = Number(m.amount) || Number(m.dueAmount) || planPrices[m.plan] || 1500;
    
    expected += fee; // Sum of ALL members' fees goes to Expected (16000)
    
    if (m.status === 'active') {
      collected += fee; // Only ACTIVE (Paid) members go to Collected (8500)
    }
  });
  
  window.currentPotCollected = collected; // Save for Money Pot UI
  return expected;
};

const exp = window.calculateExpectedRevenue();
const col = window.currentPotCollected;
const rem = exp - col;

console.log('Expected:', exp, 'Collected:', col, 'Remaining:', rem);
assert.strictEqual(exp, 16000);
assert.strictEqual(col, 8500);
assert.strictEqual(rem, 7500);

// Total cash calculation
const totalCashAll = (allTransactions || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
console.log('Total Cash All:', totalCashAll);
assert.strictEqual(totalCashAll, 8500);

// Test edit member
const docId = 'm5';
const newAmount = 3000;
const memberIdx = allMembers.findIndex(m => (m.id === docId || m.memberId === docId));
if (memberIdx !== -1) {
  allMembers[memberIdx].amount = newAmount;
}
for (let i = 0; i < allTransactions.length; i++) {
  const t = allTransactions[i];
  if (t.memberId === docId || t.id === docId || (t.name || '').toLowerCase() === allMembers[memberIdx].name.toLowerCase()) {
    allTransactions[i].amount = newAmount;
  }
}

const expAfterEdit = window.calculateExpectedRevenue();
const colAfterEdit = window.currentPotCollected;
console.log('After Edit - Expected:', expAfterEdit, 'Collected:', colAfterEdit);
assert.strictEqual(expAfterEdit, 16500);
assert.strictEqual(colAfterEdit, 9000);

// Test delete member
const delId = 'm5';
const delName = 'Member 5';
allMembers = allMembers.filter(m => (m.id !== delId && m.memberId !== delId));
allTransactions = allTransactions.filter(t => (t.memberId !== delId && t.id !== delId && (t.name || '').toLowerCase() !== delName.toLowerCase()));

const expAfterDel = window.calculateExpectedRevenue();
const colAfterDel = window.currentPotCollected;
console.log('After Delete - Expected:', expAfterDel, 'Collected:', colAfterDel, 'Members:', allMembers.length, 'Transactions:', allTransactions.length);
assert.strictEqual(allMembers.length, 9);
assert.strictEqual(allTransactions.length, 4);
assert.strictEqual(expAfterDel, 13500);
assert.strictEqual(colAfterDel, 6000);

console.log('All logic tests PASSED!');

