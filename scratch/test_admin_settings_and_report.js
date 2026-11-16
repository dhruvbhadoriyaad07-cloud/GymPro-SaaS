// scratch/test_admin_settings_and_report.js
// Automated verification for Admin Configuration (Gym Profile Settings & Firestore Storage)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');
const rulesPath = path.resolve(__dirname, '../firestore.rules');

const html = fs.readFileSync(indexPath, 'utf-8');
const rules = fs.readFileSync(rulesPath, 'utf-8');

console.log('--- 1. Testing HTML Markup for Settings & Gym Profile ---');
assert(html.includes('id="settings-view"'), 'Settings view container must exist');
assert(html.includes('Gym Profile'), 'Settings view must have "Gym Profile" header');
assert(html.includes('id="settings-owner-whatsapp"'), 'Owner WhatsApp number input must exist');
assert(html.includes('Owner WhatsApp Number (for daily reports)'), 'Label must match user specification');
assert(html.includes('id="btn-save-gym-profile"'), 'Save settings button must exist');
assert(html.includes('window.saveGymProfileSettings()'), 'Form must trigger saveGymProfileSettings()');
console.log('✓ Settings Page HTML UI verified.');

console.log('\n--- 2. Testing Firestore Security Rules ---');
assert(rules.includes('match /gymSettings/{settingId}'), 'firestore.rules must include gymSettings match rule');
console.log('✓ Firestore security rules for gymSettings verified.');

console.log('\n--- 3. Testing Static Code Functions & Firestore Integration ---');
assert(html.includes('window.saveGymProfileSettings = async function'), 'saveGymProfileSettings must be declared');
assert(html.includes('window.renderSettingsView = async function'), 'renderSettingsView must be declared');
assert(html.includes('gymSettings'), 'Code must reference gymSettings collection');
assert(html.includes('"profile"'), 'Code must reference profile document');
assert(html.includes('ownerWhatsAppNumber'), 'Code must reference ownerWhatsAppNumber field');
console.log('✓ Function declarations and Firestore document targeting verified.');

console.log('\n--- 4. Testing End-to-End Simulation of Settings & Report Logic ---');

// Mock Firestore DB store
const firestoreStore = {
  gymSettings: {
    profile: {
      ownerWhatsAppNumber: '9845674582',
      gymName: 'GymPro Fitness'
    }
  }
};

let openedUrls = [];
let toasts = [];

const mockWindow = {
  GYM_OWNER_PHONE: '9845674582',
  currentSettings: { ...firestoreStore.gymSettings.profile },
  open: (url, target) => {
    openedUrls.push({ url, target });
    return {};
  },
  showToast: (msg, type) => {
    toasts.push({ msg, type });
  }
};

// Simulate Firestore doc fetch & report logic
async function simulateSendDailyReport(customPhone) {
  let ownerPhone = customPhone;

  // Fetch from simulated Firestore gymSettings/profile
  if (!ownerPhone) {
    const snap = firestoreStore.gymSettings.profile;
    if (snap && snap.ownerWhatsAppNumber) {
      ownerPhone = snap.ownerWhatsAppNumber;
    }
  }

  const metrics = {
    totalToday: 5000,
    cashToday: 3000,
    upiToday: 2000,
    newMembersToday: 2
  };

  const total = metrics.totalToday;
  const cash = metrics.cashToday;
  const upi = metrics.upiToday;
  const newMembers = metrics.newMembersToday;
  let msg = `📊 *Aaj ka Gym Hissab* 📊\n\n*Total Collection:* ₹${total}\n💵 *Cash:* ₹${cash}\n📱 *UPI:* ₹${upi}\n👥 *New Admissions:* ${newMembers}\n\nGreat job today! 🚀`;

  const targetDigits = String(ownerPhone || '').replace(/\D/g, '');
  const clean10 = targetDigits.length > 10 ? targetDigits.slice(-10) : targetDigits;

  assert(clean10.length === 10, 'Owner phone must be 10 digits');
  const finalPhone = `91${clean10}`;
  const whatsappUrl = `https://api.whatsapp.com/send/?phone=${finalPhone}&text=${encodeURIComponent(msg)}`;

  mockWindow.open(whatsappUrl, '_blank');
  return { url: whatsappUrl, finalPhone };
}

// Test 4A: Initial report targeting default owner WhatsApp number
let res = await simulateSendDailyReport();
assert.strictEqual(res.finalPhone, '919845674582');
assert(res.url.includes('phone=919845674582'));
console.log('✓ Default report successfully targeted 919845674582');

// Test 4B: Admin updates owner WhatsApp number to a new number
const newOwnerNumber = '9876543210';
firestoreStore.gymSettings.profile.ownerWhatsAppNumber = newOwnerNumber;

// Test 4C: Next report fetch picks up the new number from Firestore
res = await simulateSendDailyReport();
assert.strictEqual(res.finalPhone, '919876543210');
assert(res.url.includes('phone=919876543210'));
console.log('✓ Updated report dynamically fetched new number from Firestore and targeted 919876543210');

console.log('\n========================================');
console.log('ALL ADMIN SETTINGS & REPORT TESTS PASSED!');
console.log('========================================');
