const form = document.querySelector('#dice');
const quantity = document.querySelector('#quantity');
const sides = form.elements.namedItem('sides');
const tray = document.querySelector('#tray');
const result = document.querySelector('#result');
const diceTypes = document.querySelector('#dice-types');
const dicePicker = diceTypes.parentElement;
const diceTrack = diceTypes.querySelector('.dice-track');
const [scrollLeft, scrollRight] = dicePicker.querySelectorAll('.dice-arrow');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function updateDiceArrows() {
  const maxScroll = diceTypes.scrollWidth - diceTypes.clientWidth;
  scrollLeft.setAttribute('aria-disabled', String(diceTypes.scrollLeft < 1));
  scrollRight.setAttribute('aria-disabled', String(diceTypes.scrollLeft >= maxScroll - 1));
}

function resizeDicePicker() {
  diceTypes.style.removeProperty('--track-inset');
  const overflows = diceTrack.scrollWidth + 10 > dicePicker.clientWidth;
  scrollLeft.hidden = scrollRight.hidden = !overflows;
  const inset = overflows ? (diceTypes.clientWidth - diceTrack.firstElementChild.offsetWidth) / 2 : 5;
  diceTypes.style.setProperty('--track-inset', `${Math.max(5, inset)}px`);
  updateDiceArrows();
}

function centerDie(event) {
  if (scrollLeft.hidden || !event.target.matches('input[name="sides"]:checked')) return;
  const tile = event.target.closest('label').getBoundingClientRect();
  const viewport = diceTypes.getBoundingClientRect();
  diceTypes.scrollBy({
    left: tile.left + tile.width / 2 - (viewport.left + viewport.width / 2),
    behavior: reducedMotion.matches ? 'instant' : 'smooth',
  });
}

for (const [button, direction] of [[scrollLeft, -1], [scrollRight, 1]]) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    diceTypes.scrollBy({ left: direction * diceTypes.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
}

diceTypes.addEventListener('scroll', updateDiceArrows);
diceTypes.addEventListener('click', centerDie);
diceTypes.addEventListener('change', centerDie);
new ResizeObserver(resizeDicePicker).observe(dicePicker);
resizeDicePicker();

const removeDie = document.querySelector('#remove-die');
const addDie = document.querySelector('#add-die');
const maxDice = 24;
let count = 1;

for (const [button, step] of [[removeDie, -1], [addDie, 1]]) {
  button.addEventListener('click', () => {
    count = (count - 1 + step + maxDice) % maxDice + 1;
    quantity.value = String(count);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const faces = Number(sides.value);
  const dice = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * faces));
  const total = dice.reduce((sum, die) => sum + die, 0);
  const details = count > 1 ? ` · Dados: ${dice.join(', ')}` : '';
  DiceView.render(tray, dice, faces);
  result.textContent = `${count} x D${faces} · Total: ${total}${details}`;
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('No se pudo activar el acceso sin conexión.', error);
  });
}
