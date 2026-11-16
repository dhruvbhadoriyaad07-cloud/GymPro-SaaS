import fs from 'fs';
import vm from 'vm';
import assert from 'assert';

const htmlPath = 'c:\\Users\\Dhruv Singh\\Desktop\\GYM system\\index.html';
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract all id="..." from HTML
const ids = new Set();
const idRe = /\sid=["']([^"']+)["']/gi;
let m;
while ((m = idRe.exec(html)) !== null) ids.add(m[1]);

function createMockElement(tag = 'div', id = '') {
  const classes = new Set();
  const el = {
    tagName: tag.toUpperCase(),
    id,
    _innerHTML: '',
    textContent: '',
    value: '',
    checked: true,
    disabled: false,
    dataset: {},
    options: [],
    selectedIndex: 0,
    style: new Proxy({ setProperty: () => {}, removeProperty: () => {} }, { set(t, k, v) { t[k] = v; return true; } }),
    children: [],
    childNodes: [],
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      toggle: (c, force) => {
        if (force === undefined) classes.has(c) ? classes.delete(c) : classes.add(c);
        else force ? classes.add(c) : classes.delete(c);
      },
      contains: (c) => classes.has(c),
      toString: () => [...classes].join(' ')
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => createMockElement('div'),
    querySelectorAll: () => [],
    closest: () => null,
    getAttribute: (attr) => el.dataset[attr] || '',
    setAttribute: (attr, val) => { el.dataset[attr] = String(val); },
    removeAttribute: (attr) => { delete el.dataset[attr]; },
    focus: () => {},
    select: () => {},
    scrollIntoView: () => {},
    appendChild: (c) => {
      el.children.push(c);
      if (tag.toLowerCase() === 'select') {
        el.options.push(c);
      }
    },
    remove: () => { el._removed = true; },
    reset: () => { el.value = ''; },
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 40 })
  };

  Object.defineProperty(el, 'innerHTML', {
    get: () => el._innerHTML,
    set: (v) => {
      el._innerHTML = String(v);
      if (tag.toLowerCase() === 'select') {
        // Parse options from innerHTML
        const optRe = /<option\s+([^>]*?)>([^<]*)<\/option>/gi;
        let optM;
        el.options = [];
        while ((optM = optRe.exec(v)) !== null) {
          const optAttrs = optM[1];
          const optText = optM[2];
          const valM = optAttrs.match(/value=["']([^"']*)["']/);
          const monthsM = optAttrs.match(/data-months=["']([^"']*)["']/);
          const priceM = optAttrs.match(/data-price=["']([^"']*)["']/);
          const optObj = {
            value: valM ? valM[1] : optText,
            text: optText,
            textContent: optText,
            getAttribute: (a) => {
              if (a === 'data-months') return monthsM ? monthsM[1] : '';
              if (a === 'data-price') return priceM ? priceM[1] : '';
              return '';
            }
          };
          el.options.push(optObj);
        }
        if (el.options.length > 0) {
          el.selectedIndex = 0;
          el.value = el.options[0].value;
        }
      }
    }
  });

  return el;
}

const domMap = new Map();
for (const id of ids) {
  domMap.set(id, createMockElement('div', id));
}

// Ensure select elements have correct mock tag
domMap.set('member-plan', createMockElement('select', 'member-plan'));
domMap.set('edit-member-plan', createMockElement('select', 'edit-member-plan'));
domMap.set('ph-renew-plan-select', createMockElement('select', 'ph-renew-plan-select'));
domMap.set('plan-category', createMockElement('select', 'plan-category'));

const windowObj = {
  location: { href: 'http://localhost:3000/index.html', replace: () => {}, origin: 'http://localhost:3000', protocol: 'http:' },
  open: () => ({}),
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
  innerWidth: 1280,
  innerHeight: 800,
  requestAnimationFrame: (cb) => { cb(); return 0; },
  cancelAnimationFrame: () => {},
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  navigator: { clipboard: { writeText: async () => {} } },
  Intl,
  confirm: () => true
};

