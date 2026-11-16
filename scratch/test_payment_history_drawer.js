const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// ── 1. Static Specification Checks ───────────────────────
assert(html.includes('arrayUnion'), 'Must import and use arrayUnion from firebase/firestore');
assert(html.includes('id="paymentHistoryBackdrop"'), 'Backdrop element must exist');
assert(html.includes('fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 opacity-0'), 'Backdrop classes must match spec');
assert(html.includes('id="paymentHistoryDrawer"'), 'Drawer panel element must exist');
assert(html.includes('fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out translate-x-full'), 'Drawer panel classes must match spec');
assert(html.includes('border-b border-gray-100'), 'Drawer header must have border-b border-gray-100');
assert(html.includes('border-l-2 border-gray-100 ml-3'), 'Timeline must use vertical left-border border-l-2 border-gray-100 ml-3');
assert(html.includes('bg-green-500') && html.includes('bg-red-500'), 'Timeline items must support bg-green-500 (ongoing) and bg-red-500 (past/expired) dots');
assert(html.includes('text-green-600 font-bold') && html.includes('text-red-600 font-bold'), 'Timeline amounts must use text-green-600 font-bold (ongoing) and text-red-600 font-bold (past/expired)');
assert(html.includes('@keyframes fadeUpIn') && html.includes('.timeline-fade-up'), 'Fade-up animation must be defined');
assert(html.includes('cursor-pointer hover:bg-gray-50 transition-colors group'), 'Main table Name column must be clickable with hover classes');
assert(html.includes('validFrom:') && html.includes('validTo:') && html.includes('paymentDate:'), 'paymentHistory entry must store validFrom, validTo, and paymentDate');
assert(!html.includes('No payment history yet'), 'Must NOT render "No payment history yet" empty state when paymentHistory is missing/empty');
assert(html.includes('buildFallbackPaymentEntry'), 'Must define dynamic fallback builder for legacy/empty paymentHistory');
assert(html.includes('id="ph-renew-mini-form"') && html.includes('id="ph-renew-plan-select"') && html.includes('id="ph-renew-confirm-btn"'), 'Side drawer must contain Renew mini-form with plan dropdown and confirm button');
assert(html.includes('Renew Plan'), 'Drawer footer button must read Renew Plan');

const editFnMatch = html.match(/window\.handleEditMemberSubmit\s*=\s*async function[\s\S]*?\n    \};/);
assert(editFnMatch, 'handleEditMemberSubmit function must exist');
assert(!editFnMatch[0].includes('addDoc('), 'Edit modal must NEVER log transactions via addDoc');
assert(!editFnMatch[0].includes('arrayUnion('), 'Edit modal must NEVER push new records to paymentHistory via arrayUnion');
assert(!editFnMatch[0].includes('allTransactions.unshift'), 'Edit modal must NEVER push new revenue transactions locally');
assert(!/\.\s*setMonth\s*\(/.test(html), 'Must NOT use Date.prototype setMonth anywhere in index.html to avoid month-end spillover');

// ── 2. Script Block Syntax Validation ────────────────────
const scriptMatches = [...html.matchAll(/<script(?:\s+type="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/gi)];
scriptMatches.forEach((match, idx) => {
  const type = match[1] || '';
  const code = match[2];
  if (!code.trim()) return;
  if (type === 'module') {
    new vm.SourceTextModule(code);
  } else {
    new vm.Script(code);
  }
});

// ── 3. Lightweight DOM Environment + VM Execution Test ──
class MockClassList {
  constructor(initial = '') {
    this.set = new Set(initial.split(/\s+/).filter(Boolean));
  }
  add(...tokens) {
    tokens.forEach(t => t && this.set.add(t));
  }
  remove(...tokens) {
    tokens.forEach(t => this.set.delete(t));
  }
  contains(token) {
    return this.set.has(token);
  }
  toggle(token, force) {
    if (force === undefined) {
      if (this.set.has(token)) { this.set.delete(token); return false; }
      this.set.add(token); return true;
    }
    if (force) this.set.add(token);
    else this.set.delete(token);
    return !!force;
  }
  toString() {
    return [...this.set].join(' ');
  }
}

class MockElement {
  constructor(id = '', className = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList(className);
    this.style = {};
    this.dataset = {};
    this._innerHTML = '';
    this._textContent = '';
    this._value = '';
    this.checked = false;
    this.disabled = false;
    this.options = [];
    this.selectedIndex = 0;
    this.listeners = {};
    this.children = [];
  }
  get value() { return this._value; }
  set value(v) {
    this._value = String(v ?? '');
    if (this.options && this.options.length > 0) {
      const idx = this.options.findIndex(o => o.value === this._value);
      if (idx >= 0) this.selectedIndex = idx;
    }
  }
  get className() { return this.classList.toString(); }
  set className(v) { this.classList = new MockClassList(String(v || '')); }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) { this._innerHTML = String(v || ''); }
  get textContent() { return this._textContent; }
  set textContent(v) { this._textContent = String(v ?? ''); }
  get innerText() { return this._textContent; }
  set innerText(v) { this._textContent = String(v ?? ''); }
  addEventListener(ev, fn) {
    (this.listeners[ev] ||= []).push(fn);
  }
  removeEventListener() {}
  dispatchEvent(ev) {
    (this.listeners[ev.type] || []).forEach(fn => fn(ev));
  }
  setAttribute(k, v) {
    if (k === 'class') this.className = v;
    else if (k.startsWith('data-')) this.dataset[k.slice(5)] = v;
    else this[k] = v;
  }
  getAttribute(k) {
    if (k === 'class') return this.className;
    if (k.startsWith('data-')) return this.dataset[k.slice(5)] ?? null;
    return this[k] ?? null;
  }
  focus() { this._focusCount = (this._focusCount || 0) + 1; }
  select() { this._selectCount = (this._selectCount || 0) + 1; }
  blur() {}
  click() { (this.listeners.click || []).forEach(fn => fn({ target: this, preventDefault() {} })); }
  appendChild(c) { this.children.push(c); return c; }
  querySelector() { return new MockElement(); }
  querySelectorAll() { return []; }
  closest() { return null; }
  remove() {}
  reset() {}
}

// Parse real HTML tags that have id="..." so initial classes match index.html
const elementsById = new Map();
for (const m of html.matchAll(/<([a-z0-9-]+)([^>]*?\sid="([^"]+)"[^>]*)>/gi)) {
  const tagName = m[1];
  const attrs = m[2];
  const id = m[3];
  const classMatch = attrs.match(/\sclass="([^"]*)"/i);
  const valueMatch = attrs.match(/\svalue="([^"]*)"/i);
  const el = new MockElement(id, classMatch ? classMatch[1] : '', tagName);
  if (valueMatch) el.value = valueMatch[1];
  elementsById.set(id, el);
}

// Static HTML checks for Custom Amount Override & Legacy Renew Modal Removal
assert(html.includes('id="ph-renew-amount-input"'), 'Expected #ph-renew-amount-input in index.html');
assert(html.includes('Amount (₹)'), 'Expected Amount (₹) label in index.html');
assert(html.includes('onDrawerRenewPlanChange()'), 'Expected onDrawerRenewPlanChange() handler in index.html');
assert(!html.includes('member-existing-id'), 'Legacy #member-existing-id hidden input must be removed');
assert(!html.includes('currentRenewingMemberId'), 'Legacy currentRenewingMemberId state must be removed');
assert(!html.includes('window.renewMember'), 'Legacy window.renewMember modal launcher must be removed');
assert(!html.includes('Process Renewal'), 'Legacy Process Renewal modal button label must be removed');
assert(!html.includes('+ New / renew member'), 'Payments button label must reflect Add New Member only');
assert(!elementsById.has('member-existing-id'), 'Elements map must not contain removed #member-existing-id');

// Assert critical IDs exist in parsed HTML before stubbing anything else
[
  'paymentHistoryBackdrop',
  'paymentHistoryDrawer',
  'ph-drawer-avatar',
  'ph-drawer-name',
  'ph-drawer-status-badge',
  'ph-drawer-phone',
  'ph-drawer-member-id',
  'ph-drawer-body',
  'ph-drawer-total',
  'ph-drawer-renew-btn',
  'ph-renew-mini-form',
  'ph-renew-plan-select',
  'ph-renew-amount-input',
  'ph-renew-confirm-btn',
  'ph-renew-preview-hint',
  'members-directory-body',
  'edit-member-name',
  'edit-member-phone',
  'edit-member-plan',
  'edit-member-start-date',
  'edit-member-expiry',
  'edit-member-amount',
  'edit-member-id',
  'editMemberModal'
].forEach(id => assert(elementsById.has(id), `Expected element #${id} in index.html`));

// Populate options on <select id="edit-member-plan">, #member-plan, and #ph-renew-plan-select from index.html
for (const selId of ['edit-member-plan', 'member-plan', 'ph-renew-plan-select']) {
  const selBlock = html.match(new RegExp(`<select[^>]*id="${selId}"[^>]*>([\\s\\S]*?)<\\/select>`, 'i'));
  if (selBlock && elementsById.has(selId)) {
    const selEl = elementsById.get(selId);
    for (const optMatch of selBlock[1].matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/gi)) {
      const attrs = optMatch[1];
      const optEl = new MockElement('', '', 'option');
      for (const aMatch of attrs.matchAll(/([a-z0-9-]+)="([^"]*)"/gi)) {
        optEl.setAttribute(aMatch[1], aMatch[2]);
      }
      optEl.textContent = optMatch[2].trim();
      if (!optEl.value) optEl.value = optEl.textContent;
      selEl.options.push(optEl);
    }
    if (selEl.options.length > 0) selEl.value = selEl.options[0].value;
  }
}

