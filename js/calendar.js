// js/calendar.js — Calendar grid, month navigation, events CRUD

var Calendar = {
  render: function() {
    var mn = new Date(App.calYear, App.calMonth).toLocaleDateString('en-MY', { month:'long', year:'numeric' });
    var first = new Date(App.calYear, App.calMonth, 1);
    var last = new Date(App.calYear, App.calMonth+1, 0);
    var startDay = first.getDay() || 7;
    var prevLast = new Date(App.calYear, App.calMonth, 0).getDate();

    var html = '<div class="pg-h"><div class="pg-t">' + mn + '</div><div style="display:flex;gap:4px"><button class="pg-btn" onclick="Calendar.prev()">‹</button><button class="pg-btn" onclick="Calendar.next()">›</button><button class="pg-btn" onclick="Calendar.openForm()">+</button></div></div>';
    html += '<div class="cal-wk"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div class="cal-grid">';

    for (var i = startDay-1; i > 0; i--) html += '<div class="cal-d other">' + (prevLast-i+1) + '</div>';
    for (var d = 1; d <= last.getDate(); d++) {
      var dt = new Date(App.calYear, App.calMonth, d);
      var dk = DB.dateKey(dt);
      var isT = dk === DB.todayKey();
      var isS = d === App.calSelDay;
      var hasT = DB.getAll('tasks').some(function(t) { return t.due && t.status==='active' && DB.dateKey(new Date(t.due))===dk; });
      var hasE = DB.getAll('events').some(function(e) { return DB.dateKey(new Date(e.date))===dk; });
      var dots = '';
      if (hasT || hasE) {
        dots = '<div class="cal-dots">';
        if (hasT) dots += '<div class="cal-dot" style="background:' + (isT?'#fff':'var(--orange)') + '"></div>';
        if (hasE) dots += '<div class="cal-dot" style="background:' + (isT?'#fff':'var(--blue)') + '"></div>';
        dots += '</div>';
      }
      html += '<div class="cal-d' + (isT?' today':'') + (isS&&!isT?' sel':'') + '" onclick="App.calSelDay=' + d + ';Calendar.render()">' + d + dots + '</div>';
    }
    html += '</div>';

    // Day events
    var selDate = new Date(App.calYear, App.calMonth, App.calSelDay);
    var selDK = DB.dateKey(selDate);
    var ev = DB.getAll('events').filter(function(e) { return DB.dateKey(new Date(e.date))===selDK; });
    var tk = DB.getAll('tasks').filter(function(t) { return t.due && t.status==='active' && DB.dateKey(new Date(t.due))===selDK; });
    html += '<div class="sec">' + selDate.toLocaleDateString('en-MY', { weekday:'long', day:'numeric', month:'short' }) + '</div>';
    if (!ev.length && !tk.length) html += '<div class="empty">Nothing scheduled</div>';
    ev.forEach(function(e) { html += '<div class="cev" onclick="Calendar.view(\'' + e.id + '\')"><div class="cev-t">' + (e.time||'—') + '</div><div class="cev-bar" style="background:' + (e.color||'var(--accent)') + '"></div><div><div class="cev-name">' + DB.esc(e.title) + '</div><div class="cev-sub">' + DB.esc(e.location||'') + '</div></div></div>'; });
    tk.forEach(function(t) { html += '<div class="cev" onclick="Tasks.view(\'' + t.id + '\')"><div class="cev-t" style="color:' + DB.priColor(t.pri) + '">●</div><div class="cev-bar" style="background:' + DB.priColor(t.pri) + '"></div><div><div class="cev-name">' + DB.esc(t.title) + '</div><div class="cev-sub">' + (t.cat||'') + '</div></div></div>'; });

    document.getElementById('pg-calendar').innerHTML = html;
  },

  prev: function() { App.calMonth--; if (App.calMonth<0) { App.calMonth=11; App.calYear--; } App.calSelDay=1; this.render(); },
  next: function() { App.calMonth++; if (App.calMonth>11) { App.calMonth=0; App.calYear++; } App.calSelDay=1; this.render(); },

  openForm: function() {
    openSheet('<div class="sheet-title">New Event</div><div class="fg"><label class="fl">Title</label><input class="fi" id="et" placeholder="Event"></div><div class="fg"><label class="fl">Date</label><input class="fi" id="ed" type="date"></div><div class="fr"><div class="fg"><label class="fl">Start</label><input class="fi" id="es" type="time"></div><div class="fg"><label class="fl">End</label><input class="fi" id="ee" type="time"></div></div><div class="fg"><label class="fl">Location</label><input class="fi" id="el" placeholder="Optional"></div><button class="btn" onclick="Calendar.saveNew()">Add</button>');
  },

  saveNew: function() {
    var v = document.getElementById('et').value.trim();
    if (!vReq(v, 'Enter name')) return;
    var colors = ['#3b82f6','#22c55e','#f59e0b','#a855f7'];
    DB.add('events', { title: v, date: document.getElementById('ed').value ? new Date(document.getElementById('ed').value+'T12:00:00').toISOString() : new Date().toISOString(), time: document.getElementById('es').value, endTime: document.getElementById('ee').value, location: document.getElementById('el').value.trim(), color: colors[Math.floor(Math.random()*colors.length)] });
    closeSheet(); toast('Event added'); App.render(App.currentPage);
  },

  view: function(id) {
    var e = DB.get('events', id);
    if (!e) return;
    openSheet('<div class="sheet-title">Event</div><div class="fg"><label class="fl">Title</label><input class="fi" id="eet" value="' + DB.esc(e.title) + '"></div><div class="fg"><label class="fl">Date</label><input class="fi" id="eed" type="date" value="' + (e.date?e.date.split('T')[0]:'') + '"></div><div class="fr"><div class="fg"><label class="fl">Start</label><input class="fi" id="ees" type="time" value="' + (e.time||'') + '"></div><div class="fg"><label class="fl">End</label><input class="fi" id="eee" type="time" value="' + (e.endTime||'') + '"></div></div><div class="fg"><label class="fl">Location</label><input class="fi" id="eel" value="' + DB.esc(e.location||'') + '"></div><div class="btn-row"><button class="btn" onclick="Calendar.saveEdit(\'' + e.id + '\')">Save</button><button class="btn btn-red" onclick="Calendar.del(\'' + e.id + '\')">Delete</button></div>');
  },

  saveEdit: function(id) {
    var e = DB.get('events', id);
    if (!e) return;
    var v = document.getElementById('eet').value.trim();
    if (!vReq(v, 'Title needed')) return;
    e.title = v;
    var dv = document.getElementById('eed').value;
    if (dv) e.date = new Date(dv+'T12:00:00').toISOString();
    e.time = document.getElementById('ees').value;
    e.endTime = document.getElementById('eee').value;
    e.location = document.getElementById('eel').value.trim();
    DB.save(); closeSheet(); toast('Updated'); App.render(App.currentPage);
  },

  del: function(id) {
    if (!confirm('Delete?')) return;
    DB.remove('events', id); closeSheet(); toast('Deleted'); App.render(App.currentPage);
  }
};
