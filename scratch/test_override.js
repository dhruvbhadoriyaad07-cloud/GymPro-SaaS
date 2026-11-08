const allTransactions = [{amount: 1000}, {amount: 2000}];
const window = {};

window.total = function(list) {
  return (list || allTransactions || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

function total(list) {
  return window.total(list);
}

console.log('direct call:', total());
console.log('window call:', window.total());

