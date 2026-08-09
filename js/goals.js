// js/goals.js — Goal cards, progress tracking, CRUD

const Goals = {
  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('page-goals');
    const goals = DB.getAll(DB.KEYS.GOALS);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Goals</h1>
          <p class="page-subtitle">Long-term objectives broken into milestones</p>
        </div>
        <button class="btn btn--primary" onclick="Goals.openAddModal()">+ New Goal</button>
      </div>

      <div class="goals-grid">
        ${goals.map(g => this.renderGoal(g)).join('')}
      </div>
    `;
  },

  renderGoal(g) {
    // Auto-calculate progress from linked tasks
    const progress = this.calcProgress(g);

    return `
      <div class="goal-card" onclick="Goals.openDetail('${g.id}')">
        <div class="goal-top">
          <div class="goal-emoji" style="background:${g.bgColor || 'var(--accent-light)'}">${g.emoji || '🎯'}</div>
          <div class="goal-deadline">${g.deadline || 'Ongoing'}</div>
        </div>
        <div class="goal-name">${g.name}</div>
        <div class="goal-desc">${g.description || ''}</div>
        <div class="goal-progress">
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" style="width:${progress}%;background:${g.color || 'var(--accent)'}"></div>
          </div>
          <div class="goal-progress-pct" style="color:${g.color || 'var(--accent)'}">${progress}%</div>
        </div>
        <div class="goal-tags">
          <span class="goal-tag" style="background:${g.bgColor || 'var(--accent-light)'};color:${g.color || 'var(--accent)'}">${g.category || 'General'}</span>
          ${this.getLinkedCount(g.id) > 0 ? `<span class="goal-tag" style="background:var(--bg);color:var(--text-tertiary)">${this.getLinkedCount(g.id)} tasks linked</span>` : ''}
        </div>
      </div>
    `;
  },

  // Calculate progress from linked tasks (auto) or use manual override
  calcProgress(goal) {
    const linkedTasks = DB.getAll(DB.KEYS.TASKS).filter(t => t.goalId === goal.id);
    if (linkedTasks.length === 0) return goal.progress || 0;

    const completed = linkedTasks.filter(t => t.completed).length;
    return Math.round((completed / linkedTasks.length) * 100);
  },

  getLinkedCount(goalId) {
    return DB.getAll(DB.KEYS.TASKS).filter(t => t.goalId === goalId).length;
  },

  // Called by Tasks.toggle() when a linked task is completed/uncompleted
  recalcProgress(goalId) {
    const goal = DB.getById(DB.KEYS.GOALS, goalId);
    if (!goal) return;
    const newProgress = this.calcProgress(goal);
    DB.update(DB.KEYS.GOALS, goalId, { progress: newProgress });
    this.render();
  },

  openAddModal() {
    // TODO: goal creation modal
    console.log('Open add goal modal');
  },

  openDetail(id) {
    // TODO: goal detail/edit view
    console.log('Open goal detail:', id);
  },

  updateProgress(id, progress) {
    DB.update(DB.KEYS.GOALS, id, { progress: Math.min(100, Math.max(0, progress)) });
    this.render();
    App.updateCounts();
  },

  // Get all tasks linked to a specific goal
  getLinkedTasks(goalId) {
    return DB.getAll(DB.KEYS.TASKS).filter(t => t.goalId === goalId);
  },
};
