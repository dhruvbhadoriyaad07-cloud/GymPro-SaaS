const fs = require('fs');

// Mock browser globals
const domElements = {};

function createElement(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    style: {},
    className: '',
    classList: {
      add: function(...classes) { this.classes.push(...classes); },
      remove: function(...classes) { this.classes = this.classes.filter(c => !classes.includes(c)); },
      classes: []
    },
    getAttribute: function(attr) { return this[attr]; }
  };
}

global.document = {
  getElementById: function(id) {
    if (!domElements[id]) domElements[id] = createElement(id);
    return domElements[id];
  },
  querySelectorAll: function(selector) {
    return buttons;
  }
};

const buttons = [
  { textContent: 'Revenue', dataWeeklyMode: 'revenue', className: 'weekly-mode-btn bg-white', addEventListener: function(e, cb) { this.onClick = cb; } },
  { textContent: 'Check-ins', dataWeeklyMode: 'check-ins', className: 'weekly-mode-btn', addEventListener: function(e, cb) { this.onClick = cb; } },
  { textContent: 'New joins', dataWeeklyMode: 'new-joins', className: 'weekly-mode-btn', addEventListener: function(e, cb) { this.onClick = cb; } }
];

// Sample data
global.allTransactions = [
  { amount: 3000, date: '2026-11-08', type: 'New Membership' },
  { amount: 1500, date: '2026-11-08', type: 'Renewal' },
  { amount: 2000, date: '2026-11-07', type: 'New Membership' },
  { amount: 4000, date: '2026-11-05', type: 'New Membership' }
];

global.allMembers = [
  { id: 'm1', name: 'Member 1', attendanceHistory: ['2026-11-08', '2026-11-07'], createdAt: '2026-11-08' },
  { id: 'm2', name: 'Member 2', attendanceHistory: ['2026-11-08', '2026-11-06'], createdAt: '2026-11-07' },
  { id: 'm3', name: 'Member 3', attendanceHistory: ['2026-11-05'], createdAt: '2026-11-05' }
];

// State & functions
let currentWeeklyMode = 'revenue';

