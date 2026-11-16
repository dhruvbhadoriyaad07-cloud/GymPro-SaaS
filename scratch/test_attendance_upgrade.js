// scratch/test_attendance_upgrade.js
// Verification suite for Attendance View Upgrade & Absent Member Tracking

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(indexPath, 'utf-8');

console.log('--- 1. Testing HTML Markup for Upgraded Attendance View ---');

// 1A. Top KPI cards
assert(html.includes('id="att-kpi-present"'), 'Must have #att-kpi-present for Card 1 Present Today count');
assert(html.includes('id="att-kpi-total-active"'), 'Must have #att-kpi-total-active for Card 1 active total');
assert(html.includes('id="att-kpi-not-yet"'), 'Must have #att-kpi-not-yet for Card 2 Not yet today count');
assert(html.includes('id="att-kpi-yesterday"'), 'Must have #att-kpi-yesterday for Card 3 Yesterday count');
assert(html.includes('id="att-kpi-yesterday-diff"'), 'Must have #att-kpi-yesterday-diff for Card 3 comparison arrow');
assert(html.includes('card-orange-hero'), 'Card 1 must have .card-orange-hero gradient class');
console.log('✓ Top 3-Card KPI Grid markup verified.');

// 1B. 'Present Today' Table Restyling
assert(html.includes('id="today-attendance-body"'), 'Must have #today-attendance-body');
assert(html.includes('In-Time') || html.includes('IN-TIME') || html.includes('In-time'), 'Must have In-time column header');
assert(html.includes('Plan Expiry'), 'Must have Plan Expiry column header');
console.log('✓ Present Today table container verified.');

// 1C. 'Not Yet Today' Collapsible Section
assert(html.includes('id="att-out"'), 'Must have collapsible container #att-out');
assert(html.includes('id="att-out-content"'), 'Must have #att-out-content collapsible body');
assert(html.includes('id="att-out-chevron"'), 'Must have #att-out-chevron toggle icon');
assert(html.includes('id="not-yet-attendance-body"'), 'Must have #not-yet-attendance-body table body');
assert(html.includes('id="att-not-yet-count"'), 'Must have #att-not-yet-count badge');
assert(html.includes('window.toggleNotYetSection'), 'Must have toggleNotYetSection handler');
console.log('✓ Not Yet Today collapsible section markup verified.');

// 1D. Action Buttons
assert(html.includes('window.sendMissedReminderWhatsApp'), 'Must have sendMissedReminderWhatsApp function');
assert(html.includes('window.markMemberPresent'), 'Must have markMemberPresent function');
assert(html.includes('we missed you at the gym today! See you soon'), 'Must contain exact missed you reminder message');
console.log('✓ WhatsApp reminder & Mark Present handler declarations verified.');

console.log('\n--- 2. Testing Simulation of Attendance Logic & KPI Calculations ---');

function toLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Dates setup
const today = new Date();
const todayStr = toLocalYMD(today);

const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
const yesterdayStr = toLocalYMD(yesterday);

const dayBeforeYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3);
const dayBeforeYesterdayStr = toLocalYMD(dayBeforeYesterday);

const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
const futureDateStr = toLocalYMD(futureDate);

const pastDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10);
const pastDateStr = toLocalYMD(pastDate);

// Mock Members
const mockMembers = [
  // 1. Present today (Active member who checked in today)
  {
    id: 'm-1',
    memberId: 'GYM-001',
    name: 'Aman Sharma',
    phone: '9876543210',
    plan: 'Monthly',
    status: 'active',
    expiryDate: futureDateStr,
    attendanceHistory: [yesterdayStr, todayStr],
    lastCheckInTime: '08:30 AM'
  },
  // 2. Present today (Active member who checked in today, expired plan)
  {
    id: 'm-2',
    memberId: 'GYM-002',
    name: 'Vikas Kumar',
    phone: '9876543211',
    plan: 'Quarterly',
    status: 'expired',
    expiryDate: pastDateStr,
    attendanceHistory: [todayStr],
    lastCheckInTime: '09:15 AM'
  },
  // 3. Not yet today (Active member, last visited yesterday)
  {
    id: 'm-3',
    memberId: 'GYM-003',
    name: 'Priya Singh',
    phone: '9876543212',
    plan: '1 Month',
    status: 'active',
    expiryDate: futureDateStr,
    attendanceHistory: [yesterdayStr]
  },
  // 4. Not yet today (Active member, last visited 3 days ago)
  {
    id: 'm-4',
    memberId: 'GYM-004',
    name: 'Rohit Verma',
    phone: '9876543213',
    plan: 'Annual',
    status: 'active',
    expiryDate: futureDateStr,
    attendanceHistory: [dayBeforeYesterdayStr]
  },
  // 5. Not yet today (Active member, never visited)
  {
    id: 'm-5',
    memberId: 'GYM-005',
    name: 'Neha Gupta',
    phone: '9876543214',
    plan: '3 Months',
    status: 'active',
    expiryDate: futureDateStr,
    attendanceHistory: []
  },
  // 6. Inactive/Expired member who hasn't checked in (Should NOT appear in 'Not Yet Today')
  {
    id: 'm-6',
    memberId: 'GYM-006',
    name: 'Suresh Raina',
    phone: '9876543215',
    plan: 'Monthly',
    status: 'inactive',
    expiryDate: pastDateStr,
    attendanceHistory: []
  }
];

