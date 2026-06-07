// ════════════════════════════════════════════════════
//   HABITFLOW — script.js
//   Well-commented, beginner-friendly vanilla JS
// ════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 1. DATA LAYER — localStorage helpers
// ─────────────────────────────────────────────

/**
 * Load habits array from localStorage.
 * Returns an empty array if nothing is stored yet.
 */
function loadHabits() {
  const raw = localStorage.getItem('hf_habits');
  return raw ? JSON.parse(raw) : [];
}

/**
 * Save the full habits array to localStorage.
 */
function saveHabits(habits) {
  localStorage.setItem('hf_habits', JSON.stringify(habits));
}

/**
 * Load app settings (theme, etc.) from localStorage.
 */
function loadSettings() {
  const raw = localStorage.getItem('hf_settings');
  return raw ? JSON.parse(raw) : { theme: 'dark' };
}

/**
 * Save app settings object to localStorage.
 */
function saveSettings(settings) {
  localStorage.setItem('hf_settings', JSON.stringify(settings));
}

// ─────────────────────────────────────────────
// 2. UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Returns today's date as a string "YYYY-MM-DD".
 * Used as a unique key for tracking daily completions.
 */
function todayKey() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Creates a formatted date string like "Monday, June 7".
 */
function formattedToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}

/**
 * Generates a unique ID for each habit.
 */
function generateId() {
  return '_' + Math.random().toString(36).slice(2, 10);
}

/**
 * Category emoji map for display purposes.
 */
const CATEGORY_EMOJI = {
  'Study':                '📚',
  'Fitness':              '💪',
  'Health':               '🥗',
  'Reading':              '📖',
  'Coding':               '💻',
  'Personal Development': '🌱',
  'Custom':               '✦',
};

/**
 * Returns the last N days as "YYYY-MM-DD" strings (including today).
 */
function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/**
 * Returns the 7 days of the current week (Mon–Sun containing today).
 */
function thisWeekDays() {
  return lastNDays(7);
}

/**
 * Calculate current streak for a habit.
 * Streak = consecutive days ending today (or yesterday if today not done).
 */
