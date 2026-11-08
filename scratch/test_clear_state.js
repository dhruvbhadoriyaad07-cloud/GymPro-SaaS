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
  confirm: () => true,
  setGullakFill: (p) => { global.gullakPct = p; }
};
global.serverTimestamp = () => new Date();
global.isFirebaseLive = false;
global.db = null;
global.requestAnimationFrame = (cb) => cb();
global.sortTxNewestFirst = (txs) => [...txs];
global.formatTxDateTime = (d, t) => '';
global.modeIcon = () => '';
global.animateNumberCounter = (id, val) => {
  if (elements[id]) elements[id].textContent = val;
};
global.animateSquidGamePot = (fill, collected, expected, rem, count) => {
  global.pot = { fill, collected, expected, rem, count };
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

const context = { ...global, console, setTimeout, clearTimeout };
vm.createContext(context);
vm.runInContext(scriptContent, context);

// Now simulate empty state
context.allMembers = [];
context.allTransactions = [];
context.updateDashboardMembers([]);
context.updateDashboardTransactions([]);
context.window.initPaymentsTab();

console.log('Active Members:', elements['kpi-active-members']?.textContent);
console.log('Total Cash:', elements['kpi-today-cash']?.textContent);
console.log('Transactions Badge:', elements['tx-count-badge']?.textContent);
console.log('Pot Data:', global.pot);
console.log('Expected Revenue:', context.window.calculateExpectedRevenue());
console.log('Current Pot Collected:', context.window.currentPotCollected);

