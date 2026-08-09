// js/search.js — Global search across all modules

var Search = {
  isOpen: false,
  query: '',
  results: [],

  init() {
    this.injectSearchUI();
    this.bindKeyboard();
  },

  injectSearchUI() {
    // Add search input to header
    const header = document.querySelector('.header-greeting');
    if (!header) return;

    const searchHTML = `
      <div class="search-container" id="searchContainer">
        <div class="search-input-wrap">
          <span class="search-icon">⌕</span>
          <input type="text" class="search-input" id="searchInput" 
                 placeholder="Search tasks, notes, goals... (Ctrl+K)"
                 oninput="Search.onInput(this.value)"
                 onfocus="Search.open()"
                 onblur="setTimeout(() => Search.close(), 200)">
          <kbd class="search-kbd">⌘K</kbd>
        </div>
        <div class="search-results" id="searchResults"></div>
      </div>
    `;
    header.insertAdjacentHTML('afterend', searchHTML);
  },

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
      // Escape to close
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        document.getElementById('searchInput')?.blur();
      }
    });
  },

  open() {
    this.isOpen = true;
    document.getElementById('searchContainer')?.classList.add('active');
    if (this.query) this.search(this.query);
  },

  close() {
    this.isOpen = false;
    document.getElementById('searchContainer')?.classList.remove('active');
  },

  onInput(value) {
    this.query = value.trim();
    if (this.query.length < 2) {
      this.clearResults();
      return;
    }
    this.search(this.query);
  },

  search(query) {
    const q = query.toLowerCase();
    const results = [];

    // Search Tasks
    const tasks = DB.getAll(DB.KEYS.TASKS);
    tasks.forEach(t => {
      if (t.name.toLowerCase().includes(q) ||
          (t.project && t.project.toLowerCase().includes(q))) {
        results.push({
          type: 'task',
          icon: t.completed ? '✅' : '☐',
          title: t.name,
          subtitle: `${t.project || 'Personal'} · ${t.priority || 'low'} priority`,
          action: () => { App.navigate('tasks'); },
        });
      }
    });

    // Search Goals
    const goals = DB.getAll(DB.KEYS.GOALS);
    goals.forEach(g => {
      if (g.name.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q))) {
        results.push({
          type: 'goal',
          icon: g.emoji || '🎯',
          title: g.name,
          subtitle: `${g.progress}% · ${g.category || 'General'}`,
          action: () => { App.navigate('goals'); },
        });
      }
    });

    // Search Projects
    const projects = DB.getAll(DB.KEYS.PROJECTS);
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))) {
        results.push({
          type: 'project',
          icon: '🚀',
          title: p.name,
          subtitle: `${p.status || 'active'}`,
          action: () => { App.navigate('projects'); },
        });
      }
    });

    // Search Notes
    const notes = DB.getAll(DB.KEYS.NOTES);
    notes.forEach(n => {
      if (n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          (n.tag && n.tag.toLowerCase().includes(q))) {
        results.push({
          type: 'note',
          icon: '📝',
          title: n.title,
          subtitle: `${n.tag || 'Personal'} · ${n.body.slice(0, 40)}...`,
          action: () => { App.navigate('notes'); Notes.enlarge(n.id); },
        });
      }
    });

    this.results = results;
    this.renderResults();
  },

  renderResults() {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (this.results.length === 0) {
      container.innerHTML = `
        <div class="search-empty">No results for "${this.query}"</div>
      `;
      return;
    }

    // Group by type
    const grouped = {};
    this.results.forEach(r => {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    });

    const typeLabels = { task: 'Tasks', goal: 'Goals', project: 'Projects', note: 'Notes' };

    let html = '';
    for (const [type, items] of Object.entries(grouped)) {
      html += `<div class="search-group-label">${typeLabels[type] || type}</div>`;
      items.slice(0, 5).forEach((item, i) => {
        html += `
          <div class="search-result-item" onclick="Search.results[${this.results.indexOf(item)}].action(); Search.close();">
            <span class="search-result-icon">${item.icon}</span>
            <div class="search-result-content">
              <div class="search-result-title">${this.highlight(item.title, this.query)}</div>
              <div class="search-result-subtitle">${item.subtitle}</div>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;
  },

  highlight(text, query) {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },

  clearResults() {
    const container = document.getElementById('searchResults');
    if (container) container.innerHTML = '';
  },
};