function calcStreak(habit) {
  const today = todayKey();
  let streak = 0;
  let checkDate = new Date();

  // If today is already completed, start counting from today
  // If not, start from yesterday
  if (!habit.completions[today]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = checkDate.toISOString().split('T')[0];
    if (habit.completions[key]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Update the longest streak record for a habit, if current exceeds it.
 */
function updateLongestStreak(habit) {
  const current = calcStreak(habit);
  if (current > (habit.longestStreak || 0)) {
    habit.longestStreak = current;
  }
}

/**
 * Weekly completion percentage for a habit (last 7 days).
 */
function weeklyRate(habit) {
  const days = thisWeekDays();
  const done = days.filter(d => habit.completions[d]).length;
  return Math.round((done / days.length) * 100);
}

// ─────────────────────────────────────────────
// 3. MOTIVATIONAL QUOTES
// ─────────────────────────────────────────────

const QUOTES = [
  "We are what we repeatedly do. Excellence, then, is not an act but a habit. — Aristotle",
  "The secret of your future is hidden in your daily routine. — Mike Murdock",
  "Motivation gets you going, but habit gets you there. — Zig Ziglar",
  "You'll never change your life until you change something you do daily. — John Maxwell",
  "Good habits are worth being fanatical about. — John Irving",
  "First forget inspiration. Habit is more dependable. — Octavia Butler",
  "The chains of habit are too light to be felt until they are too heavy to be broken. — Warren Buffett",
  "Habits are the compound interest of self-improvement. — James Clear",
  "Small habits, big results. The journey of a thousand miles begins with one step.",
  "Don't wait until you feel motivated. Build the habit, and motivation will follow.",
  "Every action you take is a vote for the person you wish to become. — James Clear",
  "Your daily choices are the architecture of your future self.",
];

let currentQuoteIndex = 0;

function showRandomQuote() {
  currentQuoteIndex = Math.floor(Math.random() * QUOTES.length);
  document.getElementById('quoteText').textContent = QUOTES[currentQuoteIndex];
}

// ─────────────────────────────────────────────
// 4. ACHIEVEMENTS SYSTEM
// ─────────────────────────────────────────────

const ACHIEVEMENTS = [
  { id: 'first_habit',   emoji: '🌱', name: 'First Step',       desc: 'Add your very first habit.',            check: (h) => h.length >= 1 },
  { id: 'streak_3',      emoji: '🔥', name: 'On Fire',          desc: 'Reach a 3-day streak.',                 check: (h) => h.some(x => calcStreak(x) >= 3) },
  { id: 'streak_7',      emoji: '⚡', name: 'Week Warrior',     desc: 'Reach a 7-day streak.',                 check: (h) => h.some(x => calcStreak(x) >= 7) },
  { id: 'streak_30',     emoji: '💎', name: 'Diamond Habit',    desc: 'Reach a 30-day streak.',                check: (h) => h.some(x => calcStreak(x) >= 30) },
  { id: '5_habits',      emoji: '🗂️', name: 'Habit Collector',  desc: 'Track 5 or more habits.',              check: (h) => h.length >= 5 },
  { id: 'all_done',      emoji: '✅', name: 'Perfect Day',      desc: 'Complete all habits in a day.',         check: (h) => h.length > 0 && h.every(x => x.completions[todayKey()]) },
  { id: '50_completions',emoji: '🏅', name: 'Half Century',     desc: 'Complete habits 50 times total.',       check: (h) => h.reduce((s,x) => s + Object.keys(x.completions).length, 0) >= 50 },
  { id: 'diverse',       emoji: '🌈', name: 'Diverse Routine',  desc: 'Have habits in 3 different categories.',check: (h) => new Set(h.map(x=>x.category)).size >= 3 },
];

// ─────────────────────────────────────────────
// 5. APP STATE
// ─────────────────────────────────────────────

let habits = loadHabits();
let settings = loadSettings();
let editingId = null;     // ID of habit being edited (null = new)
let deletingId = null;    // ID of habit pending deletion
let selectedColor = '#F59E0B';
let selectedDays = [0,1,2,3,4,5,6]; // All days active by default

// ─────────────────────────────────────────────
// 6. DOM REFERENCES
// ─────────────────────────────────────────────

const habitsList      = document.getElementById('habitsList');
const emptyState      = document.getElementById('emptyState');
const habitsFullList  = document.getElementById('habitsFullList');
const modalOverlay    = document.getElementById('modalOverlay');
const deleteOverlay   = document.getElementById('deleteOverlay');
const modal           = document.getElementById('modal');
const modalTitle      = document.getElementById('modalTitle');
const habitNameInput  = document.getElementById('habitName');
const habitCategoryInput = document.getElementById('habitCategory');
const customCategoryGroup = document.getElementById('customCategoryGroup');
const customCategoryInput = document.getElementById('customCategory');
const toastEl         = document.getElementById('toast');
const sidebar         = document.getElementById('sidebar');

// ─────────────────────────────────────────────
// 7. THEME TOGGLE
// ─────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  const mobileIcon = document.getElementById('themeToggleMobile');

  if (theme === 'dark') {
    icon.textContent = '☽';
    label.textContent = 'Light Mode';
    if (mobileIcon) mobileIcon.textContent = '☽';
  } else {
    icon.textContent = '☀';
    label.textContent = 'Dark Mode';
    if (mobileIcon) mobileIcon.textContent = '☀';
  }
}

function toggleTheme() {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  saveSettings(settings);
  applyTheme(settings.theme);
}

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('themeToggleMobile').addEventListener('click', toggleTheme);

// ─────────────────────────────────────────────
// 8. NAVIGATION (View Switcher)
// ─────────────────────────────────────────────

const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;

    // Deactivate all nav items and views
    navItems.forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    // Activate selected
    btn.classList.add('active');
    document.getElementById('view-' + view).classList.add('active');

    // Close sidebar on mobile
    closeMobileSidebar();

    // Render the relevant view
    if (view === 'habits')       renderHabitsFullList();
    if (view === 'calendar')     renderCalendar();
    if (view === 'achievements') renderAchievements();
  });
});

