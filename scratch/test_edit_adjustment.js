// Test edit adjustment logic
let allMembers = [
  { id: 'm-1', memberId: 'GYM-001', name: 'John Doe', plan: '1 Month', amount: 1500, dueAmount: 1500, paymentMode: 'UPI', status: 'active' }
];

let allTransactions = [
  { id: 'tx-1', name: 'John Doe', memberId: 'GYM-001', amount: 1500, mode: 'UPI', type: 'New Membership', date: '2026-11-07', time: '10:00 AM' }
];

let updatedTransactionsCalled = false;
function updateDashboardTransactions(list) {
  updatedTransactionsCalled = true;
  console.log('updateDashboardTransactions called with', list.length, 'transactions');
  console.log('Top transaction:', list[0]);
}

function updateDashboardMembers(list) {
  console.log('updateDashboardMembers called with', list.length, 'members');
}

function iso(d = new Date()) {
  return d.toISOString().split('T')[0];
}

// Simulate handleEditMemberSubmit
async function testEdit(docId, newAmount) {
  const name = 'John Doe';
  const phone = '9876543210';
  const plan = '3 Months';
  const expiryDate = '2027-02-07';
  const status = 'active';
  const amount = newAmount;

  const memberIdx = allMembers.findIndex(m => (m.id === docId || m.memberId === docId));
  const existingMember = memberIdx !== -1 ? allMembers[memberIdx] : null;
  const previousAmount = existingMember ? Number(existingMember.dueAmount ?? existingMember.amount ?? 0) : 0;
  const amountChanged = (amount !== previousAmount);

  console.log('Previous amount:', previousAmount, 'New amount:', amount, 'Changed?', amountChanged);

  if (memberIdx !== -1) {
    allMembers[memberIdx] = {
      ...allMembers[memberIdx],
      name,
      phone,
      plan,
      expiryDate,
      planExpiryDate: expiryDate,
      expiry: expiryDate,
      status,
      amount,
      dueAmount: amount
    };
  }

  if (amountChanged) {
    const now = new Date();
    const todayIsoStr = typeof iso === 'function' ? iso(now) : now.toISOString().split('T')[0];
    const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const adjustmentTx = {
      name: name,
      memberId: existingMember?.memberId || docId || 'GYM-ADJ',
      amount: amount,
      mode: existingMember?.paymentMode || 'UPI',
      type: 'Plan Adjustment',
      time: currentTimeStr,
      date: todayIsoStr,
      d: todayIsoStr
    };

    allTransactions.unshift({ id: `tx-adj-${Date.now()}`, ...adjustmentTx });
    updateDashboardTransactions([...allTransactions]);
  }

  updateDashboardMembers([...allMembers]);
}

testEdit('m-1', 4000).then(() => {
  console.log('Member after edit:', allMembers[0]);
  console.log('Total transactions:', allTransactions.length);
  if (allTransactions[0].type === 'Plan Adjustment' && allTransactions[0].amount === 4000) {
    console.log('PASS: Plan Adjustment transaction correctly created and prepended!');
  } else {
    console.error('FAIL!');
  }
});

