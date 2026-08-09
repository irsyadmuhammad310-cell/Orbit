// js/settings.js — Profile, preferences, integrations, data management

const Settings = {
  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('page-settings');
    const s = DB.getSettings();

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Customize your workspace</p>
        </div>
      </div>

      <div class="settings-sections">
        <div class="settings-group">
          <div class="settings-group-title">Profile</div>
          ${this.row('Display Name', null, `<div class="setting-value">${s.displayName}</div>`)}
          ${this.row('Email', null, `<div class="setting-value">${s.email}</div>`)}
          ${this.row('Currency', 'Default for financial goals', `<div class="setting-value">${s.currency} (RM)</div>`)}
          ${this.row('Time Zone', null, `<div class="setting-value">${s.timezone}</div>`)}
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Preferences</div>
          ${this.row('Dark Mode', 'Switch to dark theme', this.toggle('darkMode', s.darkMode))}
          ${this.row('Daily Reminder', 'Push notification at 8:00 AM', this.toggle('dailyReminder', s.dailyReminder))}
          ${this.row('Week Starts On', null, `<div class="setting-value">${s.weekStartsOn === 'monday' ? 'Monday' : 'Sunday'}</div>`)}
          ${this.row('Show Completed Tasks', 'Display done tasks in lists', this.toggle('showCompleted', s.showCompleted))}
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Integrations</div>
          ${this.row('Google Calendar', 'Sync events bidirectionally', this.toggle('int_googleCalendar', s.integrations.googleCalendar))}
          ${this.row('GitHub', 'Link commits to tasks', this.toggle('int_github', s.integrations.github))}
          ${this.row('FinTrack', 'Pull financial goal progress', this.toggle('int_fintrack', s.integrations.fintrack))}
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Data</div>
          ${this.row('Export All Data', 'Download as JSON backup', '<button class="btn" onclick="Settings.exportData()">Export</button>')}
          ${this.row('Import Data', 'Restore from backup', '<button class="btn" onclick="Settings.importData()">Import</button>')}
          ${this.row('Delete All Data', 'Permanently remove everything', '<button class="btn" style="color:var(--red);border-color:var(--red-bg)" onclick="Settings.clearData()">Delete</button>')}
        </div>
      </div>
    `;
  },

  row(label, desc, control) {
    return `
      <div class="setting-row">
        <div>
          <div class="setting-label">${label}</div>
          ${desc ? `<div class="setting-desc">${desc}</div>` : ''}
        </div>
        ${control}
      </div>
    `;
  },

  toggle(key, isOn) {
    return `<div class="setting-toggle ${isOn ? 'on' : ''}" onclick="Settings.toggleSetting('${key}')"></div>`;
  },

  toggleSetting(key) {
    const s = DB.getSettings();

    if (key.startsWith('int_')) {
      const intKey = key.replace('int_', '');
      s.integrations[intKey] = !s.integrations[intKey];
    } else {
      s[key] = !s[key];
    }

    DB.saveSettings(s);
    this.render();

    // Apply dark mode immediately
    if (key === 'darkMode') {
      document.body.classList.toggle('dark', s.darkMode);
    }
  },

  exportData() {
    const data = DB.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          DB.importAll(ev.target.result);
          App.init(); // Reinitialize everything
          alert('Data imported successfully!');
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  clearData() {
    if (confirm('Are you sure? This will delete ALL your data permanently.')) {
      DB.clearAll();
      App.init();
    }
  },
};
