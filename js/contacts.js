// js/contacts.js — Contacts CRM with groups, details, interaction history

var Contacts = {
  render: function() {
    var contacts = DB.getAll('contacts');
    // Group by first letter
    var grouped = {};
    contacts.forEach(function(c) { var letter = c.name.charAt(0).toUpperCase(); if (!grouped[letter]) grouped[letter] = []; grouped[letter].push(c); });
    var letters = Object.keys(grouped).sort();

    var listHtml = '';
    if (contacts.length) {
      letters.forEach(function(letter) {
        listHtml += '<div class="sec">' + letter + '</div>';
        grouped[letter].forEach(function(c) {
          var followUp = c.nextFollowUp && DB.daysBetween(c.nextFollowUp) <= 7 ? '<span class="badge b-o">Follow up</span>' : '';
          var lastDays = c.lastContact ? Math.abs(DB.daysBetween(c.lastContact)) + 'd ago' : '';
          listHtml += '<div class="tsk" onclick="Contacts.view(\'' + c.id + '\')"><div style="width:36px;height:36px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">' + c.name.charAt(0).toUpperCase() + '</div><div style="flex:1;min-width:0"><div class="tt">' + DB.esc(c.name) + '</div><div class="tm">' + DB.esc(c.role||'') + (c.org ? ' · ' + DB.esc(c.org) : '') + (lastDays ? ' · ' + lastDays : '') + '</div></div>' + followUp + '</div>';
        });
      });
    } else {
      listHtml = '<div class="empty"><div class="empty-ic">👤</div>Add your contacts</div>';
    }

    document.getElementById('pg-contacts').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Contacts</div><div class="pg-btn" onclick="Contacts.openForm()">+</div></div>' + listHtml;
  },

  openForm: function() {
    openSheet('<div class="sheet-title">New Contact</div><div class="fg"><label class="fl">Name *</label><input class="fi" id="cn" placeholder="Full name"></div><div class="fr"><div class="fg"><label class="fl">Role</label><input class="fi" id="cr" placeholder="Friend / Colleague"></div><div class="fg"><label class="fl">Organization</label><input class="fi" id="co" placeholder="Company"></div></div><div class="fr"><div class="fg"><label class="fl">Phone</label><input class="fi" id="cp" type="tel" placeholder="+60..."></div><div class="fg"><label class="fl">Email</label><input class="fi" id="ce" type="email" placeholder="email"></div></div><div class="fg"><label class="fl">Birthday</label><input class="fi" id="cbd" type="date"></div><div class="fg"><label class="fl">Life Area</label><select class="fs" id="cla"><option value="Relationships">Relationships</option><option value="Career">Career</option><option value="Personal">Personal</option></select></div><div class="fg"><label class="fl">Notes</label><textarea class="ft" id="cno" placeholder="How you met, interests, etc"></textarea></div><button class="btn" onclick="Contacts.saveNew()">Add Contact</button>');
  },

  saveNew: function() {
    var n = document.getElementById('cn').value.trim();
    if (!vReq(n, 'Enter name')) return;
    DB.add('contacts', { name: n, role: document.getElementById('cr').value.trim(), org: document.getElementById('co').value.trim(), phone: document.getElementById('cp').value.trim(), email: document.getElementById('ce').value.trim(), birthday: document.getElementById('cbd').value || null, notes: document.getElementById('cno').value.trim(), lifeArea: document.getElementById('cla').value, tags: [], lastContact: new Date().toISOString(), nextFollowUp: null, interactions: [] });
    closeSheet(); toast('Contact added'); this.render();
  },

  view: function(id) {
    var c = DB.get('contacts', id); if (!c) return;
    if (!c.interactions) c.interactions = [];
    var interHtml = c.interactions.length ? c.interactions.slice(-5).reverse().map(function(i) {
      return '<div style="padding:4px 0;font-size:11px;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">' + (i.date||'').split('T')[0] + '</span> ' + DB.esc(i.note) + '</div>';
    }).join('') : '<div style="font-size:11px;color:var(--text3)">No interactions logged</div>';

    openSheet('<div class="sheet-title">' + DB.esc(c.name) + '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">' +
        (c.phone ? '<a href="tel:' + c.phone + '" style="padding:8px 14px;background:var(--greenBg);color:var(--green);border-radius:8px;font-size:12px;font-weight:600;text-decoration:none">📞 Call</a>' : '') +
        (c.email ? '<a href="mailto:' + c.email + '" style="padding:8px 14px;background:var(--blueBg);color:var(--blue);border-radius:8px;font-size:12px;font-weight:600;text-decoration:none">✉️ Email</a>' : '') +
      '</div>' +
      '<div class="fg"><label class="fl">Name</label><input class="fi" id="ecn" value="' + DB.esc(c.name) + '"></div>' +
      '<div class="fr"><div class="fg"><label class="fl">Role</label><input class="fi" id="ecr" value="' + DB.esc(c.role||'') + '"></div><div class="fg"><label class="fl">Org</label><input class="fi" id="eco" value="' + DB.esc(c.org||'') + '"></div></div>' +
      '<div class="fr"><div class="fg"><label class="fl">Phone</label><input class="fi" id="ecp" value="' + DB.esc(c.phone||'') + '"></div><div class="fg"><label class="fl">Email</label><input class="fi" id="ece" value="' + DB.esc(c.email||'') + '"></div></div>' +
      '<div class="fg"><label class="fl">Birthday</label><input class="fi" id="ecbd" type="date" value="' + (c.birthday||'') + '"></div>' +
      '<div class="fg"><label class="fl">Follow-up date</label><input class="fi" id="ecf" type="date" value="' + (c.nextFollowUp?c.nextFollowUp.split('T')[0]:'') + '"></div>' +
      '<div class="fg"><label class="fl">Notes</label><textarea class="ft" id="ecno">' + DB.esc(c.notes||'') + '</textarea></div>' +
      '<div class="sec">Interactions</div>' + interHtml +
      '<div style="margin-top:8px"><input class="fi" id="ecint" placeholder="Log interaction (met, called, etc)" style="font-size:12px"><button style="margin-top:6px;border:none;background:var(--accentLight);color:var(--accent);padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer" onclick="Contacts.logInteraction(\'' + c.id + '\')">+ Log</button></div>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn" onclick="Contacts.saveEdit(\'' + c.id + '\')">Save</button><button class="btn btn-red" onclick="Contacts.del(\'' + c.id + '\')">Delete</button></div>');
  },

  logInteraction: function(id) {
    var c = DB.get('contacts', id); if (!c) return;
    var note = document.getElementById('ecint').value.trim();
    if (!note) { toast('Type something'); return; }
    if (!c.interactions) c.interactions = [];
    c.interactions.push({ date: new Date().toISOString(), note: note });
    c.lastContact = new Date().toISOString();
    DB.save(); toast('Logged'); closeSheet(); this.view(id);
  },

  saveEdit: function(id) {
    var c = DB.get('contacts', id); if (!c) return;
    c.name = document.getElementById('ecn').value.trim() || c.name;
    c.role = document.getElementById('ecr').value.trim();
    c.org = document.getElementById('eco').value.trim();
    c.phone = document.getElementById('ecp').value.trim();
    c.email = document.getElementById('ece').value.trim();
    c.birthday = document.getElementById('ecbd').value || null;
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
