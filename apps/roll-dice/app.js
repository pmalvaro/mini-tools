if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('No se pudo activar el acceso sin conexión.', error);
  });
}
