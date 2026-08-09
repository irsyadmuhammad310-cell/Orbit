// js/seed.js — Seed sample data on first load

(function() {
  if (localStorage.getItem(DB.KEYS.GOALS)) return; // Already seeded

  var now = new Date().toISOString();
  function daysFromNow(d) {
    var dt = new Date();
    dt.setDate(dt.getDate() + d);
    return dt.toISOString();
  }

  DB.save(DB.KEYS.GOALS, [
    { id: 'g1', name: 'Emergency Fund RM 15,000', emoji: '💰', description: 'Auto-save RM 800/month.', progress: 68, color: 'var(--green)', bgColor: 'var(--green-bg)', category: 'Finance', deadline: 'Dec 2026', createdAt: now },
    { id: 'g2', name: 'Iron Vow: Playable Demo', emoji: '🎮', description: 'Godot + combat + 1 map.', progress: 35, color: 'var(--purple)', bgColor: 'var(--purple-bg)', category: 'Game Dev', deadline: 'Sep 2026', createdAt: now },
    { id: 'g3', name: 'FinTrack V2.0', emoji: '📱', description: 'Backend + sync + Play Store.', progress: 15, color: 'var(--blue)', bgColor: 'var(--blue-bg)', category: 'Dev', deadline: 'Ongoing', createdAt: now },
    { id: 'g4', name: 'Fitness: 70kg @ 15% BF', emoji: '🏋️', description: 'Gym 4x/week. Current 74kg.', progress: 50, color: 'var(--orange)', bgColor: 'var(--orange-bg)', category: 'Health', deadline: 'Dec 2026', createdAt: now }
  ]);

  DB.save(DB.KEYS.TASKS, [
    { id: 't1', name: 'Fix eye toggle persistence', project: 'FinTrack', priority: 'high', dueDate: daysFromNow(0), completed: false, goalId: 'g3', createdAt: now },
    { id: 't2', name: 'Godot Week 3: Signals & Scenes', project: 'Iron Vow', priority: 'high', dueDate: daysFromNow(-1), completed: false, goalId: 'g2', createdAt: now },
    { id: 't3', name: 'Research Supabase for backend', project: 'FinTrack V2', priority: 'medium', dueDate: daysFromNow(2), completed: false, goalId: 'g3', createdAt: now },
    { id: 't4', name: 'Transfer RM 800 to emergency fund', project: 'Finance', priority: 'medium', dueDate: daysFromNow(4), completed: false, goalId: 'g1', recurrence: { type: 'monthly', interval: 1 }, createdAt: now },
    { id: 't5', name: 'Design pixel art tileset', project: 'Iron Vow', priority: 'low', dueDate: daysFromNow(6), completed: false, goalId: 'g2', createdAt: now },
    { id: 't6', name: 'Gym session', project: 'Health', priority: 'medium', dueDate: daysFromNow(1), completed: false, goalId: 'g4', recurrence: { type: 'weekly', interval: 1 }, createdAt: now },
    { id: 't7', name: 'Deploy FinTrack V1.0.1', project: 'FinTrack', priority: 'high', dueDate: daysFromNow(-2), completed: true, completedAt: now, goalId: 'g3', createdAt: now }
  ]);

  DB.save(DB.KEYS.PROJECTS, [
    { id: 'p1', name: 'FinTrack Premium', description: 'Personal finance PWA. V1.0.1 live.', status: 'active', files: 14, createdAt: now },
    { id: 'p2', name: 'Iron Vow', description: 'Tactical SRPG in Godot 4.', status: 'in progress', files: 2, createdAt: now },
    { id: 'p3', name: 'Personal ERP', description: 'Future business management system.', status: 'planning', files: 1, createdAt: now }
  ]);

  DB.save(DB.KEYS.NOTES, [
    { id: 'n1', title: '💡 ERP Business Idea', body: 'SME invoicing + inventory. Keep simple.', tag: 'Business', color: 'yellow', createdAt: now },
    { id: 'n2', title: '🔧 Supabase Notes', body: 'Postgres + RLS for FinTrack V2.', tag: 'FinTrack', color: 'blue', createdAt: now },
    { id: 'n3', title: '⚔️ Combat Design', body: 'Square grid. Weapon triangle. Permadeath.', tag: 'Iron Vow', color: 'purple', createdAt: now },
    { id: 'n4', title: '💰 Budget Reminder', body: 'Save RM 800 first, spend after.', tag: 'Finance', color: 'green', createdAt: now },
    { id: 'n5', title: '🏋️ Gym Split', body: 'Push/Pull/Legs/Rest. Protein 118g.', tag: 'Health', color: 'orange', createdAt: now }
  ]);

  console.log('Orbit: Sample data seeded!');
})();
