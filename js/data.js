// js/data.js — Data layer for Orbit
// DUAL-WRITE: IndexedDB (primary) + localStorage (backup)
// In-memory _store populated from IDB on boot, fallback to localStorage
// MUST load first in index.html. Boot is ASYNC (App.init waits for DB.boot())

var DB = {
  // IndexedDB config
  IDB_NAME: 'OrbitDB',
  IDB_VERSION: 1,
  IDB_STORE: 'orbit_data',
  IDB_KEY: 'main',

  // localStorage keys (backup + migration)
  LS_KEY: 'orbit_v1',
  LS_FALLBACK: 'orbit_v11',

  // In-memory store (all reads come from here)
  store: null,
  _db: null, // IDB instance

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

  // ===== IndexedDB Operations =====
  openIDB: function() {
    return new Promise(function(resolve, reject) {
      var request = indexedDB.open(DB.IDB_NAME, DB.IDB_VERSION);
      request.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(DB.IDB_STORE)) {
          db.createObjectStore(DB.IDB_STORE);
        }
      };
      request.onsuccess = function(e) {
        DB._db = e.target.result;
        resolve(DB._db);
      };
      request.onerror = function(e) {
        console.error('Orbit IDB: open failed', e);
        reject(e);
      };
    });
  },

  idbGet: function() {
    return new Promise(function(resolve, reject) {
      if (!DB._db) { resolve(null); return; }
      var tx = DB._db.transaction(DB.IDB_STORE, 'readonly');
      var store = tx.objectStore(DB.IDB_STORE);
      var req = store.get(DB.IDB_KEY);
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function() { resolve(null); };
    });
  },

  idbSet: function(data) {
    return new Promise(function(resolve, reject) {
      if (!DB._db) { resolve(); return; }
      var tx = DB._db.transaction(DB.IDB_STORE, 'readwrite');
      var store = tx.objectStore(DB.IDB_STORE);
      store.put(data, DB.IDB_KEY);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    });
  },

  // ===== Boot (async) =====
  boot: function() {
    return DB.openIDB().then(function() {
      return DB.idbGet();
    }).then(function(idbData) {
      if (idbData) {
        DB.store = idbData;
        DB._ensureSchema();
        console.log('Orbit: loaded from IndexedDB');
        return true;
      }
      return DB._loadFromLS();
    }).catch(function(err) {
      console.error('Orbit: IDB boot failed, fallback to localStorage', err);
      return DB._loadFromLS();
    });
  },

  _loadFromLS: function() {
    try {
      var raw = localStorage.getItem(DB.LS_KEY) || localStorage.getItem(DB.LS_FALLBACK);
      if (raw) {
        DB.store = JSON.parse(raw);
        DB._ensureSchema();
        DB.idbSet(DB.store); // Migrate to IDB
        console.log('Orbit: migrated from localStorage to IndexedDB');
        return true;
      }
    } catch(e) { console.error('Orbit: localStorage read failed', e); }
    return false;
  },

  _ensureSchema: function() {
    var def = DB.defaultStore();
    Object.keys(def).forEach(function(k) {
      if (DB.store[k] === undefined) DB.store[k] = def[k];
    });
  },

  // ===== DUAL-WRITE Save =====
  // Writes to BOTH IndexedDB and localStorage simultaneously
  // Never clears localStorage (same rule as FinTrack)
  save: function() {
    DB.idbSet(DB.store); // async, non-blocking
    try { localStorage.setItem(DB.LS_KEY, JSON.stringify(DB.store)); } catch(e) {}
  },

  // ===== CRUD (reads from in-memory store) =====
  uid: function() { if (crypto.randomUUID) return crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }); },

  getAll: function(collection) { return this.store[collection] || []; },

  get: function(collection, id) {
    return (this.store[collection] || []).find(function(x) { return x.id === id; }) || null;
  },

  add: function(collection, item) {
    if (!item.id) item.id = this.uid();
    if (!item.createdAt) item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    this.store[collection].push(item);
    this.save();
    return item;
  },

  update: function(collection, id, updates) {
    var items = this.store[collection];
    var idx = items.findIndex(function(x) { return x.id === id; });
    if (idx === -1) return null;
    Object.assign(items[idx], updates);
    items[idx].updatedAt = new Date().toISOString();
    this.save();
    return items[idx];
  },

  remove: function(collection, id) {
    this.store[collection] = this.store[collection].filter(function(x) { return x.id !== id; });
    this.save();
  },

  // ===== Export / Import =====
  exportAll: function() {
    return JSON.stringify({ version: '1.5.0', exportedAt: new Date().toISOString(), data: this.store }, null, 2);
  },

  importAll: function(json) {
    var raw = JSON.parse(json);
    if (!raw.data || !raw.data.tasks) throw new Error('Invalid backup');
    this.store = raw.data;
    this._ensureSchema();
    this.save();
  },

  clearAll: function() {
    localStorage.removeItem(this.LS_KEY);
    localStorage.removeItem(this.LS_FALLBACK);
    if (this._db) {
      var tx = this._db.transaction(this.IDB_STORE, 'readwrite');
      var req = tx.objectStore(this.IDB_STORE).delete(this.IDB_KEY);
      req.onsuccess = function() { console.log('Orbit: IDB cleared'); };
    }
    this.store = this.defaultStore();
  },

  // ===== Helpers =====
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
  esc: function(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; },
  projName: function(id) {
    var p = this.get('projects', id);
    return p ? p.name : '';
  }
};