// ─────────────────────────────────────────────
// 9. MOBILE SIDEBAR
// ─────────────────────────────────────────────

// Create overlay element
const sidebarOverlay = document.createElement('div');
sidebarOverlay.className = 'sidebar-overlay';
document.body.appendChild(sidebarOverlay);

document.getElementById('hamburger').addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('open');
});
sidebarOverlay.addEventListener('click', closeMobileSidebar);

function closeMobileSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

// ─────────────────────────────────────────────
// 10. MODAL — Open / Close
// ─────────────────────────────────────────────

function openModal(id = null) {
  editingId = id;
  modalTitle.textContent = id ? 'Edit Habit' : 'New Habit';

  // Reset or populate form
  if (id) {
    const habit = habits.find(h => h.id === id);
    habitNameInput.value = habit.name;
    habitCategoryInput.value = habit.category === habit.customCategory ? 'Custom' : habit.category;
    if (habit.category === habit.customCategory) {
      customCategoryGroup.style.display = 'block';
      customCategoryInput.value = habit.customCategory || '';
    }
    selectedDays = [...(habit.targetDays || [0,1,2,3,4,5,6])];
    selectedColor = habit.color || '#F59E0B';
  } else {
    habitNameInput.value = '';
    habitCategoryInput.value = 'Study';
    customCategoryInput.value = '';
    customCategoryGroup.style.display = 'none';
    selectedDays = [0,1,2,3,4,5,6];
    selectedColor = '#F59E0B';
  }

  updateDayButtons();
  updateColorPicker();
  modalOverlay.classList.add('open');
  setTimeout(() => habitNameInput.focus(), 100);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  editingId = null;
}

// Open modal triggers
document.getElementById('openAddModal').addEventListener('click',  () => openModal());
document.getElementById('openAddModal2').addEventListener('click', () => openModal());
document.getElementById('openAddModal3').addEventListener('click', () => openModal());
document.getElementById('modalClose').addEventListener('click',    closeModal);
document.getElementById('modalCancel').addEventListener('click',   closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeDeleteModal(); }
});

// ─────────────────────────────────────────────
// 11. MODAL — Category / Day / Color Pickers
// ─────────────────────────────────────────────

// Show custom category input when "Custom" is selected
habitCategoryInput.addEventListener('change', () => {
  customCategoryGroup.style.display =
    habitCategoryInput.value === 'Custom' ? 'block' : 'none';
});

// Toggle days (target days for the habit)
document.querySelectorAll('.day-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const day = parseInt(btn.dataset.day);
    if (selectedDays.includes(day)) {
      // Must keep at least one day selected
      if (selectedDays.length > 1) selectedDays = selectedDays.filter(d => d !== day);
    } else {
      selectedDays.push(day);
    }
    updateDayButtons();
  });
});

function updateDayButtons() {
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.toggle('active', selectedDays.includes(parseInt(btn.dataset.day)));
  });
}

// Color picker
document.querySelectorAll('.color-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedColor = btn.dataset.color;
    updateColorPicker();
  });
});

function updateColorPicker() {
  document.querySelectorAll('.color-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === selectedColor);
  });
}

// ─────────────────────────────────────────────
// 12. SAVE HABIT (Add or Edit)
// ─────────────────────────────────────────────

document.getElementById('modalSave').addEventListener('click', saveHabit);
habitNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveHabit(); });

