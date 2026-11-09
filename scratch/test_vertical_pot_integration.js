const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Check what elements are in pay-pot
console.log('Contains squid-expected-revenue:', html.includes('id="squid-expected-revenue"'));
console.log('Contains squid-pot-collected:', html.includes('id="squid-pot-collected"'));
console.log('Contains squid-remaining-revenue:', html.includes('id="squid-remaining-revenue"'));
console.log('Contains squid-members-count:', html.includes('id="squid-members-count"'));
console.log('Contains squid-pot-percentage:', html.includes('id="squid-pot-percentage"'));
console.log('Contains squid-pot-status:', html.includes('id="squid-pot-status"'));
console.log('Contains gpPile:', html.includes('id="gpPile"'));

