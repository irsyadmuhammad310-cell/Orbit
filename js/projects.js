// js/projects.js — Project cards, stats, status tracking

const Projects = {
  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('page-projects');
    const projects = DB.getAll(DB.KEYS.PROJECTS);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Projects</h1>
          <p class="page-subtitle">Active projects and their progress</p>
        </div>
        <button class="btn btn--primary" onclick="Projects.openAddModal()">+ New Project</button>
      </div>

      <div class="projects-grid">
        ${projects.map(p => this.renderProject(p)).join('')}
      </div>
    `;
  },

  renderProject(p) {
    const tasks = DB.getAll(DB.KEYS.TASKS).filter(t => t.project === p.name);
    const done = tasks.filter(t => t.completed).length;
    const active = tasks.filter(t => !t.completed).length;

    const statusColors = {
      active: 'var(--green)',
      'in progress': 'var(--orange)',
      planning: 'var(--blue)',
      paused: 'var(--text-tertiary)',
    };

    return `
      <div class="project-card" onclick="Projects.openDetail('${p.id}')">
        <div class="project-name">
          <span class="project-status-dot" style="background:${statusColors[p.status] || 'var(--green)'}"></span>
          ${p.name}
        </div>
        <div class="project-desc">${p.description || ''}</div>
        <div class="project-stats">
          <div class="project-stat">
            <div class="project-stat-value">${done}</div>
            <div class="project-stat-label">Done</div>
          </div>
          <div class="project-stat">
            <div class="project-stat-value">${active}</div>
            <div class="project-stat-label">Active</div>
          </div>
          <div class="project-stat">
            <div class="project-stat-value">${p.files || 0}</div>
            <div class="project-stat-label">Files</div>
          </div>
        </div>
      </div>
    `;
  },

  openAddModal() {
    console.log('Open add project modal');
  },

  openDetail(id) {
    console.log('Open project detail:', id);
  },
};
