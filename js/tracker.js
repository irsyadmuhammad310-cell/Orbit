// js/tracker.js — Goals + Habits (merged) + Habit Analytics
// Batch 6: Added Life Areas, habit analytics, goal-habit linking

var Goals = {
  render: function() {
    var goals = DB.getAll('goals');
    document.getElementById('pg-goals').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Goals</div><div class="pg-btn" onclick="Goals.openForm()">+</div></div>' +
      (goals.length ? goals.map(function(g) {
        return '<div class="goal" onclick="Goals.view(\'' + g.id + '\')"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:18px">' + (g.emoji||'🎯') + '</span><span style="font-size:14px;font-weight:700;flex:1">' + DB.esc(g.name) + '</span><span style="font-size:11px;color:var(--text3)">' + (g.deadline||'') + '</span></div>' + (g.lifeArea ? '<span class="badge b-b" style="margin-bottom:8px">' + g.lifeArea + '</span>' : '') + '<div class="bar"><div class="fill" style="width:' + g.progress + '%;background:var(--accent)"></div></div><div class="proj-s"><b>' + g.progress + '%</b></div></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">🎯</div>Set a goal</div>');
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Goal</div><div class="fg"><label class="fl">Goal</label><input class="fi" id="gn" placeholder="Learn Mandarin"></div><div class="fr"><div class="fg"><label class="fl">Emoji</label><input class="fi" id="ge" placeholder="🎯"></div><div class="fg"><label class="fl">Deadline</label><input class="fi" id="gd" placeholder="Dec 2026"></div></div><div class="fg"><label class="fl">Life Area</label><select class="fs" id="gla"><option value="">None</option><option>Career</option><option>Finance</option><option>Health</option><option>Learning</option><option>Relationships</option><option>Personal</option></select></div><button class="btn" onclick="Goals.saveNew()">Create</button>');
  },

  saveNew: function() {
    var n = document.getElementById('gn').value.trim();
    if (!vReq(n, 'Enter goal')) return;
    DB.add('goals', { name: n, emoji: document.getElementById('ge').value || '🎯', progress: 0, deadline: document.getElementById('gd').value, lifeArea: document.getElementById('gla').value });
    closeSheet(); toast('Created'); this.render();
  },

  view: function(id) {
    var g = DB.get('goals', id); if (!g) return;
    openSheet('<div class="sheet-title">Goal</div><div class="fg"><label class="fl">Goal</label><input class="fi" id="ggn" value="' + DB.esc(g.name) + '"></div><div class="fg"><label class="fl">Life Area</label><select class="fs" id="ggla"><option value="">None</option><option' + (g.lifeArea==='Career'?' selected':'') + '>Career</option><option' + (g.lifeArea==='Finance'?' selected':'') + '>Finance</option><option' + (g.lifeArea==='Health'?' selected':'') + '>Health</option><option' + (g.lifeArea==='Learning'?' selected':'') + '>Learning</option><option' + (g.lifeArea==='Relationships'?' selected':'') + '>Relationships</option><option' + (g.lifeArea==='Personal'?' selected':'') + '>Personal</option></select></div><div class="fg"><label class="fl">Progress: ' + g.progress + '%</label><input type="range" id="ggp" min="0" max="100" value="' + g.progress + '" style="width:100%"></div><div class="btn-row"><button class="btn" onclick="Goals.saveEdit(\'' + g.id + '\')">Save</button><button class="btn btn-red" onclick="Goals.del(\'' + g.id + '\')">Delete</button></div>');
  },

  saveEdit: function(id) {
    var g = DB.get('goals', id); if (!g) return;
    g.name = document.getElementById('ggn').value.trim() || g.name;
    g.progress = parseInt(document.getElementById('ggp').value) || 0;
    g.lifeArea = document.getElementById('ggla').value;
    DB.save(); closeSheet(); toast('Updated'); this.render();
  },

  del: function(id) {
    if (!confirm('Delete goal?')) return;
    DB.remove('goals', id); closeSheet(); toast('Deleted'); this.render();
  }
};

var Habits = {
  render: function() {
    var today = DB.todayKey();
    var habits = DB.getAll('habits');
    document.getElementById('pg-habits').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Habits</div><div style="display:flex;gap:4px"><button class="pg-btn" style="font-size:14px" onclick="Habits.showAnalytics()">📊</button><button class="pg-btn" onclick="Habits.openForm()">+</button></div></div>' +
      (habits.length ? habits.map(function(h) {
        var done = !!DB.store.habitLogs[h.id + '_' + today];
        var str = Habits.getStreak(h.id);
        var cells = '';
        for (var i = 20; i >= 0; i--) { var dd = new Date(); dd.setDate(dd.getDate()-i); cells += '<div class="hcell' + (DB.store.habitLogs[h.id+'_'+DB.dateKey(dd)] ? ' on' : '') + '"></div>'; }
        return '<div class="hab"><div class="hchk' + (done?' done':'') + '" onclick="Habits.toggle(\'' + h.id + '\')">✓</div><div class="hn">' + h.icon + ' ' + DB.esc(h.name) + '</div><div class="hs">' + (str>0?'🔥 '+str:'—') + '</div><div class="hgrid">' + cells + '</div><button style="border:none;background:none;color:var(--text3);font-size:14px;padding:4px;cursor:pointer" onclick="event.stopPropagation();Habits.del(\'' + h.id + '\')">✕</button></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">🔥</div>Add a habit</div>');
  },

  toggle: function(id) {
    var k = id + '_' + DB.todayKey();
    if (DB.store.habitLogs[k]) delete DB.store.habitLogs[k];
    else DB.store.habitLogs[k] = true;
    DB.save(); toast(DB.store.habitLogs[k] ? 'Done!' : 'Unmarked'); this.render();
  },

  getStreak: function(hid) {
    var s = 0, d = new Date();
    // Start counting from yesterday if today isn't logged yet
    if (!DB.store.habitLogs[hid + '_' + DB.dateKey(d)]) {
      d.setDate(d.getDate() - 1);
    }
    while (DB.store.habitLogs[hid + '_' + DB.dateKey(d)]) { s++; d.setDate(d.getDate() - 1); }
    return s;
  },

  getLongestStreak: function(hid) {
    var longest = 0, current = 0;
    for (var i = 90; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate()-i);
      if (DB.store.habitLogs[hid + '_' + DB.dateKey(d)]) { current++; if (current > longest) longest = current; }
      else current = 0;
    }
    return longest;
  },

  getCompletionRate: function(hid, days) {
    var done = 0;
    for (var i = 0; i < days; i++) { var d = new Date(); d.setDate(d.getDate()-i); if (DB.store.habitLogs[hid + '_' + DB.dateKey(d)]) done++; }
    return Math.round(done / days * 100);
  },

  getBestDay: function(hid) {
    var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var counts = [0,0,0,0,0,0,0];
    for (var i = 0; i < 30; i++) { var d = new Date(); d.setDate(d.getDate()-i); if (DB.store.habitLogs[hid + '_' + DB.dateKey(d)]) counts[d.getDay()]++; }
    var max = Math.max.apply(null, counts);
    return max > 0 ? dayNames[counts.indexOf(max)] : 'N/A';
  },

  // Batch 6 Task 46: Habit Analytics
  showAnalytics: function() {
    var habits = DB.getAll('habits');
    var html = '<div class="sheet-title">Habit Analytics</div>';
    if (!habits.length) { openSheet(html + '<div class="empty">No habits to analyze</div>'); return; }
    habits.forEach(function(h) {
      var streak = Habits.getStreak(h.id);
      var longest = Habits.getLongestStreak(h.id);
      var rate7 = Habits.getCompletionRate(h.id, 7);
      var rate30 = Habits.getCompletionRate(h.id, 30);
      var bestDay = Habits.getBestDay(h.id);
      html += '<div class="card" style="margin-bottom:10px"><div style="font-size:14px;font-weight:700;margin-bottom:8px">' + h.icon + ' ' + DB.esc(h.name) + '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px">' +
        '<div><div style="font-weight:700;font-size:16px">' + streak + '</div><div style="color:var(--text3)">Current streak</div></div>' +
        '<div><div style="font-weight:700;font-size:16px">' + longest + '</div><div style="color:var(--text3)">Longest</div></div>' +
        '<div><div style="font-weight:700;font-size:16px">' + bestDay + '</div><div style="color:var(--text3)">Best day</div></div>' +
        '</div><div style="margin-top:8px;display:flex;gap:12px;font-size:12px;color:var(--text2)"><span>7d: <b>' + rate7 + '%</b></span><span>30d: <b>' + rate30 + '%</b></span></div></div>';
    });
    openSheet(html);
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Habit</div><div class="fg"><label class="fl">Name</label><input class="fi" id="hn" placeholder="Meditate"></div><div class="fr"><div class="fg"><label class="fl">Icon</label><input class="fi" id="hi" placeholder="⭐"></div><div class="fg"><label class="fl">Life Area</label><select class="fs" id="hla"><option value="">None</option><option>Health</option><option>Learning</option><option>Career</option><option>Personal</option></select></div></div><button class="btn" onclick="Habits.saveNew()">Add</button>');
  },

  saveNew: function() {
    var n = document.getElementById('hn').value.trim();
    if (!vReq(n, 'Enter name')) return;
    DB.add('habits', { name: n, icon: document.getElementById('hi').value || '⭐', lifeArea: document.getElementById('hla').value });
    closeSheet(); toast('Added'); this.render();
  },

  del: function(id) {
    if (!confirm('Delete this habit?')) return;
    DB.remove('habits', id);
    // Clean up habit logs for this habit
    Object.keys(DB.store.habitLogs).forEach(function(k) { if (k.startsWith(id + '_')) delete DB.store.habitLogs[k]; });
    DB.save(); toast('Deleted'); this.render();
  }
};
