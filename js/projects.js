// js/projects.js — Project CRUD, progress, task linking

var Projects = {
  render: function() {
    var projects = DB.getAll('projects');
    document.getElementById('pg-projects').innerHTML = '<div class="pg-h"><div class="pg-t">Projects</div><div class="pg-btn" onclick="Projects.openForm()">+</div></div>' +
      (projects.length ? projects.map(function(p) {
        var pt = DB.getAll('tasks').filter(function(t) { return t.projId === p.id; });
        var done = pt.filter(function(t) { return t.status === 'done'; }).length;
        var act = pt.filter(function(t) { return t.status === 'active'; }).length;
        var pct = pt.length ? Math.round(done/pt.length*100) : 0;
        return '<div class="proj" onclick="Projects.view(\'' + p.id + '\')"><div class="proj-n">' + DB.esc(p.name) + '</div><div class="proj-d">' + DB.esc(p.desc) + '</div><div class="bar"><div class="fill" style="width:' + pct + '%"></div></div><div class="proj-s"><b>' + done + '</b> done · <b>' + act + '</b> active · <b>' + pct + '</b>%</div></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">🚀</div>No projects</div>');
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Project</div><div class="fg"><label class="fl">Name</label><input class="fi" id="pn" placeholder="Project name"></div><div class="fg"><label class="fl">Description</label><textarea class="ft" id="pd"></textarea></div><button class="btn" onclick="Projects.saveNew()">Create</button>');
  },

  saveNew: function() {
    var n = document.getElementById('pn').value.trim();
    if (!vReq(n, 'Enter name')) return;
    DB.add('projects', { name: n, desc: document.getElementById('pd').value.trim(), status: 'active', milestones: [] });
    closeSheet(); toast('Created'); this.render();
  },

  view: function(id) {
    var p = DB.get('projects', id);
    if (!p) return;
    var tasks = DB.getAll('tasks').filter(function(t) { return t.projId === id; });
    openSheet('<div class="sheet-title">' + DB.esc(p.name) + '</div><div class="fg"><label class="fl">Name</label><input class="fi" id="ppn" value="' + DB.esc(p.name) + '"></div><div class="fg"><label class="fl">Desc</label><textarea class="ft" id="ppd">' + DB.esc(p.desc) + '</textarea></div><div class="sec">Tasks (' + tasks.length + ')</div>' + (tasks.length ? tasks.slice(0,6).map(function(t) { return '<div style="padding:5px 0;font-size:13px;color:var(--text2)">' + DB.esc(t.title) + '</div>'; }).join('') : '<div style="font-size:12px;color:var(--text3)">None</div>') + '<div class="btn-row" style="margin-top:14px"><button class="btn" onclick="Projects.saveEdit(\'' + p.id + '\')">Save</button><button class="btn btn-red" onclick="Projects.del(\'' + p.id + '\')">Delete</button></div>');
  },

  saveEdit: function(id) {
    var p = DB.get('projects', id);
    if (!p) return;
    p.name = document.getElementById('ppn').value.trim() || p.name;
    p.desc = document.getElementById('ppd').value.trim();
    DB.save(); closeSheet(); toast('Updated'); this.render();
  },

  del: function(id) {
    if (!confirm('Delete?')) return;
    DB.getAll('tasks').forEach(function(t) { if (t.projId === id) t.projId = null; });
    DB.remove('projects', id); closeSheet(); toast('Deleted'); this.render();
  }
};