function saveHabit() {
  const name = habitNameInput.value.trim();
  if (!name) {
    showToast('⚠️ Please enter a habit name.');
    habitNameInput.focus();
    return;
  }

  let category = habitCategoryInput.value;
  let displayCategory = category;

  // Handle custom category
  if (category === 'Custom') {
    const custom = customCategoryInput.value.trim();
    displayCategory = custom || 'Custom';
  }

  if (editingId) {
    // ── Edit existing habit ──
    const idx = habits.findIndex(h => h.id === editingId);
    habits[idx].name        = name;
    habits[idx].category    = displayCategory;
    habits[idx].color       = selectedColor;
    habits[idx].targetDays  = [...selectedDays];
    showToast('✏️ Habit updated!');
  } else {
    // ── Create new habit ──
    const newHabit = {
      id:            generateId(),
      name:          name,
      category:      displayCategory,
      color:         selectedColor,
      targetDays:    [...selectedDays],
      completions:   {},   // { "YYYY-MM-DD": true }
      longestStreak: 0,
      createdAt:     todayKey(),
    };
    habits.push(newHabit);
    showToast('✦ New habit added!');
  }

  saveHabits(habits);
  closeModal();
  renderDashboard();
}

// ─────────────────────────────────────────────
// 13. TOGGLE COMPLETION
// ─────────────────────────────────────────────

/**
 * Mark or unmark a habit as completed for today.
 */
function toggleCompletion(id) {
  const habit = habits.find(h => h.id === id);
  const today = todayKey();

  if (habit.completions[today]) {
    // Unmark
    delete habit.completions[today];
    showToast('↩ Habit unmarked.');
  } else {
    // Mark complete
    habit.completions[today] = true;
    updateLongestStreak(habit);
    showToast('✓ Habit completed! Keep it up 🔥');
  }

  saveHabits(habits);
  renderDashboard();
}

// ─────────────────────────────────────────────
// 14. DELETE HABIT
// ─────────────────────────────────────────────

function openDeleteModal(id) {
  deletingId = id;
  const habit = habits.find(h => h.id === id);
  document.getElementById('deleteHabitName').textContent = habit.name;
  deleteOverlay.classList.add('open');
}

function closeDeleteModal() {
  deleteOverlay.classList.remove('open');
  deletingId = null;
}

document.getElementById('deleteClose').addEventListener('click',  closeDeleteModal);
document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);
deleteOverlay.addEventListener('click', e => { if (e.target === deleteOverlay) closeDeleteModal(); });

document.getElementById('deleteConfirm').addEventListener('click', () => {
  habits = habits.filter(h => h.id !== deletingId);
  saveHabits(habits);
  closeDeleteModal();
  renderDashboard();
  renderHabitsFullList();
  showToast('🗑 Habit deleted.');
});

// ─────────────────────────────────────────────
// 15. RENDER DASHBOARD
// ─────────────────────────────────────────────

function renderDashboard() {
  const today    = todayKey();
  const search   = document.getElementById('searchInput').value.toLowerCase();
  const catFilt  = document.getElementById('categoryFilter').value;
  const statFilt = document.getElementById('statusFilter').value;

  // Filter habits
  let filtered = habits.filter(h => {
    const matchName  = h.name.toLowerCase().includes(search);
    const matchCat   = catFilt === 'all' || h.category === catFilt;
    const done       = !!h.completions[today];
    const matchStat  = statFilt === 'all' || (statFilt === 'done' ? done : !done);
    return matchName && matchCat && matchStat;
  });

  // Update stats
  const totalHabits  = habits.length;
  const doneToday    = habits.filter(h => h.completions[today]).length;
  const activeStreaks = habits.filter(h => calcStreak(h) > 0).length;
  const completion   = totalHabits > 0 ? Math.round((doneToday / totalHabits) * 100) : 0;

  document.getElementById('statTotal').textContent      = totalHabits;
  document.getElementById('statToday').textContent      = doneToday;
  document.getElementById('statStreaks').textContent    = activeStreaks;
  document.getElementById('statCompletion').textContent = completion + '%';

  // Show/hide empty state
  if (habits.length === 0) {
    habitsList.innerHTML = '';
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    habitsList.innerHTML = filtered.map(h => habitCardHTML(h)).join('');
    attachCardEvents();
  }
}

/**
 * Build HTML for a single habit card on the dashboard.
 */
