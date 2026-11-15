const form = document.querySelector('#setup');
const fields = document.querySelector('#fields');
const startButton = document.querySelector('#start');
const resetButton = document.querySelector('#reset');
const saveButton = document.querySelector('#save');
const editor = document.querySelector('#editor');
const createButton = document.querySelector('#create');
const activeTitle = document.querySelector('#active-title');
const sound = document.querySelector('#sound');
const timer = document.querySelector('.timer');
const dial = document.querySelector('.dial');
const phaseLabel = document.querySelector('#phase');
const timeLabel = document.querySelector('#time');
const roundLabel = document.querySelector('#round');
const list = document.querySelector('#routines');
const message = document.querySelector('#message');
const storageKey = 'mini-tools:interval-timer:routines';
const limit = 10;
const phaseNames = { warm: 'Calentamiento', work: 'Actividad', rest: 'Descanso' };

let routines = loadRoutines();
let selectedId = null;
let editingId = null;
let editorTrigger;
let plan = [];
let phaseIndex = 0;
let state = 'idle';
let deadline = 0;
let remaining = 0;
let lastCountdownSecond = 0;
let interval;
let audio;

function loadRoutines() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(saved) ? saved.slice(0, limit) : [];
  } catch {
    return [];
  }
}

function settings() {
  return Object.fromEntries(['warm', 'work', 'rest', 'rounds'].map((name) => [
    name, form.elements.namedItem(name).valueAsNumber,
  ]));
}

function buildPlan({ warm, work, rest, rounds }) {
  const phases = [];
  if (warm) phases.push({ kind: 'warm', seconds: warm });
  for (let round = 1; round <= rounds; round++) {
    phases.push({ kind: 'work', seconds: work, round });
    if (rest && round < rounds) phases.push({ kind: 'rest', seconds: rest, round });
  }
  return phases;
}

function formatTime(seconds) {
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
  if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
  return parts.map((part) => String(part).padStart(2, '0')).join(':');
}

function displayTime(ms, fraction) {
  const seconds = Math.ceil(ms / 1000);
  const inPhase = state === 'running' || state === 'paused';
  timeLabel.classList.toggle('with-hours', seconds >= 3600);
  timeLabel.classList.toggle('countdown', inPhase && seconds >= 1 && seconds <= 3);
  const label = formatTime(seconds);
  if (timeLabel.textContent !== label) timeLabel.textContent = label;
  dial.style.setProperty('--sweep', `${fraction * 100}%`);
}

function preview() {
  if (state !== 'idle') return;
  const total = form.checkValidity()
    ? buildPlan(settings()).reduce((sum, phase) => sum + phase.seconds, 0)
    : 0;
  displayTime(total * 1000, 1);
}

function announcePhase() {
  const phase = plan[phaseIndex];
  timer.dataset.phase = phase.kind;
  phaseLabel.textContent = phaseNames[phase.kind];
  roundLabel.textContent = phase.round ? `Ronda ${phase.round} de ${settings().rounds}` : 'Antes de la primera ronda';
}

function syncControls() {
  const active = state === 'running' || state === 'paused';
  const editing = !editor.hidden;
  fields.disabled = active;
  startButton.disabled = editing;
  resetButton.disabled = editing || state === 'idle';
  createButton.disabled = active || editing;
  startButton.textContent = {
    idle: 'Empezar', running: 'Pausar', paused: 'Reanudar', done: 'Repetir',
  }[state];
  list.querySelectorAll('button').forEach((button) => { button.disabled = active || editing; });
}

function beep(kind) {
  if (!sound.checked || audio?.state !== 'running') return;
  const tones = { warm: [440], work: [740], rest: [420, 330], countdown: [960], done: [523, 659, 784] };
  tones[kind].forEach((frequency, index) => {
    const begin = audio.currentTime + index * .16;
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    if (kind === 'countdown') oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(kind === 'countdown' ? .25 : .14, begin);
    volume.gain.exponentialRampToValueAtTime(.001, begin + .14);
    oscillator.connect(volume).connect(audio.destination);
    oscillator.start(begin);
    oscillator.stop(begin + .15);
  });
}

function tick(now = Date.now()) {
  if (state !== 'running') return;
  const previous = phaseIndex;
  while (now >= deadline) {
    phaseIndex++;
    if (phaseIndex === plan.length) {
      clearInterval(interval);
      state = 'done';
      timer.dataset.phase = '';
      phaseLabel.textContent = 'Entrenamiento terminado';
      roundLabel.textContent = `${settings().rounds} rondas completadas`;
      displayTime(0, 0);
      beep('done');
      syncControls();
      return;
    }
    deadline += plan[phaseIndex].seconds * 1000;
  }
  if (phaseIndex !== previous) {
    lastCountdownSecond = 0;
    announcePhase();
    beep(plan[phaseIndex].kind);
  }
  remaining = deadline - now;
  const phaseSeconds = plan[phaseIndex].seconds;
  const secondsLeft = Math.ceil(remaining / 1000);
  displayTime(remaining, remaining / (phaseSeconds * 1000));

  // Leave room for the phase-change cue when a phase starts inside the countdown.
  const phaseStarting = phaseSeconds * 1000 - remaining < 350;
  if (secondsLeft <= 3 && secondsLeft !== lastCountdownSecond && !phaseStarting) {
    lastCountdownSecond = secondsLeft;
    beep('countdown');
  }
}

