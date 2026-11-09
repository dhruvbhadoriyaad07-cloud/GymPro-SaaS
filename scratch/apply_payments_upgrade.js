const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace #payments-view
const startMarker = '<div id="payments-view"';
const endMarker = '</div><!-- ════ End #payments-view ════ -->';

const startPos = html.indexOf(startMarker);
const endPos = html.indexOf(endMarker);

if (startPos === -1 || endPos === -1) {
  console.error('ERROR: Could not find payments-view markers in index.html!');
  process.exit(1);
}

const newPaymentsMarkup = fs.readFileSync('scratch/payments_view_markup.html', 'utf8');
// Ensure it has class="hidden"
const formattedMarkup = newPaymentsMarkup.replace('<div id="payments-view" >', '<div id="payments-view" class="hidden">');

html = html.substring(0, startPos) + formattedMarkup + html.substring(endPos + endMarker.length);
console.log('PASS: Replaced #payments-view HTML markup.');

// 2. Update updateDashboardTransactions in module script
const oldUdtStart = '    function updateDashboardTransactions(txList) {';
const nextFnMarker = '    function renderActivities() {';

const udtIdx = html.indexOf(oldUdtStart);
if (udtIdx === -1) {
  console.error('ERROR: Could not find old updateDashboardTransactions in index.html!');
  process.exit(1);
}

const nextFnIdx = html.indexOf(nextFnMarker, udtIdx);
if (nextFnIdx === -1) {
  console.error('ERROR: Could not find renderActivities after updateDashboardTransactions!');
  process.exit(1);
}

const newUdtCode = `    function updateDashboardTransactions(txList) {
      const targetList = Array.isArray(txList) ? txList : (Array.isArray(allTransactions) ? allTransactions : []);
      allTransactions = targetList;
      window.allTransactions = targetList;

      // 1. Strictly filter todayTxList for Dashboard Daily Cash & Breakdown
      const todayTxList = targetList.filter(t => isToday(t));
      const totalCashToday = total(todayTxList);

      let breakdown = { newMemberships: 0, renewals: 0, walkIns: 0, pt: 0 };
      let modes = {
        Cash: by('Cash', todayTxList),
        UPI: by('UPI', todayTxList),
        Card: by('Card', todayTxList)
      };

      todayTxList.forEach(t => {
        const amt = Number(t.amount) || 0;
        const typeStr = (t.type || '').trim();
        const typeLower = typeStr.toLowerCase();

        // STRICT BREAKDOWN CATEGORIZATION: New Memberships ONLY sums 'New Membership', Renewals ONLY sums 'Renewal'
        if (typeStr === 'New Membership' || (typeLower.includes('new') && !typeLower.includes('renewal'))) {
          breakdown.newMemberships += amt;
        } else if (typeStr === 'Renewal' || typeLower.includes('renewal')) {
          breakdown.renewals += amt;
        } else if (typeLower.includes('walk')) {
          breakdown.walkIns += amt;
        } else {
          breakdown.pt += amt;
        }
      });

      const formattedTotal = \`₹\${totalCashToday.toLocaleString('en-IN')}\`;

      // KPI Card
      const kpiCash = document.getElementById('kpi-today-cash') || document.getElementById('total-cash');
      if (kpiCash) kpiCash.textContent = formattedTotal;

      // Detailed Card Total
      const detailedCash = document.getElementById('detailed-total-cash');
      if (detailedCash) detailedCash.textContent = formattedTotal;

      // Breakdown
      const bNew = document.getElementById('breakdown-new-memberships');
      const bRen = document.getElementById('breakdown-renewals');
      const bWalk = document.getElementById('breakdown-walkins');
      const bPt = document.getElementById('breakdown-pt');
      if (bNew) bNew.textContent = \`₹\${breakdown.newMemberships.toLocaleString('en-IN')}\`;
      if (bRen) bRen.textContent = \`₹\${breakdown.renewals.toLocaleString('en-IN')}\`;
      if (bWalk) bWalk.textContent = \`₹\${breakdown.walkIns.toLocaleString('en-IN')}\`;
      if (bPt) bPt.textContent = \`₹\${breakdown.pt.toLocaleString('en-IN')}\`;

      // Payment Mode Split
      const totalForModes = (modes.Cash + modes.UPI + modes.Card) || 1;
      const cashPct = Math.round((modes.Cash / totalForModes) * 100);
      const upiPct = Math.round((modes.UPI / totalForModes) * 100);
      const cardPct = Math.max(0, 100 - cashPct - upiPct);

      const bCash = document.getElementById('split-bar-cash');
      const bUpi = document.getElementById('split-bar-upi');
      const bCard = document.getElementById('split-bar-card');
      if (bCash) bCash.style.width = \`\${cashPct}%\`;
      if (bUpi) bUpi.style.width = \`\${upiPct}%\`;
      if (bCard) bCard.style.width = \`\${cardPct}%\`;

      const lCash = document.getElementById('split-label-cash');
      const lUpi = document.getElementById('split-label-upi');
      const lCard = document.getElementById('split-label-card');
      if (lCash) lCash.textContent = \`Cash \${cashPct}%\`;
      if (lUpi) lUpi.textContent = \`UPI \${upiPct}%\`;
      if (lCard) lCard.textContent = \`Card \${cardPct}%\`;

      // Badge
      const txBadge = document.getElementById('tx-count-badge');
      if (txBadge) txBadge.textContent = \`\${todayTxList.length} transactions today\`;

      // Real-Time Money Pot Target & Payments View Sync
      if (typeof updatePaymentsViewData === 'function') {
        updatePaymentsViewData(targetList);
      }
      if (typeof window.renderPaymentsPage === 'function') {
        window.renderPaymentsPage(false);
      }

      // 2. Render Recent Transactions List (Sorted newest first with Date & Time)
      const txListContainer = document.getElementById('transactions-list');
      if (txListContainer) {
        if (targetList.length === 0) {
          txListContainer.innerHTML = \`<p class="text-xs text-neutral-500 py-4 text-center font-mono">No transactions recorded yet.</p>\`;
        } else {
          const sortedTx = sortTxNewestFirst(targetList);
          txListContainer.innerHTML = sortedTx.slice(0, 12).map(t => {
            const formattedDateTime = formatTxDateTime(t.date || t.d, t.time);
            return \`
          <div class="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800/40 transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">\${t.name ? t.name[0].toUpperCase() : 'T'}</div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-white truncate">\${t.name}</p>
                <p class="text-xs text-neutral-500 font-mono truncate">\${t.type || 'Payment'} · \${formattedDateTime}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              \${modeIcon(t.mode)}
              <span class="text-sm font-bold text-white font-mono">₹\${Number(t.amount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        \`;
          }).join('');
        }
      }
    }

`;

