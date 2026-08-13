// js/data.js — Data layer for Orbit
// All data stored under 'orbit_v1' key in localStorage
// MUST load first in index.html

var DB = {
  KEY: 'orbit_v1',
  FALLBACK_KEY: 'orbit_v11', // migration from older builds

  // Default store structure
  defaultStore: function() {
    return {
      tasks: [],
      projects: [],
      goals: [],
      habits: [],
      habitLogs: {},
      notes: [],
      events: [],
      reminders: [],
      documents: [],
      focusSessions: [],
      contacts: [],
      expenses: [],
      settings: { name: 'Irsyad', theme: 'system', onboarded: true },
      aiMsgs: []
    };
  },

  // In-memory store
  store: null,

  // Load from localStorage
  load: function() {
    try {
      var raw = localStorage.getItem(this.KEY) || localStorage.getItem(this.FALLBACK_KEY);
      if (raw) {
        this.store = JSON.parse(raw);
        // Ensure all arrays exist (migration safety)
        var def = this.defaultStore();
        Object.keys(def).forEach(function(k) {
          if (this.store[k] === undefined) this.store[k] = def[k];
        }.bind(this));
        return true;
      }
    } catch(e) { console.error('Orbit: load failed', e); }
    return false;
  },

  // Save to localStorage
  save: function() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.store)); } catch(e) {}
  },

  // Generate unique ID
  uid: function() { return Math.random().toString(36).slice(2, 10); },

  // Get all items from a collection
  getAll: function(collection) { return this.store[collection] || []; },

  // Get by ID
  get: function(collection, id) {
    return (this.store[collection] || []).find(function(x) { return x.id === id; }) || null;
  },

  // Add item
  add: function(collection, item) {
    if (!item.id) item.id = this.uid();
    if (!item.createdAt) item.createdAt = new Date().toISOString();
    this.store[collection].push(item);
    this.save();
    return item;
  },

  // Update item
  update: function(collection, id, updates) {
    var items = this.store[collection];
    var idx = items.findIndex(function(x) { return x.id === id; });
    if (idx === -1) return null;
    Object.assign(items[idx], updates);
    this.save();
    return items[idx];
  },

  // Remove item
  remove: function(collection, id) {
    this.store[collection] = this.store[collection].filter(function(x) { return x.id !== id; });
    this.save();
  },

  // Export all data
  exportAll: function() {
    return JSON.stringify({ version: '1.1.1', exportedAt: new Date().toISOString(), data: this.store }, null, 2);
  },

  // Import data
  importAll: function(json) {
    var raw = JSON.parse(json);
    if (!raw.data || !raw.data.tasks) throw new Error('Invalid backup');
    this.store = raw.data;
    var def = this.defaultStore();
    Object.keys(def).forEach(function(k) {
      if (this.store[k] === undefined) this.store[k] = def[k];
    }.bind(this));
    this.save();
  },

  // Clear all
  clearAll: function() {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.FALLBACK_KEY);
  },

  // Helpers
  dateKey: function(d) { return d.toISOString().split('T')[0]; },
  todayKey: function() { return this.dateKey(new Date()); },
  daysBetween: function(iso) {
    if (!iso) return 999;
    var d = new Date(iso), n = new Date();
    n.setHours(0,0,0,0); d.setHours(0,0,0,0);
    return Math.round((d - n) / 86400000);
  },
  fmtDue: function(iso) {
    var diff = this.daysBetween(iso);
    if (diff < 0) return Math.abs(diff) + 'd overdue';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff <= 6) return new Date(iso).toLocaleDateString('en-MY', { weekday: 'short' });
    return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
  },
  dueClass: function(iso) {
    var diff = this.daysBetween(iso);
    if (diff < 0) return 'b-r';
    if (diff === 0) return 'b-o';
    if (diff <= 3) return 'b-b';
    return '';
  },
  priColor: function(p) {
    return { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--blue)', low: 'var(--text3)' }[p] || 'var(--text3)';
  },
  esc: function(s) { return s ? s.replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; },
  projName: function(id) {
    var p = this.get('projects', id);
    return p ? p.name : '';
  }
};
