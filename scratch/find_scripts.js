const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Extract the main module script
const scriptMatches = html.match(/<script type="module">([\s\S]*?)<\/script>/gi) || [];
console.log('Total module scripts:', scriptMatches.length);
scriptMatches.forEach((s, i) => {
  console.log(`Script ${i}: length ${s.length}`);
});

