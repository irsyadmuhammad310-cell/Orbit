// js/intelligence.js — AI Chat + Search + Focus + Analytics + Daily Planning
// Batch 6: Added daily planning mode, life area awareness, interconnected AI

var AI = {
  render: function() {
    var msgs = DB.store.aiMsgs || [];
    var html = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">AI</div></div>';
    html += '<div class="chat-chips"><button class="chat-chip" onclick="AI.ask(\'What should I do today?\')">Today</button><button class="chat-chip" onclick="AI.ask(\'What is overdue?\')">Overdue</button><button class="chat-chip" onclick="AI.ask(\'Plan my day\')">Plan my day</button><button class="chat-chip" onclick="AI.ask(\'Which life area needs attention?\')">Life Areas</button></div>';
    html += '<div class="chat-wrap"><div class="chat-msgs" id="msgs">';
    if (msgs.length) msgs.forEach(function(m) { html += '<div class="chat-msg ' + m.role + '"><div class="bubble">' + m.text + '</div></div>'; });
    else html += '<div class="chat-msg ai"><div class="bubble">Ask about tasks, habits, deadlines, projects, life areas, or ask me to plan your day.</div></div>';
    html += '</div><div class="chat-row"><input class="chat-input" id="cq" placeholder="Ask..." onkeydown="if(event.key===\'Enter\')AI.send()"><button class="chat-send" onclick="AI.send()">→</button></div></div>';
    document.getElementById('pg-ai').innerHTML = html;
  },

  send: function() {
    var input = document.getElementById('cq');
    var q = input.value.trim(); if (!q) return;
    DB.store.aiMsgs.push({ role: 'user', text: DB.esc(q) });
    DB.store.aiMsgs.push({ role: 'ai', text: this.answer(q) });
    DB.save(); this.render();
  },

  ask: function(q) {
    DB.store.aiMsgs.push({ role: 'user', text: DB.esc(q) });
    DB.store.aiMsgs.push({ role: 'ai', text: this.answer(q) });
    DB.save(); this.render();
  },

  answer: function(q) {
    var ql = q.toLowerCase();
    var tasks = DB.getAll('tasks').filter(function(t) { return t.status === 'active'; });
    var today = DB.todayKey();

    // Batch 6 Task 43: Daily Planning Mode
    if (ql.includes('plan') && (ql.includes('day') || ql.includes('today') || ql.includes('morning'))) {
      var todayT = tasks.filter(function(t) { return t.due && DB.dateKey(new Date(t.due)) === today; });
      var overdue = tasks.filter(function(t) { return DB.daysBetween(t.due) < 0; });
      var events = DB.getAll('events').filter(function(e) { return DB.dateKey(new Date(e.date)) === today; });
      var habits = DB.getAll('habits').filter(function(h) { return !DB.store.habitLogs[h.id + '_' + today]; });
      var plan = 'Daily Plan:

';
      if (overdue.length) plan += '🚨 CLEAR FIRST:
' + overdue.slice(0,3).map(function(t) { return '• ' + t.title; }).join('
') + '

';
      if (events.length) plan += '📅 EVENTS:
' + events.map(function(e) { return '• ' + (e.time||'') + ' ' + e.title; }).join('
') + '

';
      if (todayT.length) plan += '✓ TODAY\'S TASKS:
' + todayT.map(function(t) { return '• ' + t.title + ' (' + t.pri + ')'; }).join('
') + '

';
      if (habits.length) plan += '🔥 HABITS:
' + habits.map(function(h) { return '• ' + h.icon + ' ' + h.name; }).join('
') + '

';
      plan += '💡 Suggestion: Start with overdue items, then high-priority tasks. Fit habits into transition moments.';
      return plan;
    }

    if (ql.includes('plan') && ql.includes('tomorrow')) {
      var d = new Date(); d.setDate(d.getDate()+1); var k = DB.dateKey(d);
      var ev = DB.getAll('events').filter(function(e) { return DB.dateKey(new Date(e.date)) === k; });
      var td = tasks.filter(function(t) { return t.due && DB.dateKey(new Date(t.due)) === k; });
      return 'Tomorrow\'s Plan:
Morning: ' + (ev[0] ? ev[0].title + ' ' + (ev[0].time||'') : 'Focus work') + '
Afternoon: ' + (td[0] ? td[0].title : 'Clear overdue') + '
Evening: Review + habits.

This is a suggestion only.';
    }

    // Batch 6 Task 44: Life Areas
    if (ql.includes('life area') || ql.includes('area')) {
      var areas = {};
      tasks.forEach(function(t) { var a = t.lifeArea || 'Unassigned'; areas[a] = (areas[a]||0) + 1; });
      var overduePer = {};
      tasks.filter(function(t) { return DB.daysBetween(t.due) < 0; }).forEach(function(t) { var a = t.lifeArea || 'Unassigned'; overduePer[a] = (overduePer[a]||0) + 1; });
      var needsAttention = Object.keys(overduePer).sort(function(a,b) { return overduePer[b] - overduePer[a]; });
      if (needsAttention.length) return 'Life areas needing attention:
' + needsAttention.map(function(a) { return '• ' + a + ': ' + overduePer[a] + ' overdue'; }).join('
') + '

Focus on ' + needsAttention[0] + ' first.';
      return 'All life areas look balanced. No overdue items by area.';
    }

    if (ql.includes('overdue')) {
      var ov = tasks.filter(function(t) { return DB.daysBetween(t.due) < 0; });
      return ov.length ? ov.length + ' overdue:
' + ov.map(function(t) { return '• ' + t.title; }).join('
') : 'No overdue tasks!';
    }

    if (ql.includes('today') || ql.includes('should')) {
      var tt = tasks.filter(function(t) { return t.due && DB.dateKey(new Date(t.due)) === today; });
      return tt.length ? 'Today:
' + tt.map(function(t) { return '• ' + t.title + ' (' + t.pri + ')'; }).join('
') : 'Nothing due today.';
    }

    if (ql.includes('habit')) {
      var missed = DB.getAll('habits').filter(function(h) { return !DB.store.habitLogs[h.id + '_' + today]; });
      return missed.length ? 'Still to do:
' + missed.map(function(h) { return '• ' + h.icon + ' ' + h.name; }).join('
') : 'All habits done!';
    }

    if (ql.includes('project')) {
      var withOv = DB.getAll('projects').filter(function(p) { return tasks.some(function(t) { return t.projId===p.id && DB.daysBetween(t.due)<0; }); });
      return withOv.length ? 'Projects needing attention:
' + withOv.map(function(p) { return '• ' + p.name; }).join('
') : 'All projects on track.';
    }

    if (ql.includes('subscription') || ql.includes('renew')) {
      var subs = DB.getAll('expenses').filter(function(e) { return e.type === 'subscription'; });
      return subs.length ? 'Subscriptions:
' + subs.map(function(e) { return '• ' + e.title + ' (RM ' + e.amount + '/' + e.freq + ')'; }).join('
') : 'No subscriptions tracked.';
    }

    if (ql.includes('contact') || ql.includes('follow')) {
      var contacts = DB.getAll('contacts').filter(function(c) { return c.nextFollowUp && DB.daysBetween(c.nextFollowUp) <= 7; });
      return contacts.length ? 'Follow-ups due:
' + contacts.map(function(c) { return '• ' + c.name + ' (' + DB.fmtDue(c.nextFollowUp) + ')'; }).join('
') : 'No follow-ups due this week.';
    }

    return 'I can help with:
• Plan my day
• What is overdue?
• Which life area needs attention?
• Today\'s tasks
• Habits status
• Project health
• Subscriptions
• Follow-up contacts';
  }
};

