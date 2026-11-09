const fs = require('fs');

const testHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
:root{--bg:#F1F4F9;--card:#fff;--ink:#0F172A;--muted:#64708A;--line:#E3E8F1;--grn:#12B76A;--grn2:#0B9A55;--blu:#2F6BFF;--blu2:#1E4FD8;--org:#FF6A1F;--org2:#F04A00;--yel:#FFC21A;--pur:#7C3AED;--red:#EF4444;--wa:#25D366;--d:"Barlow Condensed","Arial Narrow",Impact,sans-serif;--b:"Figtree",system-ui,-apple-system,"Segoe UI",sans-serif}
body{background:#F1F4F9;padding:24px;font-family:system-ui}

.pay-r2 {
  display: grid;
  grid-template-columns: minmax(500px, 560px) minmax(0, 1fr);
  gap: 16px;
}

.pay-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 20px;
}

/* money pot card */
.pay-pot {
  background: linear-gradient(160deg, #0F1E3D, #0A1428);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #E2E8F0;
  box-shadow: 0 24px 50px -20px rgba(15, 30, 61, .6);
  display: flex;
  flex-direction: column;
  padding: 22px 24px;
}

.pay-pot-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.pay-pot-h b {
  display: block;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
  color: #C9D4EA;
}

.pay-pot-h small {
  color: #8FA0C2;
  font-size: 12px;
}

.pay-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 99px;
  background: rgba(255, 255, 255, .1);
  color: #C9D4EA;
  white-space: nowrap;
}

.pay-pill.full { background: #DDF7E8; color: #0B7A43; }
.pay-pill.mid { background: rgba(255, 194, 26, .18); color: #FFD66B; }

/* ── Money Pot Body: Horizontal flex (Pot Left, Vertical Stats Right) ── */
.pay-pot-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 14px;
  flex: 1;
}

.pay-pot-visual {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pay-pot .gp-stage {
  position: relative;
  width: 220px;
  height: 264px;
  margin: 0;
}

.pay-pot .gp-pct b {
  font-size: 28px !important;
}

.pay-pot .gp-pct span {
  font-size: 8.5px !important;
  letter-spacing: .18em;
}

/* ── Vertical Stats Column ── */
.pay-pot-vstats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.pay-pv-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 11px 14px;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.pay-pv-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateX(2px);
}

.pay-pv-card.highlight-g {
  background: linear-gradient(135deg, rgba(77, 227, 148, 0.08), rgba(18, 183, 106, 0.02));
  border-color: rgba(77, 227, 148, 0.22);
}

.pay-pv-card.highlight-y {
  background: linear-gradient(135deg, rgba(255, 194, 26, 0.08), rgba(240, 74, 0, 0.02));
  border-color: rgba(255, 194, 26, 0.22);
}

.pay-pv-h {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
}

.pay-pv-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pay-pv-h small {
  color: #8FA0C2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.pay-pv-val {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.pay-pv-val strong {
  font: 700 22px/1.1 ui-monospace, Menlo, Consolas, monospace;
  color: #FFFFFF;
  letter-spacing: -0.02em;
}

.pay-pv-val strong.g {
  color: #4DE394;
  text-shadow: 0 0 16px rgba(77, 227, 148, 0.3);
}

.pay-pv-val strong.y {
  color: #FFC21A;
  text-shadow: 0 0 16px rgba(255, 194, 26, 0.3);
}

.pay-pv-sub {
  font-size: 11px;
  font-weight: 600;
  color: #8FA0C2;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.pay-pv-sub.g {
  color: #4DE394;
  background: rgba(77, 227, 148, 0.12);
}

.pay-pv-sub.y {
  color: #FFC21A;
  background: rgba(255, 194, 26, 0.12);
}

.pay-pot-f {
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 11.5px;
  color: #8FA0C2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pay-pot-f span {
  font-weight: 600;
  color: #C9D4EA;
}

.pay-pot-f-note {
  font-size: 10.5px;
  color: #64748B;
  text-align: right;
}

@media (max-width: 1180px) {
  .pay-r2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .pay-pot-body {
    flex-direction: column;
    align-items: center;
  }
  .pay-pot-vstats {
    width: 100%;
  }
}
</style>
</head>
<body>
<div class="pay-r2">
  <section class="pay-card pay-pot">
    <div class="pay-pot-h">
      <div><b>THE MONEY POT</b><small>Value of active plans vs all plans</small></div>
      <span class="pay-pill mid" id="squid-pot-status">82% active</span>
    </div>

    <div class="pay-pot-body">
      <!-- Left: Compact Glass Gullak Pot -->
      <div class="pay-pot-visual">
        <div class="gp-stage" id="stage" style="background:rgba(255,255,255,0.05);border-radius:20px;display:flex;align-items:center;justify-content:center;color:#fff;">
          [ Glass Gullak Pot 220x264 ]
        </div>
      </div>

      <!-- Right: Vertical Statistics Cards -->
      <div class="pay-pot-vstats">
        <div class="pay-pv-card">
          <div class="pay-pv-h">
            <span class="pay-pv-dot" style="background:#8FA0C2"></span>
            <small>Total plan value</small>
          </div>
          <div class="pay-pv-val">
            <strong id="squid-expected-revenue">₹8,500</strong>
            <span class="pay-pv-sub">Target</span>
          </div>
        </div>

        <div class="pay-pv-card highlight-g">
          <div class="pay-pv-h">
            <span class="pay-pv-dot" style="background:#4DE394"></span>
            <small>Collected</small>
          </div>
          <div class="pay-pv-val">
            <strong id="squid-pot-collected" class="g">₹7,000</strong>
            <span class="pay-pv-sub g">Active plans</span>
          </div>
        </div>

        <div class="pay-pv-card highlight-y">
          <div class="pay-pv-h">
            <span class="pay-pv-dot" style="background:#FFC21A"></span>
            <small>Overdue / Pending</small>
          </div>
          <div class="pay-pv-val">
            <strong id="squid-remaining-revenue" class="y">₹1,500</strong>
            <span class="pay-pv-sub y">To recover</span>
          </div>
        </div>

        <div class="pay-pot-f">
          <div><span id="squid-members-count">4 members</span></div>
          <div class="pay-pot-f-note">Collected = running plans</div>
        </div>
      </div>
    </div>
  </section>

  <section class="pay-card" style="display:flex;align-items:center;justify-content:center;color:#94a3b8">
    [ Collection Trend Chart ]
  </section>
</div>
</body>
</html>
`;

fs.writeFileSync('scratch/preview_pot_vertical.html', testHtml, 'utf8');
console.log('Saved scratch/preview_pot_vertical.html');

