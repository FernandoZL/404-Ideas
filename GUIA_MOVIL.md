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
