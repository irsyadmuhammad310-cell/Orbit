// js/projects.js — Project CRUD, progress, task linking, milestones, graph

var Projects = {
  render: function() {
    var projects = DB.getAll('projects');
    document.getElementById('pg-projects').innerHTML = '<div class="pg-h"><div class="pg-t">Projects</div><div class="pg-btn" onclick="Projects.openForm()">+</div></div>' +
      (projects.length ? projects.map(function(p) {
        var pt = DB.getAll('tasks').filter(function(t) { return t.projId === p.id; });
        var done = pt.filter(function(t) { return t.status === 'done'; }).length;
        var act = pt.filter(function(t) { return t.status === 'active'; }).length;
        var pct = pt.length ? Math.round(done/pt.length*100) : 0;
        var statusColor = p.status === 'active' ? 'var(--green)' : p.status === 'completed' ? 'var(--accent)' : 'var(--orange)';
        return '<div class="proj" onclick="Projects.view(\'' + p.id + '\')"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><div class="proj-n">' + DB.esc(p.name) + '</div><span class="badge" style="background:' + statusColor + ';color:#fff">' + (p.status||'active') + '</span></div><div class="proj-d">' + DB.esc(p.desc) + '</div>' + (p.deadline ? '<div style="font-size:10px;color:var(--text3);margin-bottom:6px">Deadline: ' + DB.fmtDue(p.deadline) + '</div>' : '') + '<div class="bar"><div class="fill" style="width:' + pct + '%;background:' + statusColor + '"></div></div><div class="proj-s"><b>' + done + '</b> done · <b>' + act + '</b> active · <b>' + pct + '</b>%</div></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">🚀</div>No projects</div>');
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Project</div><div class="fg"><label class="fl">Name</label><input class="fi" id="pn" placeholder="Project name"></div><div class="fg"><label class="fl">Description</label><textarea class="ft" id="pd"></textarea></div><div class="fr"><div class="fg"><label class="fl">Status</label><select class="fs" id="pst"><option value="planning">Planning</option><option value="active" selected>Active</option><option value="completed">Completed</option><option value="paused">Paused</option></select></div><div class="fg"><label class="fl">Deadline</label><input class="fi" id="pdl" type="date"></div></div><div class="fg"><label class="fl">Life Area</label><select class="fs" id="pla"><option value="">None</option><option>Career</option><option>Finance</option><option>Health</option><option>Learning</option><option>Personal</option></select></div><button class="btn" onclick="Projects.saveNew()">Create</button>');
  },

  saveNew: function() {
    var n = document.getElementById('pn').value.trim();
    if (!vReq(n, 'Enter name')) return;
    var dl = document.getElementById('pdl').value;
    DB.add('projects', { name: n, desc: document.getElementById('pd').value.trim(), status: document.getElementById('pst').value, deadline: dl ? new Date(dl+'T12:00:00').toISOString() : null, lifeArea: document.getElementById('pla').value, milestones: [] });
    closeSheet(); toast('Created'); this.render();
  },

  view: function(id) {
    var p = DB.get('projects', id);
    if (!p) return;
    var tasks = DB.getAll('tasks').filter(function(t) { return t.projId === id; });
    var done = tasks.filter(function(t) { return t.status === 'done'; }).length;
    var active = tasks.filter(function(t) { return t.status === 'active'; }).length;
    var pct = tasks.length ? Math.round(done/tasks.length*100) : 0;

    // Progress graph data (last 7 days completion)
    var graphHtml = '<div style="display:flex;align-items:flex-end;gap:4px;height:60px;margin:12px 0">';
    for (var i = 6; i >= 0; i--) {
      var dd = new Date(); dd.setDate(dd.getDate()-i);
      var dk = DB.dateKey(dd);
      var dayDone = tasks.filter(function(t) { return t.status === 'done' && t.updatedAt && t.updatedAt.split('T')[0] === dk; }).length;
      var h = dayDone ? Math.min(100, dayDone * 25) : 4;
      var dayLabel = dd.toLocaleDateString('en-MY', {weekday:'short'}).charAt(0);
      graphHtml += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px"><div style="width:100%;height:' + h + '%;min-height:4px;background:' + (dayDone ? 'var(--accent)' : 'var(--surface3)') + ';border-radius:3px"></div><span style="font-size:8px;color:var(--text3)">' + dayLabel + '</span></div>';
    }
    graphHtml += '</div>';

    var taskList = tasks.length ? '<div class="sec">Tasks (' + tasks.length + ')</div>' + tasks.slice(0,10).map(function(t) {
      var icon = t.status === 'done' ? '✅' : '○';
      return '<div style="padding:6px 0;font-size:13px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border)"><span style="font-size:11px">' + icon + '</span><span style="flex:1;color:' + (t.status==='done'?'var(--text3)':'var(--text)') + '">' + DB.esc(t.title) + '</span>' + (t.due ? '<span class="badge ' + DB.dueClass(t.due) + '">' + DB.fmtDue(t.due) + '</span>' : '') + '</div>';
    }).join('') : '';

    openSheet('<div class="sheet-title">' + DB.esc(p.name) + '</div>' +
      '<div style="text-align:center;margin-bottom:12px"><div style="font-size:32px;font-weight:800;color:var(--accent)">' + pct + '%</div><div style="font-size:11px;color:var(--text3)">' + done + ' done · ' + active + ' active</div></div>' +
      graphHtml +
      '<div class="fg"><label class="fl">Name</label><input class="fi" id="ppn" value="' + DB.esc(p.name) + '"></div>' +
      '<div class="fg"><label class="fl">Description</label><textarea class="ft" id="ppd">' + DB.esc(p.desc) + '</textarea></div>' +
      '<div class="fr"><div class="fg"><label class="fl">Status</label><select class="fs" id="ppst"><option value="planning"' + (p.status==='planning'?' selected':'') + '>Planning</option><option value="active"' + (p.status==='active'?' selected':'') + '>Active</option><option value="completed"' + (p.status==='completed'?' selected':'') + '>Completed</option><option value="paused"' + (p.status==='paused'?' selected':'') + '>Paused</option></select></div><div class="fg"><label class="fl">Deadline</label><input class="fi" id="ppdl" type="date" value="' + (p.deadline?p.deadline.split('T')[0]:'') + '"></div></div>' +
      '<div class="fg"><label class="fl">Life Area</label><select class="fs" id="ppla"><option value="">None</option><option' + (p.lifeArea==='Career'?' selected':'') + '>Career</option><option' + (p.lifeArea==='Finance'?' selected':'') + '>Finance</option><option' + (p.lifeArea==='Health'?' selected':'') + '>Health</option><option' + (p.lifeArea==='Learning'?' selected':'') + '>Learning</option><option' + (p.lifeArea==='Personal'?' selected':'') + '>Personal</option></select></div>' +
      taskList +
      '<div class="btn-row" style="margin-top:14px"><button class="btn" onclick="Projects.saveEdit(\'' + p.id + '\')">Save</button><button class="btn btn-red" onclick="Projects.del(\'' + p.id + '\')">Delete</button></div>');
  },

  saveEdit: function(id) {
    var p = DB.get('projects', id);
    if (!p) return;
    p.name = document.getElementById('ppn').value.trim() || p.name;
    p.desc = document.getElementById('ppd').value.trim();
    p.status = document.getElementById('ppst').value;
    var dl = document.getElementById('ppdl').value;
    p.deadline = dl ? new Date(dl+'T12:00:00').toISOString() : null;
    p.lifeArea = document.getElementById('ppla').value;
    DB.save(); closeSheet(); toast('Updated'); this.render();
  },

  del: function(id) {
    if (!confirm('Delete?')) return;
    DB.getAll('tasks').forEach(function(t) { if (t.projId === id) t.projId = null; });
    DB.remove('projects', id); closeSheet(); toast('Deleted'); this.render();
  }
};
