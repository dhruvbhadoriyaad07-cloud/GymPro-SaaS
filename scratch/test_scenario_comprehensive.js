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

// Exact User Scenario:
// 10 members:
// - 5 unpaid (expected 1500/mo each = 7500)
// - 5 paid (4 paid 1500, 1 paid 2500 for 2 months = 8500 collected)
const members = [
  // 5 unpaid members (plan '1 Month' = 1500)
  { id: 'm1', name: 'Unpaid 1', plan: '1 Month', amount: 0, status: 'inactive' },
  { id: 'm2', name: 'Unpaid 2', plan: '1 Month', amount: 0, status: 'inactive' },
  { id: 'm3', name: 'Unpaid 3', plan: '1 Month', amount: 0, status: 'inactive' },
  { id: 'm4', name: 'Unpaid 4', plan: '1 Month', amount: 0, status: 'inactive' },
  { id: 'm5', name: 'Unpaid 5', plan: '1 Month', amount: 0, status: 'inactive' },
  // 5 paid members: 4 @ 1500, 1 @ 2500 (2 Months)
  { id: 'm6', name: 'Paid 1', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm7', name: 'Paid 2', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm8', name: 'Paid 3', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm9', name: 'Paid 4', plan: '1 Month', amount: 1500, status: 'active' },
  { id: 'm10', name: 'Paid 5', plan: '2 Months', amount: 2500, status: 'active' }
];

// 5 transactions: 4 * 1500, 1 * 2500 = 8500
const transactions = [
  { id: 'tx-1', memberId: 'm6', name: 'Paid 1', amount: 1500, mode: 'UPI', type: 'New Membership' },
  { id: 'tx-2', memberId: 'm7', name: 'Paid 2', amount: 1500, mode: 'Cash', type: 'Renewal' },
  { id: 'tx-3', memberId: 'm8', name: 'Paid 3', amount: 1500, mode: 'UPI', type: 'Renewal' },
  { id: 'tx-4', memberId: 'm9', name: 'Paid 4', amount: 1500, mode: 'Card', type: 'New Membership' },
  { id: 'tx-5', memberId: 'm10', name: 'Paid 5', amount: 2500, mode: 'UPI', type: 'New Membership' }
];

context.updateDashboardMembers(members);
context.updateDashboardTransactions(transactions);
context.window.initPaymentsTab();

// Check values:
const expectedRevenue = context.window.calculateExpectedRevenue();
const collected = context.window.currentPotCollected;
const remaining = Math.max(0, expectedRevenue - collected);
const totalCollectionLeftCard = elements['kpi-today-cash'].textContent;
const detailedTotalCash = elements['detailed-total-cash'].textContent;

console.log('--- USER SCENARIO VERIFICATION ---');
console.log('Expected Revenue:', expectedRevenue, '(Target: 16000)');
console.log('Collected:', collected, '(Target: 8500)');
console.log('Remaining:', remaining, '(Target: 7500)');
console.log('Total Collection (Left Card):', totalCollectionLeftCard, '(Target: ₹8,500)');
console.log('Detailed Total Cash:', detailedTotalCash, '(Target: ₹8,500)');

let failed = false;
if (expectedRevenue !== 16000) { console.error('Mismatch: Expected Revenue is not 16000'); failed = true; }
if (collected !== 8500) { console.error('Mismatch: Collected is not 8500'); failed = true; }
if (remaining !== 7500) { console.error('Mismatch: Remaining is not 7500'); failed = true; }
if (totalCollectionLeftCard !== '₹8,500') { console.error('Mismatch: Total Collection is not ₹8,500'); failed = true; }

if (failed) {
  process.exit(1);
} else {
  console.log('\nSUCCESS: ALL CONDITIONS MET EXACTLY AS REQUESTED!');
}