const docListeners = {};
const localStorageStore = new Map();

function extractTimelineItems(drawerHtml) {
  // Parse rendered timeline items containing class="... timeline-fade-up ..."
  const parts = String(drawerHtml || '').split(/<div\s+class="[^"]*\btimeline-fade-up\b[^"]*"\s+style="animation-delay:\s*([^;"]+);?"[^>]*>/i);
  const items = [];
  for (let i = 1; i < parts.length; i += 2) {
    const delay = parts[i].trim();
    const bodyChunk = parts[i + 1] || '';
    const itemText = bodyChunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    items.push({
      style: { animationDelay: delay },
      textContent: itemText,
      html: bodyChunk
    });
  }
  return items;
}

const documentStub = {
  body: new MockElement('body', '', 'body'),
  documentElement: new MockElement('html', '', 'html'),
  getElementById(id) {
    if (!elementsById.has(id)) {
      elementsById.set(id, new MockElement(id));
    }
    return elementsById.get(id);
  },
  querySelector(selector) {
    if (selector && selector.startsWith('#')) {
      return documentStub.getElementById(selector.slice(1));
    }
    if (selector === 'input[name="payment-mode"]:checked') {
      return { value: 'Cash' };
    }
    return new MockElement();
  },
  querySelectorAll(selector) {
    if (selector === '#ph-drawer-body .timeline-fade-up') {
      return extractTimelineItems(elementsById.get('ph-drawer-body').innerHTML);
    }
    return [];
  },
  addEventListener(ev, fn) {
    (docListeners[ev] ||= []).push(fn);
  },
  createElement(tag) {
    return new MockElement('', '', tag);
  }
};

const windowObj = {
  document: documentStub,
  location: { href: 'http://localhost:3000/' },
  matchMedia: () => ({ matches: false, addListener() {}, removeListener() {} }),
  requestAnimationFrame: (cb) => { cb(); return 1; },
  scrollTo: () => {},
  confirm: () => true,
  alert: () => {},
  addEventListener() {},
  localStorage: {
    getItem: (k) => localStorageStore.has(k) ? localStorageStore.get(k) : null,
    setItem: (k, v) => localStorageStore.set(k, String(v)),
    removeItem: (k) => localStorageStore.delete(k)
  }
};
windowObj.window = windowObj;

const capturedSetDocs = [];
const capturedUpdateDocs = [];
const capturedAddDocs = [];

const context = vm.createContext({
  window: windowObj,
  document: documentStub,
  localStorage: windowObj.localStorage,
  console,
  Date,
  Math,
  Number,
  String,
  Array,
  Object,
  JSON,
  Set,
  Map,
  RegExp,
  Promise,
  Error,
  Intl,
  Event: class MockEvent { constructor(type, opts = {}) { this.type = type; Object.assign(this, opts); } },
  CustomEvent: class MockCustomEvent { constructor(type, opts = {}) { this.type = type; Object.assign(this, opts); } },
  encodeURIComponent,
  decodeURIComponent,
  setTimeout: (fn, ms) => { const t = setTimeout(fn, ms); if (t.unref) t.unref(); return t; },
  clearTimeout,
  setInterval: () => 1,
  clearInterval: () => {},
  requestAnimationFrame: windowObj.requestAnimationFrame,
  confirm: windowObj.confirm,
  alert: windowObj.alert,
  navigator: { userAgent: 'node-test' },
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  // Mock Firebase SDK bindings
  initializeApp: () => { throw new Error('demo mode'); },
  getFirestore: () => ({}),
  collection: (_db, col) => ({ col }),
  doc: (_db, col, id) => ({ col, id }),
  addDoc: async (colRef, data) => { capturedAddDocs.push({ col: colRef?.col, data }); return { id: 'new-doc' }; },
  setDoc: async (ref, data) => { capturedSetDocs.push({ ref, data }); },
  getDoc: async () => ({ exists: () => false, data: () => ({}) }),
  updateDoc: async (ref, data) => { capturedUpdateDocs.push({ ref, data }); },
  deleteDoc: async () => {},
  getDocs: async () => ({ docs: [] }),
  onSnapshot: () => () => {},
  query: () => ({}),
  where: () => ({}),
  serverTimestamp: () => new Date(),
  arrayUnion: (...vals) => ({ __arrayUnion: vals }),
  getAuth: () => ({}),
  onAuthStateChanged: () => {},
  signOut: async () => {},
  getStorage: () => ({}),
  ref: () => ({}),
  uploadBytes: async () => ({ ref: {} }),
  getDownloadURL: async () => 'https://example.com/logo.png'
});

const moduleScriptMatch = scriptMatches.find(m => m[1] === 'module');
assert(moduleScriptMatch, 'Module script block must exist');

const moduleCode = moduleScriptMatch[2]
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g, '')
  .replace(/import\s+[^;]+;/g, '');

vm.runInContext(moduleCode, context);

// Fire DOMContentLoaded if any listener registered
(docListeners['DOMContentLoaded'] || []).forEach(fn => fn());

// Seed mock members in allMembers
const pastMonthDate = new Date();
pastMonthDate.setMonth(pastMonthDate.getMonth() - 2);
const twoMonthsAgo = new Date();
twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 3);

vm.runInContext(`
  updateDashboardMembers([
    {
      id: 'doc-golu',
      memberId: 'GYM-1523',
      name: 'GOLU',
      phone: '9568458754',
      plan: '1 Month',
      startDate: '2026-10-01',
      expiryDate: '2026-11-01',
      amount: 1500,
      paymentHistory: [
        { timestamp: new Date(${twoMonthsAgo.getTime()}), amount: 1200, plan: '1 Month (Intro)' },
        { timestamp: new Date(${pastMonthDate.getTime()}), amount: 1500, plan: '1 Month' }
      ]
    }
  ]);
`, context);

