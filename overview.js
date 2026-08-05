/* ═══ ORBIT — OVERVIEW.JS ═══
 * Dashboard page: 7-element hierarchy
 * 1. KPIs  2. Trend  3. Status  4. Activity  5. Alerts  6. Filters  7. Actions
 */

const Overview = (() => {
  'use strict';

  function render() {
    const el = document.getElementById('pg-overview');
    const S = Orbit.state;
    const TD = Orbit.TD;

    const todayTasks = S.tasks.filter(t => t.date === TD);
    const todayDone = todayTasks.filter(t => t.done).length;
    const todayPending = todayTasks.length - todayDone;
    const goalPct = Math.round(S.goals.reduce((s, g) => s + Helpers.gpct(g), 0) / S.goals.length);
    const totalSaved = S.goals.filter(g => g.type === 'savings' || g.type === 'milestone').reduce((s, g) => s + g.current, 0);
    const pendingRem = S.reminders.filter(r => !r.done).length;
    const overdue = S.tasks.filter(t => t.date < TD && !t.done).length;
    const onTrack = S.goals.filter(g => Helpers.gpct(g) >= 50).length;
    const needsWork = S.goals.filter(g => Helpers.gpct(g) >= 20 && Helpers.gpct(g) < 50).length;

    el.innerHTML = `
      <!-- Header -->
      <div class="ov-header">
        <div class="ov-header-left"><h1>Overview</h1><p>${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
        <div class="ov-controls">
          <div class="ov-filter ${S.trendView === '6mo' ? 'active' : ''}" onclick="Overview.setTrend('6mo')"><i data-lucide="calendar"></i>6M</div>
          <div class="ov-filter ${S.trendView === '1yr' ? 'active' : ''}" onclick="Overview.setTrend('1yr')"><i data-lucide="calendar-range"></i>1Y</div>
          <button class="btn btn-primary" onclick="Tasks.newModal()"><i data-lucide="plus"></i>New Task</button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-icon" style="background:var(--accent-glow);color:var(--accent)"><i data-lucide="check-square"></i></div>
          <div class="kpi-label">Tasks Today</div>
          <div class="kpi-value" style="color:var(--accent)">${todayDone}/${todayTasks.length}</div>
          <div class="kpi-change ${todayPending === 0 ? 'up' : 'neutral'}"><i data-lucide="${todayPending === 0 ? 'check' : 'clock'}"></i>${todayPending} left</div>
        </div>
        <div class="kpi">
          <div class="kpi-icon" style="background:var(--violet-glow);color:var(--violet)"><i data-lucide="target"></i></div>
          <div class="kpi-label">Goal Progress</div>
          <div class="kpi-value">${goalPct}%</div>
          <div class="kpi-change up"><i data-lucide="trending-up"></i>+5% this month</div>
        </div>
        <div class="kpi">
          <div class="kpi-icon" style="background:var(--success-glow);color:var(--success)"><i data-lucide="piggy-bank"></i></div>
          <div class="kpi-label">Total Saved</div>
          <div class="kpi-value">RM ${Helpers.fm(totalSaved)}</div>
          <div class="kpi-change up"><i data-lucide="trending-up"></i>+RM 600</div>
        </div>
        <div class="kpi">
          <div class="kpi-icon" style="background:var(--gold-glow);color:var(--gold)"><i data-lucide="bell"></i></div>
          <div class="kpi-label">Reminders</div>
          <div class="kpi-value" style="color:var(--gold)">${pendingRem}</div>
          <div class="kpi-change neutral"><i data-lucide="clock"></i>pending</div>
        </div>
        <div class="kpi">
          <div class="kpi-icon" style="background:var(--danger-glow);color:var(--danger)"><i data-lucide="alert-triangle"></i></div>
          <div class="kpi-label">Attention</div>
          <div class="kpi-value" style="color:var(--danger)">${overdue}</div>
          <div class="kpi-change ${overdue ? 'down' : 'up'}"><i data-lucide="${overdue ? 'trending-down' : 'check'}"></i>${overdue ? 'overdue' : 'all clear'}</div>
        </div>
      </div>

      <!-- Trend + Status -->
      <div style="display:grid;grid-template-columns:1fr 260px;gap:12px;margin-bottom:14px">
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">Savings Trajectory</span>
            <div class="panel-tabs">
              <span class="panel-tab ${S.trendView === '6mo' ? 'active' : ''}" onclick="Overview.setTrend('6mo')">6M</span>
              <span class="panel-tab ${S.trendView === '1yr' ? 'active' : ''}" onclick="Overview.setTrend('1yr')">1Y</span>
            </div>
          </div>
          <div style="height:150px;position:relative"><canvas id="trendChart"></canvas></div>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Status</span></div>
          <div class="status-item"><div class="status-dot" style="background:var(--success)"></div><span class="status-label">On track</span><span class="status-val">${onTrack}</span></div>
          <div class="status-item"><div class="status-dot" style="background:var(--warning)"></div><span class="status-label">Needs work</span><span class="status-val">${needsWork}</span></div>
          <div class="status-item"><div class="status-dot" style="background:var(--danger)"></div><span class="status-label">Overdue</span><span class="status-val">${overdue}</span></div>
          <div style="border-top:1px solid var(--border-subtle);margin-top:8px;padding-top:8px">
            ${S.projects.map(p => {
              const tasks = S.tasks.filter(t => t.proj === p.id);
              const done = tasks.filter(t => t.done).length;
              return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px"><div style="width:5px;height:5px;border-radius:50%;background:var(--${p.color})"></div><span style="flex:1">${p.name}</span><span style="color:var(--text-tertiary)">${done}/${tasks.length}</span></div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Activity + Alerts -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Recent Activity</span><button class="btn btn-ghost btn-sm" onclick="Orbit.go('tasks')">View all</button></div>
          ${getActivity()}
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Alerts</span></div>
          ${getAlerts(overdue)}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-row" style="display:flex;gap:6px;padding-top:14px;border-top:1px solid var(--border-subtle);flex-wrap:wrap">
        <button class="btn" onclick="Tasks.newModal()"><i data-lucide="plus"></i>Task</button>
        <button class="btn" onclick="Reminders.newModal()"><i data-lucide="bell"></i>Reminder</button>
        <button class="btn" onclick="Orbit.go('goals')"><i data-lucide="target"></i>Goals</button>
        <button class="btn" onclick="Orbit.go('projects')"><i data-lucide="folder-kanban"></i>Projects</button>
        <button class="btn" onclick="Orbit.exportJSON()"><i data-lucide="download"></i>Export</button>
      </div>
    `;

    setTimeout(drawChart, 60);
  }

  function getActivity() {
    const items = [
      { icon: 'check-circle', bg: 'success', text: 'Pushed FinTrack changelog', time: '2h ago' },
      { icon: 'piggy-bank', bg: 'accent', text: 'Savings hit RM 7,800', time: 'Yesterday' },
      { icon: 'trophy', bg: 'violet', text: 'Godot learning plan completed', time: '2 days ago' },
      { icon: 'credit-card', bg: 'gold', text: 'Aseprite license (RM 47)', time: 'Jul 28' },
    ];
    return items.map(a =>
      `<div class="activity-item" style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-subtle)">
        <div style="width:26px;height:26px;border-radius:6px;display:grid;place-items:center;background:var(--${a.bg}-glow);color:var(--${a.bg});flex-shrink:0"><i data-lucide="${a.icon}" style="width:12px;height:12px"></i></div>
        <div><div style="font-size:11.5px;font-weight:500">${a.text}</div><div style="font-size:10px;color:var(--text-tertiary)">${a.time}</div></div>
      </div>`
    ).join('');
  }

  function getAlerts(overdue) {
    let html = '';
    if (overdue) html += `<div class="alert-item critical"><div style="color:var(--danger)"><i data-lucide="alert-circle" style="width:14px;height:14px"></i></div><span style="font-size:11.5px;font-weight:500;flex:1">${overdue} overdue task${overdue > 1 ? 's' : ''}</span><button class="btn-icon" onclick="Orbit.go('tasks')"><i data-lucide="arrow-right"></i></button></div>`;

    const nextRem = Orbit.state.reminders.find(r => !r.done);
    if (nextRem) html += `<div class="alert-item warning"><div style="color:var(--warning)"><i data-lucide="bell" style="width:14px;height:14px"></i></div><span style="font-size:11.5px;font-weight:500;flex:1">${nextRem.text}</span><span style="font-size:9.5px;color:var(--text-tertiary)">${Helpers.ftime(nextRem.dt)}</span></div>`;

    html += `<div class="alert-item info"><div style="color:var(--blue)"><i data-lucide="trending-up" style="width:14px;height:14px"></i></div><span style="font-size:11.5px;font-weight:500;flex:1">Emergency fund at 78%</span><span style="font-size:9.5px;color:var(--text-tertiary)">RM 2,200 left</span></div>`;
    return html;
  }

  function drawChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const S = Orbit.state;
    const labels = S.trendView === '6mo'
      ? ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
      : ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const data = S.trendView === '6mo'
      ? [4200, 5000, 5800, 6500, 7200, 7800]
      : [2200, 2800, 3200, 3600, 4200, 5000, 5800, 6500, 7000, 7200, 7500, 7800];

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Savings', data,
            borderColor: 'oklch(75% 0.14 185)',
            backgroundColor: 'oklch(75% 0.14 185 / 0.06)',
            fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6,
            pointBackgroundColor: 'oklch(75% 0.14 185)',
            pointBorderColor: 'oklch(15% 0.01 230)', pointBorderWidth: 2, borderWidth: 2.5
          },
          {
            label: 'Target', data: Array(labels.length).fill(10000),
            borderColor: 'oklch(44% 0.008 230)', borderDash: [4, 4],
            pointRadius: 0, borderWidth: 1, fill: false
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: true, position: 'top', align: 'end', labels: { color: 'oklch(55% 0.008 230)', font: { size: 10 }, boxWidth: 10 } },
          tooltip: { backgroundColor: 'oklch(20% 0.012 230)', borderColor: 'oklch(30% 0.01 230)', borderWidth: 1, cornerRadius: 6 }
        },
        scales: {
          x: { grid: { color: 'oklch(20% 0.006 230)' }, ticks: { color: 'oklch(44% 0.008 230)', font: { size: 10 } } },
          y: { grid: { color: 'oklch(20% 0.006 230)' }, ticks: { color: 'oklch(44% 0.008 230)', font: { size: 10 }, callback: v => `RM ${(v / 1000).toFixed(0)}k` }, min: 0, max: 12000 }
        }
      }
    });
  }

  function setTrend(view) {
    Orbit.state.trendView = view;
    Orbit.save();
    render();
    lucide.createIcons();
  }

  return { render, setTrend };
})();