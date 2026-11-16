const fs = require('fs');
const assert = require('assert');

console.log('--- 1. Testing HTML Markup for Inactive (>30d) Filter Chip ---');
const html = fs.readFileSync('index.html', 'utf8');

// Check 1: UI element in chips container
const chipRegex = /<button\s+type="button"\s+class="chip member-filter-btn"\s+data-filter="inactive"\s+onclick="filterMembersByStatus\('inactive'\)"\s+style="--k:\s*var\(--muted\);"><i\s+style="background:\s*#64708A;"><\/i>\s*Inactive\s*\(>30d\)\s*<b\s+id="chip-count-inactive">0<\/b><\/button>/;
assert.ok(chipRegex.test(html), 'Inactive (>30d) filter chip markup must match specification exactly');
console.log('✓ Inactive (>30d) filter chip markup verified.');

// Check 2: Counting logic in renderMembersDirectoryTable
assert.ok(html.includes('let inactiveCount = 0;'), 'inactiveCount must be initialized');
assert.ok(html.includes('if (days < -30) inactiveCount++;'), 'days < -30 inactiveCount++ must be present in renderMembersDirectoryTable');
assert.ok(html.includes("const cInactive = document.getElementById('chip-count-inactive');"), 'cInactive element lookup must be present');
assert.ok(html.includes("if (cInactive) cInactive.textContent = inactiveCount;"), 'cInactive textContent update must be present');
console.log('✓ Counting logic in renderMembersDirectoryTable verified.');

// Check 3: Filtering logic in filterMembersDirectory
assert.ok(html.includes("if (days < -30) mStatus = 'inactive';"), "if (days < -30) mStatus = 'inactive' must be present in filterMembersDirectory");
console.log('✓ Filtering logic in filterMembersDirectory verified.');

console.log('\n--- 2. Testing Logic Execution with Sample Members ---');
// Let's test the counting & filtering logic with synthetic dates
const today = new Date();
today.setHours(0, 0, 0, 0);

function formatYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const addDays = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return formatYMD(d);
};

const sampleMembers = [
  { name: 'Active Member', expiryDate: addDays(15) },         // days = 15 -> active
  { name: 'Expiring Soon Member', expiryDate: addDays(4) },   // days = 4  -> soon
  { name: 'Due Member 1', expiryDate: addDays(-5) },          // days = -5 -> due
  { name: 'Due Member 2', expiryDate: addDays(-29) },         // days = -29 -> due
  { name: 'Inactive Member 1', expiryDate: addDays(-31) },    // days = -31 -> inactive
  { name: 'Inactive Member 2', expiryDate: addDays(-60) },    // days = -60 -> inactive
];

let activeCount = 0;
let soonCount = 0;
let dueCount = 0;
let inactiveCount = 0;

sampleMembers.forEach(m => {
  const expDate = new Date(m.expiryDate);
  const expZero = new Date(expDate);
  expZero.setHours(0, 0, 0, 0);
  const days = Math.round((expZero.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < -30) inactiveCount++;
  else if (days < 0) dueCount++;
  else if (days <= 7) soonCount++;
  else activeCount++;
});

assert.strictEqual(activeCount, 1, 'activeCount should be 1');
assert.strictEqual(soonCount, 1, 'soonCount should be 1');
assert.strictEqual(dueCount, 2, 'dueCount should be 2 (-5 and -29 days)');
assert.strictEqual(inactiveCount, 2, 'inactiveCount should be 2 (-31 and -60 days)');
console.log(`✓ Sample counts: Active=${activeCount}, Soon=${soonCount}, Due=${dueCount}, Inactive=${inactiveCount}`);

// Test filtering simulation
function getStatusForMember(m) {
  const expDate = new Date(m.expiryDate);
  const expZero = new Date(expDate);
  expZero.setHours(0, 0, 0, 0);
  const days = Math.round((expZero.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  let mStatus = 'active';
  if (days < -30) mStatus = 'inactive';
  else if (days < 0) mStatus = 'due';
  else if (days <= 7) mStatus = 'soon';
  else mStatus = 'active';
  return mStatus;
}

const inactiveMembers = sampleMembers.filter(m => getStatusForMember(m) === 'inactive');
assert.strictEqual(inactiveMembers.length, 2);
assert.strictEqual(inactiveMembers[0].name, 'Inactive Member 1');
assert.strictEqual(inactiveMembers[1].name, 'Inactive Member 2');

const dueMembers = sampleMembers.filter(m => getStatusForMember(m) === 'due');
assert.strictEqual(dueMembers.length, 2);

console.log('✓ Filter matches expected members when status is "inactive".');

console.log('\n======================================================');
console.log('ALL INACTIVE (>30 DAYS) FILTER CHIP TESTS PASSED!');
console.log('======================================================');
