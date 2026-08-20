// js/app.js — Navigation, routing, theme, boot
// MUST load LAST (after all other modules)

var App = {
  currentPage: 'home',
  taskFilter: 'all',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  calSelDay: new Date().getDate(),

  init: function() {
    // Async boot: wait for IndexedDB to load before rendering
    DB.boot().then(function(loaded) {
      if (!loaded) {
        DB.store = DB.defaultStore();
        Seed.run();
      }
      App.applyTheme();
      Home.render();
    });
  },

  // Navigation
  go: function(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    var target = document.getElementById('pg-' + page);
    if (target) target.classList.add('active');
    // Update nav highlight
    document.querySelectorAll('.nav-b').forEach(function(b) { b.classList.remove('on'); });
    var map = { home:0, tasks:1, calendar:2, projects:3, more:4, goals:4, habits:4, notes:4, settings:4, search:4, ai:4, docs:4, analytics:4, focus:4, reminders:4, contacts:4, expenses:4 };
    var btns = document.querySelectorAll('.nav-b');
    if (map[page] !== undefined && btns[map[page]]) btns[map[page]].classList.add('on');
    this.render(page);
    window.scrollTo(0, 0);
  },

  render: function(page) {
    var modules = {
      home: Home, tasks: Tasks, calendar: Calendar, projects: Projects,
      more: typeof More !== 'undefined' ? More : null,
      goals: Goals, habits: Habits, notes: Notes,
      settings: Settings,
      search: typeof Search !== 'undefined' ? Search : null,
      ai: typeof AI !== 'undefined' ? AI : null,
      docs: Documents,
      analytics: typeof Analytics !== 'undefined' ? Analytics : null,
      focus: typeof Focus !== 'undefined' ? Focus : null,
      reminders: Reminders, contacts: Contacts, expenses: Expenses
    };
    if (modules[page] && modules[page].render) modules[page].render();
  },

  // Theme
  applyTheme: function() {
    var theme = DB.store.settings.theme || 'system';
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  },

  cycleTheme: function() {
    var order = ['system', 'light', 'dark'];
    var i = order.indexOf(DB.store.settings.theme || 'system');
    DB.store.settings.theme = order[(i + 1) % order.length];
    DB.save();
    this.applyTheme();
    Settings.render();
    toast('Theme: ' + DB.store.settings.theme);
  },

  // Greeting
  greeting: function() {
    var h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }
};

// Sheet (bottom sheet modal)
function openSheet(html) {
  document.getElementById('sheetContent').innerHTML = html;
  document.getElementById('sheetBg').classList.add('open');
}
function closeSheet() {
  document.getElementById('sheetBg').classList.remove('open');
}

// Toast
var _toastTimer;
function toast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { el.classList.remove('show'); }, 2200);
}

// Validation
function vReq(v, msg) { if (!v || !v.trim()) { toast(msg); return false; } return true; }

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { App.init(); });
} else {
  App.init();
}
