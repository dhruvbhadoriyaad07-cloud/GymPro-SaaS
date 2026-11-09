function iso(d = new Date()) {
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function today() { return new Date(); }
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

console.log('Today is:', iso(today()));
console.log('Mohit (2026-10-05):', isToday({ date: '2026-10-05' }));

