/* ═══ ORBIT — INTEGRATIONS.JS ═══
 * Google Calendar, Google Drive, FinTrack sync
 */

const Integrations = (() => {
  'use strict';

  function render() {
    const el = document.getElementById('pg-integrations');
    const S = Orbit.state;

    el.innerHTML = `
      <div class="pg-header">
        <div><div class="pg-title">Integrations</div><div class="pg-sub">Connect external services</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px">
        ${cardEl('gcal', 'Google Calendar',
          'Sync events bidirectionally. See GCal events in Orbit, push deadlines back.',
          '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>'
        )}
        ${cardEl('gdrive', 'Google Drive',
          'Attach documents, spreadsheets, and files to projects.',
          '<i data-lucide="hard-drive" style="width:20px;height:20px;color:var(--gold)"></i>'
        )}
        ${cardEl('fintrack', 'FinTrack',
          'Auto-sync balances and transactions. Goals update from real data.',
          '<i data-lucide="wallet" style="width:20px;height:20px;color:var(--accent)"></i>'
        )}
      </div>
    `;
  }

  function cardEl(key, name, desc, icon) {
    const connected = Orbit.state.integrations[key];
    return `
      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:var(--bg-elevated)">${icon}</div>
          <span style="font-size:13.5px;font-weight:700">${name}</span>
        </div>
        <div style="font-size:11.5px;color:var(--text-secondary);margin-bottom:14px;line-height:1.5">${desc}</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--text-tertiary);margin-bottom:10px">
          <div style="width:6px;height:6px;border-radius:50%;background:var(--${connected ? 'success' : 'text-tertiary'})"></div>
          ${connected ? 'Connected' : 'Disconnected'}
        </div>
        ${getExtra(key, connected)}
        <button class="btn btn-sm" onclick="Integrations.toggle('${key}')">
          ${connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    `;
  }

  function getExtra(key, connected) {
    if (!connected) return '';

    if (key === 'gcal') {
      return `
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:6px 8px;background:var(--bg-elevated);border-radius:4px">
            <div style="width:3px;height:16px;border-radius:2px;background:var(--blue)"></div>
            Team standup <span style="margin-left:auto;font-size:10px;color:var(--text-tertiary)">2:00 PM</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:6px 8px;background:var(--bg-elevated);border-radius:4px">
            <div style="width:3px;height:16px;border-radius:2px;background:var(--violet)"></div>
            Godot study session <span style="margin-left:auto;font-size:10px;color:var(--text-tertiary)">8:00 PM</span>
          </div>
        </div>
      `;
    }

    if (key === 'gdrive') {
      return `
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:6px 8px;background:var(--bg-elevated);border-radius:4px">
            <i data-lucide="file-spreadsheet" style="width:13px;height:13px;color:var(--success)"></i>
            Japan Trip Budget.xlsx
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:6px 8px;background:var(--bg-elevated);border-radius:4px">
            <i data-lucide="file-text" style="width:13px;height:13px;color:var(--blue)"></i>
            Iron Vow GDD.docs
          </div>
        </div>
      `;
    }

    if (key === 'fintrack') {
      const syncData = Orbit.state._ftSync;
      return `
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px">
          ${syncData?.accounts ? syncData.accounts.filter(a => a.type === 'asset').map(a => `
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;padding:6px 8px;background:var(--bg-elevated);border-radius:4px">
              <span>${a.name}</span><strong style="font-feature-settings:'tnum'">${a.currency} ${Helpers.fm(a.balance)}</strong>
            </div>
          `).join('') : `
            <div style="font-size:11px;color:var(--text-tertiary);padding:6px 8px">Accounts will appear after first sync</div>
          `}
        </div>
        ${syncData?.lastSync ? `<div style="font-size:9.5px;color:var(--text-tertiary);margin-bottom:8px">Last sync: ${new Date(syncData.lastSync).toLocaleTimeString()}</div>` : ''}
        <button class="btn btn-sm" style="margin-bottom:6px" onclick="Integrations.syncFinTrack()"><i data-lucide="refresh-cw"></i> Sync Now</button>
      `;
    }
    return '';
  }

  function toggle(key) {
    Orbit.state.integrations[key] = !Orbit.state.integrations[key];
    Orbit.save();
    Orbit.updateSyncStatus();
    render();
    lucide.createIcons();
    Helpers.toast(Orbit.state.integrations[key] ? 'Connected!' : 'Disconnected');
  }

  // ═══ FINTRACK SYNC ENGINE ═══
  // FinTrack localStorage keys:
  //   ft_accounts     — JSON array of account objects {id, name, type, accountType, initialBalance, currency}
  //   ft_txn_data     — JSON array of transactions {id, d, t, c, s, a, dt, acc, cur, origAmt}
  //   ft_budget_plans — JSON {year: {monthIdx: {expCats: {cat: amount}}}}
  //   ft_schema       — JSON {Income: {cat: [subs]}, Expense: {...}, Savings: {...}}
  //   ft_initial_deposit — float (opening balance)
  //   ft_reminders    — JSON array [{id, date, title, amount, completed, dismissed}]

  function syncFinTrack() {
    const S = Orbit.state;
    const accountsRaw = localStorage.getItem('ft_accounts');
    const txnRaw = localStorage.getItem('ft_txn_data');

    if (!accountsRaw && !txnRaw) {
      Helpers.toast('No FinTrack data found in this browser');
      Orbit.updateSyncStatus();
      return;
    }

    let synced = 0;

    // 1. Sync account balances → goal progress
    if (accountsRaw) {
      try {
        const accounts = JSON.parse(accountsRaw);
        const txns = txnRaw ? JSON.parse(txnRaw) : [];
        const initialDeposit = parseFloat(localStorage.getItem('ft_initial_deposit') || '0');

        // Calculate each account's live balance (same logic as FinTrack's getAccountBalance)
        function calcBalance(accId) {
          const acc = accounts.find(a => a.id === accId);
          if (!acc) return 0;
          const txnTotal = txns.filter(tx => tx.acc === accId).reduce((sum, tx) => {
            if (tx.t === 'Income') return sum + tx.a;
            if (tx.t === 'Expense') return sum - tx.a;
            return sum;
          }, 0);
          return (acc.initialBalance || 0) + txnTotal;
        }

        // Map goals to FinTrack accounts by linked name
        S.goals.forEach(goal => {
          if (!goal.linked) return;
          const linkedName = goal.linked.toLowerCase();

          // Find matching account (fuzzy match on name)
          const matchedAcc = accounts.find(a =>
            a.name.toLowerCase().includes(linkedName) ||
            linkedName.includes(a.name.toLowerCase())
          );

          if (matchedAcc) {
            const balance = calcBalance(matchedAcc.id);
            if (goal.type === 'savings' || goal.type === 'milestone') {
              goal.current = Math.max(0, Math.round(balance * 100) / 100);
              synced++;
            } else if (goal.type === 'debt') {
              // For debt goals, track how much has been paid down
              goal.current = Math.max(0, goal.target - Math.abs(matchedAcc.initialBalance));
              synced++;
            }
          }
        });

        // Total savings from all asset accounts
        const totalAssets = accounts
          .filter(a => a.type === 'asset')
          .reduce((sum, a) => sum + calcBalance(a.id), 0);

        // Store for overview display
        S._ftSync = {
          totalAssets: Math.round(totalAssets * 100) / 100,
          accounts: accounts.map(a => ({
            name: a.name,
            type: a.type,
            balance: Math.round(calcBalance(a.id) * 100) / 100,
            currency: a.currency || 'MYR'
          })),
          lastSync: new Date().toISOString()
        };

      } catch (e) {
        console.warn('Orbit: FinTrack account sync error', e);
      }
    }

    // 2. Sync recent transactions → project expenses
    if (txnRaw) {
      try {
        const txns = JSON.parse(txnRaw);
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        // Calculate monthly spending by category for project budget tracking
        const monthlyExpenses = txns.filter(tx => {
          const d = new Date(tx.d);
          return tx.t === 'Expense' && d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        });

        // Map project budgets to FinTrack categories
        S.projects.forEach(proj => {
          // Auto-match: if project has linked categories from FinTrack
          if (proj._ftCategories && proj._ftCategories.length) {
            proj.spent = monthlyExpenses
              .filter(tx => proj._ftCategories.includes(tx.c))
              .reduce((sum, tx) => sum + tx.a, 0);
            proj.spent = Math.round(proj.spent * 100) / 100;
            synced++;
          }
        });

        // Store transaction summary
        S._ftSync = S._ftSync || {};
        S._ftSync.monthlyIncome = txns
          .filter(tx => { const d = new Date(tx.d); return tx.t === 'Income' && d.getFullYear() === thisYear && d.getMonth() === thisMonth; })
          .reduce((s, tx) => s + tx.a, 0);
        S._ftSync.monthlyExpense = monthlyExpenses.reduce((s, tx) => s + tx.a, 0);
        S._ftSync.monthlySavings = txns
          .filter(tx => { const d = new Date(tx.d); return tx.t === 'Savings' && d.getFullYear() === thisYear && d.getMonth() === thisMonth; })
          .reduce((s, tx) => s + tx.a, 0);
        S._ftSync.txnCount = txns.length;
        S._ftSync.recentTxns = txns
          .sort((a, b) => new Date(b.d) - new Date(a.d))
          .slice(0, 5)
          .map(tx => ({ date: tx.d, type: tx.t, cat: tx.c, amount: tx.a, desc: tx.dt }));

      } catch (e) {
        console.warn('Orbit: FinTrack txn sync error', e);
      }
    }

    // 3. Sync FinTrack reminders → Orbit reminders (avoid duplicates)
    const ftRemRaw = localStorage.getItem('ft_reminders');
    if (ftRemRaw) {
      try {
        const ftReminders = JSON.parse(ftRemRaw);
        ftReminders.filter(r => !r.completed).forEach(r => {
          const exists = S.reminders.some(or => or.text === r.title && or._ftId === r.id);
          if (!exists) {
            S.reminders.push({
              id: Helpers.uid('r'),
              text: r.title + (r.amount ? ` (RM ${r.amount})` : ''),
              dt: r.date + 'T09:00',
              rec: r.recurring || null,
              done: false,
              _ftId: r.id,
              _source: 'fintrack'
            });
            synced++;
          }
        });
      } catch (e) {}
    }

    Orbit.save();
    Orbit.updateSyncStatus();
    Helpers.toast(synced > 0 ? `Synced ${synced} items from FinTrack` : 'FinTrack connected, all up to date');
  }

  // Check if FinTrack data exists
  function hasFinTrackData() {
    return !!(localStorage.getItem('ft_accounts') || localStorage.getItem('ft_txn_data'));
  }

  return { render, toggle, syncFinTrack, hasFinTrackData };
})();