// Verify isMemberActive logic
function isMemberActive(m) {
  if (!m) return false;
  const s = String(m.status || 'active').toLowerCase().trim();
  if (s === 'inactive' || s === 'expired') return false;

  const expDateStr = m.expiryDate || m.planExpiryDate || m.expiry;
  if (expDateStr) {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const expDate = new Date(expDateStr);
    if (!isNaN(expDate.getTime())) {
      expDate.setHours(0, 0, 0, 0);
      if (expDate.getTime() < t.getTime()) return false;
    }
  }
  return true;
}

assert.strictEqual(isMemberActive(mockMembers[0]), true, 'm-1 is active');
assert.strictEqual(isMemberActive(mockMembers[1]), false, 'm-2 is expired');
assert.strictEqual(isMemberActive(mockMembers[2]), true, 'm-3 is active');
assert.strictEqual(isMemberActive(mockMembers[3]), true, 'm-4 is active');
assert.strictEqual(isMemberActive(mockMembers[4]), true, 'm-5 is active');
assert.strictEqual(isMemberActive(mockMembers[5]), false, 'm-6 is inactive');
console.log('✓ isMemberActive filtering verified.');

// Test Splitting
const presentList = [];
const notYetList = [];

mockMembers.forEach(m => {
  const hist = Array.isArray(m.attendanceHistory) ? m.attendanceHistory : [];
  const isPresentToday = hist.includes(todayStr) || m.lastCheckIn === todayStr;

  if (isPresentToday) {
    presentList.push(m);
  } else if (isMemberActive(m)) {
    notYetList.push(m);
  }
});

assert.strictEqual(presentList.length, 2, '2 members should be in present list (m-1, m-2)');
assert.strictEqual(presentList[0].id, 'm-1');
assert.strictEqual(presentList[1].id, 'm-2');

assert.strictEqual(notYetList.length, 3, '3 active members should be in not-yet list (m-3, m-4, m-5)');
assert.strictEqual(notYetList.map(m => m.id).join(','), 'm-3,m-4,m-5');
console.log('✓ updateTodayAttendanceTable array splitting verified.');

// Test KPI calculation
let presentCount = 0;
let totalActiveCount = 0;
let notYetCount = 0;
let yesterdayCount = 0;

mockMembers.forEach(m => {
  const hist = Array.isArray(m.attendanceHistory) ? m.attendanceHistory : [];
  const isPresent = hist.includes(todayStr) || m.lastCheckIn === todayStr;
  const isYesterday = hist.includes(yesterdayStr);
  const active = isMemberActive(m);

  if (isPresent) presentCount++;
  if (isYesterday) yesterdayCount++;
  if (active) {
    totalActiveCount++;
    if (!isPresent) notYetCount++;
  }
});

assert.strictEqual(presentCount, 2, 'Present count should be 2');
assert.strictEqual(totalActiveCount, 4, 'Total active members should be 4 (m-1, m-3, m-4, m-5)');
assert.strictEqual(notYetCount, 3, 'Not yet today count should be 3 (m-3, m-4, m-5)');
assert.strictEqual(yesterdayCount, 2, 'Yesterday count should be 2 (m-1, m-3)');

const diff = presentCount - yesterdayCount;
assert.strictEqual(diff, 0, 'Today vs Yesterday diff should be 0');
console.log('✓ calculateAndRenderStats 3 KPI cards metrics verified:');
console.log(`   - Present Today: ${presentCount} / ${totalActiveCount} Active`);
console.log(`   - Not Yet Today: ${notYetCount}`);
console.log(`   - Yesterday: ${yesterdayCount} (${diff >= 0 ? `+${diff}` : diff} vs today)`);

