/* ═══ ORBIT — HELPERS.JS ═══
 * Utility functions, formatters, toast system
 */

const Helpers = (() => {
  'use strict';

  // ─── Number Formatting ───
  function fm(n) {
    return n.toLocaleString('en-MY');
  }

  // ─── Date Formatting ───
  function fds(d) {
    if (!d) return '';
    return new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function fdf(d) {
    if (!d) return '';
    return new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function fdtm(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function ftime(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // ─── Goal Progress ───
  function gpct(g) {
    if (g.type === 'project') {
      return Math.round((g.krs.filter(k => k.done).length / (g.krs.length || 1)) * 100);
    }
    return Math.min(100, Math.round(g.current / g.target * 100));
  }

  // ─── Priority Color ───
  function priCol(p) {
    return p === 'high' ? 'danger' : p === 'medium' ? 'gold' : 'accent';
  }

  // ─── Capitalize ───
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ─── Generate ID ───
  function uid(prefix) {
    return `${prefix}${Date.now()}`;
  }

  // ─── Toast Notifications ───
  function toast(msg) {
    const container = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.innerHTML = `<i data-lucide="check-circle"></i>${msg}`;
    container.appendChild(el);
    lucide.createIcons();
    setTimeout(() => el.remove(), 2800);
  }

  // ─── Re-render current page ───
  function refresh() {
    const page = Orbit.currentPage();
    Orbit.go(page);
  }

  // ─── Public API ───
  return { fm, fds, fdf, fdtm, ftime, gpct, priCol, cap, uid, toast, refresh };
})();