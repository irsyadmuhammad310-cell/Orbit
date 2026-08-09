// js/undo.js — Undo system with toast notifications
// Toast element is already in index.html, no injection needed

var Undo = {
  stack: [],
  toastTimeout: null,

  // Push an undoable action onto the stack
  push(type, data) {
    this.stack.push({ type, data, timestamp: Date.now() });
    if (this.stack.length > 10) this.stack.shift();
    this.showToast(type, data);
  },

  // Show the toast notification
  showToast(type, data) {
    var toast = document.getElementById('undoToast');
    var msg = document.getElementById('undoToastMsg');
    if (!toast || !msg) return;

    var messages = {
      'complete': `Task completed`,
      'uncomplete': `Task uncompleted`,
      'delete_task': `Task deleted`,
      'delete_note': `Note deleted`,
      'edit': `Task renamed`,
      'reorder': `Task reordered`,
    };

    msg.textContent = messages[type] || 'Action performed';
    toast.classList.add('visible');

    // Auto-hide after 5 seconds
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.hideToast(), 5000);
  },

  hideToast() {
    const toast = document.getElementById('undoToast');
    if (toast) toast.classList.remove('visible');
    clearTimeout(this.toastTimeout);
  },

  // Execute the undo (revert last action)
  execute() {
    const action = this.stack.pop();
    if (!action) return;

    switch (action.type) {
      case 'complete':
        // Undo task completion
        DB.update(DB.KEYS.TASKS, action.data.id, {
          completed: false,
          completedAt: null,
        });
        // Remove spawned recurrence if any
        if (action.data.spawnedId) {
          DB.remove(DB.KEYS.TASKS, action.data.spawnedId);
        }
        // Recalc goal
        if (action.data.goalId) Goals.recalcProgress(action.data.goalId);
        Tasks.render();
        break;

      case 'uncomplete':
        // Undo uncompleting (re-complete)
        DB.update(DB.KEYS.TASKS, action.data.id, {
          completed: true,
          completedAt: action.data.completedAt,
        });
        if (action.data.goalId) Goals.recalcProgress(action.data.goalId);
        Tasks.render();
        break;

      case 'delete_task':
        // Restore deleted task
        DB.add(DB.KEYS.TASKS, action.data.task);
        Tasks.render();
        break;

      case 'delete_note':
        // Restore deleted note
        DB.add(DB.KEYS.NOTES, action.data.note);
        Notes.render();
        break;

      case 'edit':
        // Revert name change
        DB.update(DB.KEYS.TASKS, action.data.id, { [action.data.field]: action.data.oldValue });
        Tasks.render();
        break;

      case 'reorder':
        // Restore previous task order
        DB.save(DB.KEYS.TASKS, action.data.previousOrder);
        Tasks.render();
        break;
    }

    this.hideToast();
    App.updateCounts();
    App.updateWeeklyProgress();
  },
};
