// js/overview.js — Dashboard / Overview page

const Overview = {
  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('page-overview');
    const tasks = DB.getAll(DB.KEYS.TASKS);
    const goals = DB.getAll(DB.KEYS.GOALS);
    const projects = DB.getAll(DB.KEYS.PROJECTS);
    const notes = DB.getAll(DB.KEYS.NOTES);

    const todayTasks = tasks.filter(t => !t.completed && this.isDueToday(t.dueDate));
    const completedToday = tasks.filter(t => t.completed && this.isCompletedToday(t.completedAt));
    const upcomingTasks = tasks.filter(t => !t.completed).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
    const avgGoalProgress = goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Overview</h1>
          <p class="page-subtitle">${this.getDateString()}. Here's your snapshot.</p>
        </div>
      </div>

      <div class="overview-stats">
        <div class="stat-card">
          <div class="stat-label">Tasks Due Today</div>
          <div class="stat-value">${todayTasks.length}</div>
          <div class="stat-sub up">${completedToday.length} completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Goals Progress</div>
          <div class="stat-value">${avgGoalProgress}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Projects</div>
          <div class="stat-value">${projects.filter(p => p.status !== 'completed').length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Notes</div>
          <div class="stat-value">${notes.length}</div>
        </div>
      </div>

      <div class="overview-grid">
        <div class="overview-section">
          <div class="overview-section-title">Upcoming Tasks</div>
          ${upcomingTasks.map(t => `
            <div class="overview-task">
              <div class="overview-task-dot" style="background:${this.priorityColor(t.priority)}"></div>
              <div class="overview-task-name">${t.name}</div>
              <div class="overview-task-due">${this.formatDue(t.dueDate)}</div>
            </div>
          `).join('') || '<p class="empty-state">No upcoming tasks. Nice!</p>'}
        </div>

        <div class="overview-section">
          <div class="overview-section-title">Goal Tracker</div>
          ${goals.map(g => `
            <div class="overview-goal-mini">
              <span class="overview-goal-emoji">${g.emoji || '🎯'}</span>
              <div class="overview-goal-info">
                <div class="overview-goal-name">${g.name}</div>
                <div class="overview-goal-bar"><div class="overview-goal-fill" style="width:${g.progress}%;background:${g.color || 'var(--accent)'}"></div></div>
              </div>
              <span class="overview-goal-pct" style="color:${g.color || 'var(--accent)'}">${g.progress}%</span>
            </div>
          `).join('') || '<p class="empty-state">No goals yet. Set some!</p>'}
        </div>
      </div>
    `;
  },

  isDueToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  },

  isCompletedToday(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
  },

  priorityColor(priority) {
    const colors = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--blue)' };
    return colors[priority] || 'var(--text-tertiary)';
  },

  formatDue(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const diff = Math.ceil((d - now) / 86400000);
    if (diff < 0) return 'Overdue';
    if (diff === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
  },

  getDateString() {
    return new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  },
};