html = html.substring(0, udtIdx) + newUdtCode + html.substring(nextFnIdx);
console.log('PASS: Replaced updateDashboardTransactions in module.');

// 3. Add window.recordQuickPayment in module
const recordQuickPaymentCode = `    window.recordQuickPayment = async function(p) {
      const now = new Date();
      const d = iso(now);
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const amt = Number(p.amount) || 0;
      const txDoc = {
        name: p.name,
        amount: amt,
        mode: p.mode || 'Cash',
        type: p.type || 'Walk-in',
        time: timeStr,
        date: d,
        d: d
      };

      if (isFirebaseLive && db) {
        try {
          const docRef = await addDoc(collection(db, "transactions"), {
            ...txDoc,
            createdAt: serverTimestamp()
          });
          txDoc.id = docRef.id;
        } catch (err) {
          console.error("Firestore quick payment error:", err);
          txDoc.id = 'tx-' + Date.now();
        }
      } else {
        txDoc.id = 'tx-' + Date.now();
      }

      allTransactions.unshift(txDoc);
      window.allTransactions = allTransactions;
      updateDashboardTransactions([...allTransactions]);
      if (typeof window.renderPaymentsPage === 'function') {
        window.renderPaymentsPage(false);
      }
      showToast(\`\${p.type || 'Payment'} of ₹\${amt.toLocaleString('en-IN')} recorded successfully!\`, 'success');
    };
`;

const modEndMarker = '    window.switchView = switchView;';
const modEndIdx = html.indexOf(modEndMarker);
if (modEndIdx === -1) {
  console.error('ERROR: Could not find window.switchView in module script!');
  process.exit(1);
}

html = html.substring(0, modEndIdx) + recordQuickPaymentCode + '\n' + html.substring(modEndIdx);
console.log('PASS: Injected window.recordQuickPayment into module script.');

// 4. Inject Production Payments Logic right before Glass Gullak script
const gullakMarker = '  <!-- ── Glass Gullak Money Pot Animation Script ── -->';
const gullakIdx = html.indexOf(gullakMarker);
if (gullakIdx === -1) {
  console.error('ERROR: Could not find Glass Gullak marker in index.html!');
  process.exit(1);
}

const prodPaymentsJs = fs.readFileSync('scratch/production_payments_logic.js', 'utf8');
const paymentsScriptBlock = `  <!-- ── Redesigned Payments Page Controller & Interactions ── -->
  <script>
${prodPaymentsJs}
  </script>

`;

html = html.substring(0, gullakIdx) + paymentsScriptBlock + html.substring(gullakIdx);
console.log('PASS: Injected Payments Page Controller script.');

fs.writeFileSync('index.html', html, 'utf8');
console.log('SUCCESS: index.html fully updated!');