const documentObj = {
  readyState: 'complete',
  body: createMockElement('body'),
  documentElement: createMockElement('html'),
  getElementById: (id) => domMap.get(id) || null,
  querySelector: (sel) => {
    if (sel && sel.startsWith('#')) return domMap.get(sel.slice(1)) || null;
    return createMockElement('div');
  },
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {}
};

const storage = new Map();
const localStorageObj = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

const ctx = vm.createContext({
  window: windowObj,
  self: windowObj,
  globalThis: undefined,
  document: documentObj,
  localStorage: localStorageObj,
  navigator: windowObj.navigator,
  Intl,
  Math,
  Date,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  Promise,
  Set,
  Map,
  URLSearchParams,
  encodeURIComponent,
  decodeURIComponent,
  isNaN,
  parseFloat,
  parseInt,
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  requestAnimationFrame: (cb) => { cb(); return 0; },
  cancelAnimationFrame: () => {},
  tailwind: {},
  matchMedia: windowObj.matchMedia,
  performance: { now: () => Date.now() },
  confirm: () => true,
  console: console
});
ctx.globalThis = ctx;
ctx.window.window = windowObj;
ctx.window.document = documentObj;
ctx.window.localStorage = localStorageObj;

// Extract module code
const scriptRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
const scripts = [];
let scM;
while ((scM = scriptRe.exec(html)) !== null) {
  const attrs = scM[1].trim();
  const code = scM[2];
  if (code.trim()) scripts.push({ attrs, code });
}

// Mock Firebase
let plansSnapshotCb = null;
const firestorePlansCollection = [];

const mod = new vm.SourceTextModule(scripts[1].code, { context: ctx });
await mod.link(async (specifier) => {
  if (specifier.includes('firebase-app')) {
    return new vm.SyntheticModule(['initializeApp'], function () {
      this.setExport('initializeApp', () => ({}));
    }, { context: ctx });
  }
  if (specifier.includes('firebase-firestore')) {
    const exports = [
      'getFirestore', 'collection', 'doc', 'addDoc', 'setDoc', 'getDoc',
      'updateDoc', 'deleteDoc', 'getDocs', 'onSnapshot', 'query', 'where',
      'serverTimestamp', 'arrayUnion'
    ];
    return new vm.SyntheticModule(exports, function () {
      this.setExport('getFirestore', () => ({}));
      this.setExport('collection', (_, name) => ({ path: name }));
      this.setExport('doc', (_, col, id) => ({ path: col, id }));
      this.setExport('addDoc', async (colRef, data) => {
        const id = 'plan-' + Math.random().toString(36).substring(2, 9);
        const docRecord = { id, ...data };
        firestorePlansCollection.push(docRecord);
        return { id };
      });
      this.setExport('setDoc', async () => {});
      this.setExport('getDoc', async () => ({ exists: () => false, data: () => ({}) }));
      this.setExport('updateDoc', async (docRef, data) => {
        const found = firestorePlansCollection.find(p => p.id === docRef.id);
        if (found) Object.assign(found, data);
      });
      this.setExport('deleteDoc', async (docRef) => {
        const idx = firestorePlansCollection.findIndex(p => p.id === docRef.id);
        if (idx !== -1) firestorePlansCollection.splice(idx, 1);
      });
      this.setExport('getDocs', async () => ({ empty: true, docs: [], forEach: () => {} }));
      this.setExport('onSnapshot', (ref, cb) => {
        if (ref?.path === 'plans') {
          plansSnapshotCb = cb;
        }
        return () => {};
      });
      this.setExport('query', (c) => c);
      this.setExport('where', () => ({}));
      this.setExport('serverTimestamp', () => new Date());
      this.setExport('arrayUnion', (...x) => x);
    }, { context: ctx });
  }
  if (specifier.includes('firebase-auth')) {
    return new vm.SyntheticModule(['getAuth', 'onAuthStateChanged', 'signOut'], function () {
      this.setExport('getAuth', () => ({ currentUser: { email: 'admin@gympro.in', uid: 'u1' } }));
      this.setExport('onAuthStateChanged', (_auth, cb) => {
        cb({ email: 'admin@gympro.in', uid: 'admin1' });
      });
      this.setExport('signOut', async () => {});
    }, { context: ctx });
  }
  if (specifier.includes('firebase-storage')) {
    return new vm.SyntheticModule(['getStorage', 'ref', 'uploadBytes', 'getDownloadURL'], function () {
      this.setExport('getStorage', () => ({}));
      this.setExport('ref', () => ({}));
      this.setExport('uploadBytes', async () => ({ ref: {} }));
      this.setExport('getDownloadURL', async () => 'https://example.com/logo.png');
    }, { context: ctx });
  }
  throw new Error('Unknown: ' + specifier);
});

