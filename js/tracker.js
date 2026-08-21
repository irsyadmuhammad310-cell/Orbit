// js/tracker.js — Goals + Habits (merged) + Habit Analytics
// V1.5.1: Improved goals (milestones, linked habits), improved habits (frequency, streaks)

var Goals = {
  render: function() {
    var goals = DB.getAll('goals');
    var active = goals.filter(function(g) { return !g.completed; });
    var completed = goals.filter(function(g) { return g.completed; });
    document.getElementById('pg-goals').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Goals</div><div class="pg-btn" onclick="Goals.openForm()">+</div></div>' +
      (active.length ? '<div class="sec">Active (' + active.length + ')</div>' + active.map(function(g) {
        var pct = g.progress || 0;
        var color = pct >= 75 ? 'var(--green)' : pct >= 40 ? 'var(--orange)' : 'var(--accent)';
        return '<div class="goal" onclick="Goals.view(\'' + g.id + '\')"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-size:22px">' + (g.emoji||'🎯') + '</span><div style="flex:1"><div style="font-size:14px;font-weight:700">' + DB.esc(g.name) + '</div><div style="font-size:11px;color:var(--text3)">' + (g.lifeArea||'') + (g.deadline ? ' · Due ' + g.deadline : '') + '</div></div><div style="font-size:18px;font-weight:800;color:' + color + '">' + pct + '%</div></div><div class="bar"><div class="fill" style="width:' + pct + '%;background:' + color + '"></div></div>' + (g.milestones && g.milestones.length ? '<div style="margin-top:6px;font-size:10px;color:var(--text3)">' + g.milestones.filter(function(m){return m.done;}).length + '/' + g.milestones.length + ' milestones</div>' : '') + '</div>';
      }).join('') : '<div class="empty"><div class="empty-ic">🎯</div>Set a goal to get started</div>') +
      (completed.length ? '<div class="sec">Completed (' + completed.length + ')</div>' + completed.map(function(g) {
        return '<div class="goal" style="opacity:.6" onclick="Goals.view(\'' + g.id + '\')"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">✅</span><div style="flex:1;font-size:13px;font-weight:600">' + DB.esc(g.name) + '</div></div></div>';
      }).join('') : '');
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Goal</div><div class="fg"><label class="fl">Goal name</label><input class="fi" id="gn" placeholder="Learn Mandarin B1"></div><div class="fr"><div class="fg"><label class="fl">Emoji</label><input class="fi" id="ge" placeholder="🎯" style="text-align:center"></div><div class="fg"><label class="fl">Deadline</label><input class="fi" id="gd" placeholder="Dec 2026"></div></div><div class="fg"><label class="fl">Life Area</label><select class="fs" id="gla"><option value="">None</option><option>Career</option><option>Finance</option><option>Health</option><option>Learning</option><option>Relationships</option><option>Personal</option></select></div><div class="fg"><label class="fl">Milestones (one per line)</label><textarea class="ft" id="gms" placeholder="Step 1: Complete course\nStep 2: Pass exam"></textarea></div><button class="btn" onclick="Goals.saveNew()">Create Goal</button>');
  },

  saveNew: function() {
    var n = document.getElementById('gn').value.trim();
    if (!vReq(n, 'Enter goal')) return;
    var msText = document.getElementById('gms').value.trim();
    var milestones = msText ? msText.split('\n').filter(function(l){return l.trim();}).map(function(l,i){ return {id:'ms_'+i,text:l.trim(),done:false}; }) : [];
    DB.add('goals', { name: n, emoji: document.getElementById('ge').value || '🎯', progress: 0, deadline: document.getElementById('gd').value, lifeArea: document.getElementById('gla').value, milestones: milestones, completed: false, notes: '' });
    closeSheet(); toast('Goal created'); this.render();
  },

  view: function(id) {
    var g = DB.get('goals', id); if (!g) return;
    if (!g.milestones) g.milestones = [];
    var msHtml = g.milestones.length ? '<div class="sec">Milestones</div>' + g.milestones.map(function(m,i) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><div class="tchk' + (m.done?' done':'') + '" onclick="Goals.toggleMs(\'' + g.id + '\',' + i + ')">✓</div><span style="font-size:13px;' + (m.done?'text-decoration:line-through;color:var(--text3)':'') + '">' + DB.esc(m.text) + '</span></div>';
    }).join('') : '';

    openSheet('<div class="sheet-title">' + (g.emoji||'🎯') + ' ' + DB.esc(g.name) + '</div>' +
      '<div class="fg"><label class="fl">Progress: ' + (g.progress||0) + '%</label><input type="range" id="ggp" min="0" max="100" value="' + (g.progress||0) + '" style="width:100%"></div>' +
      '<div class="fg"><label class="fl">Name</label><input class="fi" id="ggn" value="' + DB.esc(g.name) + '"></div>' +
      '<div class="fg"><label class="fl">Life Area</label><select class="fs" id="ggla"><option value="">None</option><option' + (g.lifeArea==='Career'?' selected':'') + '>Career</option><option' + (g.lifeArea==='Finance'?' selected':'') + '>Finance</option><option' + (g.lifeArea==='Health'?' selected':'') + '>Health</option><option' + (g.lifeArea==='Learning'?' selected':'') + '>Learning</option><option' + (g.lifeArea==='Relationships'?' selected':'') + '>Relationships</option><option' + (g.lifeArea==='Personal'?' selected':'') + '>Personal</option></select></div>' +
      '<div class="fg"><label class="fl">Notes</label><textarea class="ft" id="ggno">' + DB.esc(g.notes||'') + '</textarea></div>' +
      msHtml +
      '<div class="btn-row" style="margin-top:14px"><button class="btn" onclick="Goals.saveEdit(\'' + g.id + '\')">Save</button><button class="btn btn-ghost" onclick="Goals.markComplete(\'' + g.id + '\')">' + (g.completed?'Reopen':'Complete') + '</button><button class="btn btn-red" onclick="Goals.del(\'' + g.id + '\')">Delete</button></div>');
  },

  toggleMs: function(goalId, idx) {
    var g = DB.get('goals', goalId); if (!g || !g.milestones[idx]) return;
    g.milestones[idx].done = !g.milestones[idx].done;
    // Auto-update progress based on milestones
    var total = g.milestones.length;
    var doneCount = g.milestones.filter(function(m){return m.done;}).length;
    g.progress = Math.round(doneCount/total*100);
    DB.save(); closeSheet(); this.view(goalId);
  },

  markComplete: function(id) {
    var g = DB.get('goals', id); if (!g) return;
    g.completed = !g.completed;
    if (g.completed) g.progress = 100;
    DB.save(); closeSheet(); toast(g.completed?'Goal completed! 🎉':'Reopened'); this.render();
  },

  saveEdit: function(id) {
    var g = DB.get('goals', id); if (!g) return;
    g.name = document.getElementById('ggn').value.trim() || g.name;
    g.progress = parseInt(document.getElementById('ggp').value) || 0;
    g.lifeArea = document.getElementById('ggla').value;
    g.notes = document.getElementById('ggno').value.trim();
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
    var totalToday = habits.length;
    var doneToday = habits.filter(function(h) { return !!DB.store.habitLogs[h.id + '_' + today]; }).length;

    document.getElementById('pg-habits').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Habits</div><div style="display:flex;gap:4px"><button class="pg-btn" style="font-size:14px" onclick="Habits.showAnalytics()">📊</button><button class="pg-btn" onclick="Habits.openForm()">+</button></div></div>' +
      (totalToday ? '<div class="card" style="text-align:center;margin-bottom:14px"><div style="font-size:24px;font-weight:800;color:' + (doneToday===totalToday?'var(--green)':'var(--accent)') + '">' + doneToday + '/' + totalToday + '</div><div style="font-size:11px;color:var(--text3)">completed today</div></div>' : '') +
      (habits.length ? habits.map(function(h) {
        var done = !!DB.store.habitLogs[h.id + '_' + today];
        var str = Habits.getStreak(h.id);
        var freq = h.frequency || 'daily';
        var cells = '';
        for (var i = 20; i >= 0; i--) { var dd = new Date(); dd.setDate(dd.getDate()-i); cells += '<div class="hcell' + (DB.store.habitLogs[h.id+'_'+DB.dateKey(dd)] ? ' on' : '') + '"></div>'; }
        return '<div class="hab"><div class="hchk' + (done?' done':'') + '" onclick="Habits.toggle(\'' + h.id + '\')">✓</div><div class="hn">' + h.icon + ' ' + DB.esc(h.name) + '</div><div class="hs">' + (str>0?'🔥'+str:'—') + '</div><div class="hgrid">' + cells + '</div><button style="border:none;background:none;color:var(--text3);font-size:14px;padding:4px;cursor:pointer" onclick="event.stopPropagation();Habits.del(\'' + h.id + '\')">✕</button></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">🔥</div>Build a daily habit</div>');
  },

  toggle: function(id) {
    var k = id + '_' + DB.todayKey();
    if (DB.store.habitLogs[k]) delete DB.store.habitLogs[k];
    else DB.store.habitLogs[k] = true;
    DB.save(); toast(DB.store.habitLogs[k] ? '✓ Done!' : 'Unmarked'); this.render();
  },

  getStreak: function(hid) {
    var s = 0, d = new Date();
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
        '<div><div style="font-weight:700;font-size:16px;color:var(--accent)">' + streak + '</div><div style="color:var(--text3)">Streak</div></div>' +
        '<div><div style="font-weight:700;font-size:16px">' + longest + '</div><div style="color:var(--text3)">Best</div></div>' +
        '<div><div style="font-weight:700;font-size:16px">' + bestDay + '</div><div style="color:var(--text3)">Top day</div></div>' +
        '</div><div style="margin-top:8px;display:flex;gap:12px;font-size:12px;color:var(--text2)"><span>7d: <b>' + rate7 + '%</b></span><span>30d: <b>' + rate30 + '%</b></span></div></div>';
    });
    openSheet(html);
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Habit</div><div class="fg"><label class="fl">Habit name</label><input class="fi" id="hn" placeholder="Meditate 10 min"></div><div class="fr"><div class="fg"><label class="fl">Icon</label><input class="fi" id="hi" placeholder="⭐" style="text-align:center"></div><div class="fg"><label class="fl">Frequency</label><select class="fs" id="hf"><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="3x_week">3x/week</option><option value="weekly">Weekly</option></select></div></div><div class="fg"><label class="fl">Life Area</label><select class="fs" id="hla"><option value="">None</option><option>Health</option><option>Learning</option><option>Career</option><option>Personal</option></select></div><button class="btn" onclick="Habits.saveNew()">Add Habit</button>');
  },

  saveNew: function() {
    var n = document.getElementById('hn').value.trim();
    if (!vReq(n, 'Enter name')) return;
    DB.add('habits', { name: n, icon: document.getElementById('hi').value || '⭐', frequency: document.getElementById('hf').value, lifeArea: document.getElementById('hla').value });
    closeSheet(); toast('Habit added'); this.render();
  },

  del: function(id) {
    if (!confirm('Delete this habit?')) return;
    DB.remove('habits', id);
    Object.keys(DB.store.habitLogs).forEach(function(k) { if (k.indexOf(id + '_') === 0) delete DB.store.habitLogs[k]; });
    DB.save(); toast('Deleted'); this.render();
  }
};