function renderWeeklyChart() {
  const container = document.getElementById('weekly-bar-chart-container');
  if (!container) return;

  const subtitleEl = document.getElementById('weekly-chart-subtitle');
  const minEl = document.getElementById('weekly-chart-min');
  const maxEl = document.getElementById('weekly-chart-max');
  const indicatorEl = document.getElementById('weekly-chart-indicator');

  const config = {
    'revenue': {
      activeColor: '#12B76A',
      lightColor: '#D1FADF',
      shadowColor: 'rgba(18, 183, 106, 0.25)',
      prefix: '₹',
      label: 'Total revenue: '
    },
    'check-ins': {
      activeColor: '#FF6A1F',
      lightColor: '#FFEDD5',
      shadowColor: 'rgba(255, 106, 31, 0.25)',
      prefix: '',
      label: 'Total check-ins: '
    },
    'new joins': {
      activeColor: '#2F6BFF',
      lightColor: '#DBEAFE',
      shadowColor: 'rgba(47, 107, 255, 0.25)',
      prefix: '',
      label: 'New joins: '
    }
  };

  const currentCfg = config[currentWeeklyMode] || config['revenue'];
  const activeColor = currentCfg.activeColor;
  const lightColor = currentCfg.lightColor;
  const prefix = currentCfg.prefix;

  if (indicatorEl) {
    indicatorEl.style.backgroundColor = activeColor;
  }

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    days.push({
      date: d,
      dateStr: dateStr,
      dayName: dayName,
      isToday: (i === 0)
    });
  }

  const txList = (typeof allTransactions !== 'undefined' && Array.isArray(allTransactions))
    ? allTransactions
    : (Array.isArray(window.allTransactions) ? window.allTransactions : []);
  const membersList = (typeof allMembers !== 'undefined' && Array.isArray(allMembers))
    ? allMembers
    : (Array.isArray(window.allMembers) ? window.allMembers : []);

  const getDocDate = (item) => {
    if (!item) return '';
    const val = item.d || item.date || item.joinDate || item.createdAt;
    if (!val) return '';
    if (typeof val === 'string') return val.slice(0, 10);
    if (val instanceof Date) {
      const y = val.getFullYear(), m = String(val.getMonth() + 1).padStart(2, '0'), day = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    if (val.seconds) {
      const dt = new Date(val.seconds * 1000);
      const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return '';
  };

  let totalPeriodSum = 0;
  const dayData = days.map(day => {
    let val = 0;

    if (currentWeeklyMode === 'revenue') {
      txList.forEach(t => {
        if (getDocDate(t) === day.dateStr) {
          val += (Number(t.amount) || 0);
        }
      });
    } else if (currentWeeklyMode === 'check-ins') {
      const attData = (typeof attendanceData !== 'undefined' && Array.isArray(attendanceData))
        ? attendanceData
        : (Array.isArray(global.attendanceData) ? global.attendanceData : null);

      if (attData && attData.length > 0) {
        val = attData.filter(a => {
          const aDate = a.date || a.d || (a.timestamp ? a.timestamp.slice(0, 10) : '');
          return aDate === day.dateStr;
        }).length;
      } else {
        membersList.forEach(m => {
          const hist = Array.isArray(m.attendanceHistory) ? m.attendanceHistory : [];
          if (hist.includes(day.dateStr) || m.lastCheckIn === day.dateStr) {
            val++;
          }
        });
      }
    } else if (currentWeeklyMode === 'new joins') {
      const txJoins = txList.filter(t => {
        const tDate = getDocDate(t);
        const typeLower = (t.type || '').toLowerCase();
        return tDate === day.dateStr && (typeLower.includes('new') || typeLower.includes('membership'));
      }).length;

      const memberJoins = membersList.filter(m => {
        return getDocDate(m) === day.dateStr;
      }).length;

      val = Math.max(txJoins, memberJoins);
    }

    totalPeriodSum += val;
    return { ...day, val };
  });

  if (subtitleEl) {
    const formattedSum = prefix + totalPeriodSum.toLocaleString('en-IN');
    subtitleEl.innerHTML = `${currentCfg.label}<span class="font-bold text-slate-800" id="weekly-chart-total">${formattedSum}</span>`;
  }

  const maxVal = Math.max(...dayData.map(d => d.val), 0);

  if (minEl) {
    minEl.textContent = prefix + '0';
  }
  if (maxEl) {
    maxEl.textContent = `Max: ${prefix}${maxVal.toLocaleString('en-IN')}`;
  }

  const barsHtml = dayData.map(d => {
    let heightPct = 6;
    if (maxVal > 0) {
      heightPct = Math.max(10, Math.round((d.val / maxVal) * 82));
    }

    const valDisplay = prefix + d.val.toLocaleString('en-IN');
    const badgeText = `${d.dayName} · ${valDisplay}`;

    if (d.isToday) {
      return `
        <div class="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer" title="${badgeText}">
          <span class="absolute -top-7 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-md whitespace-nowrap z-10 font-sans pointer-events-none">${badgeText}</span>
          <div class="w-full max-w-[34px] rounded-xl transition-all duration-200"
               style="height: ${heightPct}%; background-color: ${activeColor}; box-shadow: 0 4px 12px ${currentCfg.shadowColor};"></div>
          <span class="text-[11px] font-bold absolute -bottom-5 font-sans" style="color: ${activeColor};">${d.dayName}</span>
        </div>
      `;
    } else {
      return `
        <div class="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer" title="${badgeText}">
          <span class="absolute -top-7 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-md whitespace-nowrap z-10 font-sans pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">${badgeText}</span>
          <div class="w-full max-w-[34px] rounded-xl transition-all duration-200 group-hover:brightness-95"
               style="height: ${heightPct}%; background-color: ${lightColor};"></div>
          <span class="text-[11px] font-medium text-slate-500 absolute -bottom-5 font-sans">${d.dayName}</span>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `
    <div class="absolute inset-x-0 top-8 border-b border-slate-100 border-dashed pointer-events-none"></div>
    <div class="absolute inset-x-0 top-1/2 border-b border-slate-100 border-dashed pointer-events-none"></div>
    ${barsHtml}
  `;
}

function setupWeeklyChartListeners() {
  const toggleButtons = document.querySelectorAll('#weekly-chart-toggles button, #weekly-chart-toggles span, .weekly-mode-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const modeAttr = (this.getAttribute && this.getAttribute('data-weekly-mode')) || this.dataWeeklyMode || this.textContent;
      const clean = (modeAttr || '').trim().toLowerCase();

      if (clean.includes('rev')) {
        currentWeeklyMode = 'revenue';
      } else if (clean.includes('check')) {
        currentWeeklyMode = 'check-ins';
      } else if (clean.includes('join')) {
        currentWeeklyMode = 'new joins';
      }

      toggleButtons.forEach(b => {
        const bText = ((b.getAttribute && b.getAttribute('data-weekly-mode')) || b.dataWeeklyMode || b.textContent || '').trim().toLowerCase();
        const isActive = (currentWeeklyMode === 'revenue' && bText.includes('rev')) ||
                         (currentWeeklyMode === 'check-ins' && bText.includes('check')) ||
                         (currentWeeklyMode === 'new joins' && bText.includes('join'));
        if (isActive) {
          b.className = 'weekly-mode-btn bg-white px-2.5 py-1 rounded-lg shadow-xs text-slate-900 transition-all cursor-pointer font-semibold';
        } else {
          b.className = 'weekly-mode-btn px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer transition-all';
        }
      });

      renderWeeklyChart();
    });
  });
}

// Run test
setupWeeklyChartListeners();

console.log("=== Mode 1: Revenue (Default) ===");
renderWeeklyChart();
console.log("Subtitle:", domElements['weekly-chart-subtitle'].innerHTML);
console.log("Max:", domElements['weekly-chart-max'].textContent);
console.log("Indicator bg:", domElements['weekly-chart-indicator'].style.backgroundColor);
console.log("Has active bar #12B76A:", domElements['weekly-bar-chart-container'].innerHTML.includes('#12B76A'));

console.log("\n=== Mode 2: Check-ins ===");
buttons[1].onClick.call(buttons[1]);
console.log("currentWeeklyMode:", currentWeeklyMode);
console.log("Subtitle:", domElements['weekly-chart-subtitle'].innerHTML);
console.log("Max:", domElements['weekly-chart-max'].textContent);
console.log("Indicator bg:", domElements['weekly-chart-indicator'].style.backgroundColor);
console.log("Has active bar #FF6A1F (Orange):", domElements['weekly-bar-chart-container'].innerHTML.includes('#FF6A1F'));
console.log("Active button class:", buttons[1].className);

console.log("\n=== Mode 3: New joins ===");
buttons[2].onClick.call(buttons[2]);
console.log("currentWeeklyMode:", currentWeeklyMode);
console.log("Subtitle:", domElements['weekly-chart-subtitle'].innerHTML);
console.log("Max:", domElements['weekly-chart-max'].textContent);
console.log("Indicator bg:", domElements['weekly-chart-indicator'].style.backgroundColor);
console.log("Has active bar #2F6BFF (Blue):", domElements['weekly-bar-chart-container'].innerHTML.includes('#2F6BFF'));
console.log("Active button class:", buttons[2].className);

