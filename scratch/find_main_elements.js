const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Check within <main> for any absolute positioned elements or svgs that might be decorative
const mainStart = html.indexOf('<main');
const mainEnd = html.indexOf('</main>');
const mainHtml = html.slice(mainStart, mainEnd);

const absMatches = mainHtml.match(/class=\"[^\"]*absolute[^\"]*\"/g) || [];
console.log('Absolute elements in main:', absMatches);

// Check if any SVG has width > 100 or height > 100
const svgMatches = mainHtml.match(/<svg[^>]*>/g) || [];
svgMatches.forEach(svg => {
  if (/width=[\"']\d{3}|height=[\"']\d{3}|viewBox=[\"']0 0 3/i.test(svg)) {
    console.log('Large SVG in main:', svg);
  }
});

