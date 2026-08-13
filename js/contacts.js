// js/contacts.js — Contacts CRM with follow-up reminders

var Contacts = {
  render: function() {
    var contacts = DB.getAll('contacts');
    document.getElementById('pg-contacts').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Contacts</div><div class="pg-btn" onclick="Contacts.openForm()">+</div></div>' +
      (contacts.length ? contacts.map(function(c) {
        var lastDays = c.lastContact ? Math.abs(DB.daysBetween(c.lastContact)) + 'd ago' : 'Never';
        return '<div class="tsk" onclick="Contacts.view(\'' + c.id + '\')"><div style="width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">' + c.name.charAt(0).toUpperCase() + '</div><div style="flex:1"><div class="tt">' + DB.esc(c.name) + '</div><div class="tm">' + DB.esc(c.role||'') + ' · Last: ' + lastDays + '</div></div></div>';
      }).join('') : '<div class="empty"><div class="empty-ic">👤</div>No contacts</div>');
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Contact</div><div class="fg"><label class="fl">Name</label><input class="fi" id="cn" placeholder="Ahmad"></div><div class="fr"><div class="fg"><label class="fl">Role</label><input class="fi" id="cr" placeholder="Friend"></div><div class="fg"><label class="fl">Organization</label><input class="fi" id="co" placeholder="Optional"></div></div><div class="fg"><label class="fl">Phone</label><input class="fi" id="cp" placeholder="Optional"></div><div class="fg"><label class="fl">Email</label><input class="fi" id="ce" placeholder="Optional"></div><div class="fg"><label class="fl">Notes</label><input class="fi" id="cno" placeholder="How you met, etc"></div><button class="btn" onclick="Contacts.saveNew()">Add Contact</button>');
  },

  saveNew: function() {
    var n = document.getElementById('cn').value.trim();
    if (!vReq(n, 'Enter name')) return;
    DB.add('contacts', { name: n, role: document.getElementById('cr').value.trim(), org: document.getElementById('co').value.trim(), phone: document.getElementById('cp').value.trim(), email: document.getElementById('ce').value.trim(), notes: document.getElementById('cno').value.trim(), tags: [], lastContact: new Date().toISOString(), nextFollowUp: null, lifeArea: 'Relationships' });
    closeSheet(); toast('Contact added'); this.render();
  },

  view: function(id) {
    var c = DB.get('contacts', id); if (!c) return;
    openSheet('<div class="sheet-title">' + DB.esc(c.name) + '</div><div class="fg"><label class="fl">Name</label><input class="fi" id="ecn" value="' + DB.esc(c.name) + '"></div><div class="fg"><label class="fl">Role</label><input class="fi" id="ecr" value="' + DB.esc(c.role||'') + '"></div><div class="fg"><label class="fl">Notes</label><input class="fi" id="ecno" value="' + DB.esc(c.notes||'') + '"></div><div class="fg"><label class="fl">Follow-up date</label><input class="fi" id="ecf" type="date" value="' + (c.nextFollowUp?c.nextFollowUp.split('T')[0]:'') + '"></div><div class="btn-row"><button class="btn" onclick="Contacts.saveEdit(\'' + c.id + '\')">Save</button><button class="btn btn-red" onclick="Contacts.del(\'' + c.id + '\')">Delete</button></div>');
  },

  saveEdit: function(id) {
    var c = DB.get('contacts', id); if (!c) return;
    c.name = document.getElementById('ecn').value.trim() || c.name;
    c.role = document.getElementById('ecr').value.trim();
    c.notes = document.getElementById('ecno').value.trim();
    var f = document.getElementById('ecf').value;
    c.nextFollowUp = f ? new Date(f+'T12:00:00').toISOString() : null;
    DB.save(); closeSheet(); toast('Updated'); this.render();
  },

  del: function(id) {
    if (!confirm('Delete contact?')) return;
    DB.remove('contacts', id); closeSheet(); toast('Deleted'); this.render();
  }
};
