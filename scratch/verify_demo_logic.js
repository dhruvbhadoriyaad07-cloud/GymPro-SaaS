function iso(d = new Date()) {
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function today() {
  return new Date();
}

function isToday(t) {
  if (!t) return false;
  const todayStr = iso(today());
  const txDate = t.d || t.date;
  if (!txDate) return false;
  if (typeof txDate === 'string') return txDate.startsWith(todayStr);
  if (txDate instanceof Date) return iso(txDate) === todayStr;
  if (txDate && txDate.seconds) return iso(new Date(txDate.seconds * 1000)) === todayStr;
  return false;
}

const todayIso = iso(today());

const initialTransactionsData = [
  { name: 'Priya Nair', amount: 1500, time: '11:14 AM', mode: 'Cash', type: 'New Membership', date: todayIso },
  { name: 'Sakshi', amount: 1500, time: '12:00 PM', mode: 'UPI', type: 'New Membership', date: todayIso },
  { name: 'Mohit', amount: 1500, time: '11:36 AM', mode: 'UPI', type: 'New Membership', date: todayIso },
  { name: 'Kiran', amount: 1500, time: '12:01 PM', mode: 'Cash', type: 'New Membership', date: todayIso },
  { name: 'Sahil', amount: 1500, time: '01:05 PM', mode: 'UPI', type: 'New Membership', date: todayIso },
  { name: 'Arjun Sharma', amount: 1500, time: '09:12 AM', mode: 'Renewal', type: 'Renewal', date: todayIso },
  { name: 'Rohit Desai', amount: 800, time: '10:05 AM', mode: 'Cash', type: 'Walk-in', date: todayIso },
  { name: 'Sneha Kulkarni', amount: 500, time: '10:30 AM', mode: 'Card', type: 'Personal Training', date: todayIso }
];

const totalCash = initialTransactionsData.filter(isToday).reduce((sum, t) => sum + t.amount, 0);
console.log('Total Cash Today:', totalCash); // 8800

function getSampleMembers() {
  const now = new Date();
  const addDays = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  const subDays = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  const todayStr = iso(now);

  return [
    { memberId: 'GYM-0042', name: 'Priya Nair', plan: 'Monthly', startDate: subDays(15), expiryDate: addDays(15), phone: '9876543201', attendanceHistory: [todayStr], lastCheckInTime: '09:45 AM', lastCheckInTimestamp: new Date(), status: 'active' },
    { memberId: 'GYM-0099', name: 'Karan Singh', plan: 'Monthly', startDate: subDays(20), expiryDate: addDays(10), phone: '9912345615', attendanceHistory: [todayStr], lastCheckInTime: '10:15 AM', lastCheckInTimestamp: new Date(), status: 'active' },
    { memberId: 'GYM-0113', name: 'Neha Gupta', plan: 'Quarterly', startDate: subDays(60), expiryDate: addDays(30), phone: '9123456723', status: 'active' },
    { memberId: 'GYM-0078', name: 'Rahul Mehta', plan: 'Quarterly', startDate: subDays(88), expiryDate: addDays(2), phone: '9823456702', status: 'active' },
    { memberId: 'GYM-0055', name: 'Anita Sharma', plan: 'Monthly', startDate: subDays(27), expiryDate: addDays(3), phone: '9734567833', status: 'active' },
    { memberId: 'GYM-0061', name: 'Suresh Babu', plan: 'Monthly', startDate: subDays(25), expiryDate: addDays(5), phone: '9045678944', status: 'active' },
    { memberId: 'GYM-0084', name: 'Divya Pillai', plan: 'Annual', startDate: subDays(300), expiryDate: addDays(65), phone: '8856789055', status: 'active' },
    { memberId: 'GYM-0102', name: 'Amit Verma', plan: 'Monthly', startDate: subDays(10), expiryDate: addDays(20), phone: '7767890166', status: 'active' },
    { memberId: 'GYM-0037', name: 'Farida Khan', plan: 'Quarterly', startDate: subDays(90), expiryDate: addDays(0), phone: '9978901277', status: 'active' },
    { memberId: 'GYM-0019', name: 'Raj Nair', plan: 'Monthly', startDate: subDays(30), expiryDate: addDays(0), phone: '9189012388', status: 'active' },
    { memberId: 'GYM-0071', name: 'Sunita Devi', plan: 'Monthly', startDate: subDays(29), expiryDate: addDays(1), phone: '9890123499', status: 'active' },
    { memberId: 'GYM-0028', name: 'Mohan Krishnan', plan: 'Annual', startDate: subDays(180), expiryDate: addDays(185), phone: '8801234511', status: 'active' },
    { memberId: 'GYM-0135', name: 'Shreya Agarwal', plan: 'Monthly', startDate: subDays(5), expiryDate: addDays(25), phone: '9712345622', status: 'active' },
    { memberId: 'GYM-0147', name: 'Vikash Tiwari', plan: 'Quarterly', startDate: subDays(45), expiryDate: addDays(45), phone: '9023456733', status: 'active' },
    { memberId: 'GYM-0052', name: 'Pallavi Roy', plan: 'Monthly', startDate: subDays(12), expiryDate: addDays(18), phone: '7734567844', status: 'active' },
    { memberId: 'GYM-0088', name: 'Gaurav Mishra', plan: 'Monthly', startDate: subDays(40), expiryDate: subDays(10), phone: '9945678955', status: 'inactive' },
    { memberId: 'GYM-0116', name: 'Kavitha Suresh', plan: 'Annual', startDate: subDays(400), expiryDate: subDays(35), phone: '8856789066', status: 'inactive' },
    { memberId: 'GYM-0123', name: 'Harish Pandey', plan: 'Monthly', startDate: subDays(50), expiryDate: subDays(20), phone: '9167890177', status: 'inactive' },
  ];
}

const members = getSampleMembers();
const now = new Date();
now.setHours(0, 0, 0, 0);
let activeCount = 0;
let inactiveCount = 0;
members.forEach(m => {
  const expDate = new Date(m.expiryDate);
  expDate.setHours(0, 0, 0, 0);
  if (m.status === 'inactive' || expDate.getTime() < now.getTime()) {
    inactiveCount++;
  } else {
    activeCount++;
  }
});
console.log('Active members:', activeCount);
console.log('Inactive members:', inactiveCount);
console.log('Total members:', members.length);

