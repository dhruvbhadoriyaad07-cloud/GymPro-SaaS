const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all CSS rules in <style>
const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
if (styleMatch) {
  const css = styleMatch[1];
  const rules = css.match(/[^{}]+{[^{}]*}/g) || [];
  rules.forEach(r => {
    if (/body|main|dashboard|stats|st\b|bg|background/i.test(r)) {
      if (/background|radial|circle|logo|svg|shape|mask|filter|blob/i.test(r)) {
        console.log('RULE:', r.trim().replace(/\s+/g, ' '));
      }
    }
  });
}

