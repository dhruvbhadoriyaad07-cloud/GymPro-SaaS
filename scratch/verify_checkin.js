const fs = require('fs');
const html = fs.readFileSync('checkin.html', 'utf8');
const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
const code = scripts[1].replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
const codeWithoutImports = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import');
try {
  new Function(codeWithoutImports);
  console.log("Script 2 syntax is VALID!");
} catch (e) {
  console.error("Script 2 syntax ERROR:", e.message);
}

