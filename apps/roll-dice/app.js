const form = document.querySelector('#dice');
const quantity = document.querySelector('#quantity');
const sides = form.elements.namedItem('sides');
const tray = document.querySelector('#tray');
const result = document.querySelector('#result');

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
