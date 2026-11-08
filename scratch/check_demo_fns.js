const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('updateTodayAttendanceTable exists?', html.includes('updateTodayAttendanceTable'));
console.log('renderActivities exists?', html.includes('renderActivities'));
console.log('updateDashboardMembers exists?', html.includes('updateDashboardMembers'));
console.log('updateDashboardTransactions exists?', html.includes('updateDashboardTransactions'));

