# MANUAL DE CONTENIDO — Nuestro lugar

Este documento es la referencia completa para agregar contenido.

**No se publica en GitHub Pages.**

---

# 1. La idea más importante

Hay tres estados:

## INBOX
Solo quieres guardar algo rápido.

Ruta:

```text
contenido/inbox/AAAA-MM-DD/
```

No aparece en la web.

## BORRADOR
El contenido ya tiene estructura, pero todavía no quieres mostrarlo.

```yaml
publicado: false
```

Puedes hacer Commit. No aparecerá en Nuestro lugar.

## PUBLICADO
Cuando esté listo:

```yaml
publicado: true
```

Commit y GitHub Actions lo incorpora al sitio.

---

# 2. Recuerdo

Ruta:

```text
contenido/recuerdos/AAAA/AAAA-MM-DD-nombre/
├── recuerdo.md
├── IMG_0001.jpeg
└── IMG_0002.jpeg
```

Ejemplo:

```yaml
---
tipo: recuerdo
publicado: false
fecha: 2026-08-21
titulo: "Un momento bonito"
categoria: momento
favorito: false
portada:
tags:
  - nosotros
  - especial
musica:
lugar: "Un lugar especial"
direccion:
latitud:
longitud:
maps:
---

# Un momento bonito

Aquí escribes lo que pasó.
```

Las fotos de la carpeta se detectan solas.

Si `portada:` está vacío, se toma la primera fotografía.

---

# 3. Recuerdo rápido

```yaml
---
publicado: false
fecha: 2026-08-21
titulo: "Algo que no quiero olvidar"
---

Hoy pasó algo que quiero guardar...
```

Puedes ampliarlo después.

---

# 4. Carta

Ruta:

```text
contenido/cartas/AAAA/AAAA-MM-DD-nombre/
├── carta.md
└── foto-opcional.jpeg
```

Ejemplo:

```yaml
---
tipo: carta
publicado: false
fecha: 2026-08-21
titulo: "Para ti"
portada:
musica:
---

Rocío,

Aquí escribes la carta.

Con amor,

Fernando 🤍
```

---

# 5. Frase

Puede tener fecha o no.

Ejemplo:

```yaml
---
tipo: frase
publicado: false
fecha:
favorito: false
contexto: "Una conversación cualquiera"
---

“Una frase que queremos recordar.”
```

---

# 6. Fecha importante

Ruta recomendada:

```text
contenido/fechas/AAAA-MM-DD-nombre.md
```

Ejemplo:

```yaml
---
tipo: fecha
publicado: false
clave:
fecha: 2026-08-21
titulo: "Una fecha importante"
contador: true
aniversario: true
destacada: false
enlace:
mensaje_aniversario: "Hoy se cumple otro capítulo 🤍"
---

Aquí explicas por qué importa.
```

`contador: true` muestra cuánto tiempo ha pasado.

`aniversario: true` permite recordarla automáticamente cada año.

---

# 7. Canción

Ruta:

```text
contenido/canciones/AAAA/AAAA-MM-DD-nombre/
├── cancion.md
└── cancion.mp3
```

Ejemplo con archivo:

```yaml
---
tipo: cancion
publicado: false
fecha: 2026-08-21
titulo: "Una canción especial"
artista: "Artista"
archivo: "cancion.mp3"
archivo_raiz: false
spotify:
youtube:
apple_music:
portada:
favorito: false
---

Esta canción me recuerda a...
```

También puedes dejar `archivo:` vacío y usar solamente Spotify, YouTube o Apple Music.

Formatos locales admitidos:

- MP3
- M4A
- AAC
- WAV

**Recomendado:** MP3 o M4A.

Nunca se reproduce automáticamente.

---

# 8. Video

Ruta:

```text
contenido/videos/AAAA/AAAA-MM-DD-nombre/
├── video.md
├── video.mp4
└── portada.jpeg
```

Ejemplo:

```yaml
---
tipo: video
publicado: false
fecha: 2026-08-21
titulo: "Un video especial"
archivo: "video.mp4"
youtube:
portada:
favorito: false
---

Aquí escribes qué pasó.
```

También puedes usar YouTube:

```yaml
archivo:
youtube: "https://www.youtube.com/watch?v=..."
```

Formatos locales admitidos:

- MP4
- MOV
- M4V

**Recomendado para la web:** MP4 con video H.264 y audio AAC.

Los videos no cargan automáticamente en la portada del sitio.

---

# 9. Fotos

Dentro de un recuerdo puedes simplemente subir:

```text
IMG_4837.jpeg
IMG_4838.jpeg
IMG_4839.jpeg
```

No necesitas renombrarlas.

Soportados por el constructor:

- JPG
- JPEG
- PNG
- WEBP
- HEIC
- HEIF

Nota: HEIC/HEIF todavía necesitan la futura fase de optimización para garantizar visualización universal fuera del ecosistema Apple.

---

# 10. Lugar

Campos:

```yaml
lugar: "Un lugar especial"
direccion:
latitud:
longitud:
maps:
```

Puedes usar solo el nombre o guardar coordenadas exactas.

---

# 11. Favorito

```yaml
favorito: true
```

Queda preparado para la sección global de favoritos.

---

# 12. Publicar

Cuando termines:

```yaml
publicado: true
```

Haz Commit.

GitHub Actions:

1. valida;
2. indexa;
3. genera JSON;
4. copia solo medios públicos;
5. excluye inbox;
6. excluye herramientas;
7. publica GitHub Pages.

---

# 13. Qué NO debes editar normalmente

```text
css/
js/
scripts/
.github/
data/generated/
```

---

# 14. Qué sí puedes tocar

```text
contenido/
plantillas/
ejemplos/
```

`herramientas/` se usa localmente para generar archivos.

---

# 15. Validar antes de subir desde PC

En la raíz del proyecto:

```powershell
python .\scripts\build.py
```

o:

```powershell
py .\scripts\build.py
```

Debe terminar con:

```text
NUESTRO LUGAR - BUILD CORRECTO
```

---

# 16. Importante sobre secretos reales

`publicado: false` evita que algo aparezca en la web.

Pero si el repositorio GitHub es público, los archivos fuente todavía podrían verse entrando deliberadamente al repositorio.

Para una sorpresa que deba permanecer realmente secreta hasta el día de publicarla, no la subas aún al repositorio público. Usa tu teléfono/PC local o un repositorio privado.
