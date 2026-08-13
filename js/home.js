// js/home.js — Home dashboard, AI brief, timeline, warnings

var Home = {
  render: function() {
    var S = DB.store;
    var active = S.tasks.filter(function(t) { return t.status === 'active'; });
    var today = DB.todayKey();
    var todayT = active.filter(function(t) { return t.due && DB.dateKey(new Date(t.due)) === today; });
    var overdue = active.filter(function(t) { return DB.daysBetween(t.due) < 0; });
    var events = S.events.filter(function(e) { return DB.dateKey(new Date(e.date)) === today; });
    var hDone = S.habits.filter(function(h) { return S.habitLogs[h.id + '_' + today]; }).length;
    var pri = overdue.concat(todayT.filter(function(t) { return overdue.indexOf(t) === -1; })).slice(0, 5);

    // Timeline
    var tl = [];
    events.filter(function(e) { return e.time; }).forEach(function(e) { tl.push({ time: e.time, title: e.title, sub: e.location || 'Event' }); });
    todayT.forEach(function(t) { tl.push({ time: '—', title: t.title, sub: t.cat || 'Task' }); });
    S.reminders.filter(function(r) { return !r.done && r.date && DB.dateKey(new Date(r.date)) === today; }).forEach(function(r) { tl.push({ time: r.time || '—', title: r.title, sub: '🔔 Reminder' }); });
    tl.sort(function(a, b) { return (a.time || 'zz').localeCompare(b.time || 'zz'); });

    // AI Brief
    var brief = '';
    if (overdue.length) brief += overdue.length + ' overdue. ';
    if (todayT.length) brief += todayT.length + ' tasks today. ';
    if (events.length) brief += events.length + ' event' + (events.length > 1 ? 's' : '') + '. ';
    if (!brief) brief = 'Clear day.';

    // Warnings
    var warnings = [];
    if (overdue.length) warnings.push(overdue.length + ' overdue task' + (overdue.length > 1 ? 's' : ''));
    var expDocs = S.documents.filter(function(d) { var db = DB.daysBetween(d.expiry); return db >= 0 && db <= 90; });
    if (expDocs.length) warnings.push(expDocs.length + ' document' + (expDocs.length > 1 ? 's' : '') + ' expiring soon');

    var html = '<h1>' + App.greeting() + ', ' + DB.esc(S.settings.name) + '.</h1>';
    html += '<p class="sub">' + todayT.length + ' tasks today' + (overdue.length ? ', ' + overdue.length + ' overdue' : '') + '</p>';
    html += '<div class="ai"><div class="ai-l">✨ AI Brief</div><div class="ai-t">' + brief + '</div></div>';
    warnings.forEach(function(w) { html += '<div class="warn">' + w + '</div>'; });
    html += '<div class="grid"><div class="card"><div class="card-v">' + todayT.length + '</div><div class="card-l">Tasks Today</div></div><div class="card"><div class="card-v">' + overdue.length + '</div><div class="card-l">Overdue</div></div><div class="card"><div class="card-v">' + events.length + '</div><div class="card-l">Events</div></div><div class="card"><div class="card-v">' + hDone + '/' + S.habits.length + '</div><div class="card-l">Habits</div></div></div>';

    if (tl.length) {
      html += '<div class="sec">Timeline</div><div class="timeline">';
      tl.forEach(function(i) { html += '<div class="tl"><div class="tl-time">' + i.time + '</div><div class="tl-title">' + DB.esc(i.title) + '</div><div class="tl-sub">' + DB.esc(i.sub) + '</div></div>'; });
      html += '</div>';
    }

    if (pri.length) {
      html += '<div class="sec">Priority</div>';
      pri.forEach(function(t) { html += Tasks.taskRow(t); });
    }

    html += '<div class="sec">Quick Capture</div><div class="qa"><div class="qa-btn" onclick="Tasks.openSmartCapture()"><span class="qa-ic">✨</span>Smart</div><div class="qa-btn" onclick="Tasks.openForm()"><span class="qa-ic">✓</span>Task</div><div class="qa-btn" onclick="Notes.openForm()"><span class="qa-ic">📝</span>Note</div></div>';

    document.getElementById('pg-home').innerHTML = html;
  }
};
