const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Mock DOM
const elements = {};
function getOrCreate(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      value: '',
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      addEventListener: () => {},
      remove: () => {},
      disabled: false,
      getAttribute: () => '',
      setAttribute: () => {},
      querySelector: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } })
    };
  }
  return elements[id];
}

const mockDocument = {
  getElementById: (id) => getOrCreate(id),
  querySelectorAll: () => [],
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
  createElementNS: () => ({ setAttribute: () => {}, appendChild: () => {}, style: { setProperty: () => {} } })
};

const sandbox = {
  window: {},
  document: mockDocument,
  console,
  setTimeout,
  clearTimeout,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => { setTimeout(cb, 10); },
  isFirebaseLive: false,
  db: null,
  allMembers: [],
  allTransactions: [],
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`)
};
sandbox.window = sandbox;

// Read index.html and extract script blocks
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];

// Find module script
const moduleMatch = scriptMatches.find(m => m[0].includes('type="module"'));
const moduleCode = moduleMatch[1]
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, ''); // strip imports for VM

vm.createContext(sandbox);

// Provide minimal Firestore mock stubs in case called
sandbox.doc = () => ({ id: 'docRef' });
sandbox.collection = () => ({ id: 'colRef' });
sandbox.query = () => ({});
sandbox.where = () => ({});
sandbox.getDocs = async () => ({ empty: true, docs: [] });
sandbox.updateDoc = async () => {};
sandbox.deleteDoc = async () => {};
sandbox.serverTimestamp = () => new Date();

try {
  vm.runInContext(moduleCode, sandbox);
  console.log('Module script executed cleanly in VM.');
} catch (err) {
  console.error('Error executing module script:', err);
  process.exit(1);
}

// Setup the exact user scenario: 10 members (5 active, 5 inactive/unpaid)
vm.runInContext(`
allMembers = [
  { id: 'm1', memberId: 'm1', name: 'Member 1', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm2', memberId: 'm2', name: 'Member 2', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm3', memberId: 'm3', name: 'Member 3', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm4', memberId: 'm4', name: 'Member 4', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm5', memberId: 'm5', name: 'Member 5', plan: '2 Months', amount: 2500, status: 'active' },
  { id: 'm6', memberId: 'm6', name: 'Member 6', plan: '1 Month', amount: 1500, status: 'inactive' },
  { id: 'm7', memberId: 'm7', name: 'Member 7', plan: '1 Month', amount: 1500, status: 'expired' },
  { id: 'm8', memberId: 'm8', name: 'Member 8', plan: '1 Month', amount: 1500, status: 'pending' },
  { id: 'm9', memberId: 'm9', name: 'Member 9', plan: '1 Month', amount: 1500, status: 'unpaid' },
  { id: 'm10', memberId: 'm10', name: 'Member 10', plan: '1 Month', amount: 1500, status: 'inactive' }
];

allTransactions = [
  { id: 'tx1', memberId: 'm1', name: 'Member 1', amount: 1500, mode: 'UPI', type: 'New Membership' },
  { id: 'tx2', memberId: 'm2', name: 'Member 2', amount: 1500, mode: 'Cash', type: 'New Membership' },
  { id: 'tx3', memberId: 'm3', name: 'Member 3', amount: 1500, mode: 'UPI', type: 'New Membership' },
  { id: 'tx4', memberId: 'm4', name: 'Member 4', amount: 1500, mode: 'Card', type: 'Renewal' },
  { id: 'tx5', memberId: 'm5', name: 'Member 5', amount: 2500, mode: 'UPI', type: 'New Membership' }
];
`, sandbox);

// Test 1: Expected Revenue
const exp = sandbox.window.calculateExpectedRevenue();
const col = sandbox.window.currentPotCollected;
const rem = exp - col;
console.log(`Test 1 Money Pot => Expected: ${exp}, Collected: ${col}, Remaining: ${rem}`);
assert.strictEqual(exp, 16000, 'Expected must be 16000');
assert.strictEqual(col, 8500, 'Collected must be 8500');
assert.strictEqual(rem, 7500, 'Remaining must be 7500');

// Test 2: Update Dashboard Transactions (Left Card)
vm.runInContext('updateDashboardTransactions(allTransactions)', sandbox);
const leftCardCash = elements['kpi-today-cash'].textContent;
console.log(`Test 2 Left Card Total Cash => ${leftCardCash}`);
assert.strictEqual(leftCardCash, '₹8,500', 'Left Card Total Cash must be ₹8,500');

// Test 3: Edit Member (e.g. m5 amount changed to 3000)
getOrCreate('edit-doc-id').value = 'm5';
getOrCreate('edit-member-name').value = 'Member 5';
getOrCreate('edit-member-phone').value = '9876543210';
getOrCreate('edit-member-plan').value = '2 Months';
getOrCreate('edit-member-expiry').value = '2026-12-31';
getOrCreate('edit-member-status').value = 'active';
getOrCreate('edit-member-amount').value = '3000';

(async () => {
  await sandbox.window.handleEditMemberSubmit({ preventDefault: () => {} });

  const exp2 = sandbox.window.calculateExpectedRevenue();
  const col2 = sandbox.window.currentPotCollected;
  const tx5 = vm.runInContext('allTransactions.find(t=>t.memberId==="m5")', sandbox);
  console.log(`Test 3 After Edit => Expected: ${exp2}, Collected: ${col2}, Tx5 Amount: ${tx5.amount}`);
  assert.strictEqual(tx5.amount, 3000, 'Tx amount must be 3000');
  assert.strictEqual(exp2, 16500, 'Expected after edit must be 16500');
  assert.strictEqual(col2, 9000, 'Collected after edit must be 9000');
  assert.strictEqual(elements['kpi-today-cash'].textContent, '₹9,000', 'Left card after edit must be ₹9,000');

  // Test 4: Delete Member (delete m5)
  sandbox.window.confirm = () => true;
  await sandbox.window.deleteMember('m5', 'Member 5');

  const exp3 = sandbox.window.calculateExpectedRevenue();
  const col3 = sandbox.window.currentPotCollected;
  const remainingMembers = vm.runInContext('allMembers', sandbox);
  const remainingTx = vm.runInContext('allTransactions', sandbox);
  console.log(`Test 4 After Delete => Members: ${remainingMembers.length}, Transactions: ${remainingTx.length}, Expected: ${exp3}, Collected: ${col3}`);
  assert.strictEqual(remainingMembers.length, 9, 'Must have 9 members');
  assert.strictEqual(remainingTx.length, 4, 'Must have 4 transactions (m5 deleted)');
  assert.strictEqual(remainingTx.some(t => t.memberId === 'm5' || t.name === 'Member 5'), false, 'Ghost transaction must not exist');
  assert.strictEqual(exp3, 13500, 'Expected after delete must be 13500');
  assert.strictEqual(col3, 6000, 'Collected after delete must be 6000');
  assert.strictEqual(elements['kpi-today-cash'].textContent, '₹6,000', 'Left card after delete must be ₹6,000');

  console.log('--- ALL SCENARIO TESTS PASSED SUCCESSFULLY! ---');
})();
