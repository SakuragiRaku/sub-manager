// ============================================================
// サブスクマネージャー - app.js
// ============================================================

const STORAGE_KEY = 'sub-manager-subs';
const THEME_KEY = 'sub-manager-theme';

const CATEGORIES = {
  video:    { label: '動画',     icon: '🎬', color: '#e74c3c' },
  music:    { label: '音楽',     icon: '🎵', color: '#9b59b6' },
  game:     { label: 'ゲーム',   icon: '🎮', color: '#27ae60' },
  tool:     { label: 'ツール',   icon: '🔧', color: '#3498db' },
  learning: { label: '学習',     icon: '📚', color: '#e67e22' },
  telecom:  { label: '通信',     icon: '📡', color: '#00cec9' },
  news:     { label: 'ニュース', icon: '📰', color: '#f1c40f' },
  other:    { label: 'その他',   icon: '📌', color: '#95a5a6' },
};

// ============================================================
// State
// ============================================================

let subs = [];
let currentFilter = { category: 'all', status: 'active', search: '' };
let editingId = null;
let calendarDate = new Date();

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initTheme();
  initNav();
  initFilters();
  initModal();
  initCalendar();
  render();
});

// ============================================================
// Data
// ============================================================

function loadData() {
  try {
    subs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { subs = []; }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ============================================================
// Theme
// ============================================================

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  setTheme(saved);
  document.getElementById('theme-btn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'dark' : 'light');
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  document.getElementById('theme-btn').textContent = theme === 'light' ? '🌙' : '☀️';
}

// ============================================================
// Navigation
// ============================================================

function initNav() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const page = document.getElementById(`page-${btn.dataset.page}`);
      page.classList.add('active');

      if (btn.dataset.page === 'calendar') renderCalendar();
      if (btn.dataset.page === 'stats') renderStats();
    });
  });
}

// ============================================================
// Filters
// ============================================================

function initFilters() {
  // Category tabs
  document.getElementById('category-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter.category = tab.dataset.cat;
    render();
  });

  // Status pills
  document.getElementById('status-pills').addEventListener('click', (e) => {
    const pill = e.target.closest('.status-pill');
    if (!pill) return;
    document.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilter.status = pill.dataset.status;
    render();
  });

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    currentFilter.search = e.target.value.trim().toLowerCase();
    render();
  });
}

// ============================================================
// Modal
// ============================================================

function initModal() {
  document.getElementById('add-btn').addEventListener('click', () => openModal());
  document.getElementById('edit-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('edit-save-btn').addEventListener('click', saveSub);
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') closeModal();
  });

  // Status toggle in form
  document.getElementById('form-status-toggle').addEventListener('click', (e) => {
    const opt = e.target.closest('.status-opt');
    if (!opt) return;
    document.querySelectorAll('.status-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
  });
}

