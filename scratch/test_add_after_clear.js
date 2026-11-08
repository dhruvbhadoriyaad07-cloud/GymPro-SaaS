const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const elements = {
  'member-name': { value: 'Dhruv Singh' },
  'member-phone': { value: '9876543210' },
  'member-plan': { value: '1 Month', options: [{ getAttribute: () => '1' }], selectedIndex: 0, addEventListener: () => {} },
  'member-amount': { value: '1500' },
  'member-start-date': { value: '2026-11-07', addEventListener: () => {} },
  'btn-submit-member': {},
  'btn-submit-text': {},
  'btn-submit-spinner': { classList: { remove: ()=>{}, add: ()=>{} } },
  'kpi-active-members': { textContent: '' },
  'kpi-today-cash': { textContent: '' }
};

global.document = {
  getElementById: (id) => elements[id] || { textContent: '', value: '', style: {}, remove: ()=>{}, addEventListener: ()=>{}, classList: { remove: ()=>{}, add: ()=>{} }, querySelector: () => ({ textContent: '', className: '' }) },
  querySelector: () => ({ value: 'UPI' }),
  querySelectorAll: () => []
};

global.window = {
  allMembers: [],
  allTransactions: [],
  closeAddMemberModal: () => {},
  showToast: (msg) => console.log('Toast:', msg),
  confirm: () => true
};
global.serverTimestamp = () => new Date();
global.isFirebaseLive = false;
global.db = null;
global.requestAnimationFrame = (cb) => cb();
global.sortTxNewestFirst = (txs) => [...txs];
global.formatTxDateTime = () => '';
global.modeIcon = () => '';
global.animateNumberCounter = () => {};
global.animateSquidGamePot = () => {};
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

const context = { ...global, console, setTimeout, clearTimeout };
vm.createContext(context);
vm.runInContext(scriptContent, context);

context.window.handleMemberSubmit({ preventDefault: () => {} }).then(() => {
  console.log('--- After adding 1 member ---');
  console.log('Member count:', context.window.allMembers.length);
  console.log('Transaction count:', context.window.allTransactions.length);
  console.log('Expected Revenue:', context.window.calculateExpectedRevenue());
  console.log('Pot Collected:', context.window.currentPotCollected);
  console.log('KPI Active Members:', elements['kpi-active-members'].textContent);
  
  if (context.window.allMembers.length === 1 && context.window.allTransactions.length === 1) {
    console.log('\nSUCCESS: Adding new member works cleanly from empty state!');
  } else {
    console.error('FAILURE: Member or transaction not added.');
    process.exit(1);
  }
});
