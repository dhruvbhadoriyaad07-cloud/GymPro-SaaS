const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== 1. Checking Background Graphic Removal ===');
const hasAmbient = html.includes('AMBIENT RADIAL LIGHTING BACKDROP');
console.log('Ambient backdrop present?', hasAmbient);
if (hasAmbient) {
  console.error('FAIL: Ambient backdrop is still present!');
} else {
  console.log('PASS: Ambient backdrop removed.');
}

const stAfterMatch = html.match(/\.st::after\s*\{([^}]+)\}/);
console.log('.st::after rule:', stAfterMatch ? stAfterMatch[1].trim() : 'Not found');
if (stAfterMatch && stAfterMatch[1].includes('width: 160px')) {
  console.error('FAIL: .st::after white circle still exists!');
} else {
  console.log('PASS: .st::after white circle removed.');
}

console.log('\n=== 2. Checking DOM IDs ===');
const requiredIds = [
  'topbar-title', 'topbar-date', 'member-search-input',
  'dashboard-view', 'dashboard-statistics-section',
  'total-cash', 'kpi-today-cash', 'kpi-cash-progress-bar', 'kpi-cash-delta',
  'present-count', 'stat-present-today', 'stat-present-floor', 'stat-floor-total',
  'kpi-active-members', 'kpi-occupancy-bar', 'stat-total-members', 'stat-inactive-members', 'kpi-occupancy-text',
  'expiring-count', 'stat-expiring-soon', 'kpi-expiring-week', 'kpi-new-joins',
  'cash-section', 'cash-date', 'transactions-list', 'tx-count-badge',
  'detailed-total-cash', 'breakdown-new-memberships', 'breakdown-renewals', 'breakdown-walkins', 'breakdown-pt',
  'split-bar-cash', 'split-bar-upi', 'split-bar-card', 'split-label-cash', 'split-label-upi', 'split-label-card',
  'expiring-members-table', 'expiry-table-body', 'count-all', 'count-today', 'count-week', 'count-month',
  'plan-count-monthly', 'plan-count-quarterly', 'plan-count-annual', 'plan-count-walkin', 'plan-total-donut', 'donut-chart-circle',
  'members-view', 'payments-view', 'attendance-view', 'plans-view', 'reports-view', 'settings-view',
  'addMemberModal', 'editMemberModal'
];

let missing = 0;
requiredIds.forEach(id => {
  if (!html.includes(`id=\"${id}\"`)) {
    console.error(`MISSING DOM ID: ${id}`);
    missing++;
  }
});
if (missing === 0) {
  console.log(`PASS: All ${requiredIds.length} required DOM IDs present.`);
} else {
  console.error(`FAIL: ${missing} IDs missing.`);
}

console.log('\n=== 3. Checking JavaScript Syntax ===');
// Extract scripts
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let sMatch;
let scriptIdx = 0;
while ((sMatch = scriptRegex.exec(html)) !== null) {
  scriptIdx++;
  const scriptContent = sMatch[1];
  try {
    // For ES modules with imports, check syntax via vm.Script with import statements stripped or checked
    const testContent = scriptContent.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import');
    new vm.Script(testContent);
    console.log(`PASS: Script block #${scriptIdx} has valid syntax.`);
  } catch (err) {
    console.error(`FAIL: Script block #${scriptIdx} syntax error:`, err.message);
  }
}

console.log('\n=== 4. Checking updateFirebaseStatus Null Safety ===');
const hasSafeUpdate = html.includes('if (pill)');
console.log('updateFirebaseStatus has if (pill)?', hasSafeUpdate);
if (hasSafeUpdate) {
  console.log('PASS: updateFirebaseStatus is null-safe.');
} else {
  console.error('FAIL: updateFirebaseStatus lacks null check on pill!');
}

