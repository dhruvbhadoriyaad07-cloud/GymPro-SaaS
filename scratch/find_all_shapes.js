const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Check all occurrences of svg in CSS and HTML
const matches = [];
let re = /<svg[^>]*>([\s\S]*?)<\/svg>/gi;
let m;
let count = 0;
while ((m = re.exec(html)) !== null) {
  count++;
  if (m[0].length > 400 || /watermark|bg|logo|shape/i.test(m[0])) {
    console.log(`SVG #${count} at ${m.index}: len=${m[0].length}`);
    console.log(m[0].slice(0, 200) + '...\n');
  }
}

// Check CSS rules with after/before or svg or background
const cssBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('Total style blocks:', cssBlocks.length);
cssBlocks.forEach((b, i) => {
  const pseudoMatches = b.match(/([^{}]+::(?:before|after)[^{]*\{[^}]*\})/gi) || [];
  if (pseudoMatches.length > 0) {
    console.log(`Style block ${i} pseudo elements:`, pseudoMatches);
  }
});

