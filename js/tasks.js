// js/tasks.js — Task CRUD, filters, recurrence, smart capture NLP

var Tasks = {
  render: function() {
    var tasks = this.getFiltered();
    var active = DB.getAll('tasks').filter(function(t) { return t.status === 'active'; }).length;
    document.getElementById('pg-tasks').innerHTML = '<div class="pg-h"><div class="pg-t">Tasks</div><div class="pg-btn" onclick="Tasks.openForm()">+</div></div>' +
      '<div class="chips">' + ['all','today','high priority','overdue'].map(function(f) {
        return '<button class="chip' + (App.taskFilter === f ? ' on' : '') + '" onclick="App.taskFilter=\'' + f + '\';Tasks.render()">' + f + '</button>';
      }).join('') + '</div>' +
      (tasks.length ? tasks.map(this.taskRow).join('') : '<div class="empty"><div class="empty-ic">✨</div>No tasks</div>');
  },

  getFiltered: function() {
    var tasks = DB.getAll('tasks').filter(function(t) { return t.status !== 'done'; });
    var today = DB.todayKey();
    if (App.taskFilter === 'today') tasks = tasks.filter(function(t) { return t.due && DB.dateKey(new Date(t.due)) === today; });
    else if (App.taskFilter === 'high priority') tasks = tasks.filter(function(t) { return t.pri === 'high' || t.pri === 'critical'; });
    else if (App.taskFilter === 'overdue') tasks = tasks.filter(function(t) { return DB.daysBetween(t.due) < 0; });
    return tasks.sort(function(a, b) { var o = {critical:0,high:1,medium:2,low:3}; return (o[a.pri]||3) - (o[b.pri]||3); });
  },

  taskRow: function(t) {
    return '<div class="tsk" onclick="Tasks.view(\'' + t.id + '\')"><div class="tchk' + (t.status==='done'?' done':'') + '" onclick="event.stopPropagation();Tasks.toggle(\'' + t.id + '\')">✓</div><div class="dot" style="background:' + DB.priColor(t.pri) + '"></div><div style="flex:1"><div class="tt' + (t.status==='done'?' done':'') + '">' + DB.esc(t.title) + '</div><div class="tm">' + (t.projId ? DB.projName(t.projId) : t.cat || 'Personal') + (t.rec ? ' · 🔄' : '') + '</div></div>' + (t.due ? '<span class="badge ' + DB.dueClass(t.due) + '">' + DB.fmtDue(t.due) + '</span>' : '') + '</div>';
  },

  toggle: function(id) {
    var t = DB.get('tasks', id);
    if (!t) return;
    t.status = t.status === 'active' ? 'done' : 'active';
    if (t.status === 'done' && t.rec) this.spawnNext(t);
    DB.save();
    toast(t.status === 'done' ? 'Completed' : 'Reopened');
    App.render(App.currentPage);
  },

  spawnNext: function(t) {
    var d = t.due ? new Date(t.due) : new Date();
    if (t.rec === 'daily') d.setDate(d.getDate() + 1);
    if (t.rec === 'weekly') d.setDate(d.getDate() + 7);
    if (t.rec === 'monthly') d.setMonth(d.getMonth() + 1);
    var nextDue = d.toISOString();
    // Prevent duplicates: check if next occurrence already exists
    var exists = DB.getAll('tasks').some(function(x) { return x.title === t.title && x.status === 'active' && x.due && Math.abs(new Date(x.due) - d) < 86400000; });
    if (exists) return;
    DB.add('tasks', { title: t.title, desc: t.desc, due: nextDue, pri: t.pri, status: 'active', projId: t.projId, cat: t.cat, rec: t.rec, lifeArea: t.lifeArea });
  },

  view: function(id) {
    var t = DB.get('tasks', id);
    if (!t) return;
    var opts = DB.getAll('projects').map(function(p) { return '<option value="' + p.id + '"' + (t.projId===p.id?' selected':'') + '>' + DB.esc(p.name) + '</option>'; }).join('');
    openSheet('<div class="sheet-title">Task</div><div class="fg"><label class="fl">Title</label><input class="fi" id="tt" value="' + DB.esc(t.title) + '"></div><div class="fg"><label class="fl">Description</label><textarea class="ft" id="td">' + DB.esc(t.desc||'') + '</textarea></div><div class="fr"><div class="fg"><label class="fl">Due</label><input class="fi" id="tdu" type="date" value="' + (t.due?t.due.split('T')[0]:'') + '"></div><div class="fg"><label class="fl">Priority</label><select class="fs" id="tpr"><option value="low"' + (t.pri==='low'?' selected':'') + '>low</option><option value="medium"' + (t.pri==='medium'?' selected':'') + '>medium</option><option value="high"' + (t.pri==='high'?' selected':'') + '>high</option><option value="critical"' + (t.pri==='critical'?' selected':'') + '>critical</option></select></div></div><div class="fg"><label class="fl">Project</label><select class="fs" id="tpj"><option value="">None</option>' + opts + '</select></div><div class="btn-row"><button class="btn" onclick="Tasks.saveEdit(\'' + t.id + '\')">Save</button><button class="btn btn-red" onclick="Tasks.del(\'' + t.id + '\')">Delete</button></div>');
  },

  saveEdit: function(id) {
    var t = DB.get('tasks', id);
    if (!t) return;
    var v = document.getElementById('tt').value.trim();
    if (!vReq(v, 'Title required')) return;
    t.title = v;
    t.desc = document.getElementById('td').value.trim();
    var d = document.getElementById('tdu').value;
    t.due = d ? new Date(d + 'T12:00:00').toISOString() : null;
    t.pri = document.getElementById('tpr').value;
    t.projId = document.getElementById('tpj').value || null;
    DB.save(); closeSheet(); toast('Updated'); App.render(App.currentPage);
  },

  del: function(id) {
    if (!confirm('Delete?')) return;
    DB.remove('tasks', id); closeSheet(); toast('Deleted'); App.render(App.currentPage);
  },

  openForm: function() {
    var opts = DB.getAll('projects').map(function(p) { return '<option value="' + p.id + '">' + DB.esc(p.name) + '</option>'; }).join('');
    openSheet('<div class="sheet-title">New Task</div><div class="fg"><label class="fl">Title</label><input class="fi" id="nt" placeholder="What needs to be done?"></div><div class="fr"><div class="fg"><label class="fl">Due</label><input class="fi" id="nd" type="date"></div><div class="fg"><label class="fl">Priority</label><select class="fs" id="np"><option value="medium">medium</option><option value="high">high</option><option value="low">low</option></select></div></div><div class="fg"><label class="fl">Project</label><select class="fs" id="npj"><option value="">None</option>' + opts + '</select></div><button class="btn" onclick="Tasks.saveNew()">Add Task</button>');
  },

  saveNew: function() {
    var v = document.getElementById('nt').value.trim();
    if (!vReq(v, 'Enter task')) return;
    var d = document.getElementById('nd').value;
    DB.add('tasks', { title: v, desc: '', due: d ? new Date(d+'T12:00:00').toISOString() : null, pri: document.getElementById('np').value, status: 'active', projId: document.getElementById('npj').value || null, cat: 'Personal', rec: null });
    closeSheet(); toast('Added'); App.render(App.currentPage);
  },

  // Smart Capture NLP
  openSmartCapture: function() {
    openSheet('<div class="sheet-title">Smart Capture</div><div class="fg"><label class="fl">Type naturally</label><input class="fi" id="nlpIn" placeholder="Call Ahmad tomorrow 3pm" oninput="Tasks.parseNLP()"></div><div id="nlpOut"></div><button class="btn" id="nlpBtn" style="display:none" onclick="Tasks.saveNLP()">Create</button>');
  },

  parseNLP: function() {
    var v = document.getElementById('nlpIn').value.trim();
    var out = document.getElementById('nlpOut');
    var btn = document.getElementById('nlpBtn');
    if (v.length < 3) { out.innerHTML = ''; btn.style.display = 'none'; return; }
    var p = this.nlp(v);
    out.innerHTML = '<div class="nlp"><div class="nlp-row"><span class="nlp-label">Task</span><span class="nlp-val">' + DB.esc(p.title) + '</span></div>' + (p.dateLabel ? '<div class="nlp-row"><span class="nlp-label">Date</span><span class="nlp-val">' + p.dateLabel + '</span></div>' : '') + (p.time ? '<div class="nlp-row"><span class="nlp-label">Time</span><span class="nlp-val">' + p.time + '</span></div>' : '') + '</div>';
    btn.style.display = 'block';
  },

  nlp: function(text) {
    var r = { title: text, date: null, dateLabel: '', time: null };
    var t = text.toLowerCase();
    var now = new Date();
    // Time extraction (requires am/pm)
    var tm = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (tm) {
      var h = parseInt(tm[1]), m = tm[2] ? parseInt(tm[2]) : 0;
      if (tm[3].toLowerCase() === 'pm' && h < 12) h += 12;
      if (tm[3].toLowerCase() === 'am' && h === 12) h = 0;
      r.time = (h<10?'0':'') + h + ':' + (m<10?'0':'') + m;
      r.title = text.replace(tm[0], '').replace(/\bat\b/i, '').trim();
    }
    // Date extraction
    if (t.includes('tomorrow')) {
      var d = new Date(now); d.setDate(d.getDate()+1);
      r.date = d.toISOString(); r.dateLabel = 'Tomorrow';
      r.title = r.title.replace(/tomorrow/i, '').trim();
    } else if (t.includes('today')) {
      r.date = now.toISOString(); r.dateLabel = 'Today';
      r.title = r.title.replace(/today/i, '').trim();
    } else if (t.match(/next\s+(mon|tue|wed|thu|fri|sat|sun)/i)) {
      var days = ['sun','mon','tue','wed','thu','fri','sat'];
      var match = t.match(/next\s+(mon|tue|wed|thu|fri|sat|sun)\w*/i);
      var target = days.indexOf(match[1].slice(0,3).toLowerCase());
      var d2 = new Date(now);
      d2.setDate(d2.getDate() + ((target - d2.getDay() + 7) % 7) + 7);
      r.date = d2.toISOString(); r.dateLabel = 'Next ' + match[1];
      r.title = r.title.replace(/next\s+\w+/i, '').trim();
    }
    r.title = r.title.replace(/\s+/g, ' ').trim() || text;
    return r;
  },

  saveNLP: function() {
    var v = document.getElementById('nlpIn').value.trim();
    if (!v) return;
    var p = this.nlp(v);
    DB.add('tasks', { title: p.title, desc: '', due: p.date || null, pri: 'medium', status: 'active', projId: null, cat: 'Personal', rec: null });
    closeSheet(); toast('Created'); App.render(App.currentPage);
  }
};
