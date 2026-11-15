# Mini Tools

Colección de aplicaciones web independientes hechas con HTML, CSS y JavaScript. Cada herramienta tendrá su propia URL y se podrá instalar como PWA.

## Añadir una herramienta

1. Crea la carpeta con `mkdir -p apps` y copia la plantilla con `cp -R templates/pwa apps/mi-herramienta`.
2. Personaliza el HTML, el JavaScript, el nombre del manifiesto y los iconos. Usa rutas relativas para que los archivos se resuelvan dentro de la ruta de la app en GitHub Pages.
3. Añade al listado `files` de `sw.js` los recursos que deban funcionar sin conexión. Sube la versión de la caché en `cacheName` cada vez que cambies esos archivos.
4. Añade un enlace a `./apps/mi-herramienta/` en `index.html` para incorporarla al catálogo.

La URL de inicio resuelta actúa como identificador de instalación. Conserva el nombre de la carpeta una vez publicada. Cada service worker se registra dentro de su carpeta y usa una caché identificada por su ámbito. Si guardas datos en `localStorage` o IndexedDB, usa prefijos o nombres propios de la app, ya que las herramientas comparten origen.

## Probar en local

Desde la raíz, ejecuta `python3 -m http.server 8000` y abre `http://localhost:8000/apps/mi-herramienta/`. Carga la app con conexión para que se instale el service worker. Cuando esté activo, comprueba que puedes recargar la app con el navegador en modo sin conexión.

## Publicar en GitHub Pages

1. Sube el proyecto al repositorio privado `pmalvaro/mini-tools`. GitHub Pages requiere un plan compatible para publicar desde repositorios privados.
2. En **Settings → Pages → Build and deployment → Source**, elige **GitHub Actions**. Revisa allí la visibilidad del sitio.
3. Ejecuta **Publicar en GitHub Pages** desde la pestaña **Actions**. El flujo publica `index.html`, `styles.css` y `apps/` como archivos estáticos. Después se ejecuta automáticamente cuando cambian esos archivos en `main`.
4. Abre la URL que muestre Pages. La ruta de cada herramienta será `https://pmalvaro.github.io/mini-tools/apps/mi-herramienta/` con el dominio predeterminado.

En Android, abre la URL de la app en Chrome y usa la opción de instalación del navegador. En iPhone, abre la URL en Safari, toca **Compartir → Añadir a pantalla de inicio** y activa **Abrir como app web**.

[Configuración de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
