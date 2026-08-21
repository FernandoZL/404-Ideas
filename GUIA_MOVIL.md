# Guía móvil — primera versión

## Guardar un recuerdo desde iPhone

1. Abre `herramientas/editor.html` en el sitio.
2. Escribe fecha, título e historia.
3. Toca **Preparar recuerdo**.
4. Copia el contenido de `recuerdo.md`.
5. En Safari abre tu repositorio de GitHub.
6. Entra a `contenido/recuerdos/AÑO/`.
7. Crea la carpeta indicada por el editor.
8. Sube tus fotos sin renombrarlas.
9. Crea `recuerdo.md` y pega el contenido.
10. Haz Commit.

GitHub Actions hará el resto del build.

## Guardar ahora y ordenar después

Usa:

`contenido/inbox/AAAA-MM-DD/`

Ese directorio no se copia al artefacto de GitHub Pages.

**Importante:** si el repositorio es público, los archivos del inbox siguen siendo visibles en GitHub aunque no aparezcan en la web.
