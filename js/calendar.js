// js/calendar.js — Monthly calendar view with events sidebar

var Calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('page-calendar');
    const monthName = new Date(this.currentYear, this.currentMonth).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Calendar</h1>
          <p class="page-subtitle">${monthName}</p>
        </div>
      </div>

      <div class="calendar-layout">
        <div class="cal-grid-wrapper">
          <div class="cal-header">
            <div class="cal-month">${monthName}</div>
            <div class="cal-nav">
              <button class="cal-nav-btn" onclick="Calendar.prevMonth()">‹</button>
              <button class="cal-nav-btn" onclick="Calendar.nextMonth()">›</button>
            </div>
          </div>
          <div class="cal-weekdays">
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="cal-weekday">${d}</div>`).join('')}
          </div>
          <div class="cal-days">
            ${this.generateDays()}
          </div>
        </div>

        <div class="cal-sidebar">
          ${this.renderTodayEvents()}
        </div>
      </div>
    `;
  },

  generateDays() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    let startDay = firstDay.getDay() || 7; // Monday = 1
    const today = new Date();
    const tasks = DB.getAll(DB.KEYS.TASKS);
    const events = DB.getAll(DB.KEYS.EVENTS);

    let html = '';

    // Previous month padding
    const prevLast = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDay - 1; i > 0; i--) {
      html += `<div class="cal-day other-month">${prevLast - i + 1}</div>`;
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const isToday = date.toDateString() === today.toDateString() ? 'today' : '';

      // Check for tasks/events on this day
      const dayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === date.toDateString();
      });

      const dots = dayTasks.length > 0
        ? `<div class="cal-day-dots">${dayTasks.slice(0, 3).map(t => {
            const color = isToday ? 'white' : (t.priority === 'high' ? 'var(--red)' : t.priority === 'medium' ? 'var(--orange)' : 'var(--blue)');
            return `<div class="cal-day-dot" style="background:${color}"></div>`;
          }).join('')}</div>`
        : '';

      html += `<div class="cal-day ${isToday}">${d}${dots}</div>`;
    }

    return html;
  },

  renderTodayEvents() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const tasks = DB.getAll(DB.KEYS.TASKS).filter(t => !t.completed);
    const todayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString());
    const tomorrowTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === tomorrow.toDateString());

    const eventColors = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--blue)' };

    let html = `<div class="cal-sidebar-title">Today, ${today.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</div>`;

    if (todayTasks.length === 0) {
      html += '<p style="font-size:0.8rem;color:var(--text-tertiary)">Nothing scheduled</p>';
    } else {
      todayTasks.forEach(t => {
        html += `
          <div class="cal-event" style="border-left-color:${eventColors[t.priority] || 'var(--accent)'}">
            <div class="cal-event-name">${t.name}</div>
            <div class="cal-event-tag">${t.project || 'Personal'}</div>
          </div>
        `;
      });
    }

    if (tomorrowTasks.length > 0) {
      html += `<div class="cal-sidebar-title" style="margin-top:16px">Tomorrow</div>`;
      tomorrowTasks.forEach(t => {
        html += `
          <div class="cal-event" style="border-left-color:${eventColors[t.priority] || 'var(--accent)'}">
            <div class="cal-event-name">${t.name}</div>
            <div class="cal-event-tag">${t.project || 'Personal'}</div>
          </div>
        `;
      });
    }

    return html;
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
    this.render();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
    this.render();
  },
};
