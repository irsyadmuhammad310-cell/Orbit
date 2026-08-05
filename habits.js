/* ═══ ORBIT — HABITS.JS ═══
 * Habit tracker: daily/weekly habits, streaks, heatmap
 */

const Habits = (() => {
  'use strict';

  // ─── Render ───
  function render() {
    const el = document.getElementById('pg-habits');
    const S = Orbit.state;
    if (!S.habits) S.habits = [];

    const today = Orbit.TD;
    const todayHabits = S.habits.filter(h => isDueToday(h));
    const doneToday = todayHabits.filter(h => isCompletedOn(h, today)).length;

    el.innerHTML = `
      <div class="pg-header">
        <div>
          <div class="pg-title">Habits</div>
          <div class="pg-sub">${doneToday}/${todayHabits.length} done today · ${S.habits.length} total</div>
        </div>
        <button class="btn btn-primary" onclick="Habits.newModal()"><i data-lucide="plus"></i>New Habit</button>
      </div>

      <!-- Today's habits -->
      <div class="panel" style="margin-bottom:14px">
        <div class="panel-head"><span class="panel-title">Today</span>
          <span style="font-size:10px;color:var(--text-tertiary)">${new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${todayHabits.length ? todayHabits.map(h => habitRowEl(h, today)).join('') : '<p style="font-size:12px;color:var(--text-tertiary);padding:12px 0">No habits due today. Create one!</p>'}
        </div>
      </div>

      <!-- All habits with streaks -->
      <div class="panel">
        <div class="panel-head"><span class="panel-title">All Habits</span>
          <span style="font-size:10px;color:var(--text-tertiary)">${S.habits.length} habits</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${S.habits.map(h => habitCardEl(h)).join('') || '<p style="font-size:12px;color:var(--text-tertiary);padding:12px 0">No habits yet</p>'}
        </div>
      </div>
    `;
  }

  // ─── Habit Row (today's checklist) ───
  function habitRowEl(h, date) {
    const done = isCompletedOn(h, date);
    const streak = getStreak(h);
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg-elevated);border-radius:var(--radius-sm);transition:all 150ms">
        <div class="check ${done ? 'done' : ''}" onclick="Habits.toggle('${h.id}','${date}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>
        </div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:500;${done ? 'text-decoration:line-through;opacity:0.5' : ''}">${h.icon ? h.icon + ' ' : ''}${h.name}</div>
          <div style="font-size:9.5px;color:var(--text-tertiary)">${h.freq} · ${streak} day streak</div>
        </div>
        ${streak >= 7 ? '<span style="font-size:10px;color:var(--accent)">🔥</span>' : ''}
      </div>
    `;
  }

  // ─── Habit Card (with heatmap) ───
  function habitCardEl(h) {
    const streak = getStreak(h);
    const best = getBestStreak(h);
    const completions = h.log || [];
    const last30 = getLast30Days();
    const rate = Math.round((last30.filter(d => completions.includes(d)).length / last30.length) * 100);

    // Mini heatmap: last 30 days
    const heatmap = last30.map(d => {
      const done = completions.includes(d);
      const isToday = d === Orbit.TD;
      return `<div style="width:10px;height:10px;border-radius:2px;background:${done ? 'var(--accent)' : isToday ? 'var(--bg-active)' : 'var(--bg-elevated)'};opacity:${done ? 1 : 0.5}" title="${d}"></div>`;
    }).join('');

    return `
      <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:14px">${h.icon || '⚡'}</span>
          <div style="flex:1">
            <div style="font-size:12.5px;font-weight:600">${h.name}</div>
            <div style="font-size:9.5px;color:var(--text-tertiary)">${h.freq} · ${rate}% completion</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:800;color:var(--accent)">${streak}</div>
            <div style="font-size:9px;color:var(--text-tertiary)">streak</div>
          </div>
          <button class="btn-icon" onclick="Habits.editModal('${h.id}')"><i data-lucide="pencil"></i></button>
        </div>
        <div style="display:flex;gap:2px;flex-wrap:wrap">${heatmap}</div>
        <div style="display:flex;gap:12px;margin-top:8px;font-size:10px;color:var(--text-tertiary)">
          <span>Best: ${best} days</span>
          <span>Total: ${completions.length}</span>
        </div>
      </div>
    `;
  }

  // ─── Logic ───
  function isDueToday(h) {
    if (h.freq === 'daily') return true;
    if (h.freq === 'weekdays') {
      const day = new Date().getDay();
      return day >= 1 && day <= 5;
    }
    if (h.freq === 'weekly') {
      // Due on the day it was created
      const created = new Date(h.created || Orbit.TD);
      return new Date().getDay() === created.getDay();
    }
    if (h.freq === 'custom' && h.days) {
      return h.days.includes(new Date().getDay());
    }
    return true;
  }

  function isCompletedOn(h, date) {
    return (h.log || []).includes(date);
  }

  function toggle(id, date) {
    const S = Orbit.state;
    const h = S.habits.find(x => x.id === id);
    if (!h) return;
    if (!h.log) h.log = [];

    if (h.log.includes(date)) {
      h.log = h.log.filter(d => d !== date);
    } else {
      h.log.push(date);
      h.log.sort();
    }

    Orbit.save();
    render();
    lucide.createIcons();

    const done = h.log.includes(date);
    Helpers.toast(done ? `${h.icon || '⚡'} Done!` : 'Unmarked');
  }

  function getStreak(h) {
    const log = (h.log || []).sort().reverse();
    if (!log.length) return 0;

    let streak = 0;
    let checkDate = new Date(Orbit.TD);

    // If today isn't done, start from yesterday
    if (!log.includes(Orbit.TD)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (log.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function getBestStreak(h) {
    const log = [...(h.log || [])].sort();
    if (!log.length) return 0;
    let best = 1, current = 1;
    for (let i = 1; i < log.length; i++) {
      const prev = new Date(log[i - 1]);
      const curr = new Date(log[i]);
      const diff = (curr - prev) / 86400000;
      if (diff === 1) { current++; best = Math.max(best, current); }
      else { current = 1; }
    }
    return Math.max(best, current);
  }

  function getLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Orbit.TODAY);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }

  // ─── Overview widget ───
  function overviewWidget() {
    const S = Orbit.state;
    if (!S.habits || !S.habits.length) return '';
    const today = Orbit.TD;
    const due = S.habits.filter(h => isDueToday(h));
    const done = due.filter(h => isCompletedOn(h, today)).length;
    if (!due.length) return '';

    return `
      <div class="panel" style="margin-bottom:14px">
        <div class="panel-head"><span class="panel-title">Habits</span>
          <span style="font-size:10px;color:var(--accent);font-weight:600">${done}/${due.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          ${due.slice(0, 5).map(h => habitRowEl(h, today)).join('')}
        </div>
        ${due.length > 5 ? `<button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="Orbit.go('habits')">View all (${due.length})</button>` : ''}
      </div>
    `;
  }

  // ─── Modals ───
  function newModal() {
    Orbit.modal(`
      <h2>New Habit</h2>
      <div class="field"><label class="field-label">Habit Name</label><input class="field-input" id="hn" placeholder="e.g. Meditate 10 min"></div>
      <div class="field-row">
        <div class="field"><label class="field-label">Frequency</label>
          <select class="field-select" id="hf">
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div class="field"><label class="field-label">Icon (emoji)</label><input class="field-input" id="hi" placeholder="🏃" maxlength="2"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="Orbit.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Habits.save()">Create</button>
      </div>
    `);
  }

  function save() {
    const name = document.getElementById('hn').value;
    if (!name) return;
    const S = Orbit.state;
    if (!S.habits) S.habits = [];

    S.habits.push({
      id: Helpers.uid('h'),
      name,
      freq: document.getElementById('hf').value,
      icon: document.getElementById('hi').value || '⚡',
      log: [],
      created: Orbit.TD
    });

    Orbit.save();
    Orbit.closeModal();
    render();
    lucide.createIcons();
    Helpers.toast('Habit created');
  }

  function editModal(id) {
    const h = Orbit.state.habits.find(x => x.id === id);
    Orbit.modal(`
      <h2>Edit Habit</h2>
      <div class="field"><label class="field-label">Name</label><input class="field-input" id="hn" value="${h.name}"></div>
      <div class="field-row">
        <div class="field"><label class="field-label">Frequency</label>
          <select class="field-select" id="hf">
            <option value="daily" ${h.freq === 'daily' ? 'selected' : ''}>Daily</option>
            <option value="weekdays" ${h.freq === 'weekdays' ? 'selected' : ''}>Weekdays</option>
            <option value="weekly" ${h.freq === 'weekly' ? 'selected' : ''}>Weekly</option>
          </select>
        </div>
        <div class="field"><label class="field-label">Icon</label><input class="field-input" id="hi" value="${h.icon}" maxlength="2"></div>
      </div>
      <div style="margin-top:12px;padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);font-size:11px;color:var(--text-secondary)">
        <strong>Stats:</strong> ${(h.log || []).length} completions · ${getStreak(h)} current streak · ${getBestStreak(h)} best streak
      </div>
      <div class="modal-foot">
        <button class="btn" style="color:var(--danger)" onclick="Habits.del('${id}')"><i data-lucide="trash-2"></i></button>
        <button class="btn" onclick="Orbit.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Habits.update('${id}')">Save</button>
      </div>
    `);
  }

  function update(id) {
    const h = Orbit.state.habits.find(x => x.id === id);
    h.name = document.getElementById('hn').value;
    h.freq = document.getElementById('hf').value;
    h.icon = document.getElementById('hi').value || '⚡';
    Orbit.save();
    Orbit.closeModal();
    render();
    lucide.createIcons();
    Helpers.toast('Updated');
  }

  function del(id) {
    if (!confirm('Delete this habit and all history?')) return;
    Orbit.state.habits = Orbit.state.habits.filter(h => h.id !== id);
    Orbit.save();
    Orbit.closeModal();
    render();
    lucide.createIcons();
    Helpers.toast('Deleted');
  }

  return { render, toggle, overviewWidget, newModal, save, editModal, update, del };
})();
