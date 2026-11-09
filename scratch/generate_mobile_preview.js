const fs = require('fs');

const testHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;1,700&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#F1F4F9;--card:#fff;--ink:#0F172A;--muted:#64708A;--line:#E3E8F1;--grn:#12B76A;--grn2:#0B9A55;--blu:#2F6BFF;--blu2:#1E4FD8;--org:#FF6A1F;--org2:#F04A00;--yel:#FFC21A;--pur:#7C3AED;--red:#EF4444;--wa:#25D366;--d:"Barlow Condensed","Arial Narrow",Impact,sans-serif;--b:"Figtree",system-ui,-apple-system,"Segoe UI",sans-serif}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--ink);font:400 14px/1.5 var(--b);padding:14px;max-width:393px;margin:0 auto}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
    margin-bottom: 16px !important;
  }

  .st {
    padding: 13px 12px 11px !important;
    border-radius: 18px !important;
    min-height: 122px !important;
  }

  .st>span {
    font-size: 10px !important;
    letter-spacing: 0.3px !important;
    padding-right: 28px !important;
    line-height: 1.2 !important;
  }

  .st b {
    font: italic 700 clamp(28px, 7.5vw, 35px)/1.05 var(--d) !important;
    margin: 5px 0 0 !important;
  }

  .st b small {
    font-size: 15px !important;
  }

  .ic {
    width: 28px !important;
    height: 28px !important;
    border-radius: 9px !important;
    right: 11px !important;
    top: 11px !important;
  }

  .ic svg {
    width: 15px !important;
    height: 15px !important;
    stroke-width: 2.2 !important;
  }

  .bar {
    height: 4px !important;
    margin-top: 7px !important;
    border-radius: 4px !important;
  }

  .st small {
    font-size: 9.5px !important;
    margin-top: 5px !important;
    line-height: 1.25 !important;
  }
}

.st {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 22px;
  color: #fff;
  min-height: 168px;
  transition: .2s;
}

.st>span {
  font-weight: 600;
  opacity: .9;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
}

.st b {
  display: block;
  font: italic 700 58px/1 var(--d);
  margin: 8px 0 0;
  letter-spacing: .01em;
}

.st b small {
  display: inline;
  font-size: 22px;
  opacity: .65;
  margin: 0;
}

.st small {
  display: block;
  opacity: .85;
  font-size: 12.5px;
  margin-top: 8px;
}

.ic {
  position: absolute;
  right: 18px;
  top: 18px;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-content: center;
  background: rgba(255, 255, 255, .22);
}

.ic svg {
  width: 21px;
  height: 21px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bar {
  height: 7px;
  border-radius: 7px;
  background: rgba(255, 255, 255, .3);
  margin-top: 12px;
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  background: #fff;
  min-width: 5px;
  border-radius: 7px;
  transition: width .6s;
}

/* Card Gradients */
.c-g {
  background: linear-gradient(135deg, #1FCB7C, #0B9A55);
}

.c-o {
  background: linear-gradient(135deg, #FF8A3D, #F04A00);
}

.c-bl {
  background: linear-gradient(135deg, #4C86FF, #1E4FD8);
}

.c-y {
  background: linear-gradient(135deg, #FFD43B, #FFB000);
  color: #3A2A00;
}

.c-y .bar {
  background: rgba(58, 42, 0, .15);
}

.c-y .bar i {
  background: #3A2A00;
}

.c-y .ic {
  background: rgba(58, 42, 0, .12);
  color: #3A2A00;
}
</style>
</head>
<body>
  <div class="stats">
    <!-- Card 1: Today's Cash -->
    <div class="st c-g">
      <div class="ic"><svg viewBox="0 0 24 24">
          <path d="M6 4h12M6 9h12M7 4c6 0 7 5 2 7H6m3 0l6 9" />
        </svg></div>
      <span>TODAY'S CASH</span>
      <b id="total-cash"><span id="kpi-today-cash">₹3,000</span></b>
      <div class="bar"><i id="kpi-cash-progress-bar" style="width:75%"></i></div>
      <small><span id="kpi-cash-delta">↑ +₹930 vs yesterday</span></small>
    </div>

    <!-- Card 2: Present Today -->
    <div class="st c-o">
      <div class="ic"><svg viewBox="0 0 24 24">
          <path d="M5 7a3 3 0 013-3h8a3 3 0 013 3v11a3 3 0 01-3 3H8a3 3 0 01-3-3zM9 13l2 2 4-4" />
        </svg></div>
      <span>PRESENT TODAY</span>
      <b id="present-count"><span id="stat-present-today">0</span></b>
      <div class="bar"><i style="width:2%"></i></div>
      <small>● Verified QR check-ins</small>
    </div>

    <!-- Card 3: Active Members -->
    <div class="st c-bl">
      <div class="ic"><svg viewBox="0 0 24 24">
          <path
            d="M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.7a3.5 3.5 0 010 6.6M18 14.8c2 .6 3.3 2.3 3.5 5.2" />
        </svg></div>
      <span>ACTIVE MEMBERS</span>
      <b><span id="kpi-active-members">3</span> <small>/ 400</small></b>
      <div class="bar"><i id="kpi-occupancy-bar" style="width:1%"></i></div>
      <small>● Total Registered: <span id="stat-total-members">4</span> &nbsp; ● Inactive: <span
          id="stat-inactive-members">1</span></small>
    </div>

    <!-- Card 4: Expiring Soon -->
    <div class="st c-y">
      <div class="ic"><svg viewBox="0 0 24 24">
          <path d="M12 7v5l3 2M12 21a8 8 0 100-16 8 8 0 000 16z" />
        </svg></div>
      <span>EXPIRING SOON</span>
      <b id="expiring-count"><span id="stat-expiring-soon">0</span></b>
      <div class="bar"><i style="width:100%"></i></div>
      <small>● Action recommended (7 days)</small>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_mobile_cards.html', testHtml, 'utf8');
console.log('Saved scratch/test_mobile_cards.html');

