# Mini Tools

Colección de aplicaciones web independientes hechas con HTML, CSS y JavaScript. Cada herramienta tendrá su propia URL y se podrá instalar como PWA.

## Añadir una herramienta

1. Crea la carpeta con `mkdir -p docs/apps` y copia la plantilla con `cp -R templates/pwa docs/apps/mi-herramienta`.
2. Personaliza el HTML, el JavaScript, el nombre del manifiesto y los iconos. Usa rutas relativas para que los archivos se resuelvan dentro de la ruta de la app en GitHub Pages.
3. Añade al listado `files` de `sw.js` los recursos que deban funcionar sin conexión. Sube la versión de la caché en `cacheName` cada vez que cambies esos archivos.
4. Añade un enlace a `./apps/mi-herramienta/` en `docs/index.html` para incorporarla al catálogo.

La URL de inicio resuelta actúa como identificador de instalación. Conserva el nombre de la carpeta una vez publicada. Cada service worker se registra dentro de su carpeta y usa una caché identificada por su ámbito. Si guardas datos en `localStorage` o IndexedDB, usa prefijos o nombres propios de la app, ya que las herramientas comparten origen.

## Probar en local

Desde la raíz, ejecuta `python3 -m http.server 8000 --directory docs` y abre `http://localhost:8000/apps/mi-herramienta/`. Carga la app con conexión para que se instale el service worker. Cuando esté activo, comprueba que puedes recargar la app con el navegador en modo sin conexión.

## Publicar en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub. En GitHub Free, usa un repositorio público para habilitar Pages.
2. En **Settings → Pages**, elige **Deploy from a branch**, selecciona la rama principal y la carpeta **/docs**, y guarda.
3. Abre la URL que muestre Pages. En un repositorio llamado `mini-tools`, la ruta de cada app será `https://USUARIO.github.io/mini-tools/apps/mi-herramienta/`. Cada push a la rama de publicación actualiza el sitio.

En Android, abre la URL de la app en Chrome y usa la opción de instalación del navegador. En iPhone, abre la URL en Safari, toca **Compartir → Añadir a pantalla de inicio** y activa **Abrir como app web**.

[Configuración de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
