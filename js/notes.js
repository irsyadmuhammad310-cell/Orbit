// js/notes.js — Sticky notes: render, enlarge on click, add/delete

const Notes = {
  colors: [
    { name: 'yellow', class: 'sticky--yellow', bg: 'var(--sticky-yellow)' },
    { name: 'pink', class: 'sticky--pink', bg: 'var(--sticky-pink)' },
    { name: 'blue', class: 'sticky--blue', bg: 'var(--sticky-blue)' },
    { name: 'green', class: 'sticky--green', bg: 'var(--sticky-green)' },
    { name: 'purple', class: 'sticky--purple', bg: 'var(--sticky-purple)' },
    { name: 'orange', class: 'sticky--orange', bg: 'var(--sticky-orange)' },
  ],

  selectedColor: 'yellow',

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('page-notes');
    const notes = DB.getAll(DB.KEYS.NOTES);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Notes</h1>
          <p class="page-subtitle">Quick thoughts, ideas, and reminders</p>
        </div>
        <button class="btn btn--primary" onclick="Notes.openAddModal()">+ New Note</button>
      </div>

      <div class="notes-board">
        ${notes.map((n, i) => this.renderSticky(n, i)).join('')}
        <div class="add-sticky" onclick="Notes.openAddModal()">
          <div class="add-sticky-icon">+</div>
          <div class="add-sticky-text">Add Note</div>
        </div>
      </div>
    `;
  },

  renderSticky(note, index) {
    const colorClass = `sticky--${note.color || 'yellow'}`;
    return `
      <div class="sticky-note ${colorClass}" onclick="Notes.enlarge('${note.id}')">
        <div class="sticky-title">${note.title}</div>
        <div class="sticky-body">${note.body}</div>
        <div class="sticky-footer">
          <span class="sticky-tag">${note.tag || 'Personal'}</span>
          <span class="sticky-date">${this.formatDate(note.createdAt)}</span>
        </div>
      </div>
    `;
  },

  enlarge(id) {
    const note = DB.getById(DB.KEYS.NOTES, id);
    if (!note) return;

    const colorObj = this.colors.find(c => c.name === note.color) || this.colors[0];
    const overlay = document.getElementById('noteModal');

    overlay.innerHTML = `
      <div class="note-modal" style="background:${colorObj.bg}">
        <button class="note-modal-close" onclick="Notes.closeModal()">✕</button>
        <div class="note-modal-title">${note.title}</div>
        <div class="note-modal-body">${note.body}</div>
        <div class="note-modal-footer">
          <span class="note-modal-tag">${note.tag || 'Personal'}</span>
          <span class="note-modal-date">${this.formatDate(note.createdAt)}</span>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn" onclick="Notes.delete('${note.id}')">Delete</button>
        </div>
      </div>
    `;

    overlay.classList.add('open');
    overlay.onclick = (e) => { if (e.target === overlay) this.closeModal(); };
  },

  closeModal() {
    document.getElementById('noteModal').classList.remove('open');
  },

  openAddModal() {
    const overlay = document.getElementById('addNoteModal');

    overlay.innerHTML = `
      <div class="add-note-modal">
        <h3>New Sticky Note</h3>
        <div class="add-note-field">
          <label>Title</label>
          <input type="text" id="newNoteTitle" placeholder="What's on your mind?">
        </div>
        <div class="add-note-field">
          <label>Content</label>
          <textarea id="newNoteBody" placeholder="Write your note here..."></textarea>
        </div>
        <div class="add-note-field">
          <label>Tag</label>
          <select id="newNoteTag">
            <option>Personal</option>
            <option>FinTrack</option>
            <option>Iron Vow</option>
            <option>Finance</option>
            <option>Health</option>
            <option>Business</option>
          </select>
        </div>
        <div class="add-note-field">
          <label>Color</label>
          <div class="add-note-colors">
            ${this.colors.map(c => `
              <div class="color-pick ${c.name === this.selectedColor ? 'selected' : ''}" 
                   style="background:${c.bg}" 
                   onclick="Notes.pickColor('${c.name}')" 
                   data-color="${c.name}"></div>
            `).join('')}
          </div>
        </div>
        <div class="add-note-actions">
          <button class="btn" onclick="Notes.closeAddModal()">Cancel</button>
          <button class="btn btn--primary" onclick="Notes.save()">Save Note</button>
        </div>
      </div>
    `;

    overlay.classList.add('open');
    overlay.onclick = (e) => { if (e.target === overlay) this.closeAddModal(); };
  },

  closeAddModal() {
    document.getElementById('addNoteModal').classList.remove('open');
  },

  pickColor(color) {
    this.selectedColor = color;
    document.querySelectorAll('.color-pick').forEach(el => {
      el.classList.toggle('selected', el.dataset.color === color);
    });
  },

  save() {
    const title = document.getElementById('newNoteTitle').value.trim();
    const body = document.getElementById('newNoteBody').value.trim();
    const tag = document.getElementById('newNoteTag').value;

    if (!title || !body) return;

    DB.add(DB.KEYS.NOTES, {
      title,
      body,
      tag,
      color: this.selectedColor,
    });

    this.closeAddModal();
    this.render();
    App.updateCounts();
  },

  delete(id) {
    const note = DB.getById(DB.KEYS.NOTES, id);
    DB.remove(DB.KEYS.NOTES, id);
    Undo.push('delete_note', { note });
    this.closeModal();
    this.render();
    App.updateCounts();
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
  },
};
