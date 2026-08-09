// js/tasks.js — Task management: CRUD, filters, toggle complete

const Tasks = {
  currentFilter: 'all',

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('page-tasks');
    const tasks = this.getFilteredTasks();
    const allTasks = DB.getAll(DB.KEYS.TASKS);
    const active = allTasks.filter(t => !t.completed && !t.parentId).length;
    const dueThisWeek = allTasks.filter(t => !t.completed && this.isDueThisWeek(t.dueDate)).length;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Tasks</h1>
          <p class="page-subtitle">${active} tasks, ${dueThisWeek} due this week</p>
        </div>
        <button class="btn btn--primary" onclick="Tasks.openAddModal()">+ Add Task</button>
      </div>

      <div class="tasks-filters">
        ${['all', 'today', 'this week', 'high priority'].map(f => `
          <div class="filter-chip ${this.currentFilter === f ? 'active' : ''}" onclick="Tasks.setFilter('${f}')">${f.charAt(0).toUpperCase() + f.slice(1)}</div>
        `).join('')}
      </div>

      <div class="task-list" id="taskList">
        ${tasks.filter(t => !t.parentId).map(t => this.renderTask(t) + this.renderSubtasks(t.id)).join('')}
      </div>
    `;

    // Initialize drag-and-drop
    this.initDragDrop();
  },

  renderTask(t) {
    const isCompleted = t.completed ? 'completed' : '';
    const checkClass = t.completed ? 'task-check done' : 'task-check';
    const priorityClass = `priority-${t.priority || 'low'}`;
    const dueClass = this.getDueClass(t.dueDate);
    const dueText = this.formatDue(t.dueDate, t.completed);
    const isSubtask = t.parentId ? 'task-item--subtask' : '';
    const subtaskCount = this.getSubtaskCount(t.id);
    const subtaskDone = this.getSubtaskDoneCount(t.id);

    return `
      <div class="task-item ${isCompleted} ${isSubtask}" draggable="true" data-task-id="${t.id}">
        <div class="${checkClass}" onclick="Tasks.toggle('${t.id}')"></div>
        <div class="task-priority ${priorityClass}"></div>
        <div class="task-content">
          <div class="task-name" ondblclick="Tasks.startInlineEdit('${t.id}', this)">${t.name}</div>
          <div class="task-meta">
            <span class="task-meta-item">${t.project || 'Personal'}</span>
            ${t.type ? `<span class="task-meta-item">·</span><span class="task-meta-item">${t.type}</span>` : ''}
            ${subtaskCount > 0 ? `<span class="task-meta-item">·</span><span class="task-meta-item">${subtaskDone}/${subtaskCount} subtasks</span>` : ''}
            ${t.recurrence ? `<span class="task-meta-item">·</span><span class="task-meta-item">🔄 ${t.recurrence.type}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          ${!t.parentId ? `<span class="task-action-btn" onclick="event.stopPropagation(); Tasks.addSubtask('${t.id}')" title="Add subtask">+</span>` : ''}
        </div>
        <div class="task-due ${dueClass}">${dueText}</div>
      </div>
    `;
  },

  // --- SUBTASKS ---
  renderSubtasks(parentId) {
    const subtasks = DB.getAll(DB.KEYS.TASKS).filter(t => t.parentId === parentId);
    if (subtasks.length === 0) return '';
    return subtasks.map(st => this.renderTask(st)).join('');
  },

  getSubtaskCount(taskId) {
    return DB.getAll(DB.KEYS.TASKS).filter(t => t.parentId === taskId).length;
  },

  getSubtaskDoneCount(taskId) {
    return DB.getAll(DB.KEYS.TASKS).filter(t => t.parentId === taskId && t.completed).length;
  },

  addSubtask(parentId) {
    const name = prompt('Subtask name:');
    if (!name || !name.trim()) return;

    const parent = DB.getById(DB.KEYS.TASKS, parentId);
    DB.add(DB.KEYS.TASKS, {
      name: name.trim(),
      parentId,
      project: parent?.project || 'Personal',
      priority: 'low',
      completed: false,
      goalId: parent?.goalId || null,
    });

    this.render();
    App.updateCounts();
  },

  // --- INLINE EDITING ---
  startInlineEdit(taskId, element) {
    const task = DB.getById(DB.KEYS.TASKS, taskId);
    if (!task) return;

    const originalName = task.name;
    element.contentEditable = true;
    element.classList.add('editing');
    element.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    const finish = (save) => {
      element.contentEditable = false;
      element.classList.remove('editing');
      const newName = element.textContent.trim();

      if (save && newName && newName !== originalName) {
        DB.update(DB.KEYS.TASKS, taskId, { name: newName });
        Undo.push('edit', { id: taskId, field: 'name', oldValue: originalName, newValue: newName });
      } else {
        element.textContent = originalName;
      }
    };

    element.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      if (e.key === 'Escape') { finish(false); }
    };

    element.onblur = () => finish(true);
  },

  // --- DRAG AND DROP ---
  initDragDrop() {
    const list = document.getElementById('taskList');
    if (!list) return;

    let draggedEl = null;

    list.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.task-item');
      if (!item) return;
      draggedEl = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    list.addEventListener('dragend', (e) => {
      if (draggedEl) draggedEl.classList.remove('dragging');
      draggedEl = null;
      document.querySelectorAll('.task-item--drag-over').forEach(el => el.classList.remove('task-item--drag-over'));
    });

    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target.closest('.task-item');
      if (!target || target === draggedEl) return;

      document.querySelectorAll('.task-item--drag-over').forEach(el => el.classList.remove('task-item--drag-over'));
      target.classList.add('task-item--drag-over');
    });

    list.addEventListener('drop', (e) => {
      e.preventDefault();
      const target = e.target.closest('.task-item');
      if (!target || !draggedEl || target === draggedEl) return;

      const draggedId = draggedEl.dataset.taskId;
      const targetId = target.dataset.taskId;
      this.reorderTasks(draggedId, targetId);
    });
  },

  reorderTasks(draggedId, targetId) {
    const tasks = DB.getAll(DB.KEYS.TASKS);
    const draggedIdx = tasks.findIndex(t => t.id === draggedId);
    const targetIdx = tasks.findIndex(t => t.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const [moved] = tasks.splice(draggedIdx, 1);
    tasks.splice(targetIdx, 0, moved);

    // Update sort order
    tasks.forEach((t, i) => t.sortOrder = i);
    DB.save(DB.KEYS.TASKS, tasks);
    this.render();
  },

  toggle(id) {
    const task = DB.getById(DB.KEYS.TASKS, id);
    if (!task) return;

    const nowCompleting = !task.completed;
    DB.update(DB.KEYS.TASKS, id, {
      completed: nowCompleting,
      completedAt: nowCompleting ? new Date().toISOString() : null,
    });

    let spawnedId = null;

    // Recurring: spawn next instance when completing
    if (nowCompleting && task.recurrence) {
      spawnedId = this.spawnNextRecurrence(task);
    }

    // Push undo action
    Undo.push(nowCompleting ? 'complete' : 'uncomplete', {
      id,
      goalId: task.goalId,
      spawnedId,
      completedAt: task.completedAt,
    });

    // Update linked goal progress
    if (task.goalId) {
      Goals.recalcProgress(task.goalId);
    }

    this.render();
    App.updateCounts();
    App.updateWeeklyProgress();
  },

  // --- RECURRENCE ENGINE ---
  spawnNextRecurrence(task) {
    const r = task.recurrence;
    if (!r || !r.type) return null;

    const nextDue = this.calcNextDueDate(task.dueDate, r);
    if (!nextDue) return null;

    const newTask = {
      ...task,
      id: undefined,
      completed: false,
      completedAt: null,
      dueDate: nextDue.toISOString(),
      createdAt: undefined,
    };
    delete newTask.id;
    delete newTask.createdAt;

    const created = DB.add(DB.KEYS.TASKS, newTask);
    return created.id;
  },

  calcNextDueDate(currentDueStr, recurrence) {
    const d = currentDueStr ? new Date(currentDueStr) : new Date();
    const interval = recurrence.interval || 1;

    switch (recurrence.type) {
      case 'daily':
        d.setDate(d.getDate() + interval);
        break;
      case 'weekly':
        d.setDate(d.getDate() + (7 * interval));
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + interval);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + interval);
        break;
      default:
        return null;
    }
    return d;
  },

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  },

  getFilteredTasks() {
    let tasks = DB.getAll(DB.KEYS.TASKS);
    const settings = DB.getSettings();
    if (!settings.showCompleted) tasks = tasks.filter(t => !t.completed);

    switch (this.currentFilter) {
      case 'today':
        tasks = tasks.filter(t => this.isDueToday(t.dueDate));
        break;
      case 'this week':
        tasks = tasks.filter(t => this.isDueThisWeek(t.dueDate));
        break;
      case 'high priority':
        tasks = tasks.filter(t => t.priority === 'high');
        break;
    }

    // Sort: incomplete first, then by due date
    return tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate || '2099-12-31') - new Date(b.dueDate || '2099-12-31');
    });
  },

  openAddModal() {
    const goals = DB.getAll(DB.KEYS.GOALS);
    const overlay = document.getElementById('quickAddModal');

    overlay.innerHTML = `
      <div class="add-note-modal">
        <h3>New Task</h3>
        <div class="add-note-field">
          <label>Task Name</label>
          <input type="text" id="newTaskName" placeholder="What needs to be done?">
        </div>
        <div class="add-note-field">
          <label>Due Date</label>
          <input type="date" id="newTaskDue">
        </div>
        <div class="add-note-field">
          <label>Priority</label>
          <select id="newTaskPriority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="add-note-field">
          <label>Project</label>
          <input type="text" id="newTaskProject" placeholder="e.g. FinTrack, Iron Vow">
        </div>
        <div class="add-note-field">
          <label>Link to Goal</label>
          <select id="newTaskGoal">
            <option value="">None</option>
            ${goals.map(g => `<option value="${g.id}">${g.emoji || ''} ${g.name}</option>`).join('')}
          </select>
        </div>
        <div class="add-note-field">
          <label>Recurrence</label>
          <select id="newTaskRecurrence">
            <option value="">None (one-time)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div class="add-note-actions">
          <button class="btn" onclick="Tasks.closeAddModal()">Cancel</button>
          <button class="btn btn--primary" onclick="Tasks.saveTask()">Add Task</button>
        </div>
      </div>
    `;

    overlay.classList.add('open');
    overlay.onclick = (e) => { if (e.target === overlay) Tasks.closeAddModal(); };
    setTimeout(() => document.getElementById('newTaskName')?.focus(), 100);
  },

  closeAddModal() {
    document.getElementById('quickAddModal').classList.remove('open');
  },

  saveTask() {
    const name = document.getElementById('newTaskName').value.trim();
    const dueDate = document.getElementById('newTaskDue').value;
    const priority = document.getElementById('newTaskPriority').value;
    const project = document.getElementById('newTaskProject').value.trim();
    const goalId = document.getElementById('newTaskGoal').value;
    const recurrenceType = document.getElementById('newTaskRecurrence').value;

    if (!name) return;

    const task = {
      name,
      dueDate: dueDate || null,
      priority,
      project: project || 'Personal',
      goalId: goalId || null,
      recurrence: recurrenceType ? { type: recurrenceType, interval: 1 } : null,
      completed: false,
    };

    DB.add(DB.KEYS.TASKS, task);
    this.closeAddModal();
    this.render();
    App.updateCounts();

    // Recalc linked goal
    if (goalId) Goals.recalcProgress(goalId);
  },

  isDueToday(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
  },

  isDueThisWeek(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + (7 - now.getDay()));
    return d >= now && d <= weekEnd;
  },

  getDueClass(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'today';
    if (d < now) return 'overdue';
    return '';
  },

  formatDue(dateStr, completed) {
    if (completed) return 'Done';
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d < now) return 'Overdue';
    return d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
  },
};
