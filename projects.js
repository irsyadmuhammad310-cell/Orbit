/* ═══ ORBIT — PROJECTS.JS ═══
 * Project cards, budget tracking, linked tasks
 */

const Projects = (() => {
  'use strict';

  function render() {
    const el = document.getElementById('pg-projects');
    const S = Orbit.state;

    el.innerHTML = `
      <div class="pg-header">
        <div><div class="pg-title">Projects</div><div class="pg-sub">${S.projects.length} tracked</div></div>
        <button class="btn btn-primary" onclick="Projects.newModal()"><i data-lucide="plus"></i>New</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px">
        ${S.projects.map(p => projectCard(p)).join('')}
      </div>
    `;
  }

  function projectCard(p) {
    const S = Orbit.state;
    const tasks = S.tasks.filter(t => t.proj === p.id);
    const done = tasks.filter(t => t.done).length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    return `
      <div class="proj-card" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:18px;transition:all 150ms var(--ease)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:28px;height:28px;border-radius:6px;display:grid;place-items:center;background:var(--${p.color}-glow);color:var(--${p.color})">
            <i data-lucide="${p.icon}" style="width:14px;height:14px"></i>
          </div>
          <span style="font-size:13.5px;font-weight:700">${p.name}</span>
          <span class="tag" style="margin-left:auto;background:var(--${p.status === 'active' ? 'success' : 'warning'}-glow);color:var(--${p.status === 'active' ? 'success' : 'warning'});font-size:9px;text-transform:uppercase;font-weight:700">${p.status}</span>
        </div>
        <p style="font-size:11px;color:var(--text-secondary);margin-bottom:12px">${p.desc}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <div style="font-size:9px;color:var(--text-tertiary);text-transform:uppercase;font-weight:700">Spent</div>
            <div style="font-size:14px;font-weight:800;font-feature-settings:'tnum'">RM ${Helpers.fm(p.spent)}</div>
          </div>
          <div>
            <div style="font-size:9px;color:var(--text-tertiary);text-transform:uppercase;font-weight:700">Budget</div>
            <div style="font-size:14px;font-weight:800">${p.budget ? `RM ${Helpers.fm(p.budget)}` : 'Free'}</div>
          </div>
        </div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:5px;font-weight:600">${done}/${tasks.length} tasks</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:var(--${p.color})"></div></div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-sm" onclick="Tasks.newModal(null,'${p.id}')"><i data-lucide="plus"></i>Task</button>
          <button class="btn btn-sm" onclick="Projects.addExpense('${p.id}')"><i data-lucide="receipt"></i>Expense</button>
          <button class="btn-icon" style="margin-left:auto" onclick="Projects.del('${p.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `;
  }

  function newModal() {
    Orbit.modal(`
      <h2>New Project</h2>
      <div class="field"><label class="field-label">Name</label><input class="field-input" id="pn" placeholder="e.g. Side Project"></div>
      <div class="field"><label class="field-label">Description</label><textarea class="field-textarea" id="pd"></textarea></div>
      <div class="field-row">
        <div class="field"><label class="field-label">Budget (RM)</label><input class="field-input" id="pb" type="number" value="0"></div>
        <div class="field"><label class="field-label">Icon</label>
          <select class="field-select" id="pi">
            <option value="code-2">Code</option>
            <option value="gamepad-2">Game</option>
            <option value="plane">Travel</option>
            <option value="book">Learning</option>
            <option value="music">Music</option>
            <option value="camera">Photo</option>
          </select>
        </div>
      </div>
      <div class="modal-foot"><button class="btn" onclick="Orbit.closeModal()">Cancel</button><button class="btn btn-primary" onclick="Projects.save()">Create</button></div>
    `);
  }

  function save() {
    const name = document.getElementById('pn').value;
    if (!name) return;
    const icon = document.getElementById('pi').value;
    const colorMap = { 'code-2': 'accent', 'gamepad-2': 'violet', 'plane': 'gold', 'book': 'blue', 'music': 'violet', 'camera': 'accent' };

    Orbit.state.projects.push({
      id: Helpers.uid('p'), name, icon,
      color: colorMap[icon] || 'accent',
      desc: document.getElementById('pd').value,
      status: 'active',
      budget: parseFloat(document.getElementById('pb').value) || 0,
      spent: 0
    });
    Orbit.save();
    Orbit.closeModal();
    render();
    lucide.createIcons();
    Helpers.toast('Project created');
  }

  function addExpense(id) {
    const amount = prompt('Expense amount (RM):');
    if (!amount || isNaN(amount)) return;
    const p = Orbit.state.projects.find(x => x.id === id);
    p.spent += parseFloat(amount);
    Orbit.save();
    render();
    lucide.createIcons();
    Helpers.toast(`RM ${amount} tracked`);
  }

  function del(id) {
    if (!confirm('Delete this project?')) return;
    Orbit.state.projects = Orbit.state.projects.filter(p => p.id !== id);
    // Unlink tasks
    Orbit.state.tasks.forEach(t => { if (t.proj === id) t.proj = null; });
    Orbit.save();
    render();
    lucide.createIcons();
    Helpers.toast('Deleted');
  }

  return { render, newModal, save, addExpense, del };
})();
