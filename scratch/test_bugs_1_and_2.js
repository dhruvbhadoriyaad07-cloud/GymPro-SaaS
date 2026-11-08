const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const elements = {};
global.document = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = {
        textContent: '',
        innerHTML: '',
        style: {},
        remove: () => {},
        addEventListener: () => {},
        classList: { remove: ()=>{}, add: ()=>{}, contains: ()=>false },
        querySelector: () => ({ textContent: '', className: '' })
      };
    }
    return elements[id];
  },
  querySelectorAll: () => []
};

global.window = {
  allMembers: [],
  allTransactions: [],
  closeEditMemberModal: () => {},
  showToast: () => {},
  confirm: () => true, // Auto-confirm deletion
  setGullakFill: (p) => { global.gullakPct = p; }
};
global.serverTimestamp = () => new Date();
global.isFirebaseLive = false;
global.db = null;
global.requestAnimationFrame = (cb) => cb();

global.sortTxNewestFirst = (txs) => [...txs];
global.formatTxDateTime = (d, t) => '2026-11-07 10:00 AM';
global.modeIcon = () => '<span></span>';
global.animateNumberCounter = () => {};
global.animateSquidGamePot = (fill, collected, expected, rem, count) => {
  global.lastPotCall = { fill, collected, expected, rem, count };
};
global.renderPaymentsLedger = () => {};

const vm = require('vm');
const scriptMatches = html.match(/<script type="module">([\s\S]*?)<\/script>/gi);
let scriptContent = '';
for (const match of scriptMatches) {
  const content = match.replace(/<\/?script[^>]*>/gi, '');
  if (content.includes('function calculateExpectedRevenue')) {
    scriptContent = content;
    break;
  }
}

scriptContent = scriptContent.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
scriptContent = scriptContent.replace(/export\s+/g, '');

const context = {
  ...global,
  console,
  setTimeout,
  clearTimeout
};

vm.createContext(context);
vm.runInContext(scriptContent, context);

// Test 1: Bug 2 Calculation Verification
console.log('=== TEST 1: Bug 2 Calculation Verification ===');
const members = [
  // 5 unpaid members (expected 1500 each = 7500)
  { id: 'm1', name: 'Unpaid 1', plan: '1 Month', amount: 0, status: 'inactive' },
  { id: 'm2', name: 'Unpaid 2', plan: '1 Month', amount: 0, status: 'inactive' },
  { id: 'm3', name: 'Unpaid 3', plan: '1 Month', amount: 0, status: 'inactive' },
  { id: 'm4', name: 'Unpaid 4', plan: '1 Month', amount: 0, status: 'inactive' },
  { id: 'm5', name: 'Unpaid 5', plan: '1 Month', amount: 0, status: 'inactive' },
  // 5 paid members (4 paid 1500, 1 paid 2500 for 2 months = 8500)
  { id: 'm6', name: 'Paid 1', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm7', name: 'Paid 2', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm8', name: 'Paid 3', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm9', name: 'Paid 4', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm10', name: 'Paid 5', plan: '2 Months', amount: 2500, status: 'active' }
];

const transactions = [
  { id: 'tx-1', memberId: 'm6', name: 'Paid 1', amount: 1500, mode: 'UPI', type: 'New Membership', date: '2026-10-10' },
  { id: 'tx-2', memberId: 'm7', name: 'Paid 2', amount: 1500, mode: 'Cash', type: 'Renewal', date: '2026-10-15' },
  { id: 'tx-3', memberId: 'm8', name: 'Paid 3', amount: 1500, mode: 'UPI', type: 'Renewal', date: '2026-10-20' },
  { id: 'tx-4', memberId: 'm9', name: 'Paid 4', amount: 1500, mode: 'Card', type: 'New Membership', date: '2026-10-25' },
  { id: 'tx-5', memberId: 'm10', name: 'Paid 5', amount: 2500, mode: 'UPI', type: 'New Membership', date: '2026-11-01' }
];

context.updateDashboardMembers(members);
context.updateDashboardTransactions(transactions);
context.window.initPaymentsTab();

const expectedRevenue = context.window.calculateExpectedRevenue();
const potCollected = context.window.currentPotCollected;
const potRemaining = expectedRevenue - potCollected;
const totalCollectionCard = elements['kpi-today-cash'].textContent;

console.log('Expected Revenue:', expectedRevenue, '(Target: 16000)');
console.log('Collected:', potCollected, '(Target: 8500)');
console.log('Remaining:', potRemaining, '(Target: 7500)');
console.log('Total Collection (Left Card):', totalCollectionCard, '(Target: ₹8,500)');

if (expectedRevenue !== 16000 || potCollected !== 8500 || potRemaining !== 7500 || totalCollectionCard !== '₹8,500') {
  console.error('FAILED Test 1!');
  process.exit(1);
}

// Test 2: Bug 1 Ghost Transactions Removal on Delete Member
console.log('\n=== TEST 2: Bug 1 Ghost Transactions Removal on Delete ===');
// Delete member 'm6'
context.window.deleteMember('m6', 'Paid 1').then(() => {
  const ghostTx = context.window.allTransactions.find(t => t.memberId === 'm6' || t.id === 'm6');
  console.log('Ghost transactions for m6 found:', ghostTx);
  console.log('Remaining transactions count:', context.window.allTransactions.length, '(Target: 4)');
  console.log('Updated Total Collection Card:', elements['kpi-today-cash'].textContent, '(Target: ₹7,000)');

  if (ghostTx || context.window.allTransactions.length !== 4 || elements['kpi-today-cash'].textContent !== '₹7,000') {
    console.error('FAILED Test 2!');
    process.exit(1);
  }

  console.log('\nALL TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
});

