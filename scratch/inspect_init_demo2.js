const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all functions called in initDemoState
const initIdx = html.indexOf('function initDemoState');
console.log(html.slice(initIdx, initIdx + 400));

