/* ═══ ORBIT — GOALS.JS ═══
 * Goals with key results, CRUD, detail modal
 */

const Goals = (() => {
  'use strict';

  function render() {
    const el = document.getElementById('pg-goals');
    const S = Orbit.state;

    el.innerHTML = `
      <div class="pg-header">
        <div><div class="pg-title">Goals</div><div class="pg-sub">${S.goals.length} active</div></div>
        <button class="btn btn-primary" onclick="Goals.newModal()"><i data-lucide="plus"></i>New Goal</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${S.goals.map(g => goalCard(g)).join('')}
      </div>
    `;
  }

  function goalCard(g) {
    const pct = Helpers.gpct(g);
    return `
      <div class="goal" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:16px 18px;cursor:pointer;transition:all 150ms var(--ease);margin-bottom:0" onclick="Goals.detail('${g.id}')">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span class="tag" style="background:var(--${g.color}-glow);color:var(--${g.color});font-size:9px;text-transform:uppercase;font-weight:700">${g.type}</span>
          <span style="font-size:13px;font-weight:600;flex:1">${g.name}</span>
          <span style="font-size:12px;font-weight:800;color:var(--${g.color})">${pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:var(--${g.color})"></div></div>
        <div style="display:flex;gap:10px;margin-top:8px;font-size:10.5px;color:var(--text-secondary)">
          ${g.target > 100 ? `<span>RM ${Helpers.fm(g.current)} / ${Helpers.fm(g.target)}</span>` : ''}
          <span>${g.krs.filter(k => k.done).length}/${g.krs.length} KRs</span>
          <span style="margin-left:auto">${Helpers.fds(g.deadline)}</span>
        </div>
      </div>
    `;
  }

  function detail(id) {
    const g = Orbit.state.goals.find(x => x.id === id);
    const pct = Helpers.gpct(g);

    Orbit.modal(`
      <h2>${g.name}</h2>
      <p style="font-size:11px;color:var(--text-secondary);margin-bottom:12px">${g.desc}</p>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div class="progress-bar" style="flex:1;height:6px"><div class="progress-fill" style="width:${pct}%;background:var(--${g.color})"></div></div>
        <span style="font-size:13px;font-weight:800;color:var(--${g.color})">${pct}%</span>
      </div>
      ${g.target > 100 ? `<p style="font-size:12px;margin-bottom:12px"><strong>RM ${Helpers.fm(g.current)}</strong> / RM ${Helpers.fm(g.target)}</p>` : ''}
      <div style="font-size:11px;font-weight:700;margin-bottom:8px">Key Results</div>
      ${g.krs.map(k => `
        <div style="display:flex;align-items:center;gap:7px;padding:5px 0;cursor:pointer" onclick="Goals.toggleKR('${g.id}','${k.id}')">
          <div class="check ${k.done ? 'done' : ''}" style="width:14px;height:14px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>
          </div>
          <span style="font-size:11.5px;${k.done ? 'text-decoration:line-through;opacity:0.4' : ''}">${k.t}</span>
        </div>
      `).join('')}
      <button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="Goals.addKR('${g.id}')"><i data-lucide="plus"></i>Add KR</button>
      <div class="modal-foot">
        <button class="btn" style="color:var(--danger)" onclick="Goals.del('${g.id}')"><i data-lucide="trash-2"></i></button>
        <button class="btn" onclick="Goals.editModal('${g.id}')"><i data-lucide="pencil"></i>Edit</button>
        <button class="btn" onclick="Orbit.closeModal()">Close</button>
      </div>
    `);
  }

  function toggleKR(gid, kid) {
    const g = Orbit.state.goals.find(x => x.id === gid);
    const kr = g.krs.find(k => k.id === kid);
    kr.done = !kr.done;
    Orbit.save();
    detail(gid); // Re-render modal
    Helpers.refresh();
  }

  function addKR(gid) {
    const text = prompt('Key result:');
    if (!text) return;
    Orbit.state.goals.find(g => g.id === gid).krs.push({ id: Helpers.uid('k'), t: text, done: false });
    Orbit.save();
    detail(gid);
  }

  function del(id) {
    if (!confirm('Delete this goal?')) return;
    Orbit.state.goals = Orbit.state.goals.filter(g => g.id !== id);
    Orbit.save();
    Orbit.closeModal();
    Helpers.refresh();
    Helpers.toast('Deleted');
  }

  function newModal() {
    Orbit.modal(`
      <h2>New Goal</h2>
      <div class="field"><label class="field-label">Name</label><input class="field-input" id="gn" placeholder="e.g. Buy MacBook Pro"></div>
      <div class="field"><label class="field-label">Description</label><textarea class="field-textarea" id="gd"></textarea></div>
      <div class="field-row">
        <div class="field"><label class="field-label">Type</label><select class="field-select" id="gt"><option value="savings">Savings</option><option value="project">Project</option><option value="milestone">Milestone</option><option value="debt">Debt</option></select></div>
        <div class="field"><label class="field-label">Deadline</label><input class="field-input" id="gdl" type="date"></div>
      </div>
      <div class="field-row">
        <div class="field"><label class="field-label">Target (RM)</label><input class="field-input" id="gta" type="number" placeholder="10000"></div>
        <div class="field"><label class="field-label">Current (RM)</label><input class="field-input" id="gc" type="number" value="0"></div>
      </div>
      <div class="modal-foot"><button class="btn" onclick="Orbit.closeModal()">Cancel</button><button class="btn btn-primary" onclick="Goals.save()">Create</button></div>
    `);
  }

  function save() {
    const name = document.getElementById('gn').value;
    if (!name) return;
    const type = document.getElementById('gt').value;
    const colorMap = { savings: 'accent', project: 'violet', milestone: 'gold', debt: 'danger' };

    Orbit.state.goals.push({
      id: Helpers.uid('g'), name,
      desc: document.getElementById('gd').value,
      type, target: parseFloat(document.getElementById('gta').value) || 100,
      current: parseFloat(document.getElementById('gc').value) || 0,
      deadline: document.getElementById('gdl').value || '2027-12-31',
      color: colorMap[type], krs: []
    });
    Orbit.save();
    Orbit.closeModal();
    render();
    lucide.createIcons();
    Helpers.toast('Goal created');
  }

  function editModal(id) {
    const g = Orbit.state.goals.find(x => x.id === id);
    Orbit.modal(`
      <h2>Edit Goal</h2>
      <div class="field"><label class="field-label">Name</label><input class="field-input" id="gn" value="${g.name}"></div>
      <div class="field"><label class="field-label">Description</label><textarea class="field-textarea" id="gd">${g.desc}</textarea></div>
      <div class="field-row">
        <div class="field"><label class="field-label">Target (RM)</label><input class="field-input" id="gta" type="number" value="${g.target}"></div>
        <div class="field"><label class="field-label">Current (RM)</label><input class="field-input" id="gc" type="number" value="${g.current}"></div>
      </div>
      <div class="field"><label class="field-label">Deadline</label><input class="field-input" id="gdl" type="date" value="${g.deadline}"></div>
      <div class="modal-foot"><button class="btn" onclick="Orbit.closeModal()">Cancel</button><button class="btn btn-primary" onclick="Goals.update('${id}')">Save</button></div>
    `);
  }

  function update(id) {
    const g = Orbit.state.goals.find(x => x.id === id);
    g.name = document.getElementById('gn').value;
    g.desc = document.getElementById('gd').value;
    g.target = parseFloat(document.getElementById('gta').value) || g.target;
    g.current = parseFloat(document.getElementById('gc').value) || g.current;
    g.deadline = document.getElementById('gdl').value || g.deadline;
    Orbit.save();
    Orbit.closeModal();
    Helpers.refresh();
    Helpers.toast('Updated');
  }

  return { render, detail, toggleKR, addKR, del, newModal, save, editModal, update };
})();