// Verify legacy modal renewal launcher is completely removed at runtime
assert.strictEqual(typeof windowObj.renewMember, 'undefined', 'window.renewMember must be deleted');

// Verify table Name cell & highlighted Renew button are rendered in Members directory AND Expiring soon table
const dirHtml = documentStub.getElementById('members-directory-body').innerHTML;
assert(dirHtml.includes(`window.openPaymentHistoryDrawer('doc-golu')`), 'Main directory table Name column must invoke openPaymentHistoryDrawer');
assert(dirHtml.includes(`window.openMemberRenewDrawer('doc-golu')`) && dirHtml.includes('from-blue-600 to-indigo-600'), 'Members section must render highlighted Renew button');

const expiryHtml = documentStub.getElementById('expiry-table-body').innerHTML;
assert(expiryHtml.includes(`window.openMemberRenewDrawer('doc-golu')`), 'Expiring soon table Renew button must trigger window.openMemberRenewDrawer');
assert(!expiryHtml.includes('window.renewMember'), 'Expiring soon table must NOT call legacy window.renewMember');
assert(html.includes('window.openMemberRenewDrawer(r.id || r.memberId)'), 'Payments Pending renewals widget must trigger window.openMemberRenewDrawer');

// Verify clicking Renew button opens drawer, reveals mini-form, AND auto-focuses #ph-renew-amount-input
const amountInputForFocus = documentStub.getElementById('ph-renew-amount-input');
const prevFocusCount = amountInputForFocus._focusCount || 0;
const prevSelectCount = amountInputForFocus._selectCount || 0;
windowObj.openMemberRenewDrawer('doc-golu');
assert(!documentStub.getElementById('ph-renew-mini-form').classList.contains('hidden'), 'openMemberRenewDrawer must immediately show the Renew mini-form');
assert((amountInputForFocus._focusCount || 0) > prevFocusCount, 'openMemberRenewDrawer must auto-focus #ph-renew-amount-input');
assert((amountInputForFocus._selectCount || 0) > prevSelectCount, 'openMemberRenewDrawer must auto-select #ph-renew-amount-input');
assert(documentStub.getElementById('paymentHistoryDrawer').classList.contains('translate-x-0'), 'openMemberRenewDrawer must slide open the drawer');
windowObj.closePaymentHistoryDrawer();

// Trigger openPaymentHistoryDrawer (normal view keeps mini-form closed)
windowObj.openPaymentHistoryDrawer('doc-golu');
assert(documentStub.getElementById('ph-renew-mini-form').classList.contains('hidden'), 'openPaymentHistoryDrawer must keep Renew mini-form hidden initially');

const backdrop = documentStub.getElementById('paymentHistoryBackdrop');
const drawer = documentStub.getElementById('paymentHistoryDrawer');
assert(!backdrop.classList.contains('hidden'), 'Backdrop must become visible');
assert(backdrop.classList.contains('opacity-100'), 'Backdrop must animate to opacity-100');
assert(!drawer.classList.contains('hidden'), 'Drawer must become visible');
assert(drawer.classList.contains('translate-x-0'), 'Drawer must animate to translate-x-0');

assert.strictEqual(documentStub.getElementById('ph-drawer-name').textContent, 'GOLU');
assert.strictEqual(documentStub.getElementById('ph-drawer-phone').textContent, '+91 9568458754');
assert.strictEqual(documentStub.getElementById('ph-drawer-status-badge').textContent, 'EXPIRED');
assert.strictEqual(documentStub.getElementById('ph-drawer-total').textContent, '₹2,700');
assert(documentStub.getElementById('ph-drawer-total').classList.contains('text-red-600'), 'Total Paid for EXPIRED member must be red');

// Check chronological sort (newest first) & staggered delay & red styling for expired member
const timelineItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
assert.strictEqual(timelineItems.length, 2, 'Should render 2 timeline items');
assert(timelineItems[0].textContent.includes('1 Month') && timelineItems[0].textContent.includes('1,500'), 'Newest payment must appear first');
assert(timelineItems[1].textContent.includes('1 Month (Intro)') && timelineItems[1].textContent.includes('1,200'), 'Older payment must appear second');
assert(timelineItems[0].html.includes('text-red-600 font-bold') && timelineItems[0].html.includes('bg-red-500'), 'Expired member entry 0 must be red');
assert(timelineItems[1].html.includes('text-red-600 font-bold') && timelineItems[1].html.includes('bg-red-500'), 'Expired member entry 1 must be red');
assert.strictEqual(timelineItems[0].style.animationDelay, '0ms', 'First item delay should be 0ms');
assert.strictEqual(timelineItems[1].style.animationDelay, '65ms', 'Second item delay should cascade at 65ms');

// Close drawer via Escape key handler too
windowObj.closePaymentHistoryDrawer();
assert(backdrop.classList.contains('opacity-0'), 'Backdrop must animate back to opacity-0');
assert(drawer.classList.contains('translate-x-full'), 'Drawer must animate back to translate-x-full');

// Reopen and verify Escape key closes drawer
windowObj.openPaymentHistoryDrawer('doc-golu');
assert(drawer.classList.contains('translate-x-0'), 'Drawer reopened');
(docListeners['keydown'] || []).forEach(fn => fn({ key: 'Escape' }));
assert(drawer.classList.contains('translate-x-full'), 'Escape key must close drawer');

// Test Edit Modal (Corrections Only):
// Case 1: Profile-only edit, expiry unchanged -> NO new paymentHistory log, NO transaction
windowObj.openEditMemberModal('doc-golu', '+91 9568458754');
documentStub.getElementById('edit-member-name').value = 'GOLU SINGH';

