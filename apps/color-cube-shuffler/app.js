if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('No se pudo activar el acceso sin conexión.', error);
  });
}

const colors = [
  { name: 'blanco', hex: '#f3f5fb' },
  { name: 'amarillo', hex: '#ffdc46' },
  { name: 'verde', hex: '#31d696' },
  { name: 'azul', hex: '#478cff' },
  { name: 'naranja', hex: '#ff9a42' },
  { name: 'rojo', hex: '#ff5068' },
];

const board = document.querySelector('#board');
const cubes = Array.from({ length: 9 }, () => {
  const cube = document.createElement('span');
  cube.className = 'cube';
  return cube;
});
board.append(...cubes);

function showFaces(faces) {
  faces.forEach(({ hex }, index) => {
    cubes[index].style.setProperty('--face-color', hex);
  });

  const names = faces.map(({ name }) => name);
  const rows = [names.slice(0, 3), names.slice(3, 6), names.slice(6)];
  board.setAttribute('aria-label', rows.map((row, index) =>
    `Fila ${index + 1}: ${row.join(', ')}`
  ).join('. '));
}

const shuffleButton = document.querySelector('#shuffle');
const status = document.querySelector('#status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

shuffleButton.addEventListener('click', async () => {
  const faces = cubes.map(() => colors[Math.floor(Math.random() * colors.length)]);
  const animations = [];

  if (!reducedMotion.matches) {
    shuffleButton.disabled = true;

    for (const [index, cube] of cubes.entries()) {
      const direction = index % 2 === 0 ? 1 : -1;
      const start = cube.style.getPropertyValue('--face-color');
      const flash = colors[(index + 2) % colors.length].hex;
      animations.push(cube.animate([
        { transform: 'none', backgroundColor: start },
        { transform: `translateY(-12%) rotateY(${direction * 90}deg) rotateZ(${direction * 10}deg)`, backgroundColor: start, offset: 0.24 },
        { transform: `translateY(-20%) rotateY(${direction * 180}deg) scale(0.9)`, backgroundColor: flash, offset: 0.5 },
        { transform: `translateY(-8%) rotateY(${direction * 270}deg)`, backgroundColor: faces[index].hex, offset: 0.76 },
        { transform: `rotateY(${direction * 360}deg)`, backgroundColor: faces[index].hex },
      ], {
        duration: 520,
        delay: (index * 5 % cubes.length) * 20,
        easing: 'ease-in-out',
        fill: 'forwards',
      }));
    }

    await Promise.allSettled(animations.map((animation) => animation.finished));
  }

  showFaces(faces);
  animations.forEach((animation) => animation.cancel());
  shuffleButton.disabled = false;
  status.textContent = board.getAttribute('aria-label');
});

showFaces(cubes.map(() => colors[0]));
