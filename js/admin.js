// js/admin.js — Reminders + Documents + Expenses + Automation Rules
// Batch 6: Added automation engine, expense-project linking, subscription renewals

var Reminders = {
  render: function() {
    var reminders = DB.getAll('reminders').filter(function(r) { return !r.done; });
    document.getElementById('pg-reminders').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Reminders</div><div class="pg-btn" onclick="Reminders.openForm()">+</div></div>' +
      (reminders.length ? reminders.map(function(r) {
        return '<div class="tsk"><div class="tchk' + (r.done?' done':'') + '" onclick="Reminders.toggle(\'' + r.id + '\')">✓</div><div style="flex:1"><div class="tt">' + DB.esc(r.title) + '</div><div class="tm">' + (r.time||'') + ' · ' + DB.fmtDue(r.date) + '</div></div>' + (r.date ? '<span class="badge ' + DB.dueClass(r.date) + '">' + DB.fmtDue(r.date) + '</span>' : '') + '</div>';
      }).join('') : '<div class="empty"><div class="empty-ic">🔔</div>No reminders</div>');
  },
  toggle: function(id) { var r = DB.get('reminders', id); if (r) r.done = !r.done; DB.save(); toast(r.done?'Done':'Reopened'); this.render(); },
  openForm: function() {
    openSheet('<div class="sheet-title">New Reminder</div><div class="fg"><label class="fl">What to remember</label><input class="fi" id="rt" placeholder="Renew passport"></div><div class="fr"><div class="fg"><label class="fl">Date</label><input class="fi" id="rd" type="date"></div><div class="fg"><label class="fl">Time</label><input class="fi" id="rtm" type="time"></div></div><button class="btn" onclick="Reminders.saveNew()">Add</button>');
  },
  saveNew: function() {
    var v = document.getElementById('rt').value.trim();
    if (!vReq(v, 'Enter reminder')) return;
    DB.add('reminders', { title: v, date: document.getElementById('rd').value ? new Date(document.getElementById('rd').value+'T12:00:00').toISOString() : null, time: document.getElementById('rtm').value, done: false });
    closeSheet(); toast('Reminder added'); this.render();
  }
};

