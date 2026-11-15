const form = document.querySelector('#dice');
const quantity = document.querySelector('#quantity');
const sides = form.elements.namedItem('sides');
const result = document.querySelector('#result');

for (const button of form.querySelectorAll('[data-step]')) {
  button.addEventListener('click', () => {
    const min = Number(quantity.min);
    const max = Number(quantity.max);
    const count = quantity.valueAsNumber || min;
    const next = Math.trunc(count) + Number(button.dataset.step);
    quantity.valueAsNumber = Math.min(max, Math.max(min, next));
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const count = quantity.valueAsNumber;
  const faces = Number(sides.value);
  const dice = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * faces));
  const total = dice.reduce((sum, die) => sum + die, 0);
  const details = count > 1 ? ` · Dados: ${dice.join(', ')}` : '';
  result.textContent = `${count}d${faces} · Total: ${total}${details}`;
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('No se pudo activar el acceso sin conexión.', error);
  });
}