(async () => {
  const initialTxCount = vm.runInContext(`allTransactions.length`, context);
  await windowObj.handleEditMemberSubmit({ preventDefault: () => {} });
  let golu = vm.runInContext(`allMembers.find(m => m.id === 'doc-golu')`, context);
  assert.strictEqual(golu.name, 'GOLU SINGH');
  assert.strictEqual(golu.paymentHistory.length, 2, 'Simple profile edit must NOT append to paymentHistory');
  assert.strictEqual(capturedAddDocs.length, 0, 'Profile edit must NOT call addDoc');
  assert.strictEqual(vm.runInContext(`allTransactions.length`, context), initialTxCount, 'Profile edit must NOT log revenue transaction');

  // Case 2: Plan / Expiry correction in Edit Modal -> updates latest history object in place, NEVER pushes new record or transaction
  vm.runInContext(`isFirebaseLive = true; db = {};`, context);
  windowObj.openEditMemberModal('doc-golu', '+91 9568458754');
  const planSelect = documentStub.getElementById('edit-member-plan');
  planSelect.value = '3 Months';
  windowObj.onEditPlanChange('plan'); // calculates expiry & sets amount to 4000
  await windowObj.handleEditMemberSubmit({ preventDefault: () => {} });

  golu = vm.runInContext(`allMembers.find(m => m.id === 'doc-golu')`, context);
  assert.strictEqual(golu.paymentHistory.length, 2, 'Edit modal correction must NEVER push a new record to paymentHistory');
  const latestCorrectedEntry = golu.paymentHistory[1];
  assert.strictEqual(latestCorrectedEntry.amount, 4000, 'Corrected latest entry amount should update to 4000');
  assert.strictEqual(latestCorrectedEntry.plan, '3 Months', 'Corrected latest entry plan should update to 3 Months');
  assert.strictEqual(latestCorrectedEntry.validTo, '2027-01-01', 'Corrected latest entry validTo should update to 2027-01-01');
  assert.strictEqual(capturedAddDocs.length, 0, 'Edit modal correction must NEVER call addDoc for transactions');
  assert.strictEqual(vm.runInContext(`allTransactions.length`, context), initialTxCount, 'Edit modal correction must NEVER log revenue transaction');

  const goluEditUpdateDoc = capturedUpdateDocs.find(c => c.ref && c.ref.id === 'doc-golu');
  assert(goluEditUpdateDoc && !goluEditUpdateDoc.data.paymentHistory.__arrayUnion, 'Edit modal must persist updated history array directly, never arrayUnion');

  // Case 3: Edit Modal correction on legacy member with empty paymentHistory: [] -> stays empty (no auto-push)
  vm.runInContext(`
    updateDashboardMembers([
      ...allMembers,
      {
        id: 'doc-ext',
        memberId: 'GYM-7777',
        name: 'Ext Test',
        phone: '9988776655',
        plan: '1 Month',
        startDate: '2026-10-11',
        expiryDate: '2026-11-11',
        amount: 1500,
        paymentHistory: []
      }
    ]);
  `, context);
  windowObj.openEditMemberModal('doc-ext', '+91 9988776655');
  documentStub.getElementById('edit-member-expiry').value = '2026-12-11';
  await windowObj.handleEditMemberSubmit({ preventDefault: () => {} });
  const extMember = vm.runInContext(`allMembers.find(m => m.id === 'doc-ext')`, context);
  assert.strictEqual(extMember.expiryDate, '2026-12-11', 'Edit modal correction should update expiryDate');
  assert.strictEqual(extMember.paymentHistory.length, 0, 'Edit modal must NEVER push a record when paymentHistory is empty');
  assert.strictEqual(capturedAddDocs.length, 0, 'Edit modal must NEVER log transaction on expiry correction');

  // Test Side Drawer Renew Mini-Form:
  // Part A: Expired legacy member (empty paymentHistory) renewed via drawer -> backfills historical + pushes new renewal + logs tx
  vm.runInContext(`
    updateDashboardMembers([
      ...allMembers,
      {
        id: 'doc-expired-renew',
        memberId: 'GYM-8111',
        name: 'Vikram Expired',
        phone: '9876543210',
        plan: '1 Month',
        expiryDate: '2026-10-10',
        amount: 1500,
        paymentHistory: []
      }
    ]);
  `, context);
  windowObj.openPaymentHistoryDrawer('doc-expired-renew');
  const miniForm = documentStub.getElementById('ph-renew-mini-form');
  const renewSelect = documentStub.getElementById('ph-renew-plan-select');
  const renewAmountInput = documentStub.getElementById('ph-renew-amount-input');
  const previewHint = documentStub.getElementById('ph-renew-preview-hint');
  assert(miniForm.classList.contains('hidden'), 'Renew mini-form must start hidden when opening drawer');

  windowObj.toggleDrawerRenewForm();
  assert(!miniForm.classList.contains('hidden'), 'Clicking Renew Plan must reveal inline mini-form');
  assert.strictEqual(renewSelect.value, '1 Month', 'Mini-form plan dropdown should default to member current plan');
  assert.strictEqual(renewAmountInput.value, '1500', 'Amount input should auto-fill with 1500 for 1 Month plan');
  assert(previewHint.textContent.includes('1,500'), 'Preview hint should display default plan price');

  renewSelect.value = '3 Months';
  windowObj.updateDrawerRenewPreview();
  assert.strictEqual(renewAmountInput.value, '4000', 'Amount input should auto-fill with 4000 when selecting 3 Months plan');
  assert(previewHint.textContent.includes('4,000'), 'Preview hint must update when selecting 3 Months plan');

  const todayD = new Date();
  const todayIso = `${todayD.getFullYear()}-${String(todayD.getMonth() + 1).padStart(2, '0')}-${String(todayD.getDate()).padStart(2, '0')}`;
  const todayShort = todayD.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const expectedExpiredRenewTo = vm.runInContext(`shiftIsoMonths('2026-10-10', 3)`, context);

  await windowObj.confirmDrawerRenewal();
  assert(miniForm.classList.contains('hidden'), 'Mini-form must close after Confirm');
  const vikram = vm.runInContext(`allMembers.find(m => m.id === 'doc-expired-renew')`, context);
  assert.strictEqual(vikram.status, 'active', 'Expired member must become active after drawer renewal');
  assert.strictEqual(vikram.plan, '3 Months');
  assert.strictEqual(vikram.expiryDate, expectedExpiredRenewTo, 'Renew validTo must calculate from member current expiryDate');
  assert.strictEqual(vikram.paymentHistory.length, 2, 'Expired legacy member renewal must preserve historical entry + push new renewal');
  assert.strictEqual(vikram.paymentHistory[0].validTo, '2026-10-10', 'Historical entry must preserve previous expiry');
  assert.strictEqual(vikram.paymentHistory[1].validFrom, '2026-10-10', 'New renewal validFrom must auto-fill from member current expiryDate');
  assert.strictEqual(vikram.paymentHistory[1].validTo, expectedExpiredRenewTo);
  assert(vikram.paymentHistory[1].paymentDate instanceof Date, 'New renewal must set paymentDate to click timestamp Date');
  assert.strictEqual('timestamp' in vikram.paymentHistory[1], false, 'New renewal must strictly use the three date fields: validFrom, validTo, paymentDate');
  assert.strictEqual(vikram.paymentHistory[1].amount, 4000);

  const vikramUpdate = capturedUpdateDocs.find(c => c.ref && c.ref.id === 'doc-expired-renew');
  assert(vikramUpdate && vikramUpdate.data.paymentHistory && vikramUpdate.data.paymentHistory.__arrayUnion.length === 2, 'Firestore updateDoc must append history via arrayUnion');
  const renewTxAdd = capturedAddDocs.find(c => c.col === 'transactions' && c.data.memberId === 'GYM-8111');
  assert(renewTxAdd && renewTxAdd.data.type === 'Renewal' && renewTxAdd.data.amount === 4000, 'Drawer renewal must log Renewal transaction to Firestore');
  assert.strictEqual(vm.runInContext(`allTransactions[0].type`, context), 'Renewal');
  assert.strictEqual(vm.runInContext(`allTransactions[0].amount`, context), 4000);
  assert.strictEqual(vm.runInContext(`allTransactions[0].date`, context), todayIso, 'Transaction revenue date must be paymentDate (today), not validFrom');
  assert.strictEqual(documentStub.getElementById('ph-drawer-status-badge').textContent, 'ACTIVE');

  // Part A2: Member whose plan expired 5 days ago -> renews 1 Month today -> cycle starts from expiry, paid today, timeline & Cash Today reflect paymentDate
  const fiveDaysAgoDate = new Date(todayD.getFullYear(), todayD.getMonth(), todayD.getDate() - 5, 10, 0, 0);
  const fiveDaysAgoIso = `${fiveDaysAgoDate.getFullYear()}-${String(fiveDaysAgoDate.getMonth() + 1).padStart(2, '0')}-${String(fiveDaysAgoDate.getDate()).padStart(2, '0')}`;
  const expectedLateToIso = vm.runInContext(`shiftIsoMonths('${fiveDaysAgoIso}', 1)`, context);
  const expectedLateFromFmt = fiveDaysAgoDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const [eY, eM, eDay] = expectedLateToIso.split('-').map(Number);
  const expectedLateToFmt = new Date(eY, eM - 1, eDay, 12, 0, 0).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  vm.runInContext(`
    updateDashboardMembers([
      ...allMembers,
      {
        id: 'doc-late-payer',
        memberId: 'GYM-8155',
        name: 'Late Payer',
        phone: '9876511111',
        plan: '1 Month',
        expiryDate: '${fiveDaysAgoIso}',
        amount: 1500,
        paymentHistory: []
      }
    ]);
  `, context);
  windowObj.openPaymentHistoryDrawer('doc-late-payer');
  windowObj.toggleDrawerRenewForm(true);
  assert(previewHint.textContent.includes(expectedLateFromFmt), 'Mini-form must auto-fill validFrom from current expiryDate');
  await windowObj.confirmDrawerRenewal();

  const latePayer = vm.runInContext(`allMembers.find(m => m.id === 'doc-late-payer')`, context);
  const lateLatest = latePayer.paymentHistory[latePayer.paymentHistory.length - 1];
  assert.strictEqual(lateLatest.validFrom, fiveDaysAgoIso, 'Late payer validFrom must start from old expiryDate');
  assert.strictEqual(lateLatest.validTo, expectedLateToIso, 'Late payer validTo must be validFrom + 1 Month');
  assert(lateLatest.paymentDate instanceof Date, 'Late payer paymentDate must capture click Date');
  const lateItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
  assert(lateItems[0].textContent.includes(`${expectedLateFromFmt} to ${expectedLateToFmt}`), 'Timeline heading must show cycle range');
  assert(lateItems[0].textContent.includes(`Paid ₹1,500 on ${todayShort}`), `Timeline subtext must display "Paid ₹1,500 on ${todayShort}"`);

  // Verify Dashboard Revenue ('Cash Today') filters paymentHistory strictly by paymentDate & ignores validFrom
  assert.strictEqual(windowObj.isToday({ validFrom: todayIso, validTo: '2027-01-01', paymentDate: fiveDaysAgoDate, amount: 9999 }), false, 'isToday must ignore validFrom=today when paymentDate is in the past');
  assert.strictEqual(windowObj.isToday({ validFrom: fiveDaysAgoIso, validTo: expectedLateToIso, paymentDate: new Date(), amount: 1500 }), true, 'isToday must return true when paymentDate is today even if validFrom was in the past');

  const todayCashTotalBefore = documentStub.getElementById('detailed-total-cash').textContent;
  assert.strictEqual(todayCashTotalBefore, '₹5,500', 'Today Cash total should include Vikram ₹4,000 + Late Payer ₹1,500 without double-counting');

  // Direct members paymentHistory test: payment with validFrom=today & past paymentDate MUST NOT add to Cash Today; payment with past validFrom & today paymentDate MUST add to Cash Today
  vm.runInContext(`
    allTransactions = [];
    updateDashboardMembers([
      {
        id: 'doc-cash-test',
        memberId: 'GYM-9991',
        name: 'Cash Filter Test',
        phone: '9999900001',
        plan: '1 Month',
        expiryDate: '2027-01-01',
        amount: 2000,
        paymentHistory: [
          { validFrom: '${todayIso}', validTo: '2026-12-31', paymentDate: new Date(${fiveDaysAgoDate.getTime()}), amount: 5000, plan: '3 Months' },
          { validFrom: '${fiveDaysAgoIso}', validTo: '${expectedLateToIso}', paymentDate: new Date(), amount: 2000, plan: '1 Month' }
        ]
      }
    ]);
  `, context);
  assert.strictEqual(windowObj.calculateTodayRevenueFromPaymentHistory(), 2000, 'Today paymentHistory revenue must count ₹2,000 (paymentDate=today) and exclude ₹5,000 (validFrom=today, past paymentDate)');
  assert.strictEqual(documentStub.getElementById('detailed-total-cash').textContent, '₹2,000', 'Dashboard Today Cash card must strictly match paymentDate revenue');

  // Month-End Clamping Utility & Expiry Calculation Tests (No setMonth spillover: Jan 31 -> Feb 28 / Leap Feb 29)
  assert.strictEqual(windowObj.shiftIsoMonths('2026-01-31', 1), '2026-02-28', 'Jan 31 + 1 month (non-leap) must clamp to Feb 28');
  assert.strictEqual(windowObj.shiftIsoMonths('2024-01-31', 1), '2024-02-29', 'Jan 31 + 1 month (leap year) must clamp to Feb 29');
  assert.strictEqual(windowObj.shiftIsoMonths('2026-03-31', 1), '2026-04-30', 'Mar 31 + 1 month must clamp to Apr 30');
  assert.strictEqual(windowObj.shiftIsoMonths('2026-01-31', 3), '2026-04-30', 'Jan 31 + 3 months must clamp to Apr 30');

  // Verify Drawer Renewal clamps Jan 31 -> Feb 28 (non-leap) & Feb 29 (leap year)
  vm.runInContext(`
    updateDashboardMembers([
      { id: 'doc-jan31-std', memberId: 'GYM-3101', name: 'Jan31 NonLeap', phone: '9111100001', plan: '1 Month', expiryDate: '2026-01-31', amount: 1500, paymentHistory: [] },
      { id: 'doc-jan31-leap', memberId: 'GYM-3102', name: 'Jan31 Leap', phone: '9111100002', plan: '1 Month', expiryDate: '2024-01-31', amount: 1500, paymentHistory: [] }
    ]);
  `, context);
  windowObj.openPaymentHistoryDrawer('doc-jan31-std');
  windowObj.toggleDrawerRenewForm(true);
  await windowObj.confirmDrawerRenewal();
  const janStd = vm.runInContext(`allMembers.find(m => m.id === 'doc-jan31-std')`, context);
  assert.strictEqual(janStd.expiryDate, '2026-02-28', 'Drawer renewal from 2026-01-31 + 1 Month must clamp to 2026-02-28');

  windowObj.openPaymentHistoryDrawer('doc-jan31-leap');
  windowObj.toggleDrawerRenewForm(true);
  await windowObj.confirmDrawerRenewal();
  const janLeap = vm.runInContext(`allMembers.find(m => m.id === 'doc-jan31-leap')`, context);
  assert.strictEqual(janLeap.expiryDate, '2024-02-29', 'Drawer renewal from 2024-01-31 + 1 Month must clamp to 2024-02-29');

  // Verify Add Member submit & Edit modal plan change clamp Jan 31 without setMonth spillover
  documentStub.getElementById('member-name').value = 'JAN END TEST';
  documentStub.getElementById('member-phone').value = '9111100099';
  documentStub.getElementById('member-plan').value = '1 Month';
  documentStub.getElementById('member-start-date').value = '2026-01-31';
  documentStub.getElementById('member-amount').value = '1500';
  await windowObj.handleMemberSubmit({ preventDefault: () => {} });
  const janAdded = vm.runInContext(`allMembers.find(m => m.phone === '9111100099')`, context);
  assert.strictEqual(janAdded.expiryDate, '2026-02-28', 'Add Member starting 2026-01-31 + 1 Month must clamp to 2026-02-28');

  windowObj.openEditMemberModal('doc-jan31-leap', '9111100002');
  documentStub.getElementById('edit-member-start-date').value = '2024-01-31';
  documentStub.getElementById('edit-member-plan').value = '1 Month';
  windowObj.onEditPlanChange('plan');
  assert.strictEqual(documentStub.getElementById('edit-member-expiry').value, '2024-02-29', 'Edit modal plan change starting 2024-01-31 + 1 Month must clamp to 2024-02-29');
  // Clear transactions added by Jan31 test members before remaining assertions
  vm.runInContext(`allTransactions = [];`, context);
  // Restore Vikram & GOLU & Ext back alongside Cash Filter Test? No, reset allTransactions cleanly and re-add GOLU so subsequent tests stay self-contained:
  vm.runInContext(`
    updateDashboardMembers([
      {
        id: 'doc-golu',
        memberId: 'GYM-1523',
        name: 'GOLU SINGH',
        phone: '9568458754',
        plan: '3 Months',
        startDate: '2026-10-01',
        expiryDate: '2027-01-01',
        amount: 4000,
        paymentHistory: [
          { timestamp: new Date(${twoMonthsAgo.getTime()}), amount: 1200, plan: '1 Month (Intro)' },
          { timestamp: new Date(${pastMonthDate.getTime()}), amount: 4000, plan: '3 Months', validFrom: '2026-10-01', validTo: '2027-01-01' }
        ]
      }
    ]);
  `, context);

  // Part B: Active member renewed via drawer -> extends seamlessly from current expiryDate, strictly pushes 1 brand new entry
  vm.runInContext(`
    updateDashboardMembers([
      ...allMembers,
      {
        id: 'doc-active-renew',
        memberId: 'GYM-8222',
        name: 'Priya Active',
        phone: '9876500001',
        plan: '1 Month',
        startDate: '2026-12-10',
        expiryDate: '2027-01-10',
        amount: 1500,
        paymentHistory: [
          { validFrom: '2026-12-10', validTo: '2027-01-10', paymentDate: new Date(2026, 11, 10), amount: 1500, plan: '1 Month' }
        ]
      }
    ]);
  `, context);
  windowObj.openPaymentHistoryDrawer('doc-active-renew');
  windowObj.toggleDrawerRenewForm(true);
  renewSelect.value = '6 Months';
  windowObj.updateDrawerRenewPreview();
  await windowObj.confirmDrawerRenewal();

  const priya = vm.runInContext(`allMembers.find(m => m.id === 'doc-active-renew')`, context);
  assert.strictEqual(priya.paymentHistory.length, 2, 'Active member drawer renewal must push 1 brand new entry');
  assert.strictEqual(priya.paymentHistory[1].validFrom, '2027-01-10', 'Active member renewal must chain seamlessly from current expiry');
  assert.strictEqual(priya.paymentHistory[1].validTo, '2027-07-10', 'Active member 6 Months renewal must extend expiry to 2027-07-10');
  assert.strictEqual(priya.paymentHistory[1].amount, 7500);
  assert.strictEqual(priya.expiryDate, '2027-07-10');
  assert.strictEqual(documentStub.getElementById('ph-drawer-total').textContent, '₹9,000', 'Total Paid must reflect 1500 + 7500 = ₹9,000');

  // Test Fixing Existing Corrupt Data (duplicate identical date ranges + same-day missing ranges)
  vm.runInContext(`
    updateDashboardMembers([
      ...allMembers,
      {
        id: 'doc-corrupt',
        memberId: 'GYM-8888',
        name: 'Corrupt Dup',
        phone: '9111122222',
        plan: '1 Month',
        expiryDate: '2026-12-11',
        amount: 1500,
        paymentHistory: [
          { validFrom: '2026-11-11', validTo: '2026-12-11', paymentDate: new Date(2026, 10, 11, 9, 0, 0), amount: 1500, plan: '1 Month' },
          { validFrom: '2026-11-11', validTo: '2026-12-11', paymentDate: new Date(2026, 10, 11, 10, 0, 0), amount: 1500, plan: '1 Month' },
          { validFrom: '2026-11-11', validTo: '2026-12-11', paymentDate: new Date(2026, 10, 11, 11, 0, 0), amount: 1500, plan: '1 Month' }
        ]
      }
    ]);
  `, context);
  windowObj.openPaymentHistoryDrawer('doc-corrupt');
  const corruptItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
  assert.strictEqual(corruptItems.length, 3);
  assert(corruptItems[0].textContent.includes('11 Nov 2026 to 11 Dec 2026'), 'Newest duplicate keeps current range');
  assert(corruptItems[0].html.includes('text-green-600 font-bold'), 'Newest ongoing plan must be green');
  assert(corruptItems[1].textContent.includes('11 Oct 2026 to 11 Nov 2026') && corruptItems[1].textContent.includes('Past Plan'), '1st corrupt duplicate shifted back 1 month and marked Past Plan');
  assert(corruptItems[1].html.includes('text-red-600 font-bold'), '1st past entry must be red');
  assert(/11\s+Sept?\s+2026\s+to\s+11\s+Oct\s+2026/i.test(corruptItems[2].textContent) && corruptItems[2].textContent.includes('Past Plan'), '2nd corrupt duplicate shifted back 2 months chronologically');
  assert(corruptItems[2].html.includes('text-red-600 font-bold'), '2nd past entry must be red');

  // Open drawer again on GOLU & verify corrected entry + green active status after Edit Modal correction
  windowObj.openPaymentHistoryDrawer('doc-golu');
  assert.strictEqual(documentStub.getElementById('ph-drawer-status-badge').textContent, 'ACTIVE');
  assert.strictEqual(documentStub.getElementById('ph-drawer-total').textContent, '₹5,200');
  assert(documentStub.getElementById('ph-drawer-total').classList.contains('text-green-600'), 'Total Paid for ACTIVE member must be green');
  const updatedItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
  assert.strictEqual(updatedItems.length, 2, 'GOLU should still have 2 timeline entries after Edit Modal correction');
  assert(updatedItems[0].textContent.includes('3 Months') && updatedItems[0].textContent.includes('4,000'), 'Corrected latest entry should display 3 Months and ₹4,000');
  assert(updatedItems[0].textContent.includes(' to '), 'Latest timeline heading must display date range');
  assert(updatedItems[0].textContent.includes('Paid ₹4,000 on '), 'Subtext must display Paid ₹4,000 on <date>');
  assert(updatedItems[0].html.includes('text-green-600 font-bold') && updatedItems[0].html.includes('bg-green-500'), 'Current ongoing payment must be green');
  assert(updatedItems[1].html.includes('text-red-600 font-bold') && updatedItems[1].html.includes('bg-red-500'), 'Previous past payment must be red');

  // Test Legacy Members without paymentHistory (UI Fallback + validFrom..validTo range + Total Paid)
  vm.runInContext(`
    updateDashboardMembers([
      ...allMembers,
      {
        id: 'doc-naman',
        memberId: 'GYM-5099',
        name: 'Naman',
        phone: '9586457845',
        plan: '1 Month',
        expiryDate: '2026-10-10',
        amount: 1500
        // paymentHistory intentionally undefined
      },
      {
        id: 'doc-rohit',
        memberId: 'GYM-5832',
        name: 'Rohit Tomar',
        phone: '9845674582',
        plan: '3 Months',
        expiryDate: '2027-02-10',
        paymentHistory: [] // empty array & missing amount
      },
      {
        id: 'doc-monthend',
        memberId: 'GYM-9001',
        name: 'Month End User',
        phone: '9000000001',
        plan: '1 Month',
        expiryDate: '2026-03-31',
        amount: 0
      }
    ]);
  `, context);

  // Case A: Undefined paymentHistory (expired 1-Month member -> Red money + Red dot)
  windowObj.openPaymentHistoryDrawer('doc-naman');
  assert(!documentStub.getElementById('ph-drawer-body').innerHTML.includes('No payment history yet'), 'Must never show empty state for legacy member');
  assert.strictEqual(documentStub.getElementById('ph-drawer-total').textContent, '₹1,500', 'Total Paid must reflect fallback plan amount, not ₹0');
  assert(documentStub.getElementById('ph-drawer-total').classList.contains('text-red-600'), 'Expired legacy member Total Paid must be red');
  const namanItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
  assert.strictEqual(namanItems.length, 1, 'Should dynamically generate 1 fallback timeline entry');
  assert(namanItems[0].textContent.includes('1 Month') && namanItems[0].textContent.includes('1,500'), 'Fallback must show plan and amount');
  assert(namanItems[0].html.includes('text-red-600 font-bold') && namanItems[0].html.includes('bg-red-500'), 'Expired legacy fallback entry must render in red');
  assert(/10\s+Sept?\s+2026\s+to\s+10\s+Oct\s+2026/i.test(namanItems[0].textContent), 'Fallback heading must display 10 Sept 2026 to 10 Oct 2026');
  assert(namanItems[0].textContent.includes('Paid ₹1,500'), 'Subtext must display Paid ₹1,500');

  // Case B: Empty array [] & missing amount (active 3-Month member -> Green money + Green dot)
  windowObj.openPaymentHistoryDrawer('doc-rohit');
  assert.strictEqual(documentStub.getElementById('ph-drawer-total').textContent, '₹4,000', 'Total Paid must use 3 Months default ₹4,000');
  assert(documentStub.getElementById('ph-drawer-total').classList.contains('text-green-600'), 'Active legacy member Total Paid must be green');
  const rohitItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
  assert.strictEqual(rohitItems.length, 1);
  assert(rohitItems[0].textContent.includes('3 Months') && rohitItems[0].textContent.includes('4,000'));
  assert(rohitItems[0].html.includes('text-green-600 font-bold') && rohitItems[0].html.includes('bg-green-500'), 'Ongoing active plan fallback entry must render in green');
  assert(/10\s+Nov\s+2026\s+to\s+10\s+Feb\s+2027/i.test(rohitItems[0].textContent), 'Fallback heading must display 10 Nov 2026 to 10 Feb 2027');

  // Case C: Month-end clamping (2026-03-31 minus 1 Month -> 28 Feb 2026 to 31 Mar 2026) & amount: 0 fallback
  windowObj.openPaymentHistoryDrawer('doc-monthend');
  assert.strictEqual(documentStub.getElementById('ph-drawer-total').textContent, '₹1,500');
  assert(documentStub.getElementById('ph-drawer-total').classList.contains('text-red-600'), 'Expired month-end member Total Paid must be red');
  const meItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
  assert(meItems[0].html.includes('text-red-600 font-bold'), 'Expired month-end entry must be red');
  assert(/28\s+Feb\s+2026\s+to\s+31\s+Mar\s+2026/i.test(meItems[0].textContent), 'Month-end range should be 28 Feb 2026 to 31 Mar 2026');

  // Test Backend (Add New Member via handleMemberSubmit -> stores validFrom, validTo, paymentDate)
  vm.runInContext(`isFirebaseLive = true; db = {};`, context);
  documentStub.getElementById('member-name').value = 'ARJUN VERMA';
  documentStub.getElementById('member-phone').value = '9811223344';
  documentStub.getElementById('member-plan').value = '6 Months';
  documentStub.getElementById('member-start-date').value = '2026-11-11';
  documentStub.getElementById('member-amount').value = ''; // verify blank falls back to plan price 7500

  await windowObj.handleMemberSubmit({ preventDefault: () => {} });

  const arjun = vm.runInContext(`allMembers.find(m => m.phone === '9811223344')`, context);
  assert(arjun, 'New member should be added to allMembers');
  assert(Array.isArray(arjun.paymentHistory) && arjun.paymentHistory.length === 1, 'New member must automatically have 1 initial paymentHistory entry locally');
  assert.strictEqual(arjun.paymentHistory[0].amount, 7500);
  assert.strictEqual(arjun.paymentHistory[0].plan, '6 Months');
  assert.strictEqual(arjun.paymentHistory[0].validFrom, '2026-11-11');
  assert.strictEqual(arjun.paymentHistory[0].validTo, '2027-05-11');
  assert(arjun.paymentHistory[0].paymentDate instanceof Date);

  const arjunSetDoc = capturedSetDocs.find(c => c.ref && c.ref.id === '9811223344');
  assert(arjunSetDoc, 'Firestore setDoc should be called for new member');
  assert(Array.isArray(arjunSetDoc.data.paymentHistory) && arjunSetDoc.data.paymentHistory.length === 1, 'Firestore setDoc must persist initial paymentHistory');
  assert.strictEqual(arjunSetDoc.data.paymentHistory[0].validFrom, '2026-11-11');
  assert.strictEqual(arjunSetDoc.data.paymentHistory[0].validTo, '2027-05-11');
  assert.strictEqual(arjunSetDoc.data.paymentHistory[0].amount, 7500);
  assert.strictEqual(arjunSetDoc.data.paymentHistory[0].plan, '6 Months');

  windowObj.openPaymentHistoryDrawer('9811223344');
  assert.strictEqual(documentStub.getElementById('ph-drawer-total').textContent, '₹7,500', 'Drawer Total Paid for new member must equal ₹7,500');
  assert(documentStub.getElementById('ph-drawer-total').classList.contains('text-green-600'), 'Active new member Total Paid must be green');
  const arjunItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
  assert.strictEqual(arjunItems.length, 1);
  assert(arjunItems[0].textContent.includes('11 Nov 2026 to 11 May 2027'), 'New member timeline must show 11 Nov 2026 to 11 May 2027 range');
  assert(arjunItems[0].textContent.includes('6 Months') && arjunItems[0].textContent.includes('Paid ₹7,500 on '));
  assert(arjunItems[0].html.includes('text-green-600 font-bold') && arjunItems[0].html.includes('bg-green-500'), 'New active member initial payment must be green');

  // Test Custom Amount Override in Renew Membership Plan mini-form
  const discNow = new Date();
  const discPast = new Date(discNow.getFullYear(), discNow.getMonth(), discNow.getDate() - 5);
  const discFromIso = `${discPast.getFullYear()}-${String(discPast.getMonth() + 1).padStart(2, '0')}-${String(discPast.getDate()).padStart(2, '0')}`;
  vm.runInContext(`
    updateDashboardMembers([
      ...allMembers,
      {
        id: 'doc-discount-renew',
        memberId: 'GYM-9123',
        name: 'Discount Member',
        phone: '9876501234',
        plan: '1 Month',
        expiryDate: '${discFromIso}',
        amount: 1500,
        paymentHistory: [
          {
            validFrom: '2026-10-01',
            validTo: '${discFromIso}',
            paymentDate: new Date(2026, 9, 1, 10, 0, 0),
            amount: 1500,
            plan: '1 Month'
          }
        ]
      }
    ]);
  `, context);

  const parseCashText = (txt) => Number(String(txt || '').replace(/[^\d]/g, '')) || 0;
  const cashBeforeDiscount = parseCashText(documentStub.getElementById('detailed-total-cash').textContent);

  windowObj.openPaymentHistoryDrawer('doc-discount-renew');
  windowObj.toggleDrawerRenewForm(true);
  assert.strictEqual(renewSelect.value, '1 Month', 'Discount member dropdown defaults to 1 Month');
  assert.strictEqual(renewAmountInput.value, '1500', 'Amount input should auto-fill to 1500 on open');

  // Switch dropdown via onDrawerRenewPlanChange() -> auto-fills 4000, then switch back -> 1500
  renewSelect.value = '3 Months';
  windowObj.onDrawerRenewPlanChange();
  assert.strictEqual(renewAmountInput.value, '4000', 'Selecting 3 Months via onDrawerRenewPlanChange must auto-fill 4000');

  renewSelect.value = '1 Month';
  windowObj.onDrawerRenewPlanChange();
  assert.strictEqual(renewAmountInput.value, '1500', 'Switching back to 1 Month via onDrawerRenewPlanChange must auto-fill 1500');

  // Manual override to discounted 1200 must persist and drive preview + submission
  renewAmountInput.value = '1200';
  windowObj.updateDrawerRenewPreview(false);
  assert.strictEqual(renewAmountInput.value, '1200', 'Manual discount override 1200 must remain intact');
  assert(previewHint.textContent.includes('1,200'), 'Preview hint must reflect manual override ₹1,200');

  const addDocsBeforeDiscount = capturedAddDocs.length;
  await windowObj.confirmDrawerRenewal();

  const discMember = vm.runInContext(`allMembers.find(m => m.id === 'doc-discount-renew')`, context);
  const discLatest = discMember.paymentHistory[discMember.paymentHistory.length - 1];
  assert.strictEqual(discLatest.amount, 1200, 'paymentHistory entry must store manual override amount 1200, ignoring default 1500');
  assert.strictEqual(discMember.amount, 1200, 'Member document amount must update to manual override 1200');
  assert.strictEqual(discLatest.plan, '1 Month');

  const discUpdateCall = [...capturedUpdateDocs].reverse().find(c => c.ref && c.ref.id === 'doc-discount-renew');
  assert(discUpdateCall && discUpdateCall.data.amount === 1200, 'Firestore updateDoc must persist custom amount 1200');

  assert.strictEqual(capturedAddDocs.length, addDocsBeforeDiscount + 1, 'Renewal must add 1 transaction doc to Firestore');
  const discTxDoc = capturedAddDocs[capturedAddDocs.length - 1];
  assert.strictEqual(discTxDoc.data.amount, 1200, 'Firestore transaction must record overridden amount 1200');
  assert.strictEqual(vm.runInContext(`allTransactions[0].amount`, context), 1200, 'Local allTransactions entry must store overridden amount 1200');

  const discItems = documentStub.querySelectorAll('#ph-drawer-body .timeline-fade-up');
  assert(discItems[0].textContent.includes('Paid ₹1,200 on '), 'Drawer timeline item must display custom amount ₹1,200');
  assert.strictEqual(documentStub.getElementById('ph-drawer-total').textContent, '₹2,700', 'Drawer Total Paid should equal 1500 + 1200 = ₹2,700');

  const cashAfterDiscount = parseCashText(documentStub.getElementById('detailed-total-cash').textContent);
  assert.strictEqual(cashAfterDiscount - cashBeforeDiscount, 1200, 'Cash Today must increase by overridden ₹1,200 rather than default ₹1,500');

  // Verify Add New Member rejects duplicate phone rather than performing a legacy modal renewal
  const countBeforeDup = vm.runInContext(`allMembers.length`, context);
  const discHistBeforeDup = discMember.paymentHistory.length;
  documentStub.getElementById('member-name').value = 'Discount Member';
  documentStub.getElementById('member-phone').value = '9876501234';
  documentStub.getElementById('member-plan').value = '1 Month';
  documentStub.getElementById('member-amount').value = '1500';
  await windowObj.handleMemberSubmit({ preventDefault: () => {} });
  assert.strictEqual(vm.runInContext(`allMembers.length`, context), countBeforeDup, 'Duplicate phone submission in Add Member modal must not add duplicate member');
  assert.strictEqual(discMember.paymentHistory.length, discHistBeforeDup, 'Add Member modal must never push renewal to existing member paymentHistory');

  // Verify WhatsApp button in both Desktop & Mobile directory views renders ONLY for Expiring Soon & Expired, NOT Active
  const todayBase = new Date();
  const fmtIsoD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const activeExpIso = fmtIsoD(new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate() + 25));
  const soonExpIso = fmtIsoD(new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate() + 3));
  const expiredExpIso = fmtIsoD(new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate() - 4));
  vm.runInContext(`
    updateDashboardMembers([
      { id: 'wa-active', memberId: 'GYM-101', name: 'WaActive', phone: '9000000101', plan: '1 Month', expiryDate: '${activeExpIso}', amount: 1500 },
      { id: 'wa-soon', memberId: 'GYM-102', name: 'WaSoon', phone: '9000000102', plan: '3 Months', expiryDate: '${soonExpIso}', amount: 0, dueAmount: 0 },
      { id: 'wa-expired', memberId: 'GYM-103', name: 'WaExpired', phone: '9000000103', plan: '1 Month', expiryDate: '${expiredExpIso}', amount: 1200, dueAmount: 1200 }
    ]);
  `, context);
  const waDirHtml = documentStub.getElementById('members-directory-body').innerHTML;
  const waActiveMatches = waDirHtml.match(/sendWhatsAppReminder\('WaActive'/g) || [];
  const waSoonMatches = waDirHtml.match(/sendWhatsAppReminder\('WaSoon',[^)]*,\s*4000\)/g) || [];
  const waExpiredMatches = waDirHtml.match(/sendWhatsAppReminder\('WaExpired',[^)]*,\s*1200\)/g) || [];
  assert.strictEqual(waActiveMatches.length, 0, 'Active member must NOT have WhatsApp button in desktop or mobile view');
  assert.strictEqual(waSoonMatches.length, 2, 'Expiring soon member must pass non-zero planAmount (4000) in both desktop and mobile view even when amount/dueAmount=0');
  assert.strictEqual(waExpiredMatches.length, 2, 'Expired member must pass custom planAmount (1200) in both desktop and mobile view');

  // Verify WhatsApp reminder URL uses api.whatsapp.com, approved English template with ₹${member.planAmount}, never ₹0, and encodeURIComponent()
  const openedWaUrls = [];
  windowObj.open = (url, target) => { openedWaUrls.push({ url, target }); };
  windowObj.handleWhatsAppReminder('WaSoon', '+91 9000000102', '05 Nov 2026');
  windowObj.handleWhatsAppReminder('WaExpired', '+91 9000000103', '05 Nov 2026', 1200);
  windowObj.handleWhatsAppReminder({ name: 'raman', phone: '6864954656', expiryDate: '2026-11-05', plan: '1 Month', planAmount: 1500 });
  assert.strictEqual(openedWaUrls.length, 3, 'handleWhatsAppReminder must invoke window.open for each valid call');

  const expectedSoonText = 'Hi WaSoon, your gym subscription expired on 05 Nov 2026. Please pay your due amount of ₹4000 to continue your workouts. Regards, Gym Admin';
  const expectedExpiredText = 'Hi WaExpired, your gym subscription expired on 05 Nov 2026. Please pay your due amount of ₹1200 to continue your workouts. Regards, Gym Admin';
  const expectedObjText = 'Hi raman, your gym subscription expired on 05 Nov 2026. Please pay your due amount of ₹1500 to continue your workouts. Regards, Gym Admin';

  assert.strictEqual(
    openedWaUrls[0].url,
    `https://api.whatsapp.com/send/?phone=919000000102&text=${encodeURIComponent(expectedSoonText)}`,
    'Omitted planAmount must resolve non-zero plan price from allMembers/plan defaults instead of ₹0'
  );
  assert.strictEqual(
    openedWaUrls[1].url,
    `https://api.whatsapp.com/send/?phone=919000000103&text=${encodeURIComponent(expectedExpiredText)}`,
    'Explicit discounted planAmount must be encoded into exact approved WhatsApp template'
  );
  assert.strictEqual(
    openedWaUrls[2].url,
    `https://api.whatsapp.com/send/?phone=916864954656&text=${encodeURIComponent(expectedObjText)}`,
    'Member object call must format expiryDate and encode planAmount cleanly'
  );
  for (const item of openedWaUrls) {
    assert(!item.url.includes('%E2%82%B90') && !decodeURIComponent(item.url).includes('₹0'), 'Reminder must never contain ₹0');
  }
  assert.strictEqual(windowObj.sendWhatsAppReminder, windowObj.handleWhatsAppReminder, 'sendWhatsAppReminder and handleWhatsAppReminder must share the same handler');

  console.log('ALL PAYMENT HISTORY DRAWER & AUTO-LOGGING TESTS PASSED!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