function openModal(id = null) {
  editingId = id;
  const modal = document.getElementById('edit-modal');
  const title = document.getElementById('edit-modal-title');

  if (id) {
    const sub = subs.find(s => s.id === id);
    if (!sub) return;
    title.textContent = '✏️ サブスク編集';
    document.getElementById('form-name').value = sub.name;
    document.getElementById('form-category').value = sub.category;
    document.getElementById('form-cycle').value = sub.cycle;
    document.getElementById('form-amount').value = sub.amount;
    document.getElementById('form-next-date').value = sub.nextDate;
    document.getElementById('form-memo').value = sub.memo || '';

    document.querySelectorAll('.status-opt').forEach(o => {
      o.classList.toggle('active', o.dataset.val === sub.status);
    });
  } else {
    title.textContent = '💳 サブスク追加';
    document.getElementById('form-name').value = '';
    document.getElementById('form-category').value = 'video';
    document.getElementById('form-cycle').value = 'monthly';
    document.getElementById('form-amount').value = '';
    document.getElementById('form-next-date').value = '';
    document.getElementById('form-memo').value = '';

    document.querySelectorAll('.status-opt').forEach(o => {
      o.classList.toggle('active', o.dataset.val === 'active');
    });
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingId = null;
}

function saveSub() {
  const name = document.getElementById('form-name').value.trim();
  const category = document.getElementById('form-category').value;
  const cycle = document.getElementById('form-cycle').value;
  const amount = parseInt(document.getElementById('form-amount').value) || 0;
  const nextDate = document.getElementById('form-next-date').value;
  const memo = document.getElementById('form-memo').value.trim();
  const status = document.querySelector('.status-opt.active').dataset.val;

  if (!name) { alert('サービス名を入力してください'); return; }
  if (amount <= 0) { alert('金額を入力してください'); return; }

  if (editingId) {
    const idx = subs.findIndex(s => s.id === editingId);
    if (idx !== -1) {
      subs[idx] = { ...subs[idx], name, category, cycle, amount, nextDate, memo, status };
    }
  } else {
    subs.push({
      id: generateId(),
      name, category, cycle, amount, nextDate, memo, status,
      createdAt: new Date().toISOString(),
    });
  }

  saveData();
  closeModal();
  render();
}

function deleteSub(id) {
  if (!confirm('このサブスクを削除しますか？')) return;
  subs = subs.filter(s => s.id !== id);
  saveData();
  render();
}

// ============================================================
// Render List
// ============================================================

function render() {
  renderDashboard();
  renderGrid();
}

function renderDashboard() {
  const activeSubs = subs.filter(s => s.status === 'active');
  const monthly = activeSubs.reduce((sum, s) => {
    return sum + (s.cycle === 'yearly' ? Math.round(s.amount / 12) : s.amount);
  }, 0);
  const yearly = monthly * 12;
  const now = new Date();
  const thisMonth = activeSubs.filter(s => {
    if (!s.nextDate) return false;
    const d = new Date(s.nextDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  document.getElementById('dash-monthly').textContent = `¥${monthly.toLocaleString()}`;
  document.getElementById('dash-yearly').textContent = `¥${yearly.toLocaleString()}`;
  document.getElementById('dash-count').textContent = activeSubs.length;
  document.getElementById('dash-upcoming').textContent = thisMonth;
}

function renderGrid() {
  const grid = document.getElementById('sub-grid');
  const empty = document.getElementById('empty-state');

  let filtered = subs.filter(s => {
    if (currentFilter.category !== 'all' && s.category !== currentFilter.category) return false;
    if (currentFilter.status !== 'all' && s.status !== currentFilter.status) return false;
    if (currentFilter.search && !s.name.toLowerCase().includes(currentFilter.search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = filtered.map(s => {
    const cat = CATEGORIES[s.category] || CATEGORIES.other;
    const monthlyPrice = s.cycle === 'yearly' ? Math.round(s.amount / 12) : s.amount;
    const cycleTxt = s.cycle === 'yearly' ? '年額' : '月額';
    const isWarning = isUpcomingSoon(s.nextDate);
    const dateStr = s.nextDate ? formatDate(s.nextDate) : '未設定';

    return `
      <div class="sub-card ${s.status === 'cancelled' ? 'cancelled' : ''}"
           style="--cat-color: ${cat.color}">
        <div class="sub-card-top">
          <span class="sub-card-name">${cat.icon} ${escHtml(s.name)}</span>
          <span class="sub-card-cat" style="--cat-color: ${cat.color}">${cat.label}</span>
        </div>
        <div class="sub-card-price">¥${monthlyPrice.toLocaleString()}<span class="sub-card-cycle">/月</span></div>
        ${s.cycle === 'yearly' ? `<div class="sub-card-cycle">(${cycleTxt} ¥${s.amount.toLocaleString()})</div>` : ''}
        <div class="sub-card-bottom">
          <span class="sub-card-date ${isWarning ? 'warning' : ''}">
            ${isWarning ? '⚠️ ' : '📅 '}次回: ${dateStr}
          </span>
          <span class="sub-card-status ${s.status === 'active' ? 'active-status' : 'cancelled-status'}">
            ${s.status === 'active' ? '契約中' : '解約済み'}
          </span>
        </div>
        <div class="sub-card-actions">
          <button onclick="openModal('${s.id}')">✏️ 編集</button>
          <button class="delete-btn" onclick="deleteSub('${s.id}')">🗑 削除</button>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// Calendar
// ============================================================

function initCalendar() {
  document.getElementById('cal-prev').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  document.getElementById('cal-title').textContent = `${year}年 ${month + 1}月`;

  const grid = document.getElementById('calendar-grid');
  // keep headers
  const headers = grid.querySelectorAll('.cal-day-header');
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const today = new Date();

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    grid.appendChild(createCalCell(daysInPrev - i, true, []));
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const events = subs.filter(s => s.status === 'active' && s.nextDate === dateStr);
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    grid.appendChild(createCalCell(d, false, events, isToday));
  }

  // Next month padding
  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    grid.appendChild(createCalCell(i, true, []));
  }
}

function createCalCell(day, otherMonth, events, isToday = false) {
  const cell = document.createElement('div');
  cell.className = `cal-cell${otherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`;

  let eventsHtml = events.map(s => {
    const isWarn = isUpcomingSoon(s.nextDate);
    return `<div class="cal-event ${isWarn ? 'warning' : 'normal'}">${CATEGORIES[s.category]?.icon || '📌'} ${escHtml(s.name)}</div>`;
  }).join('');

  cell.innerHTML = `<div class="cal-cell-day">${day}</div><div class="cal-cell-events">${eventsHtml}</div>`;
  return cell;
}

// ============================================================
// Stats
// ============================================================

function renderStats() {
  renderPieChart();
  renderBarChart();
}

function renderPieChart() {
  const canvas = document.getElementById('pie-chart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 300 * dpr;
  canvas.height = 300 * dpr;
  ctx.scale(dpr, dpr);

  const activeSubs = subs.filter(s => s.status === 'active');
  const catTotals = {};
  activeSubs.forEach(s => {
    const monthly = s.cycle === 'yearly' ? Math.round(s.amount / 12) : s.amount;
    catTotals[s.category] = (catTotals[s.category] || 0) + monthly;
  });

  const entries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (total === 0) {
    ctx.clearRect(0, 0, 300, 300);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim();
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('データがありません', 150, 150);
    document.getElementById('pie-legend').innerHTML = '';
    return;
  }

  const cx = 150, cy = 150, r = 110;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, 300, 300);

  entries.forEach(([cat, val]) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.fillStyle = CATEGORIES[cat]?.color || '#95a5a6';
    ctx.fill();
    startAngle += slice;
  });

  // Center circle (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim();
  ctx.fill();

  // Center text
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`¥${total.toLocaleString()}`, cx, cy - 4);
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim();
  ctx.fillText('/月', cx, cy + 14);

  // Legend
  document.getElementById('pie-legend').innerHTML = entries.map(([cat, val]) => {
    const c = CATEGORIES[cat] || CATEGORIES.other;
    const pct = Math.round((val / total) * 100);
    return `<span class="legend-item"><span class="legend-color" style="background:${c.color}"></span>${c.icon} ${c.label} ¥${val.toLocaleString()} (${pct}%)</span>`;
  }).join('');
}

function renderBarChart() {
  const canvas = document.getElementById('bar-chart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 500 * dpr;
  canvas.height = 300 * dpr;
  ctx.scale(dpr, dpr);

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim();
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

  // build last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: `${d.getMonth() + 1}月` });
  }

  // Calculate monthly cost for each month (rough estimate: active subs' monthly cost)
  const activeSubs = subs.filter(s => s.status === 'active');
  const monthlyTotal = activeSubs.reduce((sum, s) => {
    return sum + (s.cycle === 'yearly' ? Math.round(s.amount / 12) : s.amount);
  }, 0);

  const values = months.map(() => monthlyTotal);
  const maxVal = Math.max(...values, 1);

  ctx.clearRect(0, 0, 500, 300);

  const barW = 50;
  const gap = (500 - barW * 6) / 7;
  const chartH = 240;
  const baseY = 270;

  months.forEach((m, i) => {
    const x = gap + i * (barW + gap);
    const h = (values[i] / maxVal) * chartH;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, baseY - h, x, baseY);
    grad.addColorStop(0, accentColor);
    grad.addColorStop(1, 'rgba(108, 92, 231, 0.3)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(x, baseY - h, barW, h, [6, 6, 0, 0]);
    ctx.fill();

    // Label
    ctx.fillStyle = textColor;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, x + barW / 2, baseY + 18);

    // Value on top
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`¥${values[i].toLocaleString()}`, x + barW / 2, baseY - h - 6);
  });
}

// ============================================================
// Helpers
// ============================================================

function isUpcomingSoon(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (d - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