startButton.addEventListener('click', () => {
  const now = Date.now();
  if (state === 'running') {
    tick(now);
    if (state !== 'running') return;
    clearInterval(interval);
    state = 'paused';
    phaseLabel.textContent = `En pausa · ${phaseNames[plan[phaseIndex].kind]}`;
    syncControls();
    return;
  }
  const restarting = state !== 'paused';
  if (restarting) {
    plan = buildPlan(settings());
    phaseIndex = 0;
    lastCountdownSecond = 0;
    remaining = plan[0].seconds * 1000;
  }
  state = 'running';
  deadline = now + remaining;
  announcePhase();
  syncControls();
  tick(now);
  interval = setInterval(tick, 100);
  if (sound.checked && window.AudioContext) {
    try {
      audio ??= new AudioContext();
      audio.resume().then(() => {
        if (restarting && state === 'running' && phaseIndex === 0) beep(plan[0].kind);
      }).catch(() => {});
    } catch {
      // The timer also works on devices without audio output.
    }
  } else {
    audio?.close().catch(() => {});
    audio = undefined;
  }
});

function resetTimer() {
  clearInterval(interval);
  state = 'idle';
  timer.dataset.phase = '';
  phaseLabel.textContent = 'En espera';
  roundLabel.textContent = 'Tiempo total';
  syncControls();
  preview();
}

function persist(next) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    routines = next;
    return true;
  } catch {
    message.textContent = 'El navegador no ha podido guardar el cambio.';
    return false;
  }
}

function iconButton(label, drawing) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'routine-action';
  button.setAttribute('aria-label', label);
  button.title = label;

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(svgNamespace, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svgNamespace, 'path');
  path.setAttribute('d', drawing);
  icon.append(path);
  button.append(icon);
  return button;
}

function renderRoutines() {
  document.querySelector('#count').textContent = `${routines.length}/${limit}`;
  document.querySelector('#empty').hidden = routines.length > 0;
  list.replaceChildren();
  for (const routine of routines) {
    const row = document.createElement('li');
    const load = document.createElement('button');
    load.type = 'button';
    load.className = 'routine-load';
    load.textContent = routine.title;
    if (routine.id === selectedId) load.setAttribute('aria-current', 'true');
    const details = document.createElement('small');
    details.textContent = `${routine.rounds} rondas · ${routine.work} s actividad · ${routine.rest} s descanso`;
    load.append(details);
    load.addEventListener('click', () => {
      selectRoutine(routine);
      list.querySelector('[aria-current]')?.removeAttribute('aria-current');
      load.setAttribute('aria-current', 'true');
      message.textContent = `Rutina cargada: ${routine.title}.`;
    });
    const edit = iconButton(
      `Editar ${routine.title}`,
      'm4 16 12-12 4 4L8 20H4z M13 7l4 4',
    );
    edit.addEventListener('click', () => openEditor(routine, edit));
    const remove = iconButton(
      `Borrar ${routine.title}`,
      'M3 6h18 M9 6V3h6v3 M5 6l1 14h12l1-14 M10 10v6 M14 10v6',
    );
    remove.addEventListener('click', () => {
      if (!confirm(`¿Borrar «${routine.title}»?`)) return;
      if (!persist(routines.filter(({ id }) => id !== routine.id))) return;
      if (selectedId === routine.id) selectRoutine();
      renderRoutines();
      createButton.focus();
      message.textContent = 'Rutina borrada.';
    });
    row.append(load, edit, remove);
    list.append(row);
  }
}

function fillForm(routine) {
  form.reset();
  if (!routine) return;
  for (const name of ['warm', 'work', 'rest', 'rounds', 'title']) {
    form.elements.namedItem(name).value = routine[name];
  }
  sound.checked = routine.sound;
}

function selectRoutine(routine) {
  selectedId = routine?.id ?? null;
  fillForm(routine);
  activeTitle.textContent = routine?.title ?? '';
  activeTitle.hidden = !routine;
  resetTimer();
}

function openEditor(routine, trigger) {
  editingId = routine?.id ?? null;
  if (!editingId && routines.length >= limit) {
    message.textContent = 'Ya tienes 10 rutinas. Borra una para guardar otra.';
    return;
  }
  editorTrigger = trigger;
  message.textContent = '';
  fillForm(routine);
  document.querySelector('#editor-title').textContent = routine ? 'Editar rutina' : 'Nueva rutina';
  saveButton.textContent = routine ? 'Actualizar rutina' : 'Guardar rutina';
  editor.hidden = false;
  syncControls();
  form.elements.namedItem('title').focus();
}

function closeEditor() {
  editor.hidden = true;
  editingId = null;
  syncControls();
}

function saveRoutine(id) {
  const titleInput = form.elements.namedItem('title');
  const title = titleInput.value.trim();
  if (!form.reportValidity()) return;
  if (!title) {
    message.textContent = 'Pon un nombre a la rutina para guardarla.';
    titleInput.focus();
    return;
  }
  if (!id && routines.length >= limit) {
    message.textContent = 'Ya tienes 10 rutinas. Borra una para guardar otra.';
    return;
  }
  const routine = { id: id ?? crypto.randomUUID(), title, sound: sound.checked, ...settings() };
  const next = id ? routines.map((item) => item.id === id ? routine : item) : [...routines, routine];
  if (!persist(next)) return;
  closeEditor();
  selectRoutine(routine);
  renderRoutines();
  startButton.focus();
  message.textContent = 'Rutina guardada.';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!editor.hidden) saveRoutine(editingId);
});
createButton.addEventListener('click', () => openEditor(null, createButton));
document.querySelector('#cancel').addEventListener('click', () => {
  fillForm(routines.find(({ id }) => id === selectedId));
  closeEditor();
  editorTrigger.focus();
});
resetButton.addEventListener('click', resetTimer);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});
renderRoutines();
preview();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}