var Search = {
  render: function() {
    document.getElementById('pg-search').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Search</div></div><div class="search"><span class="search-ic">🔍</span><input class="search-input" id="sq" placeholder="Search everything..." oninput="Search.doSearch(this.value)"></div><div id="sres"></div>';
  },
  doSearch: function(q) {
    q = q.trim().toLowerCase(); var el = document.getElementById('sres');
    if (q.length < 2) { el.innerHTML = ''; return; }
    var html = '', found = false;
    DB.getAll('tasks').forEach(function(t) { if (t.title.toLowerCase().includes(q)) { html += Tasks.taskRow(t); found = true; } });
    DB.getAll('projects').forEach(function(p) { if (p.name.toLowerCase().includes(q)) { html += '<div class="tsk"><div class="dot" style="background:var(--accent)"></div><div style="flex:1"><div class="tt">' + DB.esc(p.name) + '</div><div class="tm">Project</div></div></div>'; found = true; } });
    DB.getAll('notes').forEach(function(n) { if (n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) { html += '<div class="tsk" onclick="Notes.view(\'' + n.id + '\')"><div class="dot" style="background:var(--accent)"></div><div style="flex:1"><div class="tt">' + DB.esc(n.title) + '</div><div class="tm">Note</div></div></div>'; found = true; } });
    DB.getAll('contacts').forEach(function(c) { if (c.name.toLowerCase().includes(q)) { html += '<div class="tsk"><div class="dot" style="background:var(--accent)"></div><div style="flex:1"><div class="tt">' + DB.esc(c.name) + '</div><div class="tm">Contact · ' + DB.esc(c.role||'') + '</div></div></div>'; found = true; } });
    DB.getAll('documents').forEach(function(d) { if (d.name.toLowerCase().includes(q)) { html += '<div class="tsk"><div class="dot" style="background:var(--accent)"></div><div style="flex:1"><div class="tt">' + DB.esc(d.name) + '</div><div class="tm">Document</div></div></div>'; found = true; } });
    DB.getAll('expenses').forEach(function(e) { if (e.title.toLowerCase().includes(q)) { html += '<div class="tsk"><div class="dot" style="background:var(--accent)"></div><div style="flex:1"><div class="tt">' + DB.esc(e.title) + '</div><div class="tm">Expense · RM ' + e.amount + '</div></div></div>'; found = true; } });
    el.innerHTML = found ? html : '<div class="empty">No results</div>';
  }
};

