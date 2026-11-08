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
        classList: { remove: ()=>{}, add: ()=>{}, contains: ()=>false, toggle: ()=>{} },
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
  confirm: () => true,
  setGullakFill: () => {}
};
global.serverTimestamp = () => new Date();
global.isFirebaseLive = false;
global.db = null;
global.requestAnimationFrame = (cb) => cb();
global.sortTxNewestFirst = (txs) => [...txs];
global.formatTxDateTime = () => '';
global.modeIcon = () => '';
global.animateNumberCounter = (id, val) => {
  if (elements[id]) elements[id].textContent = val;
};
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

console.log('--- Initial State (Cleaned) ---');
console.log('Active Members:', elements['kpi-active-members']?.textContent);
console.log('Total Cash:', elements['kpi-today-cash']?.textContent);
console.log('All Members Count:', context.window.allMembers.length);
console.log('All Transactions Count:', context.window.allTransactions.length);

if (context.window.allMembers.length === 0 && context.window.allTransactions.length === 0) {
  console.log('\nSUCCESS: Database completely cleared! Ready for new members.');
  process.exit(0);
} else {
  console.error('\nFAILURE: Members or transactions are not empty!');
  process.exit(1);
}
