// js/focus.js — Focus Mode with Pomodoro timer

const Focus = {
  isRunning: false,
  isPaused: false,
  currentTaskId: null,
  mode: 'work', // 'work' | 'break'
  timeLeft: 25 * 60, // seconds
  totalTime: 25 * 60,
  interval: null,
  sessionsToday: 0,
  totalFocusToday: 0, // minutes

  WORK_DURATION: 25 * 60,
  BREAK_DURATION: 5 * 60,
  LONG_BREAK_DURATION: 15 * 60,

  init() {
    this.loadTodayStats();
  },

  loadTodayStats() {
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('orbit_focus_stats') || '{}');
    if (stats.date === today) {
      this.sessionsToday = stats.sessions || 0;
      this.totalFocusToday = stats.minutes || 0;
    } else {
      this.sessionsToday = 0;
      this.totalFocusToday = 0;
    }
  },

  saveTodayStats() {
    localStorage.setItem('orbit_focus_stats', JSON.stringify({
      date: new Date().toDateString(),
      sessions: this.sessionsToday,
      minutes: this.totalFocusToday,
    }));
  },

  start(taskId) {
    this.currentTaskId = taskId || null;
    this.mode = 'work';
    this.timeLeft = this.WORK_DURATION;
    this.totalTime = this.WORK_DURATION;
    this.isRunning = true;
    this.isPaused = false;
    this.tick();
    this.renderFocusOverlay();
  },

  tick() {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (this.isPaused) return;
      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.onTimerEnd();
      }

      this.updateDisplay();
    }, 1000);
  },

  onTimerEnd() {
    clearInterval(this.interval);

    if (this.mode === 'work') {
      this.sessionsToday++;
      this.totalFocusToday += this.WORK_DURATION / 60;
      this.saveTodayStats();

      // Play notification sound (if available)
      this.notify('Focus session complete! Take a break.');

      // Switch to break
      const isLongBreak = this.sessionsToday % 4 === 0;
      this.mode = 'break';
      this.timeLeft = isLongBreak ? this.LONG_BREAK_DURATION : this.BREAK_DURATION;
      this.totalTime = this.timeLeft;
      this.tick();
    } else {
      // Break ended
      this.notify('Break over! Ready for another session?');
      this.mode = 'work';
      this.timeLeft = this.WORK_DURATION;
      this.totalTime = this.WORK_DURATION;
      this.isPaused = true; // Wait for user to start next session
    }

    this.updateDisplay();
  },

  pause() {
    this.isPaused = !this.isPaused;
    this.updateDisplay();
  },

  stop() {
    clearInterval(this.interval);
    this.isRunning = false;
    this.isPaused = false;
    this.currentTaskId = null;
    this.closeFocusOverlay();
  },

  notify(msg) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Orbit Focus', { body: msg });
    }
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  getProgress() {
    return ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
  },

  renderFocusOverlay() {
    let overlay = document.getElementById('focusOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'focusOverlay';
      overlay.className = 'focus-overlay';
      document.body.appendChild(overlay);
    }

    const task = this.currentTaskId ? DB.getById(DB.KEYS.TASKS, this.currentTaskId) : null;

    overlay.innerHTML = `
      <div class="focus-card">
        <div class="focus-mode-label">${this.mode === 'work' ? '🎯 Focus Time' : '☕ Break Time'}</div>
        <div class="focus-timer">${this.formatTime(this.timeLeft)}</div>
        <div class="focus-progress-ring">
          <div class="focus-progress-fill" style="width:${this.getProgress()}%"></div>
        </div>
        ${task ? `<div class="focus-task-name">${task.name}</div>` : ''}
        <div class="focus-controls">
          <button class="btn" onclick="Focus.pause()">${this.isPaused ? '▶ Resume' : '⏸ Pause'}</button>
          <button class="btn" onclick="Focus.stop()" style="color:var(--red)">✕ Stop</button>
        </div>
        <div class="focus-stats-mini">
          <span>${this.sessionsToday} sessions today</span>
          <span>${this.totalFocusToday} min focused</span>
        </div>
      </div>
    `;

    overlay.classList.add('open');
  },

  updateDisplay() {
    const timer = document.querySelector('.focus-timer');
    if (timer) timer.textContent = this.formatTime(this.timeLeft);

    const fill = document.querySelector('.focus-progress-fill');
    if (fill) fill.style.width = `${this.getProgress()}%`;

    const label = document.querySelector('.focus-mode-label');
    if (label) label.textContent = this.mode === 'work' ? '🎯 Focus Time' : '☕ Break Time';

    const pauseBtn = document.querySelector('.focus-controls .btn');
    if (pauseBtn) pauseBtn.textContent = this.isPaused ? '▶ Resume' : '⏸ Pause';
  },

  closeFocusOverlay() {
    const overlay = document.getElementById('focusOverlay');
    if (overlay) overlay.remove();
  },

  // Get focus stats for Insights
  getWeeklyFocusData() {
    // Simplified: return today's stats
    return {
      sessionsToday: this.sessionsToday,
      minutesToday: this.totalFocusToday,
    };
  },
};
