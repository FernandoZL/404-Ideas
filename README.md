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
