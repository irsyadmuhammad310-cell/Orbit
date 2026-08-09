// js/habits.js — Daily habits tracker with streaks

var Habits = {
  STORAGE_KEY: 'orbit_habits',
  LOGS_KEY: 'orbit_habit_logs',

  init() {},

  getHabits() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  saveHabits(habits) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(habits));
  },

  getLogs() {
    const raw = localStorage.getItem(this.LOGS_KEY);
    return raw ? JSON.parse(raw) : {};
  },

  saveLogs(logs) {
    localStorage.setItem(this.LOGS_KEY, JSON.stringify(logs));
  },

  addHabit(name, icon) {
    const habits = this.getHabits();
    habits.push({
      id: crypto.randomUUID(),
      name,
      icon: icon || '⭐',
      createdAt: new Date().toISOString(),
    });
    this.saveHabits(habits);
  },

  removeHabit(id) {
    this.saveHabits(this.getHabits().filter(h => h.id !== id));
  },

  // Toggle a habit for a given date
  toggleLog(habitId, dateStr) {
    const logs = this.getLogs();
    const key = `${habitId}_${dateStr}`;
    if (logs[key]) {
      delete logs[key];
    } else {
      logs[key] = true;
    }
    this.saveLogs(logs);
  },

  isCompleted(habitId, dateStr) {
    return !!this.getLogs()[`${habitId}_${dateStr}`];
  },

  // Calculate current streak for a habit
  getStreak(habitId) {
    const logs = this.getLogs();
    let streak = 0;
    const d = new Date();

    // Check if today is done; if not, start from yesterday
    const todayKey = `${habitId}_${this.dateKey(d)}`;
    if (!logs[todayKey]) {
      d.setDate(d.getDate() - 1);
    }

    while (true) {
      const key = `${habitId}_${this.dateKey(d)}`;
      if (logs[key]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  },

  // Get last N days completion grid
  getGrid(habitId, days = 30) {
    const grid = [];
    const logs = this.getLogs();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${habitId}_${this.dateKey(d)}`;
      grid.push({
        date: new Date(d),
        done: !!logs[key],
      });
    }
    return grid;
  },

  dateKey(d) {
    return d.toISOString().split('T')[0];
  },

  todayKey() {
    return this.dateKey(new Date());
  },

  // Render habits section (used in Overview or standalone)
  render() {
    const habits = this.getHabits();
    const today = this.todayKey();

    if (habits.length === 0) {
      return `
        <div class="habits-empty">
          <p>No habits tracked yet.</p>
          <button class="btn btn--primary" onclick="Habits.openAddModal()">+ Add Habit</button>
        </div>
      `;
    }

    return `
      <div class="habits-list">
        ${habits.map(h => {
          const done = this.isCompleted(h.id, today);
          const streak = this.getStreak(h.id);
          const grid = this.getGrid(h.id, 21);

          return `
            <div class="habit-row">
              <div class="habit-check ${done ? 'done' : ''}" onclick="Habits.toggleLog('${h.id}', '${today}'); Overview.init(); Habits.renderPage();">
                ${done ? '✓' : ''}
              </div>
              <div class="habit-info">
                <div class="habit-name">${h.icon} ${h.name}</div>
                <div class="habit-streak">${streak > 0 ? `🔥 ${streak} day streak` : 'Start today!'}</div>
              </div>
              <div class="habit-grid">
                ${grid.map(g => `<div class="habit-cell ${g.done ? 'filled' : ''}"></div>`).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <button class="btn" onclick="Habits.openAddModal()" style="margin-top:12px">+ Add Habit</button>
    `;
  },

  renderPage() {
    // If habits has its own page view
    const container = document.getElementById('page-habits');
    if (!container) return;
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Habits</h1>
          <p class="page-subtitle">Daily streaks and consistency tracking</p>
        </div>
      </div>
      ${this.render()}
    `;
  },

  openAddModal() {
    const name = prompt('Habit name (e.g. "Gym", "Read 30 min"):');
    if (!name?.trim()) return;
    const icon = prompt('Emoji icon:', '⭐') || '⭐';
    this.addHabit(name.trim(), icon);
    Overview.init();
    this.renderPage();
  },
};

// Seed default habits if empty
if (!localStorage.getItem('orbit_habits')) {
  localStorage.setItem('orbit_habits', JSON.stringify([
    { id: 'hab1', name: 'Gym', icon: '🏋️', createdAt: new Date().toISOString() },
    { id: 'hab2', name: 'Read 30 min', icon: '📚', createdAt: new Date().toISOString() },
    { id: 'hab3', name: 'Code 1 hour', icon: '💻', createdAt: new Date().toISOString() },
  ]));
}
