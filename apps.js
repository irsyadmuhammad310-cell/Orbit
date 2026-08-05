/* ═══ ORBIT — APP.JS ═══
 * State management, navigation, initialization
 */

const Orbit = (() => {
  'use strict';

  // ─── Constants ───
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  const TD = TODAY.toISOString().split('T')[0];

  // ─── Default State ───
  const DEFAULT_STATE = {
    tasks: [
      { id: 't1', name: 'Review FinTrack v16 feature list', date: TD, pri: 'high', proj: 'p2', done: false, rem: null },
      { id: 't2', name: 'Grid movement: A* pathfinding', date: TD, pri: 'medium', proj: 'p1', done: false, rem: `${TD}T14:00` },
      { id: 't3', name: 'Transfer RM 500 to savings', date: TD, pri: 'high', proj: null, done: false, rem: `${TD}T09:00` },
      { id: 't4', name: 'Research Japan rail pass', date: '2026-08-05', pri: 'low', proj: 'p3', done: false, rem: null },
      { id: 't5', name: 'Push v15.8.1 changelog', date: TD, pri: 'medium', proj: 'p2', done: true, rem: null },
      { id: 't6', name: 'Buy pixel art tutorial', date: '2026-08-07', pri: 'low', proj: 'p1', done: false, rem: '2026-08-07T10:00' },
      { id: 't7', name: 'Monthly budget review', date: '2026-08-01', pri: 'high', proj: null, done: true, rem: null },
      { id: 't8', name: 'PTPTN auto-debit increase', date: '2026-08-06', pri: 'medium', proj: null, done: false, rem: '2026-08-06T09:00' },
      { id: 't9', name: 'Design unit class tree', date: '2026-08-08', pri: 'medium', proj: 'p1', done: false, rem: null },
      { id: 't10', name: 'Orbit integration API spec', date: '2026-08-05', pri: 'low', proj: 'p2', done: false, rem: null },
    ],
    goals: [
      { id: 'g1', name: 'Emergency Fund (6mo)', desc: '6 months expenses safety net', type: 'savings', target: 10000, current: 7800, deadline: '2026-12-31', color: 'accent', krs: [{ id: 'k1', t: 'Reach RM 5k', done: true }, { id: 'k2', t: 'Reach RM 8k', done: true }, { id: 'k3', t: 'Hit RM 10k', done: false }] },
      { id: 'g2', name: 'Ship Iron Vow Demo', desc: 'Playable: 3 maps, 6 units, combat', type: 'project', target: 100, current: 35, deadline: '2027-03-31', color: 'violet', krs: [{ id: 'k4', t: 'Godot plan done', done: true }, { id: 'k5', t: 'Buy art pack', done: false }, { id: 'k6', t: 'Grid prototype', done: false }] },
      { id: 'g3', name: 'Japan Trip Fund', desc: '10-day Japan trip savings', type: 'milestone', target: 7500, current: 3900, deadline: '2027-04-15', color: 'gold', krs: [{ id: 'k7', t: 'Save RM 3k base', done: true }, { id: 'k8', t: 'Book flights', done: false }] },
      { id: 'g4', name: 'Clear PTPTN Faster', desc: 'Extra RM 200/mo on loan', type: 'debt', target: 12000, current: 4200, deadline: '2028-06-30', color: 'danger', krs: [{ id: 'k9', t: 'Auto-debit setup', done: true }, { id: 'k10', t: 'Below RM 8k', done: false }] },
    ],
    projects: [
      { id: 'p1', name: 'Iron Vow', icon: 'gamepad-2', color: 'violet', desc: 'Tactical SRPG, Godot 4', status: 'active', budget: 1540, spent: 47 },
      { id: 'p2', name: 'FinTrack', icon: 'code-2', color: 'accent', desc: 'Finance PWA, free stack', status: 'active', budget: 0, spent: 0 },
      { id: 'p3', name: 'Japan Trip', icon: 'plane', color: 'gold', desc: '10-day Japan Apr 2027', status: 'planned', budget: 7500, spent: 0 },
    ],
    reminders: [
      { id: 'r1', text: 'Transfer RM 500', dt: '2026-08-04T09:00', rec: null, done: true },
      { id: 'r2', text: 'Grid movement deadline', dt: '2026-08-04T14:00', rec: null, done: false },
      { id: 'r3', text: 'PTPTN payment day', dt: '2026-08-06T09:00', rec: 'monthly', done: false },
      { id: 'r4', text: 'Weekly goal check-in', dt: '2026-08-08T20:00', rec: 'weekly', done: false },
      { id: 'r5', text: 'Buy pixel art tutorial', dt: '2026-08-07T10:00', rec: null, done: false },
    ],
    integrations: { gcal: true, gdrive: true, fintrack: true },
    settings: { currency: 'MYR', notifications: true, desktopMode: false },
    calMonth: TODAY.getMonth(),
    calYear: TODAY.getFullYear(),
    selectedDate: TD,
    trendView: '6mo',
  };

  // ─── State ───
  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem('orbit_data');
      return saved ? JSON.parse(saved) : structuredClone(DEFAULT_STATE);
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function save() {
    try {
      localStorage.setItem('orbit_data', JSON.stringify(state));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        Helpers.toast('Storage full! Clear some data in Settings.');
      }
    }
  }

  // ─── Navigation ───
  function go(page) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('[data-p]').forEach(n => n.classList.remove('active'));
    document.getElementById(`pg-${page}`).classList.add('active');
    document.querySelectorAll(`[data-p="${page}"]`).forEach(n => n.classList.add('active'));

    // Call page renderer
    const renderers = {
      overview: Overview.render,
      tasks: Tasks.render,
      calendar: Calendar.render,
      goals: Goals.render,
      projects: Projects.render,
      reminders: Reminders.render,
      integrations: Integrations.render,
    };
    if (renderers[page]) renderers[page]();
    updateBadges();
    lucide.createIcons();
  }

  function currentPage() {
    const el = document.querySelector('.page-view.active');
    return el?.id?.replace('pg-', '') || 'overview';
  }

  function updateBadges() {
    const taskCount = state.tasks.filter(t => t.date === TD && !t.done).length;
    const remCount = state.reminders.filter(r => !r.done).length;
    document.getElementById('navTaskBadge').textContent = taskCount || '';
    document.getElementById('navRemBadge').textContent = remCount || '';
  }

  // ─── Sync Status ───
  function updateSyncStatus() {
    const dot = document.getElementById('syncDot');
    const label = document.getElementById('syncStatus');
    const hasFinTrack = localStorage.getItem('ft_accounts') || localStorage.getItem('ft_txn_data');

    if (state.integrations.fintrack && hasFinTrack) {
      dot.className = 'sync-dot live';
      label.textContent = 'synced';
    } else if (state.integrations.fintrack) {
      dot.className = 'sync-dot off';
      label.textContent = 'no data';
    } else {
      dot.className = 'sync-dot off';
      label.textContent = 'disabled';
    }
  }

  // ─── Reminder Checker ───
  function checkReminders() {
    const now = new Date();
    state.reminders.filter(r => !r.done && !r._notified).forEach(r => {
      const rTime = new Date(r.dt);
      if (Math.abs(now - rTime) < 60000) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Orbit', { body: r.text });
        }
        r._notified = true;
        Helpers.toast(`⏰ ${r.text}`);
      }
    });
  }

  // ─── Modal ───
  function modal(html) {
    document.getElementById('modalBox').innerHTML = html;
    document.getElementById('modalBg').classList.add('open');
    lucide.createIcons();
    // Focus first input
    setTimeout(() => {
      const input = document.querySelector('#modalBox .field-input, #modalBox .field-textarea');
      if (input) input.focus();
    }, 100);
  }

  function closeModal() {
    document.getElementById('modalBg').classList.remove('open');
  }

  // ─── Init ───
  function init() {
    // Nav events
    document.getElementById('sideNav').onclick = e => {
      const item = e.target.closest('[data-p]');
      if (item) go(item.dataset.p);
    };
    document.getElementById('mobNav').onclick = e => {
      const item = e.target.closest('[data-p]');
      if (item) go(item.dataset.p);
    };

    // Modal close on backdrop
    document.getElementById('modalBg').onclick = e => {
      if (e.target === e.currentTarget) closeModal();
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    // Request notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Reminder interval
    setInterval(checkReminders, 30000);

    // Initial render
    lucide.createIcons();
    go('overview');
    updateSyncStatus();
  }

  // ─── Public API ───
  return {
    get state() { return state; },
    get TD() { return TD; },
    get TODAY() { return TODAY; },
    save,
    go,
    currentPage,
    updateBadges,
    updateSyncStatus,
    modal,
    closeModal,
    init,
    reset() {
      if (!confirm('Reset all Orbit data?')) return;
      state = structuredClone(DEFAULT_STATE);
      save();
      go(currentPage());
      Helpers.toast('Data reset');
    },
    exportJSON() {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: 'orbit-backup.json' }).click();
      URL.revokeObjectURL(url);
      Helpers.toast('Exported');
    }
  };
})();