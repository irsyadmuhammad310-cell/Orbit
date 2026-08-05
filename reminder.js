/* ═══ ORBIT — REMINDERS.JS ═══
 * Reminder CRUD, recurring support, notifications
 */

const Reminders = (() => {
  'use strict';

  function render() {
    const el = document.getElementById('pg-reminders');
    const S = Orbit.state;
    const upcoming = S.reminders.filter(r => !r.done).sort((a, b) => new Date(a.dt) - new Date(b.dt));
    const past = S.reminders.filter(r => r.done);

    el.innerHTML = `
      <div class="pg-header">
        <div><div class="pg-title">Reminders</div><div class="pg-sub">${upcoming.length} pending</div></div>
        <button class="btn btn-primary" onclick="Reminders.newModal()"><i data-lucide="plus"></i>New</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;max-width:540px">
        ${upcoming.map(r => remEl(r)).join('') || '<p style="font-size:12px;color:var(--text-tertiary);text-align:center;padding:20px">All clear! No pending reminders.</p>'}
        ${past.length ? `
          <div style="margin-top:14px;font-size:10px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase">Dismissed</div>
          ${past.slice(0, 5).map(r => `
            <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);opacity:0.35">
              <div style="width:26px;height:26px;border-radius:6px;display:grid;place-items:center;background:var(--success-glow);color:var(--success)"><i data-lucide="check-circle" style="width:12px;height:12px"></i></div>
              <div style="flex:1"><div style="font-size:12px;font-weight:500">${r.text}</div></div>
            </div>
          `).join('')}
        ` : ''}
      </div>
    `;
  }

  function remEl(r) {
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);transition:all 150ms" class="rem-hover">
        <div style="width:26px;height:26px;border-radius:6px;display:grid;place-items:center;background:var(--${r.rec ? 'blue' : 'gold'}-glow);color:var(--${r.rec ? 'blue' : 'gold'})">
          <i data-lucide="${r.rec ? 'repeat' : 'bell'}" style="width:12px;height:12px"></i>
        </div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:500">${r.text}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:1px">${Helpers.fdtm(r.dt)}${r.rec ? ` · ${r.rec}` : ''}</div>
        </div>
        <button class="btn-icon" onclick="Reminders.dismiss('${r.id}')"><i data-lucide="check"></i></button>
        <button class="btn-icon" style="color:var(--danger)" onclick="Reminders.del('${r.id}')"><i data-lucide="trash-2"></i></button>
      </div>
    `;
  }

  function dismiss(id) {
    const r = Orbit.state.reminders.find(x => x.id === id);
    if (r) r.done = true;
    Orbit.save();
    Helpers.refresh();
    Helpers.toast('Dismissed');
  }

  function del(id) {
    Orbit.state.reminders = Orbit.state.reminders.filter(r => r.id !== id);
    Orbit.save();
    Helpers.refresh();
    Helpers.toast('Deleted');
  }

  function newModal(date) {
    Orbit.modal(`
      <h2>New Reminder</h2>
      <div class="field"><label class="field-label">What to remember?</label><input class="field-input" id="rt" placeholder="e.g. Pay rent"></div>
      <div class="field-row">
        <div class="field"><label class="field-label">Date</label><input class="field-input" id="rd" type="date" value="${date || Orbit.TD}"></div>
        <div class="field"><label class="field-label">Time</label><input class="field-input" id="rti" type="time" value="09:00"></div>
      </div>
      <div class="field"><label class="field-label">Repeat</label>
        <select class="field-select" id="rr">
          <option value="">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div class="modal-foot"><button class="btn" onclick="Orbit.closeModal()">Cancel</button><button class="btn btn-primary" onclick="Reminders.save()">Set Reminder</button></div>
    `);
  }

  function save() {
    const text = document.getElementById('rt').value;
    if (!text) return;
    const date = document.getElementById('rd').value;
    const time = document.getElementById('rti').value || '09:00';
    const rec = document.getElementById('rr').value || null;

    Orbit.state.reminders.push({
      id: Helpers.uid('r'), text,
      dt: `${date}T${time}`,
      rec, done: false
    });

    Orbit.save();
    Orbit.closeModal();
    Helpers.refresh();
    Helpers.toast('Reminder set');

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  return { render, dismiss, del, newModal, save };
})();
