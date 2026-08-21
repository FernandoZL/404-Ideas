# Nuestro lugar 🤍 — Fundación

Esta es la primera migración técnica del proyecto.

## Qué cambia en esta versión

- `index.html` conserva el contenido y comportamiento actual.
- El CSS salió de `index.html` y ahora vive en `css/legacy.css`.
- El JavaScript salió de `index.html` y ahora vive en `js/legacy.js`.
- Se conserva una copia autosuficiente en `assets/legacy/index-original.html`.
- Se crea `contenido/` como fuente futura de recuerdos.
- Se crean plantillas para contenido.
- `scripts/build.py` descubre recuerdos y genera índices.
- GitHub Actions construye `_site` y publica GitHub Pages.
- `contenido/inbox/` queda excluido del sitio publicado.
- `herramientas/editor.html` prepara un `recuerdo.md` desde el teléfono.

## Importante: dembow.mp3

Este ZIP no contiene tu archivo de audio porque no fue adjuntado a esta conversación.

Mantén tu archivo existente:

`/dembow.mp3`

en la raíz del repositorio. El sitio seguirá usando exactamente esa ruta.

## Primera prueba de recuerdo

Crea:

`contenido/recuerdos/2026/2026-08-20-prueba/recuerdo.md`

con:

```md
---
fecha: 2026-08-20
titulo: Prueba
---

Este es nuestro primer recuerdo detectado automáticamente.
```

Puedes poner fotos `.jpg`, `.jpeg`, `.png` o `.webp` en la misma carpeta.

Ejecuta:

```bash
python scripts/build.py
```

Se generarán:

- `data/generated/recuerdos.json`
- `data/generated/estadisticas.json`
- `_site/`

## Aún NO hace esta versión

- No cambia la portada visual a “Nuestro lugar”.
- No migra todavía los textos históricos a Markdown.
- No transforma HEIC/HEIF.
- No genera thumbnails.
- No muestra todavía los recuerdos nuevos en la interfaz.
- No escribe directamente a GitHub desde el editor.

Es deliberado: primero congelamos y estabilizamos la base actual.


## v2.2 — Navegación y exploración

- Navegación global reutilizable con menú lateral.
- Barra inferior optimizada para iPhone: Inicio / Historia / Guardar / Archivo.
- El loader completo se muestra una sola vez por sesión.
- `recuerdos.html`: buscador y filtros.
- `historia.html`: línea del tiempo ordenable.
- `fotos.html`: galería automática y lightbox con swipe.
- `recuerdo.html?id=...`: URL individual para cada recuerdo.
- `archivo.html`: mapa de secciones presentes y futuras.
- `expediente-0606.html` incorpora un regreso visible a Nuestro lugar.
- El build genera también `data/generated/galeria.json`.


## v2.3 — Lugares

- Editor con navegación de regreso visible.
- Búsqueda/preview de lugar mediante Google Maps sin API key.
- Geolocalización opcional del navegador.
- Soporte para `direccion`, `latitud`, `longitud` y `maps`.
- Vista de mapa dentro de cada recuerdo.
- `data/generated/lugares.json`.
- Nueva sección `lugares.html`.
- El buscador de recuerdos también encuentra lugares y direcciones.


## v2.3.1 — Hotfix de caché

- CSS y JavaScript llevan versión en la URL.
- Los JSON generados se solicitan con cache-busting.
- Evita que el navegador muestre 0 recuerdos después de un deploy nuevo.


## v2.4 — Editor que sí guarda

- Autoguardado del borrador en `localStorage`.
- Recuperación automática al volver al editor.
- Estado visible: guardando / guardado.
- Selección y previsualización de fotos.
- Descarga real de `recuerdo.md`.
- Copia del Markdown.
- Copia de la ruta de publicación.
- Botón directo para abrir GitHub.
- Separación clara entre **borrador guardado** y **recuerdo publicado**.
- El formulario no se limpia hasta pulsar **Empezar un recuerdo nuevo**.


## v2.5 — Experiencia pública limpia

- Se eliminan de la navegación pública los enlaces al editor.
- Se eliminan mensajes de roadmap, desarrollo y “próximamente”.
- Las secciones vacías usan texto editorial, no instrucciones de administración.
- `archivo.html` muestra únicamente secciones públicas reales.
- El editor sigue disponible por URL directa y lleva `noindex,nofollow,noarchive`.
- El acceso de edición recomendado es mediante un favorito directo en el teléfono.

## v2.6 — Frases + Cartas

- Frases originales del Expediente #0606 migradas como contenido fuente.
- `frases.json` y `cartas.json` generados automáticamente.
- Página pública `frases.html` con frase aleatoria.
- Página pública `cartas.html` y detalle `carta.html`.
- Herramientas privadas para generar cartas y frases.
- Los ejemplos del editor son genéricos y no reutilizan recuerdos reales recientes.

## v2.7 — Fechas + aniversarios + números

