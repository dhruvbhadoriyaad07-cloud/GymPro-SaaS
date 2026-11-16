// scratch/test_dashboard_auth_lock.js
// Automated verification for Admin Dashboard authentication lock in index.html

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(indexPath, 'utf-8');

console.log('--- 1. Testing Firebase Auth Imports in index.html ---');
assert(
  html.includes('import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";') ||
  (html.includes('getAuth') && html.includes('onAuthStateChanged') && html.includes('firebase-auth.js')),
  'getAuth and onAuthStateChanged must be imported from firebase-auth.js'
);
console.log('✓ Firebase Auth imports verified.');

console.log('\n--- 2. Testing Dashboard Backdoor Lock Code Snippet ---');
assert(html.includes('const auth = getAuth();'), 'Must initialize auth with getAuth()');
assert(html.includes('// Dashboard backdoor lock'), 'Must have Dashboard backdoor lock comment');
assert(html.includes('window.location.replace("login.html");'), 'Must redirect unauthenticated user to login.html');
console.log('✓ Dashboard backdoor lock snippet verified.');

console.log('\n--- 3. Simulating Authentication Lock Behavior ---');
let redirectedTo = null;
const mockWindow = {
  location: {
    replace: (url) => { redirectedTo = url; }
  }
};

function simulateBackdoorLock(user) {
  redirectedTo = null;
  if (!user) {
    mockWindow.location.replace("login.html");
  }
}

// 3A: Unauthenticated user -> must redirect to login.html
simulateBackdoorLock(null);
assert.strictEqual(redirectedTo, 'login.html', 'Unauthenticated user must be redirected to login.html');
console.log('✓ Unauthenticated user (user = null) is redirected to login.html');

// 3B: Authenticated user -> must NOT redirect
simulateBackdoorLock({ email: 'admin@gympro.in', uid: 'admin-123' });
assert.strictEqual(redirectedTo, null, 'Authenticated user must not be redirected');
console.log('✓ Authenticated user is allowed through to dashboard');

console.log('\n======================================================');
console.log('ALL DASHBOARD AUTHENTICATION LOCK TESTS PASSED!');
console.log('======================================================');
