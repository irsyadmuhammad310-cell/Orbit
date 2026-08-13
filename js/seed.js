// js/seed.js — Seed sample data on first load

var Seed = {
  run: function() {
    var d = function(n) { var x = new Date(); x.setDate(x.getDate() + n); x.setHours(12,0,0,0); return x.toISOString(); };

    DB.store.tasks = [
      { id:'t1', title:'Review FinTrack V1.0.2 deploy', desc:'Check modules after IDB migration', due:d(0), pri:'high', status:'active', projId:'p1', cat:'Dev', rec:null, lifeArea:'Career' },
      { id:'t2', title:'Gym session (Push day)', desc:'', due:d(0), pri:'medium', status:'active', projId:null, cat:'Health', rec:'weekly', lifeArea:'Health' },
      { id:'t3', title:'Call bank about credit card', desc:'Fee waiver', due:d(1), pri:'high', status:'active', projId:null, cat:'Admin', rec:null, lifeArea:'Finance' },
      { id:'t4', title:'Design Orbit navigation', desc:'Bottom nav', due:d(2), pri:'medium', status:'active', projId:'p3', cat:'Dev', rec:null, lifeArea:'Career' },
      { id:'t5', title:'Buy groceries', desc:'Rice, chicken, eggs', due:d(0), pri:'low', status:'active', projId:null, cat:'Personal', rec:null, lifeArea:'Personal' },
      { id:'t6', title:'Godot Week 4: UI & Menus', desc:'HUD', due:d(-1), pri:'high', status:'active', projId:'p2', cat:'Game Dev', rec:null, lifeArea:'Career' },
      { id:'t7', title:'Transfer RM 800 emergency fund', desc:'', due:d(3), pri:'medium', status:'active', projId:null, cat:'Finance', rec:'monthly', lifeArea:'Finance' },
      { id:'t8', title:'Update website copy', desc:'About section', due:d(5), pri:'low', status:'active', projId:'p4', cat:'Dev', rec:null, lifeArea:'Career' },
      { id:'t9', title:'Renew car insurance', desc:'Compare quotes', due:d(7), pri:'high', status:'active', projId:null, cat:'Admin', rec:null, lifeArea:'Finance' },
      { id:'t10', title:'Weekly planning', desc:'', due:d(4), pri:'medium', status:'active', projId:null, cat:'Productivity', rec:'weekly', lifeArea:'Personal' }
    ];

    DB.store.projects = [
      { id:'p1', name:'FinTrack Premium', desc:'Finance PWA.', status:'active', lifeArea:'Career', milestones:[] },
      { id:'p2', name:'Iron Vow', desc:'SRPG in Godot 4.', status:'active', lifeArea:'Career', milestones:[] },
      { id:'p3', name:'Orbit', desc:'Personal AI PA.', status:'active', lifeArea:'Career', milestones:[] },
      { id:'p4', name:'Personal Website', desc:'Portfolio.', status:'active', lifeArea:'Career', milestones:[] },
      { id:'p5', name:'Career Dev', desc:'Certs.', status:'planning', lifeArea:'Career', milestones:[] }
    ];

    DB.store.goals = [
      { id:'g1', name:'Emergency Fund RM 15K', emoji:'💰', progress:68, deadline:'Dec 2026', lifeArea:'Finance' },
      { id:'g2', name:'Iron Vow Demo', emoji:'🎮', progress:35, deadline:'Sep 2026', lifeArea:'Career' },
      { id:'g3', name:'70kg @ 15% BF', emoji:'🏋️', progress:50, deadline:'Dec 2026', lifeArea:'Health' },
      { id:'g4', name:'Ship Orbit V1', emoji:'🛸', progress:15, deadline:'Sep 2026', lifeArea:'Career' }
    ];

    DB.store.habits = [
      { id:'h1', name:'Gym', icon:'🏋️', lifeArea:'Health' },
      { id:'h2', name:'Read 30 min', icon:'📚', lifeArea:'Learning' },
      { id:'h3', name:'Code 1 hour', icon:'💻', lifeArea:'Career' },
      { id:'h4', name:'Mandarin', icon:'🇨🇳', lifeArea:'Learning' }
    ];

    // Seed habit logs for past 14 days
    DB.store.habitLogs = {};
    for (var i = 1; i <= 14; i++) {
      var x = new Date(); x.setDate(x.getDate() - i);
      var dk = DB.dateKey(x);
      DB.store.habits.forEach(function(h) {
        if (Math.random() > 0.3) DB.store.habitLogs[h.id + '_' + dk] = true;
      });
    }

    DB.store.notes = [
      { id:'n1', title:'💡 ERP Idea', body:'SME invoicing. Supabase.', tag:'Business', color:'yellow', pinned:true },
      { id:'n2', title:'🔧 Supabase', body:'Postgres + RLS.', tag:'FinTrack', color:'blue', pinned:false },
      { id:'n3', title:'⚔️ Combat', body:'Square grid. Weapon triangle.', tag:'Iron Vow', color:'purple', pinned:false },
      { id:'n4', title:'💰 Budget Rule', body:'Save RM 800 first.', tag:'Finance', color:'green', pinned:true }
    ];

    DB.store.events = [
      { id:'e1', title:'Gym', date:d(0), time:'18:00', endTime:'19:30', location:'', color:'#f59e0b' },
      { id:'e2', title:'Dentist', date:d(2), time:'10:00', endTime:'11:00', location:'KPJ', color:'#3b82f6' },
      { id:'e3', title:'Standup', date:d(1), time:'09:30', endTime:'10:00', location:'', color:'#22c55e' }
    ];

    DB.store.reminders = [
      { id:'r1', title:'Renew car insurance', date:d(7), time:'09:00', done:false },
      { id:'r2', title:'Transfer emergency fund', date:d(3), time:'10:00', done:false }
    ];

    DB.store.documents = [
      { id:'d1', name:'Passport', category:'Identity', expiry:'2028-03-14', notes:'Malaysia' },
      { id:'d2', name:'Driving License', category:'Identity', expiry:'2027-01-30', notes:'' },
      { id:'d3', name:'Car Insurance', category:'Insurance', expiry:d(7).split('T')[0], notes:'Renewal upcoming' }
    ];

    DB.store.contacts = [
      { id:'c1', name:'Ahmad', phone:'', email:'', org:'', role:'Friend', notes:'Uni friend', tags:['friend'], lastContact:d(-14), nextFollowUp:d(7), lifeArea:'Relationships' },
      { id:'c2', name:'Sarah (HR)', phone:'', email:'', org:'Company', role:'Colleague', notes:'', tags:['work'], lastContact:d(-5), nextFollowUp:null, lifeArea:'Career' }
    ];

    DB.store.expenses = [
      { id:'x1', title:'Netflix', amount:45, currency:'MYR', type:'subscription', freq:'monthly', nextDate:d(15), category:'Entertainment', projId:null },
      { id:'x2', title:'Phone Bill', amount:85, currency:'MYR', type:'subscription', freq:'monthly', nextDate:d(2), category:'Utilities', projId:null },
      { id:'x3', title:'GitHub Pro', amount:16, currency:'MYR', type:'subscription', freq:'monthly', nextDate:d(20), category:'Software', projId:null }
    ];

    DB.store.focusSessions = [];
    DB.store.aiMsgs = [];
    DB.save();
    console.log('Orbit: seeded!');
  }
};
