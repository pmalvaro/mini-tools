# Mini Tools

Este proyecto reúne herramientas web independientes. Cada herramienta debe poder abrirse en su propia URL e instalarse como PWA en el móvil. Usa HTML, CSS y JavaScript nativos, sin frameworks, dependencias de producción, backend ni paso de compilación.

## Estructura del proyecto

- `docs/` es la raíz del sitio estático. Su `index.html` muestra el catálogo y `.nojekyll` permite publicar directamente los archivos en GitHub Pages.
- `docs/apps/<slug>/` contiene todos los archivos de una herramienta. Usa nombres de carpeta en minúsculas y con guiones. Conserva el slug después de publicar para mantener los enlaces y la identidad de instalación.
- `templates/pwa/` es la plantilla de partida para herramientas nuevas. Está fuera de la carpeta publicada.
- `README.md` contiene las instrucciones para añadir herramientas, servir el proyecto en local y configurar GitHub Pages.

## Desarrollo de una app

- Parte de la plantilla PWA, personaliza el título, el manifiesto y los iconos, y añade un enlace a la herramienta en el catálogo.
- Usa rutas relativas para enlaces, scripts, estilos, iconos y registro del service worker. La URL de despliegue incluye el prefijo del repositorio, como `/mini-tools/apps/<slug>/`.
- Mantén el manifiesto y el service worker dentro de la carpeta de la app. Usa `start_url` y `scope` relativos a esa carpeta y conserva el modo `standalone`. Cada service worker debe controlar solo su app y usar una caché propia.
- Añade al listado de precarga de `sw.js` los recursos necesarios sin conexión. Cambia la versión de la caché cuando se modifiquen esos recursos. Durante la activación, elimina solo las versiones anteriores de la caché de esa app.
- Si guardas datos en el navegador, usa nombres de almacenamiento propios de la app. Las herramientas del mismo sitio comparten origen.
- Diseña para pantallas pequeñas y controles táctiles. Usa HTML semántico, etiquetas para controles y foco visible para navegación con teclado.

## Verificación

- Sirve `docs/` con `python3 -m http.server 8000 --directory docs`. Abre `http://localhost:8000/apps/<slug>/` y comprueba el enlace desde el catálogo, los recursos y el flujo principal de la app.
- Para verificar las rutas de despliegue, sirve también una copia del sitio bajo un prefijo como `/mini-tools/`. Comprueba que se resuelven el manifiesto, los iconos y el service worker.
- Verifica que el service worker esté activo tras la primera visita con conexión y recarga la app sin conexión. Si modificas la caché, comprueba tanto una instalación nueva como una actualización desde la versión anterior.
- Cuando corresponda, prueba la instalación y el arranque en Chrome para Android y Safari para iPhone. Indica en la entrega qué comprobaciones quedaron pendientes.

## Repositorio y publicación

El repositorio remoto es `pmalvaro/mini-tools` y es privado. GitHub Pages es el destino previsto y `/docs` es la carpeta preparada para publicar desde la rama principal. Comprueba que el plan admite Pages en repositorios privados y revisa la visibilidad del sitio antes de habilitarlo. La privacidad del repositorio y la del sitio se gestionan por separado.

## Commits

Todo commit creado por un agente debe seguir [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Usa `tipo(ámbito): descripción`, con ámbito opcional y una descripción breve en imperativo. Usa el slug como ámbito si el cambio afecta a una sola app. Marca los cambios incompatibles con `!` y explica el impacto en un pie `BREAKING CHANGE:` cuando corresponda.

```text
feat(temporizador): añade el control de pausa
fix(temporizador): restaura la sesión al volver a abrir la app
docs: documenta la publicación en GitHub Pages
```
