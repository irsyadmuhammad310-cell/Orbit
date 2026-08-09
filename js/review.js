// js/review.js — Weekly Review: auto-generated summary of the week

var Review = {
  init() {},

  // Generate review data for current week (Mon-Sun)
  getWeekData() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const tasks = DB.getAll(DB.KEYS.TASKS);
    const goals = DB.getAll(DB.KEYS.GOALS);

    const completedThisWeek = tasks.filter(t =>
      t.completed && t.completedAt &&
      new Date(t.completedAt) >= weekStart && new Date(t.completedAt) <= weekEnd
    );

    const overdue = tasks.filter(t =>
      !t.completed && t.dueDate && new Date(t.dueDate) < now
    );

    const upcomingNextWeek = tasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      const d = new Date(t.dueDate);
      const nextMon = new Date(weekEnd);
      nextMon.setDate(nextMon.getDate() + 1);
      const nextSun = new Date(nextMon);
      nextSun.setDate(nextMon.getDate() + 6);
      return d >= nextMon && d <= nextSun;
    });

    const goalProgress = goals.map(g => ({
      ...g,
      currentProgress: Goals.calcProgress(g),
    }));

    // Productivity by day
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const prodByDay = dayNames.map((name, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const count = completedThisWeek.filter(t => {
        const d = new Date(t.completedAt);
        return d.toDateString() === dayDate.toDateString();
      }).length;
      return { name, count };
    });

    return {
      weekStart,
      weekEnd,
      completedThisWeek,
      overdue,
      upcomingNextWeek,
      goalProgress,
      prodByDay,
      totalTasks: tasks.filter(t => !t.parentId).length,
    };
  },

  render() {
    const data = this.getWeekData();
    const maxDay = Math.max(...data.prodByDay.map(d => d.count), 1);
    const weekLabel = `${data.weekStart.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })} - ${data.weekEnd.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}`;

    return `
      <div class="review-section">
        <div class="review-header">
          <h2 class="review-title">Weekly Review</h2>
          <span class="review-week">${weekLabel}</span>
        </div>

        <div class="review-stats">
          <div class="review-stat">
            <div class="review-stat-value">${data.completedThisWeek.length}</div>
            <div class="review-stat-label">Completed</div>
          </div>
          <div class="review-stat">
            <div class="review-stat-value" style="color:var(--red)">${data.overdue.length}</div>
            <div class="review-stat-label">Overdue</div>
          </div>
          <div class="review-stat">
            <div class="review-stat-value">${data.upcomingNextWeek.length}</div>
            <div class="review-stat-label">Next Week</div>
          </div>
        </div>

        <div class="review-chart">
          <div class="review-chart-title">Tasks Completed by Day</div>
          <div class="review-bars">
            ${data.prodByDay.map(d => `
              <div class="review-bar-col">
                <div class="review-bar" style="height:${(d.count / maxDay) * 100}%"></div>
                <span class="review-bar-label">${d.name}</span>
                <span class="review-bar-count">${d.count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${data.overdue.length > 0 ? `
          <div class="review-list">
            <div class="review-list-title" style="color:var(--red)">⚠️ Slipped Tasks</div>
            ${data.overdue.slice(0, 5).map(t => `
              <div class="review-list-item">${t.name} <span style="color:var(--text-tertiary)">(${t.project || 'Personal'})</span></div>
            `).join('')}
          </div>
        ` : ''}

        <div class="review-list">
          <div class="review-list-title">🎯 Goal Progress</div>
          ${data.goalProgress.map(g => `
            <div class="review-goal-row">
              <span>${g.emoji || '🎯'} ${g.name}</span>
              <span style="font-weight:700;color:${g.color || 'var(--accent)'}">${g.currentProgress}%</span>
            </div>
          `).join('')}
        </div>

        ${data.upcomingNextWeek.length > 0 ? `
          <div class="review-list">
            <div class="review-list-title">📋 Focus for Next Week</div>
            ${data.upcomingNextWeek.slice(0, 5).map(t => `
              <div class="review-list-item">${t.name}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },
};
