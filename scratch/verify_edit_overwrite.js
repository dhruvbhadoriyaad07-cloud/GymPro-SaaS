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

// Setting edit form values for Sahil
dom['edit-doc-id'].value = 'demo-sahil';
dom['edit-member-name'].value = 'Sahil';
dom['edit-member-phone'].value = '9876543201';
dom['edit-member-plan'].value = '3 Months';
dom['edit-member-expiry'].value = '2027-02-07';
dom['edit-member-status'].value = 'active';
dom['edit-member-amount'].value = '3500';

global.document = {
  body: mockElement('body'),
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

// Verify Sahil is in allTransactions
const sahilTxBefore = global.window.allTransactions.find(t => t.name.toLowerCase() === 'sahil');
console.log('Sahil transaction before edit:', sahilTxBefore);
console.log('Total transactions before edit:', global.window.allTransactions.length);

// Call handleEditMemberSubmit
global.window.handleEditMemberSubmit({ preventDefault: () => {} }).then(() => {
  const sahilTxAfter = global.window.allTransactions.find(t => t.name.toLowerCase() === 'sahil');
  console.log('Sahil transaction after edit:', sahilTxAfter);
  console.log('Total transactions after edit:', global.window.allTransactions.length);

  if (sahilTxAfter.amount === 3500 && global.window.allTransactions.length === 8) {
    console.log('\nSUCCESS: Existing transaction amount directly overwritten to 3500, no duplicates created!');
  } else {
    console.error('\nFAILURE: Transaction amount not properly overwritten!');
    process.exit(1);
  }
});

