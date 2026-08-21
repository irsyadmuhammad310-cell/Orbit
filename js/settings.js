// js/settings.js — Theme, export, import, clear

var Settings = {
  render: function() {
    document.getElementById('pg-settings').innerHTML = '<div class="pg-h"><div class="back" onclick="App.go(\'more\')">←</div><div class="pg-t" style="flex:1">Settings</div></div>' +
      '<div class="set"><div class="set-h">Appearance</div><div class="set-r" onclick="App.cycleTheme()"><span class="set-l">Theme</span><span class="set-v">' + DB.store.settings.theme + '</span></div></div>' +
      '<div class="set"><div class="set-h">Data</div><div class="set-r" onclick="Settings.exportData()"><span class="set-l">Export backup</span><span class="set-v">↓</span></div><div class="set-r" onclick="Settings.importData()"><span class="set-l">Import backup</span><span class="set-v">↑</span></div><div class="set-r" onclick="DB.store.aiMsgs=[];DB.save();toast(\'Cleared\');Settings.render()"><span class="set-l">Clear AI history</span><span class="set-v">🗑</span></div><div class="set-r" onclick="Settings.clearAll()"><span class="set-l" style="color:var(--red)">Delete all data</span><span class="set-v">⚠</span></div></div>' +
      '<div class="set"><div class="set-h">System</div><div class="set-r" onclick="Settings.checkForUpdates()"><span class="set-l">Check for Updates</span><span class="set-v">🔄</span></div></div>' +
      '<div class="set"><div class="set-h">About</div><div class="set-r"><span class="set-l">Version</span><span class="set-v">1.5.4</span></div><div class="set-r"><span class="set-l">Tasks</span><span class="set-v">' + DB.getAll('tasks').length + '</span></div><div class="set-r"><span class="set-l">Projects</span><span class="set-v">' + DB.getAll('projects').length + '</span></div></div>';
  },

  exportData: function() {
    var blob = new Blob([DB.exportAll()], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'orbit-backup-' + DB.todayKey() + '.json';
    a.click();
    toast('Exported');
  },

  importData: function() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = function(e) {
      var f = e.target.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          if (!confirm('Overwrite current data?')) return;
          DB.importAll(ev.target.result);
          App.applyTheme();
          toast('Imported');
          App.go('home');
        } catch(err) { toast('Import failed'); }
      };
      reader.readAsText(f);
    };
    input.click();
  },

  clearAll: function() {
    if (!confirm('Delete ALL data?')) return;
    DB.clearAll();
    location.reload();
  },

  checkForUpdates: function() {
    toast('Checking for updates...');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(reg) { reg.unregister(); });
        return caches.keys();
      }).then(function(keys) {
        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
      }).then(function() {
        toast('✅ Cache cleared. Reloading...');
        setTimeout(function() { location.reload(true); }, 800);
      }).catch(function() { toast('❌ Update check failed'); });
    } else {
      location.reload(true);
    }
  }
};

// More page
var More = {
  render: function() {
    document.getElementById('pg-more').innerHTML = '<div class="pg-h"><div class="pg-t">More</div></div><div class="more">' +
      '<div class="more-item" onclick="App.go(\'goals\')"><div class="more-ic">🎯</div><div>Goals</div></div>' +
      '<div class="more-item" onclick="App.go(\'habits\')"><div class="more-ic">🔥</div><div>Habits</div></div>' +
      '<div class="more-item" onclick="App.go(\'notes\')"><div class="more-ic">📝</div><div>Notes</div></div>' +
      '<div class="more-item" onclick="App.go(\'reminders\')"><div class="more-ic">🔔</div><div>Reminders</div></div>' +
      '<div class="more-item" onclick="App.go(\'docs\')"><div class="more-ic">📄</div><div>Documents</div></div>' +
      '<div class="more-item" onclick="App.go(\'contacts\')"><div class="more-ic">👤</div><div>Contacts</div></div>' +
      '<div class="more-item" onclick="App.go(\'focus\')"><div class="more-ic">⏱</div><div>Focus</div></div>' +
      '<div class="more-item" onclick="App.go(\'search\')"><div class="more-ic">🔍</div><div>Search</div></div>' +
      '<div class="more-item" onclick="App.go(\'settings\')"><div class="more-ic">⚙️</div><div>Settings</div></div>' +
    '</div>';
  }
};
