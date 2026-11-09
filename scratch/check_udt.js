const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Let's check how many times updateDashboardTransactions is defined
let count = 0;
html.split('\n').forEach((line, i) => {
  if (line.includes('updateDashboardTransactions')) {
    console.log(`${i + 1}: ${line}`);
  }
});

