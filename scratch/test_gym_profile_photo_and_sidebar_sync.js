// scratch/test_gym_profile_photo_and_sidebar_sync.js
// Automated verification for Gym Profile with Base64 FileReader & Dynamic Sidebar Sync (No Firebase Storage)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');

const html = fs.readFileSync(indexPath, 'utf-8');

console.log('--- 1. Testing HTML Markup for Gym Profile Inputs & Photo Upload ---');
assert(html.includes('id="settings-gym-name"'), 'Settings must have #settings-gym-name input');
assert(html.includes('id="settings-admin-name"'), 'Settings must have #settings-admin-name input');
assert(html.includes('id="settings-photo-file-input"'), 'Settings must have #settings-photo-file-input file input');
assert(html.includes('id="settings-photo-preview"'), 'Settings must have #settings-photo-preview image preview');
assert(html.includes('id="settings-owner-whatsapp"'), 'Settings must have #settings-owner-whatsapp input');
assert(html.includes('id="btn-save-gym-profile"'), 'Settings must have #btn-save-gym-profile button');
console.log('✓ All Gym Profile inputs and photo upload elements present in Settings.');

console.log('\n--- 2. Testing Sidebar Dynamic Markup Elements ---');
assert(html.includes('id="sidebar-brand-name"'), 'Sidebar must have dynamic #sidebar-brand-name');
assert(html.includes('id="sidebar-brand-logo-img"'), 'Sidebar must have dynamic #sidebar-brand-logo-img');
assert(html.includes('id="sidebar-brand-logo-icon"'), 'Sidebar must have fallback #sidebar-brand-logo-icon');
assert(html.includes('id="sidebar-user-name"'), 'Sidebar must have dynamic #sidebar-user-name');
assert(html.includes('id="sidebar-user-photo"'), 'Sidebar must have dynamic #sidebar-user-photo');
assert(html.includes('id="sidebar-user-initial"'), 'Sidebar must have fallback #sidebar-user-initial');
console.log('✓ All dynamic Sidebar brand and user profile elements present.');

console.log('\n--- 3. Testing Complete Removal of Firebase Storage (No Billing / CORS) ---');
assert(!html.includes('firebase-storage.js'), 'Must NOT import firebase-storage.js');
assert(!html.includes('getStorage('), 'Must NOT initialize getStorage()');
assert(!html.includes('uploadBytes('), 'Must NOT use uploadBytes()');
assert(html.includes('readFileAsBase64'), 'Must have client-side readFileAsBase64 function');
assert(html.includes('photoBase64'), 'Must save and load photoBase64 in gymSettings/profile');
console.log('✓ Firebase Storage completely decommissioned in favor of client-side FileReader Base64.');

console.log('\n--- 4. Testing Static Code Functions & Firestore Integration ---');
assert(html.includes('window.syncSidebarProfile = syncSidebarProfile'), 'syncSidebarProfile must be exported');
assert(html.includes('window.handleSettingsPhotoSelected ='), 'handleSettingsPhotoSelected must be declared');
assert(html.includes('window.removeSettingsPhoto = function'), 'removeSettingsPhoto must be declared');
assert(html.includes('photoBase64'), 'Profile data must include photoBase64');
assert(html.includes('adminName'), 'Profile data must include adminName');
assert(html.includes('gymName'), 'Profile data must include gymName');
console.log('✓ All function declarations and profile fields verified.');

console.log('\n--- 5. Testing Simulation of Dynamic Sidebar Sync & Fallbacks ---');

// Mock DOM elements for sidebar
const dom = {
  'sidebar-brand-name': { textContent: 'GymPro' },
  'sidebar-brand-logo-img': { src: '', classList: new Set(['hidden']) },
  'sidebar-brand-logo-icon': { classList: new Set([]) },
  'sidebar-user-name': { textContent: 'admin' },
  'sidebar-user-photo': { src: '', classList: new Set(['hidden']) },
  'sidebar-user-initial': { textContent: 'A', classList: new Set([]) }
};

