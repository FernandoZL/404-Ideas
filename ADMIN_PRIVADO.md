# ADMINISTRACIÓN PRIVADA — Nuestro lugar

Esta guía es para Fernando. No se publica en GitHub Pages.

## Regla principal

Hay tres estados distintos:

### 1. INBOX
Guardar ahora y ordenar después.

Ruta:

```text
contenido/inbox/AAAA-MM-DD/
```

Puedes subir fotos, videos y un `nota.txt`.

**GitHub Actions nunca copia `inbox` al sitio.**

### 2. BORRADOR
El contenido ya tiene estructura, pero todavía no debe aparecer en la web.

Ejemplo:

```yaml
---
tipo: recuerdo
publicado: false
fecha: 2026-08-21
titulo: "Un momento bonito"
---
```

Puedes hacer Commit. El constructor lo ignora.

### 3. PUBLICADO
Cuando quieras que aparezca:

```yaml
publicado: true
```

Commit y GitHub Actions hará el resto.

---

## Desde iPhone — recuerdo rápido oculto

1. Abre la app/web de GitHub.
2. Entra al repositorio.
3. Ve a `contenido/recuerdos/AÑO/`.
4. Crea la carpeta `AAAA-MM-DD-nombre`.
5. Sube tus fotos.
6. Crea `recuerdo.md`.
7. Usa `publicado: false`.
8. Commit.

No aparecerá en Nuestro lugar.

Cuando esté listo, cambia únicamente:

```yaml
publicado: false
```

por:

```yaml
publicado: true
```

y haz Commit.

---

## Desde iPhone — guardar sin organizar

Usa:

```text
contenido/inbox/AAAA-MM-DD/
```

Ejemplo:

```text
contenido/inbox/2026-08-21/
├── IMG_1001.jpeg
├── IMG_1002.jpeg
└── nota.txt
```

Esto sirve para guardar algo rápido y organizarlo después.

---

## Editor visual

El directorio `herramientas/` ya NO se publica en GitHub Pages.

En Windows puedes abrirlo con:

```text
herramientas/ABRIR_EDITOR_LOCAL.bat
```

El editor se abre únicamente en:

```text
http://127.0.0.1:8765/herramientas/
```

y desaparece cuando cierras la ventana del servidor.

---

## Importante sobre privacidad real

`publicado: false` e `inbox` los ocultan del **sitio web**, pero si el repositorio de GitHub es público, alguien que visite deliberadamente el repositorio podría ver esos archivos fuente.

Para sorpresas que deban ser realmente secretas antes de publicarlas, la siguiente evolución recomendada es separar el contenido pendiente en un repositorio privado y sincronizarlo solo al publicar.


## Canciones y videos

Los editores locales ahora incluyen:

```text
herramientas/editor-cancion.html
herramientas/editor-video.html
```

Ambos generan contenido con `publicado: false` por defecto.

Ninguna herramienta se copia al sitio público.