await mod.evaluate();

console.log('--- Step 1: Verify Initial Plans & Default Seeding ---');
assert(Array.isArray(windowObj.allPlans), 'allPlans must be an array');
assert(windowObj.allPlans.length >= 5, 'Should have baseline default plans loaded');
console.log('Initial plans count:', windowObj.allPlans.length);
assert(windowObj.allPlans.some(p => p.name === '1 Month'), 'Should have "1 Month" plan');
assert(windowObj.allPlans.some(p => p.name === 'General PT'), 'Should have "General PT" plan');

console.log('--- Step 2: Verify switchView("plans") ---');
windowObj.switchView('plans');
const plansView = domMap.get('plans-view');
const dashView = domMap.get('dashboard-view');
assert(!plansView.classList.contains('hidden'), 'plans-view must not be hidden when switchView("plans") is called');
assert(dashView.classList.contains('hidden'), 'dashboard-view must be hidden when in plans-view');

const plansTableHtml = domMap.get('plans-table-container').innerHTML;
assert(plansTableHtml.includes('1 Month'), 'Plans table should render "1 Month"');
assert(plansTableHtml.includes('General PT'), 'Plans table should render "General PT"');
assert(plansTableHtml.includes('Personal Training'), 'Plans table should render "Personal Training" badge');

console.log('--- Step 3: Verify Dynamic Dropdown Syncing ---');
const renewSelect = domMap.get('ph-renew-plan-select');
const memberPlanSelect = domMap.get('member-plan');
const editPlanSelect = domMap.get('edit-member-plan');

assert(renewSelect.options.length >= 5, 'ph-renew-plan-select should be populated with active plans');
assert(memberPlanSelect.options.length >= 5, 'member-plan should be populated with active plans');
assert(editPlanSelect.options.length >= 5, 'edit-member-plan should be populated with active plans');

const renewOptValues = renewSelect.options.map(o => o.value);
assert(renewOptValues.includes('1 Month'), 'Renew select must have 1 Month option');
assert(renewOptValues.includes('3 Months'), 'Renew select must have 3 Months option');
assert(renewOptValues.includes('General PT'), 'Renew select must have General PT option');

console.log('--- Step 4: Verify Create New Plan (CRUD: Create) ---');
windowObj.openPlanModal();
assert(!domMap.get('planModal').classList.contains('hidden'), 'planModal must be open');

domMap.get('plan-name').value = 'VIP 1 Year Special';
domMap.get('plan-category').value = 'Membership';
domMap.get('plan-duration').value = '12';
domMap.get('plan-price').value = '15000';
domMap.get('plan-status-toggle').checked = true;

await windowObj.handlePlanSubmit({ preventDefault: () => {} });
assert(windowObj.allPlans.some(p => p.name === 'VIP 1 Year Special'), 'VIP 1 Year Special must exist in allPlans');

// Verify it automatically synced to dropdowns
assert(renewSelect.options.some(o => o.value === 'VIP 1 Year Special'), 'Renew select must now include VIP 1 Year Special');
assert(memberPlanSelect.options.some(o => o.value === 'VIP 1 Year Special'), 'Member select must now include VIP 1 Year Special');

// Verify duration and price calculation dynamically uses the new plan
assert.strictEqual(windowObj.getPlanDurationMonths('VIP 1 Year Special'), 12, 'getPlanDurationMonths must return 12');
assert.strictEqual(windowObj.resolvePlanPrice('VIP 1 Year Special'), 15000, 'resolvePlanPrice must return 15000');

