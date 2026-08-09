// js/insights.js — Productivity analytics and trends

var Insights = {
  init() {},

  render() {
    const tasks = DB.getAll(DB.KEYS.TASKS);
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);

    // Completion trend (last 4 weeks)
    const weeklyData = this.getWeeklyCompletions(completedTasks);

    // Productivity by day of week
    const dayData = this.getByDayOfWeek(completedTasks);

    // Project distribution
    const projectData = this.getProjectDistribution(tasks);

    // Focus stats
    const focusStats = Focus.getWeeklyFocusData();

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Insights</h1>
          <p class="page-subtitle">Your productivity patterns and trends</p>
        </div>
      </div>

      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-card-title">Weekly Completions (Last 4 Weeks)</div>
          <div class="insight-bars">
            ${weeklyData.map(w => `
              <div class="insight-bar-col">
                <div class="insight-bar" style="height:${w.pct}%"></div>
                <span class="insight-bar-label">${w.label}</span>
                <span class="insight-bar-value">${w.count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-card-title">Most Productive Days</div>
          <div class="insight-bars">
            ${dayData.map(d => `
              <div class="insight-bar-col">
                <div class="insight-bar" style="height:${d.pct}%;background:${d.isTop ? 'var(--green)' : 'var(--accent)'}"></div>
                <span class="insight-bar-label">${d.name}</span>
                <span class="insight-bar-value">${d.count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-card-title">Time by Project</div>
          <div class="insight-project-list">
            ${projectData.map(p => `
              <div class="insight-project-row">
                <span class="insight-project-name">${p.name}</span>
                <div class="insight-project-bar-bg">
                  <div class="insight-project-bar" style="width:${p.pct}%"></div>
                </div>
                <span class="insight-project-count">${p.count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-card-title">Today's Focus</div>
          <div class="insight-focus-stats">
            <div class="insight-big-number">${focusStats.sessionsToday}</div>
            <div class="insight-big-label">Pomodoro sessions</div>
            <div class="insight-big-number" style="margin-top:12px">${focusStats.minutesToday}</div>
            <div class="insight-big-label">minutes focused</div>
          </div>
        </div>
      </div>
    `;
  },

  getWeeklyCompletions(tasks) {
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date();
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (w * 7));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const count = tasks.filter(t => {
        const d = new Date(t.completedAt);
        return d >= start && d <= end;
      }).length;

      weeks.push({
        label: w === 0 ? 'This Week' : `${w}w ago`,
        count,
      });
    }

    const max = Math.max(...weeks.map(w => w.count), 1);
    return weeks.map(w => ({ ...w, pct: (w.count / max) * 100 }));
  },

  getByDayOfWeek(tasks) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = Array(7).fill(0);

    tasks.forEach(t => {
      const d = new Date(t.completedAt).getDay();
      const idx = d === 0 ? 6 : d - 1; // Convert to Mon=0
      counts[idx]++;
    });

    const max = Math.max(...counts, 1);
    const topIdx = counts.indexOf(Math.max(...counts));

    return days.map((name, i) => ({
      name,
      count: counts[i],
      pct: (counts[i] / max) * 100,
      isTop: i === topIdx,
    }));
  },

  getProjectDistribution(tasks) {
    const projects = {};
    tasks.forEach(t => {
      const p = t.project || 'Personal';
      projects[p] = (projects[p] || 0) + 1;
    });

    const sorted = Object.entries(projects)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const max = sorted[0]?.count || 1;
    return sorted.map(p => ({ ...p, pct: (p.count / max) * 100 }));
  },
};
