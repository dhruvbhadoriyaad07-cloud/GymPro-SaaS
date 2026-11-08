const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Mock DOM
function mockElement(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    remove: () => {},
    classList: {
      contains: () => false,
      add: () => {},
      remove: () => {}
    },
    querySelector: () => mockElement('sub'),
    querySelectorAll: () => [],
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {}
  };
}

const dom = {};
['edit-doc-id', 'edit-member-name', 'edit-member-phone', 'edit-member-plan', 'edit-member-expiry', 'edit-member-status', 'edit-member-amount', 'btn-edit-submit', 'btn-edit-text', 'btn-edit-spinner'].forEach(id => {
  dom[id] = mockElement(id);
});

dom['edit-doc-id'].value = 'GYM-0042';
dom['edit-member-name'].value = 'Priya Nair';
dom['edit-member-phone'].value = '9876543201';
dom['edit-member-plan'].value = '3 Months';
dom['edit-member-expiry'].value = '2027-02-07';
dom['edit-member-status'].value = 'active';
dom['edit-member-amount'].value = '4000';

global.document = {
  getElementById: (id) => {
    if (!dom[id]) dom[id] = mockElement(id);
    return dom[id];
  },
  querySelector: (sel) => mockElement(sel),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.window = {
  document: global.document,
  addEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  closeEditMemberModal: () => { console.log('closeEditMemberModal called'); }
};

global.initializeApp = () => ({});
global.getFirestore = () => ({});
global.getAuth = () => ({});
global.collection = () => ({});
global.doc = () => ({});
global.onSnapshot = () => {};
global.addDoc = () => {};
global.updateDoc = () => {};
global.deleteDoc = () => {};
global.serverTimestamp = () => new Date();
global.onAuthStateChanged = (auth, cb) => { cb(null); };

const scriptMatches = html.match(/<script type="module">([\s\S]*?)<\/script>/i);
const scriptCode = scriptMatches[1].replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import');
eval(scriptCode);

console.log('Initial transactions length:', global.window.allTransactions.length);
console.log('Member initial amount:', global.window.allMembers[0].amount);

// Call handleEditMemberSubmit
global.window.handleEditMemberSubmit({ preventDefault: () => {} }).then(() => {
  console.log('Updated transactions length:', global.window.allTransactions.length);
  console.log('New top transaction:', global.window.allTransactions[0]);
  console.log('Updated member amount:', global.window.allMembers[0].amount);
  
  if (global.window.allTransactions[0].type === 'Plan Adjustment' && global.window.allTransactions[0].amount === 4000) {
    console.log('\nTEST PASSED: Plan Adjustment transaction successfully created and Payments Ledger updated!');
  } else {
    console.error('TEST FAILED');
    process.exit(1);
  }
});