console.log('--- Step 5: Verify Edit Plan (CRUD: Update) ---');
const vipPlan = windowObj.allPlans.find(p => p.name === 'VIP 1 Year Special');
windowObj.openPlanModal(vipPlan.id);
assert.strictEqual(domMap.get('plan-edit-id').value, vipPlan.id);
assert.strictEqual(domMap.get('plan-name').value, 'VIP 1 Year Special');

// Change price to 16000
domMap.get('plan-price').value = '16000';
await windowObj.handlePlanSubmit({ preventDefault: () => {} });
assert.strictEqual(windowObj.resolvePlanPrice('VIP 1 Year Special'), 16000, 'Price must update to 16000');

console.log('--- Step 6: Verify Toggle Active / Inactive Status ---');
await windowObj.togglePlanStatus(vipPlan.id);
const updatedVip = windowObj.allPlans.find(p => p.id === vipPlan.id);
assert.strictEqual(updatedVip.status, 'inactive', 'Status should now be inactive');

// Verify Inactive plan is REMOVED from Renew Plan and Add Member dropdowns
assert(!renewSelect.options.some(o => o.value === 'VIP 1 Year Special'), 'Inactive plan must NOT appear in Renew Plan dropdown');
assert(!memberPlanSelect.options.some(o => o.value === 'VIP 1 Year Special'), 'Inactive plan must NOT appear in Add Member dropdown');

console.log('--- Step 7: Verify Delete Plan (CRUD: Delete) ---');
await windowObj.deletePlan(vipPlan.id, vipPlan.name);
assert(!windowObj.allPlans.some(p => p.id === vipPlan.id), 'Plan must be deleted from allPlans');
assert(!renewSelect.options.some(o => o.value === 'VIP 1 Year Special'), 'Deleted plan must not exist in dropdowns');

console.log('--- Step 8: Verify Clean List/Table View & Admin Controls ---');
windowObj.renderPlansTable(windowObj.allPlans);
const tableContainerHtml = domMap.get('plans-table-container').innerHTML;

// 1. Assert Table Layout & Required Column Headers
assert(tableContainerHtml.includes('<table class="w-full text-left border-collapse"'), 'Must render full-width table view');
assert(tableContainerHtml.includes('PACKAGE NAME'), 'Table header must have PACKAGE NAME');
assert(tableContainerHtml.includes('CATEGORY'), 'Table header must have CATEGORY');
assert(tableContainerHtml.includes('DURATION'), 'Table header must have DURATION');
assert(tableContainerHtml.includes('PRICE'), 'Table header must have PRICE');
assert(tableContainerHtml.includes('STATUS'), 'Table header must have STATUS');
assert(tableContainerHtml.includes('ACTIONS'), 'Table header must have ACTIONS');

// 2. Assert Table Row Data
assert(tableContainerHtml.includes('1 Month'), 'Table row must include 1 Month plan');
assert(tableContainerHtml.includes('₹1,500'), 'Table row must format price as ₹1,500');

// 3. Assert Admin Controls (Edit & Delete on the far right)
assert(tableContainerHtml.includes('openPlanModal('), 'Table row must have edit icon button calling openPlanModal');
assert(tableContainerHtml.includes('deletePlan('), 'Table row must have delete icon button calling deletePlan');

// 4. Assert Top Action Bar elements exist in DOM
assert(html.includes('+ New Plan'), 'Top action bar must have + New Plan button');
assert(html.includes('data-plan-filter="all"'), 'Filter bar must have All Plans filter');
assert(html.includes('data-plan-filter="active"'), 'Filter bar must have Active filter');
assert(html.includes('data-plan-filter="inactive"'), 'Filter bar must have Inactive filter');

// 5. Assert No Fast-Add Modal or card button
assert(!html.includes('id="fastAddMemberModal"'), 'fastAddMemberModal must be completely removed');
assert(!tableContainerHtml.includes('Add member on this plan'), 'Table view must not contain fast-add buttons');
assert(windowObj.openFastAddModal === undefined, 'openFastAddModal must be undefined');

console.log('ALL PLANS & PACKAGES CRUD AND TABLE VIEW TESTS PASSED SUCCESSFULLY!');

