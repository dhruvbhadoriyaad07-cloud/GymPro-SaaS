const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('gympro-theme.css', 'utf8');

console.log('--- Checking gympro-theme.css for background / logo / watermarks ---');
const cssLines = css.split('\n');
cssLines.forEach((l, i) => {
  if (/background|svg|url\(|::before|::after|watermark|logo/i.test(l)) {
    console.log(`CSS L${i+1}: ${l.trim()}`);
  }
});

console.log('\n--- Checking index.html for large shapes / logos / watermarks / svgs ---');
// Look for SVG in main or dashboard-view or body
const matches = html.match(/<svg[^>]*>[\s\S]*?<\/svg>/g) || [];
console.log('Total SVGs in index.html:', matches.length);
matches.forEach((svg, i) => {
  if (svg.length > 500 || /watermark|logo|background|bg/i.test(svg)) {
    console.log(`SVG ${i} (length ${svg.length}):`, svg.slice(0, 150));
  }
});