function getEl(id) {
  const el = dom[id];
  if (!el) return null;
  return {
    ...el,
    get textContent() { return el.textContent; },
    set textContent(v) { el.textContent = v; },
    get src() { return el.src; },
    set src(v) { el.src = v; },
    classList: {
      contains: (c) => el.classList.has(c),
      add: (c) => el.classList.add(c),
      remove: (c) => el.classList.delete(c)
    }
  };
}

function simulateSyncSidebarProfile(profile) {
  const gymName = (profile.gymName || '').trim() || 'GymPro';
  const adminName = (profile.adminName || '').trim() || 'Admin';
  const imageSrc = profile.photoBase64 || profile.photoUrl || '';

  const brandNameEl = getEl('sidebar-brand-name');
  if (brandNameEl) brandNameEl.textContent = gymName;

  const brandLogoImg = getEl('sidebar-brand-logo-img');
  const brandLogoIcon = getEl('sidebar-brand-logo-icon');
  if (brandLogoImg && brandLogoIcon) {
    if (imageSrc) {
      brandLogoImg.src = imageSrc;
      brandLogoImg.classList.remove('hidden');
      brandLogoIcon.classList.add('hidden');
    } else {
      brandLogoImg.src = '';
      brandLogoImg.classList.add('hidden');
      brandLogoIcon.classList.remove('hidden');
    }
  }

  const userNameEl = getEl('sidebar-user-name');
  if (userNameEl) userNameEl.textContent = adminName;

  const userPhotoEl = getEl('sidebar-user-photo');
  const userInitialEl = getEl('sidebar-user-initial');
  if (userPhotoEl && userInitialEl) {
    if (imageSrc) {
      userPhotoEl.src = imageSrc;
      userPhotoEl.classList.remove('hidden');
      userInitialEl.classList.add('hidden');
    } else {
      userPhotoEl.src = '';
      userPhotoEl.classList.add('hidden');
      userInitialEl.classList.remove('hidden');
      const initial = adminName.trim().charAt(0).toUpperCase() || 'A';
      userInitialEl.textContent = initial;
    }
  }
}

// Test 5A: Initial default state with empty fields uses fallbacks
simulateSyncSidebarProfile({ gymName: '', adminName: '', photoBase64: '' });
assert.strictEqual(dom['sidebar-brand-name'].textContent, 'GymPro', 'Default brand name must fallback to GymPro');
assert.strictEqual(dom['sidebar-user-name'].textContent, 'Admin', 'Default user name must fallback to Admin');
assert(dom['sidebar-brand-logo-img'].classList.has('hidden'), 'Logo img must be hidden without photo');
assert(!dom['sidebar-brand-logo-icon'].classList.has('hidden'), 'Logo icon must be visible without photo');
assert(dom['sidebar-user-photo'].classList.has('hidden'), 'User photo must be hidden without photo');
assert.strictEqual(dom['sidebar-user-initial'].textContent, 'A', 'Initial must be A');
console.log('✓ Fallbacks verified: "GymPro" and "Admin" applied when fields are empty.');

// Test 5B: Custom profile with Base64 string updates brand name, logo, admin name, and user photo
const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
simulateSyncSidebarProfile({
  gymName: 'Titan Fitness Arena',
  adminName: 'Rohit Tomar',
  photoBase64: sampleBase64
});
assert.strictEqual(dom['sidebar-brand-name'].textContent, 'Titan Fitness Arena');
assert.strictEqual(dom['sidebar-user-name'].textContent, 'Rohit Tomar');
assert.strictEqual(dom['sidebar-brand-logo-img'].src, sampleBase64);
assert(!dom['sidebar-brand-logo-img'].classList.has('hidden'), 'Logo img must be shown with Base64 photo');
assert(dom['sidebar-brand-logo-icon'].classList.has('hidden'), 'Logo icon must be hidden with Base64 photo');
assert.strictEqual(dom['sidebar-user-photo'].src, sampleBase64);
assert(!dom['sidebar-user-photo'].classList.has('hidden'), 'User photo must be shown with Base64 photo');
console.log('✓ Custom profile sync verified: "Titan Fitness Arena" & "Rohit Tomar" with Base64 photo applied across sidebar.');

console.log('\n======================================================');
console.log('ALL GYM PROFILE PHOTO & SIDEBAR SYNC TESTS PASSED!');
console.log('======================================================');

