const fs = require('fs');
const rl = require('readline');

const stream = fs.createReadStream('C:/Users/Dhruv Singh/.gemini/antigravity/brain/2b11ac40-0d4d-4e4c-9e29-2061ec7f50a9/.system_generated/logs/transcript_full.jsonl');
const rli = rl.createInterface({ input: stream });

let count = 0;
rli.on('line', (line) => {
  count++;
  if (count === 5416) {
    const obj = JSON.parse(line);
    fs.writeFileSync('scratch/preview_template.html', obj.content, 'utf8');
    console.log('Saved preview_template.html successfully! Size:', obj.content.length);
    process.exit(0);
  }
});