function habitCardHTML(habit) {
  const today       = todayKey();
  const isDone      = !!habit.completions[today];
  const streak      = calcStreak(habit);
  const best        = habit.longestStreak || 0;
  const weekDays    = thisWeekDays();
  const rate        = weeklyRate(habit);
  const catEmoji    = CATEGORY_EMOJI[habit.category] || '✦';
  const color       = habit.color || '#F59E0B';

  // Streak badge class
  let badgeClass = 'cool', badgeLabel = 'No streak';
  if (streak >= 7)  { badgeClass = 'hot';  badgeLabel = '🔥 On fire!'; }
  else if (streak >= 3) { badgeClass = 'warm'; badgeLabel = '⚡ Building'; }
  else if (streak >= 1) { badgeClass = 'warm'; badgeLabel = '↑ Going'; }

  // Week dots
  const weekDots = weekDays.map((d, i) => {
    const isToday  = d === today;
    const isFilled = !!habit.completions[d];
    return `<div class="week-dot ${isFilled ? 'filled' : ''} ${isToday ? 'today' : ''}"></div>`;
  }).join('');

  return `
    <div class="habit-card ${isDone ? 'completed' : ''}"
         style="--card-color: ${color};"
         data-id="${habit.id}">

      <div class="habit-card-top">
        <div class="habit-info">
          <div class="habit-category-badge">${catEmoji} ${habit.category}</div>
          <div class="habit-name">${escapeHtml(habit.name)}</div>
        </div>
        <div class="habit-actions">
          <button class="habit-action-btn edit-btn" data-id="${habit.id}" title="Edit">✎</button>
          <button class="habit-action-btn del del-btn" data-id="${habit.id}" title="Delete">✕</button>
        </div>
      </div>

      <div class="habit-streak">
        <span class="streak-flame">🔥</span>
        <span class="streak-count">${streak}</span>
        <span class="streak-label">day streak</span>
        <span class="streak-badge ${badgeClass}">${streak >= 1 ? badgeLabel : '—'}</span>
        <span class="streak-best">Best: ${best}</span>
      </div>

      <div class="habit-week">${weekDots}</div>

      <div class="habit-progress-bar">
        <div class="habit-progress-fill" style="width: ${rate}%;"></div>
      </div>

      <button class="habit-complete-btn ${isDone ? 'done' : ''}" data-id="${habit.id}">
        ${isDone ? '✓ Completed Today' : '○ Mark as Complete'}
      </button>
    </div>
  `;
}

/** Attach click events to dynamically rendered cards. */
function attachCardEvents() {
  document.querySelectorAll('.habit-complete-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleCompletion(btn.dataset.id));
  });
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openModal(btn.dataset.id); });
  });
  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openDeleteModal(btn.dataset.id); });
  });
}

// ─────────────────────────────────────────────
// 16. RENDER MY HABITS (Full List View)
// ─────────────────────────────────────────────

