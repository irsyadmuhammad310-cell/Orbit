// js/data.js — localStorage data layer for Orbit
// All data stored under 'orbit_' prefix

const DB = {
  KEYS: {
    TASKS: 'orbit_tasks',
    GOALS: 'orbit_goals',
    PROJECTS: 'orbit_projects',
    NOTES: 'orbit_notes',
    EVENTS: 'orbit_events',
    SETTINGS: 'orbit_settings',
  },

  // Generic CRUD
  getAll(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },

  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  getById(key, id) {
    return this.getAll(key).find(item => item.id === id) || null;
  },

  add(key, item) {
    const items = this.getAll(key);
    item.id = item.id || crypto.randomUUID();
    item.createdAt = item.createdAt || new Date().toISOString();
    items.push(item);
    this.save(key, items);
    return item;
  },

  update(key, id, updates) {
    const items = this.getAll(key);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save(key, items);
    return items[idx];
  },

  remove(key, id) {
    const items = this.getAll(key).filter(i => i.id !== id);
    this.save(key, items);
  },

  // Settings (single object, not array)
  getSettings() {
    const raw = localStorage.getItem(this.KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : this.defaultSettings();
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  defaultSettings() {
    return {
      displayName: 'Muhammad Irsyad',
      email: 'irsyad***@gmail.com',
      currency: 'MYR',
      timezone: 'Asia/Kuala_Lumpur',
      darkMode: false,
      dailyReminder: true,
      weekStartsOn: 'monday',
      showCompleted: true,
      integrations: { googleCalendar: true, github: true, fintrack: false },
    };
  },

  // Export / Import
  exportAll() {
    const data = {};
    Object.values(this.KEYS).forEach(key => {
      data[key] = localStorage.getItem(key);
    });
    return JSON.stringify(data, null, 2);
  },

  importAll(json) {
    const data = JSON.parse(json);
    Object.entries(data).forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value);
    });
  },

  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  },
};
