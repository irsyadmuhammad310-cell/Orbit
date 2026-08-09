// js/app.js — Core navigation, routing, initialization

const App = {
  currentPage: 'overview',

  init() {
    this.bindNav();
    this.bindQuickAdd();
    this.updateGreeting();
    this.updateCounts();
    this.updateWeeklyProgress();
    // Initialize all modules
    Undo.init();
    Search.init();
    Overview.init();
    Tasks.init();
    Goals.init();
    Projects.init();
    Notes.init();
    Calendar.init();
    Settings.init();
  },

  bindNav() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        this.navigate(item.dataset.page);
      });
    });
  },

  navigate(page) {
    this.currentPage = page;
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    // Update page views
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
      target.style.animation = 'none';
      target.offsetHeight; // reflow
      target.style.animation = 'fadeIn 300ms var(--ease-out-expo)';
    }
    this.updateCounts();
  },

  bindQuickAdd() {
    document.getElementById('quickAddBtn')?.addEventListener('click', () => {
      // Open quick add modal (task by default)
      Tasks.openAddModal();
    });
  },

  updateGreeting() {
    const hour = new Date().getHours();
    const settings = DB.getSettings();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    const el = document.querySelector('.header-greeting');
    if (el) el.innerHTML = `${greeting}, <strong>${settings.displayName.split(' ')[0]}</strong>`;
  },

  updateCounts() {
    const tasks = DB.getAll(DB.KEYS.TASKS).filter(t => !t.completed);
    const goals = DB.getAll(DB.KEYS.GOALS);
    const projects = DB.getAll(DB.KEYS.PROJECTS);
    const notes = DB.getAll(DB.KEYS.NOTES);

    this.setCount('taskCount', tasks.length);
    this.setCount('goalCount', goals.length);
    this.setCount('projectCount', projects.length);
    this.setCount('noteCount', notes.length);
  },

  setCount(id, count) {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  },

  updateWeeklyProgress() {
    const tasks = DB.getAll(DB.KEYS.TASKS);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const weekTasks = tasks.filter(t => new Date(t.createdAt) >= weekStart);
    const completed = weekTasks.filter(t => t.completed).length;
    const total = weekTasks.length || 1;
    const pct = Math.round((completed / total) * 100);

    document.getElementById('weeklyPct').textContent = `${pct}%`;
    document.getElementById('weeklyBar').style.width = `${pct}%`;
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
