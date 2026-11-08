const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

function iso(d = new Date()) {
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function today() {
  return new Date();
}

function isToday(t) {
  if (!t) return false;
  const todayStr = iso(today());
  const txDate = t.d || t.date;
  if (!txDate) return false;
  if (typeof txDate === 'string') return txDate.startsWith(todayStr);
  if (txDate instanceof Date) return iso(txDate) === todayStr;
  if (txDate && txDate.seconds) return iso(new Date(txDate.seconds * 1000)) === todayStr;
  return false;
}

// Extract initialTransactionsData
const txIdx = html.indexOf('const initialTransactionsData = [');
const txEnd = html.indexOf('];', txIdx);
const txStr = html.slice(txIdx, txEnd + 2).replace('const initialTransactionsData', 'var initialTransactionsData');
eval(txStr);

console.log('Today iso:', iso(today()));
console.log('initialTransactionsData length:', initialTransactionsData.length);
console.log('matching isToday count:', initialTransactionsData.filter(isToday).length);
console.log('Total cash calculated:', initialTransactionsData.filter(isToday).reduce((sum, t) => sum + (Number(t.amount) || 0), 0));