- Las fechas principales ya no están codificadas en JavaScript.
- Nueva fuente `contenido/fechas/`.
- `data/generated/fechas.json` se genera automáticamente.
- La línea del tiempo consume las fechas generadas.
- Nueva página pública `fechas.html`.
- “Nosotros en números” se genera desde fechas + estadísticas.
- Los aniversarios pueden aparecer automáticamente en “Un día como hoy”.
- El ejemplo técnico de Café Cartel fue sustituido por un ejemplo genérico.

## v2.7.1 — Estabilización de interacción

- Corregido el modal de “Recuérdame algo bonito”.
- Modal con fondo propio, cierre, Escape y foco accesible.
- Hub privado `/herramientas/` para añadir contenido desde móvil.
- El hub muestra solo tipos que ya funcionan: recuerdo, carta, frase y fecha.
- Se realizó prueba de interacción real en navegador además del build estático.


## v2.7.2 — Publicación privada

- `/herramientas` ya no forma parte del artefacto de GitHub Pages.
- `publicado: false` excluye recuerdos, cartas, frases y fechas del sitio.
- Las plantillas nuevas nacen como borrador.
- Los editores privados permiten decidir cuándo publicar.
- `contenido/inbox` continúa totalmente excluido del build público.
- El build falla si detecta referencias administrativas dentro de `_site`.
- Se incluye un editor local para Windows.


## v2.8 — Canciones + Videos

- `contenido/canciones/` como fuente.
- `contenido/videos/` como fuente.
- `canciones.json` y `videos.json` automáticos.
- `canciones.html` + detalle individual.
- `videos.html` + detalle individual.
- Audio local con interacción manual, sin autoplay.
- Spotify, YouTube y Apple Music opcionales.
- Video local con carga diferida (`preload=metadata`).
- YouTube con `youtube-nocookie.com`.
- `dembow.mp3` se conserva en raíz para no romper el Expediente #0606 y además entra al catálogo como “Tu canción”.
- Editores privados de canción y video.
- Manual completo: `MANUAL_CONTENIDO.md`.
- Ejemplos copiables: `/ejemplos`.


## v2.9 — Sorpresas

- Sistema `contenido/especiales/`.
- `data/generated/especiales.json`.
- `sorpresas.html`.
- Una sorpresa puede contener su propio HTML/CSS/JS y archivos.
- Solo las sorpresas `publicado:true` se copian al sitio.
- `Te amo x1000` es la primera sorpresa formal.
- El Expediente #0606 conserva su implementación original.
- Editor privado `editor-especial.html`.
- Plantilla y ejemplo genérico incluidos.


## v2.10 — Administración web

- Nuevo panel web en `/gestion-8f3c6a91/`.
- No existe enlace al panel desde la experiencia pública.
- Autenticación mediante Fine-grained Personal Access Token.
- El token no se almacena en el repositorio.
- GitHub REST API desde navegador.
- Commits atómicos de texto + archivos usando Git Data API.
- Nuevo contenido: recuerdo, carta, frase, fecha, canción, video, sorpresa.
- Administración de contenido existente.
- Agregar fotos después.
- Publicar / ocultar sin editar GitHub manualmente.
- Inbox desde navegador.
- Límite preventivo de 90 MiB por archivo.
- `/herramientas` sigue siendo local y no se publica.
- Documentación: `PANEL_WEB.md`.


## v2.10.2 — estabilización de administración

- Panel reorganizado por cuatro pasos.
- Navegación absoluta y visible hacia Nuestro lugar.
- Detección de token inválido/vencido (HTTP 401).
- Limpieza automática del token inválido en el navegador.
- Botón `Cambiar token`.
- Mensajes específicos para 401 / 403 / 409.
- Guía integrada de renovación del token.
- Nuevo `GUIA_TOKEN_GITHUB.md`.
- Se mantiene el modelo de un Commit por operación.


## v2.10.3 — Azar de todo el archivo + responsive universal

- `Recuérdame algo bonito` deja de elegir únicamente recuerdos.
- Nuevo `data/generated/azar.json`.
- Selección aleatoria equilibrada por tipo de contenido.
- Puede mostrar recuerdos, fotos, frases, cartas, fechas, canciones, videos,
  sorpresas, lugares y secciones del Expediente #0606.
- Nunca incluye borradores, Inbox, herramientas, admin ni archivos técnicos.
- Se restauraron las páginas públicas de Canciones y Videos detectadas como
  faltantes durante la auditoría.
- Nuevo `css/responsive.css` para iPhone, Android, iPad/tablets y escritorio.
- Safe areas, landscape, touch targets, modal tipo bottom-sheet en móvil,
  tipografía fluida y rejillas adaptativas.
- El panel de gestión recibió una segunda pasada responsive.
- El panel avisa en móvil antes de intentar archivos superiores a 28 MiB.


## v2.10.4 — frase de navegación + modal móvil

- Home: `Nuestra historia también vive en los detalles.`
- El modal `Recuérdame algo bonito` vuelve a centrarse en el viewport visible.
- Safe areas para iPhone.
- Altura basada en `100dvh`.
- Scroll interno del modal cuando el contenido supera la pantalla.
- Blur de fondo conservado.
- Ajuste adicional para iPhone pequeño y landscape.
