/* ═══ ORBIT — CALENDAR.JS ═══
 * Full calendar page + mini widget
 */

const Calendar = (() => {
  'use strict';

  function render() {
    const el = document.getElementById('pg-calendar');
    const S = Orbit.state;
    const TD = Orbit.TD;
    const yr = S.calYear, mo = S.calMonth;
    const monthName = new Date(yr, mo).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const selTasks = S.tasks.filter(t => t.date === S.selectedDate);
    const selRems = S.reminders.filter(r => r.dt.startsWith(S.selectedDate));

    el.innerHTML = `
      <div class="pg-header">
        <div><div class="pg-title">Calendar</div><div class="pg-sub">${monthName}</div></div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="Calendar.goToday()">Today</button>
          <button class="btn btn-primary" onclick="Tasks.newModal('${S.selectedDate}')"><i data-lucide="plus"></i>Add</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 280px;gap:16px">
        <div class="panel">
          <div class="cal-head">
            <span class="cal-month">${monthName}</span>
            <div style="display:flex;gap:2px">
              <button class="btn-icon" onclick="Calendar.prev()"><i data-lucide="chevron-left"></i></button>
              <button class="btn-icon" onclick="Calendar.next()"><i data-lucide="chevron-right"></i></button>
            </div>
          </div>
          <div class="cal-grid">
            <div class="cal-dow">Sun</div><div class="cal-dow">Mon</div><div class="cal-dow">Tue</div>
            <div class="cal-dow">Wed</div><div class="cal-dow">Thu</div><div class="cal-dow">Fri</div><div class="cal-dow">Sat</div>
            ${buildCells(yr, mo)}
          </div>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;margin-bottom:10px">
            ${S.selectedDate === TD ? 'Today' : Helpers.fdf(S.selectedDate)}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px">
            ${selTasks.map(t => Tasks.taskEl(t)).join('') || '<p style="font-size:11px;color:var(--text-tertiary)">No tasks</p>'}
          </div>
          ${selRems.length ? `
            <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin:10px 0 6px">Reminders</div>
            ${selRems.map(r => `<div style="display:flex;align-items:center;gap:7px;padding:5px 0;font-size:11px;border-bottom:1px solid var(--border-subtle)"><div style="width:4px;height:4px;border-radius:50%;background:var(--gold)"></div><span style="flex:1">${r.text}</span><span style="font-size:9.5px;color:var(--text-tertiary)">${Helpers.ftime(r.dt)}</span></div>`).join('')}
          ` : ''}
          <div style="display:flex;gap:6px;margin-top:10px">
            <button class="btn btn-sm" onclick="Tasks.newModal('${S.selectedDate}')"><i data-lucide="plus"></i>Task</button>
            <button class="btn btn-sm" onclick="Reminders.newModal('${S.selectedDate}')"><i data-lucide="bell"></i>Remind</button>
          </div>
        </div>
      </div>
    `;
  }

  function buildCells(yr, mo) {
    const S = Orbit.state;
    const TD = Orbit.TD;
    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const prevDays = new Date(yr, mo, 0).getDate();
    let html = '';

    // Previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="cal-day muted">${prevDays - i}</div>`;
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasItems = S.tasks.some(t => t.date === ds && !t.done);
      const isToday = ds === TD;
      const isSelected = ds === S.selectedDate;
      html += `<div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasItems ? 'has-items' : ''}" onclick="Calendar.select('${ds}')">${d}</div>`;
    }
    // Next month fill
    const remaining = 42 - (firstDay + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="cal-day muted">${i}</div>`;
    }
    return html;
  }

  // Mini calendar widget for Tasks sidebar
  function widgetEl() {
    const S = Orbit.state;
    const yr = S.calYear, mo = S.calMonth;
    const monthName = new Date(yr, mo).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const TD = Orbit.TD;

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="cal-day muted"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasItems = S.tasks.some(t => t.date === ds && !t.done);
      const isToday = ds === TD;
      cells += `<div class="cal-day ${isToday ? 'today' : ''} ${hasItems ? 'has-items' : ''}" onclick="Orbit.go('calendar');Calendar.select('${ds}')">${d}</div>`;
    }

    return `
      <div class="cal-widget">
        <div class="cal-head"><span class="cal-month">${monthName}</span></div>
        <div class="cal-grid">
          <div class="cal-dow">S</div><div class="cal-dow">M</div><div class="cal-dow">T</div>
          <div class="cal-dow">W</div><div class="cal-dow">T</div><div class="cal-dow">F</div><div class="cal-dow">S</div>
          ${cells}
        </div>
      </div>
    `;
  }

  function select(date) {
    Orbit.state.selectedDate = date;
    Orbit.save();
    render();
    lucide.createIcons();
  }

  function prev() {
    Orbit.state.calMonth--;
    if (Orbit.state.calMonth < 0) { Orbit.state.calMonth = 11; Orbit.state.calYear--; }
    Orbit.save(); render(); lucide.createIcons();
  }

  function next() {
    Orbit.state.calMonth++;
    if (Orbit.state.calMonth > 11) { Orbit.state.calMonth = 0; Orbit.state.calYear++; }
    Orbit.save(); render(); lucide.createIcons();
  }

  function goToday() {
    Orbit.state.calMonth = Orbit.TODAY.getMonth();
    Orbit.state.calYear = Orbit.TODAY.getFullYear();
    Orbit.state.selectedDate = Orbit.TD;
    Orbit.save(); render(); lucide.createIcons();
  }

  return { render, widgetEl, select, prev, next, goToday };
})();
