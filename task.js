/* ═══ ORBIT — TASKS.JS ═══
 * Task CRUD, filtering, quick-add, rendering
 */

const Tasks = (() => {
  'use strict';

  let currentFilter = 'all';

  function render() {
    const el = document.getElementById('pg-tasks');
    const S = Orbit.state;
    const TD = Orbit.TD;

    let list = [...S.tasks].sort((a, b) => (a.done - b.done) || (new Date(a.date) - new Date(b.date)));
    if (currentFilter === 'today') list = list.filter(t => t.date === TD);
    else if (currentFilter === 'upcoming') list = list.filter(t => t.date > TD && !t.done);
    else if (currentFilter === 'overdue') list = list.filter(t => t.date < TD && !t.done);
    else if (currentFilter === 'done') list = list.filter(t => t.done);

    const todayCount = S.tasks.filter(t => t.date === TD && !t.done).length;

    el.innerHTML = `
      <div class="pg-header">
        <div><div class="pg-title">Tasks</div><div class="pg-sub">${S.tasks.filter(t => !t.done).length} active, ${S.tasks.filter(t => t.done).length} done</div></div>
        <button class="btn btn-primary" onclick="Tasks.newModal()"><i data-lucide="plus"></i>New Task</button>
      </div>
      <div class="task-layout" style="display:grid;grid-template-columns:1fr 280px;gap:16px">
        <div>
          <div class="quick-input" style="display:flex;gap:6px;padding:10px 12px;margin-bottom:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
            <input placeholder="Quick add... press Enter" id="qi" style="flex:1;background:none;border:none;outline:none;color:var(--text-primary);font-size:12.5px;font-family:inherit" onkeydown="if(event.key==='Enter')Tasks.quickAdd()">
            <button class="btn btn-sm btn-primary" onclick="Tasks.quickAdd()"><i data-lucide="plus"></i></button>
          </div>
          <div class="filters" style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap">
            ${['all', 'today', 'upcoming', 'overdue', 'done'].map(f =>
              `<span class="chip ${currentFilter === f ? 'active' : ''}" onclick="Tasks.setFilter('${f}')">${f === 'today' ? `Today (${todayCount})` : Helpers.cap(f)}</span>`
            ).join('')}
          </div>
          <div class="tasks" style="display:flex;flex-direction:column;gap:4px">
            ${list.map(t => taskEl(t)).join('') || '<p style="text-align:center;color:var(--text-tertiary);padding:24px;font-size:12px">Nothing here</p>'}
          </div>
        </div>
        <div>
          ${Calendar.widgetEl()}
          <div style="margin-top:14px">
            <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Today</div>
            ${S.tasks.filter(t => t.date === TD).map(t => `
              <div style="display:flex;align-items:center;gap:7px;padding:5px 0;font-size:11px;border-bottom:1px solid var(--border-subtle)">
                <div style="width:4px;height:4px;border-radius:50%;background:var(--${t.done ? 'success' : Helpers.priCol(t.pri)})"></div>
                <span style="flex:1;${t.done ? 'opacity:0.4;text-decoration:line-through' : ''}">${t.name}</span>
                ${t.rem ? `<span style="font-size:9.5px;color:var(--text-tertiary)">${Helpers.ftime(t.rem)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function taskEl(t) {
    const S = Orbit.state;
    const TD = Orbit.TD;
    const p = S.projects.find(x => x.id === t.proj);
    const ov = t.date < TD && !t.done;
    const isTd = t.date === TD;

    return `
      <div class="task ${t.done ? 'done' : ''}">
        <div class="check ${t.done ? 'done' : ''}" onclick="event.stopPropagation();Tasks.toggle('${t.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>
        </div>
        <div class="task-body">
          <div class="task-title ${t.done ? 'done' : ''}">${t.name}</div>
          <div class="task-info">
            <div style="width:5px;height:5px;border-radius:50%;background:var(--${Helpers.priCol(t.pri)})"></div>
            ${p ? `<span class="tag" style="background:var(--${p.color}-glow);color:var(--${p.color})">${p.name}</span>` : ''}
            <span class="task-when ${ov ? 'overdue' : ''} ${isTd ? 'today' : ''}">
              <i data-lucide="calendar"></i>${isTd ? 'Today' : Helpers.fds(t.date)}
            </span>
            ${t.rem ? `<span style="font-size:9.5px;color:var(--gold);display:flex;align-items:center;gap:3px"><i data-lucide="bell" style="width:9px;height:9px"></i>${Helpers.ftime(t.rem)}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon" onclick="event.stopPropagation();Tasks.editModal('${t.id}')"><i data-lucide="pencil"></i></button>
          <button class="btn-icon" onclick="event.stopPropagation();Tasks.del('${t.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `;
  }

  function setFilter(f) {
    currentFilter = f;
    render();
    lucide.createIcons();
  }

  function quickAdd() {
    const input = document.getElementById('qi');
    if (!input?.value.trim()) return;
    Orbit.state.tasks.push({
      id: Helpers.uid('t'), name: input.value.trim(),
      date: Orbit.TD, pri: 'medium', proj: null, done: false, rem: null
    });
    Orbit.save();
    input.value = '';
    render();
    lucide.createIcons();
    Helpers.toast('Task added');
  }

  function toggle(id) {
    const t = Orbit.state.tasks.find(x => x.id === id);
    if (t) t.done = !t.done;
    Orbit.save();
    Helpers.refresh();
    Helpers.toast(t.done ? 'Done ✓' : 'Reopened');
  }

  function del(id) {
    Orbit.state.tasks = Orbit.state.tasks.filter(t => t.id !== id);
    Orbit.save();
    Helpers.refresh();
    Helpers.toast('Deleted');
  }

  // ─── Modals ───
  function newModal(date, proj) {
    const S = Orbit.state;
    Orbit.modal(`
      <h2>New Task</h2>
      <div class="field"><label class="field-label">What needs doing?</label><input class="field-input" id="fn" placeholder="Task name"></div>
      <div class="field-row">
        <div class="field"><label class="field-label">Date</label><input class="field-input" id="fd" type="date" value="${date || Orbit.TD}"></div>
        <div class="field"><label class="field-label">Priority</label><select class="field-select" id="fp"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label class="field-label">Project</label><select class="field-select" id="fpr"><option value="">None</option>${S.projects.map(p => `<option value="${p.id}" ${p.id === proj ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">Reminder</label><input class="field-input" id="fr" type="time"></div>
      </div>
      <div class="modal-foot"><button class="btn" onclick="Orbit.closeModal()">Cancel</button><button class="btn btn-primary" onclick="Tasks.save()">Create</button></div>
    `);
  }

  function save() {
    const name = document.getElementById('fn').value;
    if (!name) return;
    const date = document.getElementById('fd').value || Orbit.TD;
    const rem = document.getElementById('fr').value;

    Orbit.state.tasks.push({
      id: Helpers.uid('t'), name, date,
      pri: document.getElementById('fp').value,
      proj: document.getElementById('fpr').value || null,
      done: false,
      rem: rem ? `${date}T${rem}` : null
    });

    // Auto-create reminder if time set
    if (rem) {
      Orbit.state.reminders.push({
        id: Helpers.uid('r'), text: name,
        dt: `${date}T${rem}`, rec: null, done: false
      });
    }

    Orbit.save();
    Orbit.closeModal();
    Helpers.refresh();
    Helpers.toast('Task created');
  }

  function editModal(id) {
    const t = Orbit.state.tasks.find(x => x.id === id);
    const S = Orbit.state;
    Orbit.modal(`
      <h2>Edit Task</h2>
      <div class="field"><label class="field-label">Name</label><input class="field-input" id="fn" value="${t.name}"></div>
      <div class="field-row">
        <div class="field"><label class="field-label">Date</label><input class="field-input" id="fd" type="date" value="${t.date}"></div>
        <div class="field"><label class="field-label">Priority</label><select class="field-select" id="fp">${['high', 'medium', 'low'].map(x => `<option value="${x}" ${t.pri === x ? 'selected' : ''}>${Helpers.cap(x)}</option>`).join('')}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label class="field-label">Project</label><select class="field-select" id="fpr"><option value="">None</option>${S.projects.map(p => `<option value="${p.id}" ${p.id === t.proj ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">Reminder</label><input class="field-input" id="fr" type="time" value="${t.rem ? t.rem.split('T')[1] : ''}"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" style="color:var(--danger)" onclick="Tasks.del('${id}');Orbit.closeModal()"><i data-lucide="trash-2"></i></button>
        <button class="btn" onclick="Orbit.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Tasks.update('${id}')">Save</button>
      </div>
    `);
  }

  function update(id) {
    const t = Orbit.state.tasks.find(x => x.id === id);
    t.name = document.getElementById('fn').value;
    t.date = document.getElementById('fd').value;
    t.pri = document.getElementById('fp').value;
    t.proj = document.getElementById('fpr').value || null;
    const rem = document.getElementById('fr').value;
    t.rem = rem ? `${t.date}T${rem}` : null;
    Orbit.save();
    Orbit.closeModal();
    Helpers.refresh();
    Helpers.toast('Saved');
  }

  return { render, taskEl, setFilter, quickAdd, toggle, del, newModal, save, editModal, update };
})();