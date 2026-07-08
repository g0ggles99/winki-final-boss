const STORAGE_KEY = 'surf-points-v1';
const defaults = [
  { id: 'surf', name: 'Surf', points: 5 }, { id: 'swim', name: 'Swim', points: 4 },
  { id: 'training', name: 'Other surf training', points: 3 }, { id: 'yoga', name: 'Yoga', points: 2 },
  { id: 'surfskate', name: 'Surfskate', points: 1 }, { id: 'stretch', name: 'Stretch', points: 1 }, { id: 'popups', name: 'Pop ups', points: 1 }
];
const freshState = () => ({ version: 2, activities: defaults, entries: [], goals: { weekly: 50 } });
let state;
try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); state = { ...freshState(), ...saved, goals: { ...freshState().goals, ...saved.goals } }; if (state.version !== 2 && state.entries.length === 0) state = freshState(); else state.version = 2; } catch { state = freshState(); }
const $ = (s) => document.querySelector(s);
const dateKey = (d = new Date()) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const dateFromKey = (key) => new Date(`${key}T12:00:00`);
const fmtDate = (key, options = { weekday: 'short', month: 'short', day: 'numeric' }) => dateFromKey(key).toLocaleDateString(undefined, options);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const pointTotal = (predicate) => state.entries.filter(predicate).reduce((sum, entry) => sum + entry.points, 0);
const startOfWeek = (date = new Date()) => { const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); return d; };
function renderActivities() {
  const select = $('#activity');
  select.innerHTML = state.activities.map(a => `<option value="${a.id}">${a.name} · ${a.points} pts</option>`).join('');
  $('#quick-add').innerHTML = state.activities.slice(0, 6).map(a => `<button type="button" data-id="${a.id}">+ ${a.name} (${a.points})</button>`).join('');
}
function progress(current, goal, period) {
  $(`#${period}-current`).textContent = current; $(`#${period}-goal`).textContent = goal;
  $(`#${period}-bar`).style.width = `${Math.min(100, Math.round(current / goal * 100))}%`;
  const left = Math.max(0, goal - current);
  $(`#${period}-message`).textContent = left === 0 ? 'Goal reached — lovely work.' : `${left} point${left === 1 ? '' : 's'} to go`;
}
function comparisonText(current, previous, label) {
  const delta = current - previous;
  if (delta === 0) return `Same as ${label}`;
  return delta > 0 ? `↑ ${delta} vs ${label}` : `↓ ${Math.abs(delta)} vs ${label}`;
}
function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}
function sumBetween(startKey, endKey) {
  return pointTotal(e => e.date >= startKey && e.date <= endKey);
}
function renderPeriodHistory(target, rows, goal) {
  const peak = Math.max(goal || 0, ...rows.map(row => row.total), 1);
  $(target).innerHTML = rows.map(row => {
    const pct = Math.min(100, Math.round(row.total / peak * 100));
    return `<div class="period-item${row.current ? ' is-current' : ''}">
      <div class="period-top"><span>${escapeHtml(row.label)}</span><strong>${row.total}</strong></div>
      <div class="period-meter"><span style="width:${pct}%"></span></div>
      <p>${escapeHtml(row.detail)}</p>
    </div>`;
  }).join('');
}
function renderDashboard() {
  const today = new Date(), todayKey = dateKey(today), weekStart = startOfWeek(today);
  const daily = pointTotal(e => e.date === todayKey);
  const weekStartKey = dateKey(weekStart);
  const weekly = pointTotal(e => e.date >= weekStartKey && e.date <= todayKey);
  const monthly = pointTotal(e => { const d = dateFromKey(e.date); return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); });
  const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeek = pointTotal(e => { const d = dateFromKey(e.date); return d >= lastWeekStart && d < weekStart; });
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1), thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = pointTotal(e => { const d = dateFromKey(e.date); return d >= lastMonthStart && d < thisMonthStart; });
  const yearly = pointTotal(e => dateFromKey(e.date).getFullYear() === today.getFullYear());
  const monthlyGoal = state.goals.weekly * 4, yearlyGoal = state.goals.weekly * 52;
  $('#today-points').textContent = daily; progress(weekly, state.goals.weekly, 'weekly'); progress(monthly, monthlyGoal, 'monthly'); progress(yearly, yearlyGoal, 'yearly');
  const level = Math.min(10, Math.floor(yearly / 260) + 1);
  const titles = ['Grom', 'Foam Slayer', 'Lineup Local', 'Point Breaker', 'Swell Seeker', 'Wave Wizard', 'Winki Warrior', 'Tube Hunter', 'Ocean Boss', 'FINAL BOSS'];
  $('#character-level').textContent = level; $('#character-title').textContent = titles[level - 1];
  const weeklyPercent = Math.min(1, weekly / state.goals.weekly);
  $('#boss-status').textContent = weekly >= state.goals.weekly ? 'MISSION CLEAR! The Winki boss has been beaten.' : `${state.goals.weekly - weekly} points until this week’s boss battle is cleared.`;
  $('.character-stage').style.transform = `rotate(${(weeklyPercent * 8 - 4).toFixed(1)}deg) translateY(${Math.round((1 - weeklyPercent) * 12)}px) scale(${(0.86 + weeklyPercent * 0.18).toFixed(2)})`;
  $('#boss-status').classList.toggle('screen-clear', weekly >= state.goals.weekly);
  $('#weekly-message').textContent = `${Math.max(0, state.goals.weekly - weekly)} to go · ${comparisonText(weekly, lastWeek, 'last week')}`;
  $('#monthly-message').textContent = `${Math.max(0, monthlyGoal - monthly)} to go · ${comparisonText(monthly, lastMonth, 'last month')}`;
  $('#avatar-fill').style.width = `${Math.min(100, weeklyPercent * 100)}%`;
  document.querySelectorAll('.avatar-stop').forEach(stop => { const ratio = Number(stop.dataset.ratio); stop.classList.toggle('is-active', weeklyPercent >= ratio); const label = stop.querySelector('span:last-child'); const names = ['GROM', 'PADDLING', 'UP & RIDING', 'CHARGING', 'BOSS CLEAR']; const index = [...document.querySelectorAll('.avatar-stop')].indexOf(stop); label.innerHTML = `${Math.round(state.goals.weekly * ratio)}<br />${names[index]}`; });
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() - 6 + i); return d; });
  const values = days.map(d => pointTotal(e => e.date === dateKey(d))); const peak = Math.max(...values, 1);
  $('#week-chart').innerHTML = days.map((d, i) => `<div class="bar-group"><span class="bar-value">${values[i] || ''}</span><span class="bar" style="height:${Math.max(3, values[i] / peak * 132)}px"></span><span class="bar-label">${d.toLocaleDateString(undefined,{weekday:'short'}).slice(0,2)}</span></div>`).join('');
  const weekRows = Array.from({ length: 7 }, (_, i) => {
    const start = addDays(weekStart, (i - 6) * 7), end = addDays(start, 6);
    return {
      label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      detail: i === 6 ? 'This week' : `to ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      total: sumBetween(dateKey(start), dateKey(end)),
      current: i === 6
    };
  });
  renderPeriodHistory('#week-history', weekRows, state.goals.weekly);
  const monthRows = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(today.getFullYear(), today.getMonth() - 6 + i, 1), end = new Date(today.getFullYear(), today.getMonth() - 5 + i, 0);
    return {
      label: start.toLocaleDateString(undefined, { month: 'short' }),
      detail: String(start.getFullYear()),
      total: sumBetween(dateKey(start), dateKey(end)),
      current: i === 6
    };
  });
  renderPeriodHistory('#month-history', monthRows, monthlyGoal);
  const recent = [...state.entries].sort((a,b) => b.createdAt - a.createdAt).slice(0, 12);
  $('#entry-list').innerHTML = recent.length ? recent.map(e => `<div class="entry"><div><div class="entry-name">${escapeHtml(e.name)}</div><div class="entry-meta">${fmtDate(e.date)}${e.note ? ` · ${escapeHtml(e.note)}` : ''}</div></div><span class="entry-points">+${e.points}</span><button class="delete-entry" data-delete="${e.id}" aria-label="Delete ${escapeHtml(e.name)}">×</button></div>`).join('') : '<p class="empty">No points yet. Add your first surf-building activity above.</p>';
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function cleanSprite() {
  const image = $('#surfer-sprite'), canvas = $('#sprite-canvas');
  const process = () => { try { canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0); const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < pixels.data.length; i += 4) { const [r, g, b] = [pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]]; if (r > 190 && b > 120 && g < 100) pixels.data[i + 3] = 0; } ctx.putImageData(pixels, 0, 0); const cleanSource = canvas.toDataURL('image/png'); image.src = cleanSource; document.querySelectorAll('.surfer-sprite').forEach(sprite => { sprite.src = cleanSource; }); } catch { /* Original sprite remains visible if canvas is unavailable. */ } };
  if (image.complete) process(); else image.addEventListener('load', process, { once: true });
}
function backupProgress() {
  const backup = { app: 'Winki Final Boss', exportedAt: new Date().toISOString(), data: state };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `winki-final-boss-backup-${dateKey()}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function restoreProgress(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try {
    const backup = JSON.parse(reader.result), restored = backup.data;
    if (backup.app !== 'Winki Final Boss' || !restored || !Array.isArray(restored.entries) || !Array.isArray(restored.activities)) throw new Error('Not a Winki backup');
    if (!confirm('Restore this backup? It will replace the progress currently stored on this device.')) return;
    state = { ...freshState(), ...restored, version: 2, goals: { ...freshState().goals, ...restored.goals } }; save(); renderActivities(); renderDashboard(); alert('Backup restored. Back to the lineup.');
  } catch { alert('That file does not look like a Winki Final Boss backup.'); } finally { $('#restore-data').value = ''; } };
  reader.readAsText(file);
}
function addEntry(activityId, date = $('#entry-date').value, note = $('#entry-note').value.trim()) { const activity = state.activities.find(a => a.id === activityId); if (!activity || !date) return; state.entries.push({ id: crypto.randomUUID(), name: activity.name, points: Number(activity.points), date, note, createdAt: Date.now() }); save(); $('#entry-note').value = ''; renderDashboard(); }
function renderActivitySettings() { $('#activity-settings').innerHTML = state.activities.map(a => `<div class="activity-row" data-id="${a.id}"><label>Name<input class="activity-name" value="${escapeHtml(a.name)}" maxlength="32"></label><label>Points<input class="activity-points" type="number" min="1" max="1000" value="${a.points}"></label><button type="button" class="remove-activity">Remove</button></div>`).join(''); }
function init() {
  $('#today-date').textContent = new Date().toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' }); $('#entry-date').value = dateKey(); cleanSprite(); renderActivities(); renderDashboard();
  $('#entry-form').addEventListener('submit', e => { e.preventDefault(); addEntry($('#activity').value); });
  $('#quick-add').addEventListener('click', e => { const id = e.target.dataset.id; if (id) addEntry(id); });
  $('#entry-list').addEventListener('click', e => { const id = e.target.dataset.delete; if (id) { state.entries = state.entries.filter(x => x.id !== id); save(); renderDashboard(); } });
  $('#backup-data').addEventListener('click', backupProgress);
  $('#restore-data').addEventListener('change', e => restoreProgress(e.target.files[0]));
  $('.score-grid').addEventListener('click', e => { const period = e.target.dataset.period; if (!period) return; $('#goal-dialog-title').textContent = `Set ${period} goal`; $('#goal-input').value = state.goals[period]; $('#goal-form').dataset.period = period; $('#goal-dialog').showModal(); });
  $('#goal-form').addEventListener('submit', () => { const period = $('#goal-form').dataset.period, value = Number($('#goal-input').value); if (period && value > 0) { state.goals[period] = value; save(); renderDashboard(); } });
  $('#manage-activities').addEventListener('click', () => { renderActivitySettings(); $('#activities-dialog').showModal(); });
  $('#add-custom').addEventListener('click', () => { const name = $('#new-activity-name').value.trim(), points = Number($('#new-activity-points').value); if (!name || !points) return; state.activities.push({ id: crypto.randomUUID(), name, points }); $('#new-activity-name').value = ''; $('#new-activity-points').value = ''; renderActivitySettings(); });
  $('#activity-settings').addEventListener('click', e => { const row = e.target.closest('.activity-row'); if (e.target.classList.contains('remove-activity') && row) { state.activities = state.activities.filter(a => a.id !== row.dataset.id); row.remove(); } });
  $('#activities-form').addEventListener('submit', () => { document.querySelectorAll('.activity-row').forEach(row => { const activity = state.activities.find(a => a.id === row.dataset.id); if (activity) { activity.name = row.querySelector('.activity-name').value.trim() || activity.name; activity.points = Math.max(1, Number(row.querySelector('.activity-points').value) || activity.points); } }); save(); renderActivities(); renderDashboard(); });
}
init();
