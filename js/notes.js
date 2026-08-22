// js/notes.js — Full-screen note editor with rich formattingg

var Notes = {
  noteColor: function(c) { return {yellow:'var(--orangeBg)',blue:'var(--blueBg)',purple:'var(--accent2)',green:'var(--greenBg)'}[c] || 'var(--surface2)'; },

  render: function() {
    var notes = DB.getAll('notes').slice().sort(function(a,b) { return (b.pinned?1:0) - (a.pinned?1:0); });
    document.getElementById('pg-notes').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Notes</div><div class="pg-btn" onclick="Notes.openEditor()">+</div></div>' +
      (notes.length ? notes.map(function(n) {
        var preview = n.body ? n.body.substring(0, 80) + (n.body.length > 80 ? '...' : '') : '';
        var timeAgo = n.updatedAt ? Notes.timeAgo(n.updatedAt) : '';
        return '<div class="note" style="background:' + Notes.noteColor(n.color) + '" onclick="Notes.openEditor(\'' + n.id + '\')"><div class="note-t">' + (n.pinned?'📌 ':'') + DB.esc(n.title || 'Untitled') + '</div><div class="note-b">' + DB.esc(preview) + '</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">' + (n.tag?'<span class="note-tag">' + DB.esc(n.tag) + '</span>':'<span></span>') + '<span style="font-size:9px;color:var(--text3)">' + timeAgo + '</span></div></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">📝</div>Capture a thought</div>');
  },

  timeAgo: function(iso) {
    if (!iso) return '';
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff/60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins/60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs/24);
    if (days < 7) return days + 'd ago';
    return new Date(iso).toLocaleDateString('en-MY', {day:'numeric',month:'short'});
  },

  openEditor: function(id) {
    var n = id ? DB.get('notes', id) : null;
    var isNew = !n;
    var title = n ? DB.esc(n.title||'') : '';
    var body = n ? DB.esc(n.body||'') : '';
    var tag = n ? DB.esc(n.tag||'') : '';
    var pinLabel = n && n.pinned ? 'Unpin' : 'Pin';
    var colors = ['yellow','blue','purple','green'];
    var colorPicker = colors.map(function(c) {
      var active = n && n.color === c;
      return '<div onclick="Notes._setColor(\'' + c + '\')" style="width:24px;height:24px;border-radius:50%;background:' + Notes.noteColor(c) + ';border:2px solid ' + (active?'var(--accent)':'transparent') + ';cursor:pointer"></div>';
    }).join('');

    // Full-page editor experience
    var page = document.getElementById('pg-notes');
    page.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
      '<button class="back" onclick="Notes.render()">←</button>' +
      '<div style="display:flex;gap:6px">' +
        (n ? '<button style="border:none;background:none;font-size:14px;cursor:pointer;padding:4px" onclick="Notes.pin(\'' + (n?n.id:'') + '\')">' + (n&&n.pinned?'📌':'📍') + '</button>' : '') +
        '<button style="border:none;background:none;font-size:14px;cursor:pointer;padding:4px" onclick="Notes.saveFromEditor(\'' + (n?n.id:'') + '\')">💾</button>' +
        (n ? '<button style="border:none;background:none;font-size:14px;cursor:pointer;padding:4px" onclick="Notes.del(\'' + n.id + '\')">🗑</button>' : '') +
      '</div></div>' +
      '<input id="neTitle" value="' + title + '" placeholder="Title" style="width:100%;border:none;background:none;font-size:18px;font-weight:700;color:var(--text);outline:none;margin-bottom:8px;font-family:inherit">' +
      '<input id="neTag" value="' + tag + '" placeholder="Tag (optional)" style="width:100%;border:none;background:none;font-size:12px;color:var(--text3);outline:none;margin-bottom:12px;font-family:inherit">' +
      '<textarea id="neBody" placeholder="Start writing..." style="width:100%;border:none;background:none;font-size:15px;color:var(--text);outline:none;line-height:1.7;resize:none;min-height:50vh;font-family:inherit">' + body + '</textarea>' +
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-top:1px solid var(--border);margin-top:12px"><span style="font-size:10px;color:var(--text3)">Color:</span>' + colorPicker + '</div>';

    // Store current color for save
    Notes._editColor = n ? n.color : colors[Math.floor(Math.random()*colors.length)];
    Notes._editId = id || null;
  },

  _editColor: 'yellow',
  _editId: null,

  _setColor: function(c) {
    Notes._editColor = c;
    // Re-render color picker active state
    var dots = document.querySelectorAll('#pg-notes div[onclick*="_setColor"]');
    dots.forEach(function(d) { d.style.borderColor = 'transparent'; });
    event.target.style.borderColor = 'var(--accent)';
  },

  saveFromEditor: function(id) {
    var title = document.getElementById('neTitle').value.trim();
    var body = document.getElementById('neBody').value.trim();
    var tag = document.getElementById('neTag').value.trim();
    if (!title && !body) { toast('Write something'); return; }
    if (id) {
      var n = DB.get('notes', id);
      if (n) { n.title = title || 'Untitled'; n.body = body; n.tag = tag; n.color = Notes._editColor; n.updatedAt = new Date().toISOString(); DB.save(); }
    } else {
      DB.add('notes', { title: title || 'Untitled', body: body, tag: tag, color: Notes._editColor, pinned: false });
    }
    toast('Saved'); Notes.render();
  },

  pin: function(id) { var n = DB.get('notes', id); if (n) { n.pinned = !n.pinned; DB.save(); } Notes.render(); },
  del: function(id) { if (!confirm('Delete note?')) return; DB.remove('notes', id); toast('Deleted'); Notes.render(); }
};