var Focus = {
  interval: null, seconds: 0, active: false,
  render: function() {
    var mins = Math.floor(this.seconds/60), secs = this.seconds%60;
    var todaySessions = DB.getAll('focusSessions').filter(function(s) { return s.date === DB.todayKey(); }).length;
    var totalMins = DB.getAll('focusSessions').reduce(function(s, f) { return s + (f.duration||0); }, 0);
    document.getElementById('pg-focus').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Focus</div></div>' +
      (this.active ?
        '<div class="card" style="text-align:center;padding:40px 20px"><div style="font-size:48px;font-weight:700">' + (mins<10?'0':'') + mins + ':' + (secs<10?'0':'') + secs + '</div><div style="margin-top:12px;font-size:13px;color:var(--text2)">Stay focused.</div><button class="btn btn-red" style="margin-top:20px;max-width:200px" onclick="Focus.stop()">Stop</button></div>' :
        '<div class="card" style="text-align:center;padding:40px 20px"><div style="font-size:48px">⏱</div><div style="margin-top:8px;font-size:15px;font-weight:600">25-min Pomodoro</div><button class="btn" style="margin-top:20px;max-width:200px" onclick="Focus.start()">Start Focus</button></div>'
      ) + '<div class="grid" style="margin-top:14px"><div class="card"><div class="card-v">' + todaySessions + '</div><div class="card-l">Sessions today</div></div><div class="card"><div class="card-v">' + totalMins + 'm</div><div class="card-l">Total focused</div></div></div>';
  },
  start: function() {
    this.seconds = 25*60; this.active = true;
    this.interval = setInterval(function() {
      Focus.seconds--;
      if (Focus.seconds <= 0) { clearInterval(Focus.interval); Focus.active = false; DB.add('focusSessions', { date: DB.todayKey(), duration: 25 }); toast('Session complete! 🎉'); }
      // Only re-render if focus page is visible
      if (App.currentPage === 'focus') Focus.render();
    }, 1000);
    this.render();
  },
  stop: function() { clearInterval(this.interval); this.active = false; this.seconds = 0; this.render(); toast('Stopped'); }
};

var Analytics = {
  render: function() {
    var done = DB.getAll('tasks').filter(function(t) { return t.status === 'done'; }).length;
    var active = DB.getAll('tasks').filter(function(t) { return t.status === 'active'; }).length;
    var overdue = DB.getAll('tasks').filter(function(t) { return t.status === 'active' && DB.daysBetween(t.due) < 0; }).length;
    var rate = (done+active) > 0 ? Math.round(done/(done+active)*100) : 0;
    var totalH = DB.getAll('habits').length * 7, doneH = 0;
    for (var i = 0; i < 7; i++) { var d = new Date(); d.setDate(d.getDate()-i); DB.getAll('habits').forEach(function(h) { if (DB.store.habitLogs[h.id+'_'+DB.dateKey(d)]) doneH++; }); }
    var habitRate = totalH ? Math.round(doneH/totalH*100) : 0;
    var avgGoal = DB.getAll('goals').length ? Math.round(DB.getAll('goals').reduce(function(s,g) { return s+g.progress; }, 0) / DB.getAll('goals').length) : 0;
    var focusTotal = DB.getAll('focusSessions').reduce(function(s,f) { return s + (f.duration||0); }, 0);

    document.getElementById('pg-analytics').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Analytics</div></div>' +
      '<div class="grid"><div class="card"><div class="card-v">' + done + '</div><div class="card-l">Tasks Done</div></div><div class="card"><div class="card-v">' + overdue + '</div><div class="card-l">Overdue</div></div><div class="card"><div class="card-v">' + rate + '%</div><div class="card-l">Completion</div></div><div class="card"><div class="card-v">' + habitRate + '%</div><div class="card-l">Habit (7d)</div></div><div class="card"><div class="card-v">' + avgGoal + '%</div><div class="card-l">Avg Goal</div></div><div class="card"><div class="card-v">' + focusTotal + 'm</div><div class="card-l">Focus Time</div></div></div>';
  }
};