var Documents = {
  render: function() {
    var docs = DB.getAll('documents');
    document.getElementById('pg-docs').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Documents</div><div class="pg-btn" onclick="Documents.openForm()">+</div></div>' +
      (docs.length ? docs.map(function(d) {
        var exp = DB.daysBetween(d.expiry);
        var expTxt = !d.expiry ? 'No expiry' : exp < 0 ? 'Expired' : 'Expires ' + DB.fmtDue(d.expiry);
        return '<div class="doc"><div class="proj-n">' + DB.esc(d.name) + '</div><div class="doc-d">' + DB.esc(d.category) + (d.notes ? ' · ' + DB.esc(d.notes) : '') + '</div><span class="badge ' + (d.expiry && exp<=90 ? 'b-o' : '') + '">' + expTxt + '</span></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">📄</div>No documents</div>');
  },
  openForm: function() {
    openSheet('<div class="sheet-title">New Document</div><div class="fg"><label class="fl">Name</label><input class="fi" id="dn" placeholder="Passport"></div><div class="fr"><div class="fg"><label class="fl">Category</label><input class="fi" id="dc" placeholder="Identity"></div><div class="fg"><label class="fl">Expiry</label><input class="fi" id="de" type="date"></div></div><div class="fg"><label class="fl">Notes</label><input class="fi" id="dno" placeholder="Optional"></div><button class="btn" onclick="Documents.saveNew()">Add</button>');
  },
  saveNew: function() {
    var n = document.getElementById('dn').value.trim();
    if (!vReq(n, 'Enter name')) return;
    DB.add('documents', { name: n, category: document.getElementById('dc').value.trim()||'General', expiry: document.getElementById('de').value||'', notes: document.getElementById('dno').value.trim() });
    closeSheet(); toast('Added'); this.render();
  }
};

var Expenses = {
  render: function() {
    var expenses = DB.getAll('expenses');
    var monthly = expenses.filter(function(e) { return e.freq === 'monthly'; }).reduce(function(s, e) { return s + (e.amount||0); }, 0);
    document.getElementById('pg-expenses').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Expenses</div><div class="pg-btn" onclick="Expenses.openForm()">+</div></div>' +
      '<div class="card" style="margin-bottom:14px"><div class="card-v">RM ' + monthly + '/mo</div><div class="card-l">Total recurring</div></div>' +
      (expenses.length ? expenses.map(function(e) {
        return '<div class="tsk" onclick="Expenses.view(\'' + e.id + '\')"><div style="flex:1"><div class="tt">' + DB.esc(e.title) + '</div><div class="tm">' + DB.esc(e.category||'') + ' · ' + (e.type==='subscription'?'🔄 '+e.freq:'One-time') + (e.projId ? ' · ' + DB.projName(e.projId) : '') + '</div></div><span class="badge b-o">RM ' + e.amount + '</span></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">💰</div>No expenses</div>');
  },
  openForm: function() {
    var projOpts = DB.getAll('projects').map(function(p) { return '<option value="' + p.id + '">' + DB.esc(p.name) + '</option>'; }).join('');
    openSheet('<div class="sheet-title">New Expense</div><div class="fg"><label class="fl">Title</label><input class="fi" id="xt" placeholder="Netflix"></div><div class="fr"><div class="fg"><label class="fl">Amount (RM)</label><input class="fi" id="xa" type="number" placeholder="45"></div><div class="fg"><label class="fl">Type</label><select class="fs" id="xtype"><option value="subscription">Subscription</option><option value="one-time">One-time</option></select></div></div><div class="fr"><div class="fg"><label class="fl">Frequency</label><select class="fs" id="xf"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div><div class="fg"><label class="fl">Category</label><input class="fi" id="xc" placeholder="Entertainment"></div></div><div class="fg"><label class="fl">Link to Project</label><select class="fs" id="xp"><option value="">None</option>' + projOpts + '</select></div><button class="btn" onclick="Expenses.saveNew()">Add</button>');
  },
  saveNew: function() {
    var t = document.getElementById('xt').value.trim();
    if (!vReq(t, 'Enter title')) return;
    DB.add('expenses', { title: t, amount: parseFloat(document.getElementById('xa').value)||0, currency: 'MYR', type: document.getElementById('xtype').value, freq: document.getElementById('xf').value, category: document.getElementById('xc').value.trim()||'General', projId: document.getElementById('xp').value||null });
    closeSheet(); toast('Added'); this.render();
  },
  view: function(id) {
    var e = DB.get('expenses', id); if (!e) return;
    openSheet('<div class="sheet-title">' + DB.esc(e.title) + '</div><div class="fg"><label class="fl">Amount (RM)</label><input class="fi" id="exa" type="number" value="' + e.amount + '"></div><div class="fg"><label class="fl">Category</label><input class="fi" id="exc" value="' + DB.esc(e.category||'') + '"></div><div class="btn-row"><button class="btn" onclick="Expenses.saveEdit(\'' + e.id + '\')">Save</button><button class="btn btn-red" onclick="Expenses.del(\'' + e.id + '\')">Delete</button></div>');
  },
  saveEdit: function(id) {
    var e = DB.get('expenses', id); if (!e) return;
    e.amount = parseFloat(document.getElementById('exa').value)||0;
    e.category = document.getElementById('exc').value.trim();
    DB.save(); closeSheet(); toast('Updated'); this.render();
  },
  del: function(id) { if (!confirm('Delete?')) return; DB.remove('expenses', id); closeSheet(); toast('Deleted'); this.render(); }
};

// Batch 6 Task 42: Automation Rules Engine
var Automation = {
  // Run on every render of Home
  check: function() {
    var actions = [];
    var tasks = DB.getAll('tasks').filter(function(t) { return t.status === 'active'; });
    var overdue = tasks.filter(function(t) { return DB.daysBetween(t.due) < 0; });

    // Rule: IF task overdue 3+ days THEN warn
    overdue.filter(function(t) { return DB.daysBetween(t.due) <= -3; }).forEach(function(t) {
      actions.push({ type: 'warn', text: '"' + t.title + '" is ' + Math.abs(DB.daysBetween(t.due)) + ' days overdue' });
    });

    // Rule: IF document expires in 90 days THEN warn
    DB.getAll('documents').filter(function(d) { var db = DB.daysBetween(d.expiry); return db >= 0 && db <= 90; }).forEach(function(d) {
      actions.push({ type: 'warn', text: '"' + d.name + '" expires in ' + DB.daysBetween(d.expiry) + ' days' });
    });

    // Rule: IF habit missed 3+ days THEN warn
    var today = DB.todayKey();
    DB.getAll('habits').forEach(function(h) {
      var missed = 0;
      for (var i = 1; i <= 3; i++) { var d = new Date(); d.setDate(d.getDate()-i); if (!DB.store.habitLogs[h.id+'_'+DB.dateKey(d)]) missed++; }
      if (missed >= 3) actions.push({ type: 'warn', text: 'Habit "' + h.name + '" missed 3 days in a row' });
    });

    // Rule: IF subscription renews in 7 days THEN warn
    DB.getAll('expenses').filter(function(e) { return e.type === 'subscription' && e.nextDate && DB.daysBetween(e.nextDate) >= 0 && DB.daysBetween(e.nextDate) <= 7; }).forEach(function(e) {
      actions.push({ type: 'warn', text: '"' + e.title + '" renews in ' + DB.daysBetween(e.nextDate) + ' days (RM ' + e.amount + ')' });
    });

    // Rule: IF project deadline in 3 days THEN warn
    DB.getAll('projects').forEach(function(p) {
      if (p.deadline && DB.daysBetween(p.deadline) >= 0 && DB.daysBetween(p.deadline) <= 3) {
        actions.push({ type: 'warn', text: 'Project "' + p.name + '" deadline in ' + DB.daysBetween(p.deadline) + ' days' });
      }
    });

    return actions.slice(0, 5); // Cap at 5 warnings
  }
};