function renderHabitsFullList() {
  const today = todayKey();

  if (habits.length === 0) {
    habitsFullList.innerHTML = `
      <div style="text-align:center; padding:48px; color:var(--text-muted);">
        <div style="font-size:2.5rem; margin-bottom:12px;">◈</div>
        <p>No habits yet. Add one from the Dashboard.</p>
      </div>`;
    return;
  }

  habitsFullList.innerHTML = habits.map(h => {
    const streak    = calcStreak(h);
    const done      = !!h.completions[today];
    const total     = Object.keys(h.completions).length;
    const catEmoji  = CATEGORY_EMOJI[h.category] || '✦';
    const color     = h.color || '#F59E0B';

    return `
      <div class="habit-row" data-id="${h.id}">
        <div class="habit-row-color" style="background:${color};"></div>
        <div class="habit-row-info">
          <div class="habit-row-name">${escapeHtml(h.name)}</div>
          <div class="habit-row-meta">${catEmoji} ${h.category} &nbsp;·&nbsp; ${total} total completions &nbsp;·&nbsp; Started ${h.createdAt}</div>
        </div>
        <div class="habit-row-streak">🔥 ${streak}</div>
        <div class="habit-row-actions">
          <button class="habit-action-btn edit-btn" data-id="${h.id}" title="Edit">✎</button>
          <button class="habit-action-btn del del-btn" data-id="${h.id}" title="Delete">✕</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach events for edit/delete in full list
  habitsFullList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.id));
  });
  habitsFullList.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

// ─────────────────────────────────────────────
// 17. RENDER CALENDAR VIEW
// ─────────────────────────────────────────────

function renderCalendar() {
  const container = document.getElementById('calendarContainer');

  if (habits.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:48px; color:var(--text-muted);">
        <p>No habits to display. Add habits first.</p>
      </div>`;
    return;
  }

  // Show the last 35 days (5 weeks) for each habit
  const numDays = 35;
  const days    = lastNDays(numDays);
  const today   = todayKey();

  // Day-of-week headers
  const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    .map(d => `<div class="cal-day-header">${d}</div>`).join('');

  // Find starting weekday to pad the grid
  const firstDate   = new Date(days[0]);
  const startPad    = firstDate.getDay(); // 0 = Sun

  container.innerHTML = habits.map(habit => {
    const color = habit.color || '#F59E0B';

    // Build calendar cells
    let cells = '';
    // Empty cells for padding at start
    for (let i = 0; i < startPad; i++) {
      cells += `<div class="cal-day empty"></div>`;
    }
    days.forEach(dayKey => {
      const d     = parseInt(dayKey.split('-')[2]); // day number
      const isDone  = !!habit.completions[dayKey];
      const isToday = dayKey === today;
      cells += `<div class="cal-day ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}"
                     style="${isDone ? `--card-color:${color};` : ''}">${d}</div>`;
    });

    const weekRate = weeklyRate(habit);
    const catEmoji = CATEGORY_EMOJI[habit.category] || '✦';

    return `
      <div class="calendar-habit-section">
        <div class="calendar-habit-name" style="color:${color};">
          ${catEmoji} ${escapeHtml(habit.name)}
          <span>${weekRate}% this week</span>
        </div>
        <div class="calendar-grid">
          ${dayHeaders}
          ${cells}
        </div>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────
// 18. RENDER ACHIEVEMENTS
// ─────────────────────────────────────────────

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');

  grid.innerHTML = ACHIEVEMENTS.map(ach => {
    const unlocked = ach.check(habits);
    return `
      <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <span class="achievement-emoji">${ach.emoji}</span>
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.desc}</div>
        <span class="achievement-badge">${unlocked ? '✓ Unlocked' : '🔒 Locked'}</span>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────
// 19. SEARCH & FILTER — Live Update
// ─────────────────────────────────────────────

document.getElementById('searchInput').addEventListener('input',    renderDashboard);
document.getElementById('categoryFilter').addEventListener('change', renderDashboard);
document.getElementById('statusFilter').addEventListener('change',  renderDashboard);

// ─────────────────────────────────────────────
// 20. TOAST NOTIFICATIONS
// ─────────────────────────────────────────────

let toastTimeout = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ─────────────────────────────────────────────
// 21. XSS PROTECTION — escapeHtml
// ─────────────────────────────────────────────

/**
 * Escapes special HTML characters to prevent XSS attacks.
 * Always use this when rendering user-provided text.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────
// 22. QUOTE REFRESH BUTTON
// ─────────────────────────────────────────────

document.getElementById('refreshQuote').addEventListener('click', showRandomQuote);

// ─────────────────────────────────────────────
// 23. INITIALISE APP
// ─────────────────────────────────────────────

function init() {
  // Apply saved theme
  applyTheme(settings.theme);

  // Set today's date in header
  document.getElementById('todayDate').textContent = formattedToday();

  // Show a motivational quote
  showRandomQuote();

  // Render dashboard
  renderDashboard();

  console.log('%cHabitflow initialised ✦', 'color:#F59E0B; font-weight:bold; font-size:14px;');
}

// ── Start the app ──
init();
