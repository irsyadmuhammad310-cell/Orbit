// js/notes.js — Notes CRUD, pin, color, tags

var Notes = {
  noteColor: function(c) { return {yellow:'var(--orangeBg)',blue:'var(--blueBg)',purple:'var(--accent2)',green:'var(--greenBg)'}[c] || 'var(--surface2)'; },

  render: function() {
    var notes = DB.getAll('notes').slice().sort(function(a,b) { return (b.pinned?1:0) - (a.pinned?1:0); });
    document.getElementById('pg-notes').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Notes</div><div class="pg-btn" onclick="Notes.openForm()">+</div></div>' +
      (notes.length ? notes.map(function(n) {
        return '<div class="note" style="background:' + Notes.noteColor(n.color) + '" onclick="Notes.view(\'' + n.id + '\')"><div class="note-t">' + (n.pinned?'📌 ':'') + DB.esc(n.title) + '</div><div class="note-b">' + DB.esc(n.body) + '</div>' + (n.tag?'<span class="note-tag">' + DB.esc(n.tag) + '</span>':'') + '</div>';
      }).join('') : '<div class="empty"><div class="empty-ic">📝</div>Capture a thought</div>');
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Note</div><div class="fg"><label class="fl">Title</label><input class="fi" id="nnt" placeholder="Quick thought..."></div><div class="fg"><label class="fl">Content</label><textarea class="ft" id="nnb"></textarea></div><div class="fg"><label class="fl">Tag</label><input class="fi" id="nng"></div><button class="btn" onclick="Notes.saveNew()">Save</button>');
  },

  saveNew: function() {
    var t = document.getElementById('nnt').value.trim(), b = document.getElementById('nnb').value.trim();
    if (!t && !b) { toast('Write something'); return; }
    var colors = ['yellow','blue','purple','green'];
    DB.add('notes', { title: t||'Untitled', body: b, tag: document.getElementById('nng').value.trim(), color: colors[Math.floor(Math.random()*colors.length)], pinned: false });
    closeSheet(); toast('Saved'); this.render();
  },

  view: function(id) {
    var n = DB.get('notes', id); if (!n) return;
    openSheet('<div class="sheet-title">Note</div><div class="fg"><label class="fl">Title</label><input class="fi" id="ent" value="' + DB.esc(n.title) + '"></div><div class="fg"><label class="fl">Content</label><textarea class="ft" id="enb">' + DB.esc(n.body) + '</textarea></div><div class="btn-row"><button class="btn" onclick="Notes.saveEdit(\'' + n.id + '\')">Save</button><button class="btn btn-ghost" onclick="Notes.pin(\'' + n.id + '\')">' + (n.pinned?'Unpin':'Pin') + '</button><button class="btn btn-red" onclick="Notes.del(\'' + n.id + '\')">Del</button></div>');
  },

  saveEdit: function(id) {
    var n = DB.get('notes', id); if (!n) return;
    n.title = document.getElementById('ent').value.trim() || 'Untitled';
    n.body = document.getElementById('enb').value.trim();
    DB.save(); closeSheet(); toast('Updated'); this.render();
  },

  pin: function(id) { var n = DB.get('notes', id); if (n) n.pinned = !n.pinned; DB.save(); closeSheet(); this.render(); },
  del: function(id) { if (!confirm('Delete?')) return; DB.remove('notes', id); closeSheet(); toast('Deleted'); this.render(); }
};
