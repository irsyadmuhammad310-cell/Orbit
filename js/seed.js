// js/seed.js — Empty app (no sample data)
// New users start with a clean slate

var Seed = {
  run: function() {
    // No seed data. User starts fresh.
    DB.store.tasks = [];
    DB.store.projects = [];
    DB.store.goals = [];
    DB.store.habits = [];
    DB.store.habitLogs = {};
    DB.store.notes = [];
    DB.store.events = [];
    DB.store.reminders = [];
    DB.store.documents = [];
    DB.store.contacts = [];
    DB.store.expenses = [];
    DB.store.focusSessions = [];
    DB.store.aiMsgs = [];
    DB.save();
    console.log('Orbit: ready (empty)');
  }
};