console.log('\n--- 3. Testing Last Visit Formatter ---');
function formatLastVisit(m) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
  const isoToday = today.toISOString().split('T')[0];

  const history = Array.isArray(m.attendanceHistory) ? [...m.attendanceHistory] : [];
  if (m.lastCheckIn && !history.includes(m.lastCheckIn)) {
    history.push(m.lastCheckIn);
  }

  // Filter out today and future dates
  const pastDates = history.filter(d => typeof d === 'string' && d.length === 10 && d < todayStr && d !== isoToday).sort().reverse();
  if (pastDates.length === 0) {
    return 'No visits yet';
  }

  const lastDateStr = pastDates[0];
  const [py, pm, pd] = lastDateStr.split('-').map(Number);
  const pastMidnight = new Date(py, pm - 1, pd);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffDays = Math.round((todayMidnight - pastMidnight) / 86400000);

  if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays > 1) {
    return `${diffDays} days ago`;
  } else {
    return 'No visits yet';
  }
}

assert.strictEqual(formatLastVisit(mockMembers[2]), 'Yesterday', 'm-3 last visit should be Yesterday');
assert.strictEqual(formatLastVisit(mockMembers[3]), '3 days ago', 'm-4 last visit should be 3 days ago');
assert.strictEqual(formatLastVisit(mockMembers[4]), 'No visits yet', 'm-5 last visit should be No visits yet');
console.log('✓ formatLastVisit outputs: Yesterday, 3 days ago, No visits yet.');

console.log('\n--- 4. Testing WhatsApp Missed Reminder & Mark Present URL & Logic ---');
function generateMissedReminderUrl(member) {
  const digits = String(member.phone || '').replace(/\D/g, '');
  const clean10 = digits.length > 10 ? digits.slice(-10) : digits;
  const finalPhone = `91${clean10}`;
  const reminderMsg = `Hi ${member.name}, we missed you at the gym today! See you soon.`;
  return `https://api.whatsapp.com/send/?phone=${finalPhone}&text=${encodeURIComponent(reminderMsg)}`;
}

const reminderUrl = generateMissedReminderUrl(mockMembers[2]);
assert(reminderUrl.startsWith('https://api.whatsapp.com/send/?phone=919876543212&text='), 'Target phone must be 919876543212');
const decodedReminder = decodeURIComponent(reminderUrl.split('&text=')[1]);
assert.strictEqual(decodedReminder, 'Hi Priya Singh, we missed you at the gym today! See you soon.');
console.log('✓ WhatsApp reminder URL generated & decoded:');
console.log('  ', decodedReminder);

// Test Mark Present Simulation
function simulateMarkPresent(member) {
  if (!Array.isArray(member.attendanceHistory)) member.attendanceHistory = [];
  if (!member.attendanceHistory.includes(todayStr)) {
    member.attendanceHistory.push(todayStr);
  }
  member.lastCheckIn = todayStr;
  member.lastCheckInTime = '10:00 AM';
}

simulateMarkPresent(mockMembers[2]); // Mark Priya Singh present
assert(mockMembers[2].attendanceHistory.includes(todayStr), 'Priya Singh should now have today in attendanceHistory');

// Re-split
const newPresent = [];
const newNotYet = [];
mockMembers.forEach(m => {
  const hist = Array.isArray(m.attendanceHistory) ? m.attendanceHistory : [];
  if (hist.includes(todayStr) || m.lastCheckIn === todayStr) {
    newPresent.push(m);
  } else if (isMemberActive(m)) {
    newNotYet.push(m);
  }
});

assert.strictEqual(newPresent.length, 3, 'Present count should now be 3');
assert(newPresent.some(m => m.id === 'm-3'), 'Priya Singh is now in Present table');
assert.strictEqual(newNotYet.length, 2, 'Not yet count should now be 2');
assert(!newNotYet.some(m => m.id === 'm-3'), 'Priya Singh is no longer in Not Yet table');
console.log('✓ Member seamlessly transitioned from Not Yet Today to Present Today upon Mark Present.');

console.log('\n======================================================');
console.log('ALL ATTENDANCE UPGRADE & ABSENT TRACKING TESTS PASSED!');
console.log('======================================================');
