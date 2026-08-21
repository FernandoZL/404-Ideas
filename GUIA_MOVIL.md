# GUÍA MÓVIL — Nuestro lugar

## Forma recomendada desde ahora

Ya no necesitas crear carpetas o archivos manualmente para el uso normal.

Guarda como favorito en tu iPhone:

```text
https://fernandozl.github.io/404-Ideas/gestion-8f3c6a91/
```

Desde ahí puedes:

- crear recuerdos;
- subir fotos;
- agregar fotos posteriormente;
- crear cartas;
- guardar frases;
- crear fechas;
- subir canciones;
- subir videos;
- subir páginas HTML/sorpresas;
- guardar cosas en Inbox;
- editar contenido existente;
- publicar u ocultar.

Consulta `PANEL_WEB.md` para configurar el acceso por primera vez.

---

# GUÍA MÓVIL — Nuestro lugar

Guía rápida para trabajar desde iPhone.

---

## A. Solo quiero guardar algo rápido

Ve a:

```text
contenido/inbox/AAAA-MM-DD/
```

Sube las fotos/videos y, si quieres, crea:

```text
nota.txt
```

Ejemplo:

```text
contenido/inbox/2026-08-21/
├── IMG_1001.jpeg
├── IMG_1002.jpeg
└── nota.txt
```

No aparece en la web.

---

## B. Crear un recuerdo sin publicarlo

1. Abre GitHub.
2. Ve a `contenido/recuerdos/AAAA/`.
3. Crea `AAAA-MM-DD-nombre`.
4. Sube fotos.
5. Crea `recuerdo.md`.
6. Usa:

```yaml
publicado: false
```

7. Commit.

Puedes volver otro día y seguir editando.

Cuando esté listo:

```yaml
publicado: true
```

Commit.

---

## C. Agregar fotos a un recuerdo existente

Abre la carpeta del recuerdo y sube las nuevas fotos.

No debes modificar `recuerdo.md` salvo que quieras escoger una portada específica.

---

## D. Carta

Crea:

```text
contenido/cartas/AAAA/AAAA-MM-DD-nombre/carta.md
```

Empieza con `publicado: false`.

---

## E. Frase

Crea un `.md` dentro de:

```text
contenido/frases/
```

La fecha es opcional.

---

## F. Fecha

Crea:

```text
contenido/fechas/AAAA-MM-DD-nombre.md
```

Puedes activar contador y aniversario.

---

## G. Canción

Crea una carpeta en:

```text
contenido/canciones/AAAA/
```

Sube:

```text
cancion.md
cancion.mp3
```

o guarda solo enlaces de Spotify/YouTube/Apple Music.

---

## H. Video

Crea:

```text
contenido/videos/AAAA/AAAA-MM-DD-nombre/
```

Sube `video.md` y opcionalmente `video.mp4`.

También puedes usar únicamente YouTube.

---

## I. Desde PC: editor visual

Ejecuta:

```text
herramientas/ABRIR_EDITOR_LOCAL.bat
```

Luego abre:

```text
http://127.0.0.1:8765/herramientas/
```

Tendrás:

- Recuerdo
- Carta
- Frase
- Fecha
- Canción
- Video

Ese panel NO se publica en la web.

---

## J. Regla sencilla

```text
GUARDAR SIN ORDENAR → inbox
PREPARAR EN SECRETO → publicado:false
MOSTRAR EN LA WEB   → publicado:true
```


---

## K. Sorpresa HTML

Si ya tienes el HTML preparado:

1. Ve a `contenido/especiales/`.
2. Crea una carpeta corta, por ejemplo `una-sorpresa`.
3. Sube `index.html`.
4. Crea `info.md`.
5. Déjalo con:

```yaml
publicado: false
```

mientras lo estás preparando.

Cuando quieras que aparezca:

```yaml
publicado: true
```

Commit.

En móvil es más práctico subir un HTML que ya hayas preparado previamente que intentar escribir una experiencia compleja desde cero en la app de GitHub.


## Si el token vence

No necesitas volver a Git ni cambiar archivos.

1. El panel te devolverá a la pantalla de conexión.
2. Crea un Fine-grained token nuevo.
3. Selecciona `404-Ideas`.
4. `Contents → Read and write`.
5. Pega el token nuevo.
6. Continúa usando el panel.

También puedes pulsar `Cambiar token` desde la cabecera.

Consulta `GUIA_TOKEN_GITHUB.md`.


## Compatibilidad de pantalla v2.10.3

La web pública y el panel están preparados para:

- iPhone con notch / Dynamic Island;
- iPhone SE y pantallas compactas;
- Android;
- iPad y tablets;
- modo horizontal;
- laptops y escritorio.

`Recuérdame algo bonito` ahora puede traer cualquier contenido público del
archivo, no únicamente un recuerdo.
