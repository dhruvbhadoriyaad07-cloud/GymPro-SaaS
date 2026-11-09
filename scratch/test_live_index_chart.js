const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Check that the required IDs and elements exist in HTML
const requiredElements = [
  'id="weekly-chart-indicator"',
  'id="weekly-chart-subtitle"',
  'id="weekly-chart-toggles"',
  'data-weekly-mode="revenue"',
  'data-weekly-mode="check-ins"',
  'data-weekly-mode="new-joins"',
  'id="weekly-bar-chart-container"',
  'id="weekly-chart-min"',
  'id="weekly-chart-max"'
];

let allFound = true;
requiredElements.forEach(req => {
  if (!html.includes(req)) {
    console.error("Missing in HTML:", req);
    allFound = false;
  } else {
    console.log("Found in HTML:", req);
  }
});

if (!allFound) {
  process.exit(1);
}

// Check that JS functions exist
const requiredJs = [
  'let currentWeeklyMode = \'revenue\';',
  'function renderWeeklyChart()',
  'function setupWeeklyChartListeners()',
  'window.renderWeeklyChart = renderWeeklyChart;',
  'window.setupWeeklyChartListeners = setupWeeklyChartListeners;'
];

requiredJs.forEach(req => {
  if (!html.includes(req)) {
    console.error("Missing in JS:", req);
    allFound = false;
  } else {
    console.log("Found in JS:", req);
  }
});

if (allFound) {
  console.log("\nALL CHECKS PASSED SUCCESSFULLY!");
}

