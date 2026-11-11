const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Check table tag in renderMembersDirectoryRows
assert(html.includes('<table class="w-full text-left border-collapse" style="min-width: 760px;">'), 'Table must have border-collapse, w-full text-left');

// 2. Check thead styling
assert(html.includes('<thead class="text-xs uppercase text-gray-400 bg-gray-50 border-y border-gray-100">'), 'Thead must have text-xs uppercase text-gray-400 bg-gray-50 border-y border-gray-100');

// 3. Check tbody styling
assert(html.includes('<tbody class="divide-y divide-gray-100 bg-white">'), 'Tbody must have divide-y divide-gray-100 bg-white');

// 4. Check Actions column header has w-24
assert(html.includes('<th class="w-24 py-2 px-4 text-right"></th>'), 'Actions header must have w-24 py-2 px-4 text-right');

// 5. Ensure compact padding px-4 py-2 whitespace-nowrap on all td elements in desktopRow
const desktopRowRegex = /const desktopRow = `([\s\S]*?)`;/;
const desktopRowMatch = html.match(desktopRowRegex);
assert(desktopRowMatch, 'desktopRow template literal must exist');
const desktopRow = desktopRowMatch[1];

assert(!desktopRow.includes('h-32') && !desktopRow.includes('h-full') && !desktopRow.includes('min-h-'), 'No fixed heights on row/cells');
assert(!desktopRow.includes('py-3') && !desktopRow.includes('py-4') && !desktopRow.includes('py-10') && !desktopRow.includes('py-16'), 'No large padding on desktopRow td');
assert((desktopRow.match(/px-4 py-2 whitespace-nowrap/g) || []).length === 6, 'All 6 td elements in desktopRow must use px-4 py-2 whitespace-nowrap');

// 6. Ensure actions container has flex items-center justify-end gap-2 w-24 ml-auto
assert(desktopRow.includes('flex items-center justify-end gap-2 w-24 ml-auto'), 'Actions container must have w-24 gap-2 ml-auto');

// 7. Ensure action icons have smaller w-4 h-4
assert((desktopRow.match(/class="w-4 h-4/g) || []).length >= 3, 'All action icons must have w-4 h-4');

// 8. Ensure placeholder div is NOT present
assert(!desktopRow.includes('w-8 h-8 rounded-full bg-transparent'), 'No placeholder div for active members');

// 9. Verify all script blocks parse without syntax error
const scriptMatches = [...html.matchAll(/<script(?:\s+type="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/gi)];
const vm = require('vm');

scriptMatches.forEach((match, idx) => {
  const type = match[1] || '';
  const code = match[2];
  if (!code.trim()) return;

  if (type === 'module') {
    try {
      new vm.SourceTextModule(code);
    } catch (e) {
      assert.fail(`Module script block ${idx} syntax error: ${e.message}`);
    }
  } else {
    try {
      new vm.Script(code);
    } catch (e) {
      assert.fail(`Classic script block ${idx} syntax error: ${e.message}`);
    }
  }
});

console.log('All ultra-thin user template assertions and script validations passed successfully!');
