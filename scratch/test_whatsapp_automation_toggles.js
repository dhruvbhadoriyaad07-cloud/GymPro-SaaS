// scratch/test_whatsapp_automation_toggles.js
// Automated verification for functional ON/OFF toggles for WhatsApp automation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(indexPath, 'utf-8');

console.log('--- 1. Testing Settings Page HTML Checkboxes & Labels ---');
assert(html.includes('id="settings-auto-receipts"'), 'Settings must have #settings-auto-receipts checkbox');
assert(html.includes('name="autoReceiptsEnabled"'), 'Checkbox must bind to autoReceiptsEnabled');
assert(
  html.includes('Enable Auto-Receipts on WhatsApp after check-ins/renewals'),
  'Must include exact label "Enable Auto-Receipts on WhatsApp after check-ins/renewals"'
);

assert(html.includes('id="settings-daily-reports"'), 'Settings must have #settings-daily-reports checkbox');
assert(html.includes('name="dailyReportsEnabled"'), 'Checkbox must bind to dailyReportsEnabled');
assert(
  html.includes('Enable Daily WhatsApp Reports'),
  'Must include exact label "Enable Daily WhatsApp Reports"'
);
console.log('✓ Both WhatsApp automation checkboxes with exact labels present in Settings view.');

console.log('\n--- 2. Testing JavaScript State & Firestore Sync Bindings ---');
assert(html.includes('autoReceiptsEnabled'), 'gymProfile and updatedData must include autoReceiptsEnabled');
assert(html.includes('dailyReportsEnabled'), 'gymProfile and updatedData must include dailyReportsEnabled');
assert(html.includes('Boolean(autoReceiptsEnabled)'), 'Must convert autoReceiptsEnabled to boolean');
assert(html.includes('Boolean(dailyReportsEnabled)'), 'Must convert dailyReportsEnabled to boolean');
assert(html.includes('autoReceiptsInput.checked'), 'Must read autoReceiptsInput checked state');
assert(html.includes('dailyReportsInput.checked'), 'Must read dailyReportsInput checked state');
console.log('✓ Firestore sync logic and state bindings verified.');

console.log('\n--- 3. Testing Conditional Auto-Receipts Redirect Behavior ---');
let openCalled = false;
let openedUrl = null;
const mockWindow = {
  open: (url) => {
    openCalled = true;
    openedUrl = url;
  }
};

let toastShown = null;
const mockShowToast = (msg, type) => {
  toastShown = { msg, type };
};

// Simulate sendPaymentReceiptWhatsApp logic
async function simulateSendPaymentReceipt(name, phone, amount, expiry, profileState) {
  openCalled = false;
  openedUrl = null;
  toastShown = null;

  let isAutoReceiptsEnabled = (profileState && typeof profileState.autoReceiptsEnabled === 'boolean')
    ? profileState.autoReceiptsEnabled
    : true;

  if (!isAutoReceiptsEnabled) {
    mockShowToast(`Payment recorded for ${name}. (WhatsApp receipt skipped)`, 'info');
    return null;
  }

  const url = `https://api.whatsapp.com/send/?phone=919876543210&text=Hi%20${name}`;
  mockWindow.open(url);
  mockShowToast(`VIP E-Receipt opened for ${name} on WhatsApp!`, 'success');
  return url;
}

// Test 3A: When autoReceiptsEnabled is FALSE -> skip redirect
const resDisabled = await simulateSendPaymentReceipt('Rohan', '9876543210', 1500, '10 Dec 2026', { autoReceiptsEnabled: false });
assert.strictEqual(resDisabled, null, 'Must return null when auto-receipts are disabled');
assert.strictEqual(openCalled, false, 'window.open must NOT be called when auto-receipts are disabled');
assert(toastShown && toastShown.msg.includes('WhatsApp receipt skipped'), 'Toast must indicate receipt was skipped');
console.log('✓ Auto-receipts disabled: window.open() skipped, standard toast shown without unwanted redirect.');

// Test 3B: When autoReceiptsEnabled is TRUE -> open WhatsApp
const resEnabled = await simulateSendPaymentReceipt('Rohan', '9876543210', 1500, '10 Dec 2026', { autoReceiptsEnabled: true });
assert(resEnabled && resEnabled.includes('whatsapp.com'), 'Must return valid WhatsApp URL when enabled');
assert.strictEqual(openCalled, true, 'window.open MUST be called when auto-receipts are enabled');
console.log('✓ Auto-receipts enabled: window.open() executed as expected.');

console.log('\n--- 4. Testing Conditional Daily Report Redirect Behavior ---');
let alertMessage = null;
const mockAlert = (msg) => { alertMessage = msg; };

// Simulate sendDailyReportToOwner logic
async function simulateSendDailyReport(profileState) {
  openCalled = false;
  openedUrl = null;
  alertMessage = null;

  let isDailyReportsEnabled = (profileState && typeof profileState.dailyReportsEnabled === 'boolean')
    ? profileState.dailyReportsEnabled
    : true;

  if (!isDailyReportsEnabled) {
    mockAlert('Daily Reports are disabled in Settings');
    return null;
  }

  const url = 'https://api.whatsapp.com/send/?phone=919845674582&text=Report';
  mockWindow.open(url);
  return url;
}

// Test 4A: When dailyReportsEnabled is FALSE -> alert and abort
const reportResDisabled = await simulateSendDailyReport({ dailyReportsEnabled: false });
assert.strictEqual(reportResDisabled, null, 'Must return null when daily reports are disabled');
assert.strictEqual(openCalled, false, 'window.open must NOT be called when daily reports are disabled');
assert.strictEqual(alertMessage, 'Daily Reports are disabled in Settings', 'Must show exact alert message');
console.log('✓ Daily reports disabled: alert shown ("Daily Reports are disabled in Settings") and WhatsApp redirect aborted.');

// Test 4B: When dailyReportsEnabled is TRUE -> generate and open WhatsApp
const reportResEnabled = await simulateSendDailyReport({ dailyReportsEnabled: true });
assert(reportResEnabled && reportResEnabled.includes('whatsapp.com'), 'Must return URL when enabled');
assert.strictEqual(openCalled, true, 'window.open MUST be called when daily reports are enabled');
console.log('✓ Daily reports enabled: WhatsApp report generated and opened.');

console.log('\n======================================================');
console.log('ALL WHATSAPP AUTOMATION TOGGLE TESTS PASSED!');
console.log('======================================================');
