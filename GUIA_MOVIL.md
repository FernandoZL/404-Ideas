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


## Guardar un lugar

En `Guardar algo` ahora puedes:

1. Escribir el nombre del lugar.
2. Tocar **Buscar en mapa** para verificarlo.
3. Si estás físicamente allí, tocar **Usar mi ubicación**.
4. También puedes escribir latitud/longitud o guardar un enlace de Google Maps.
5. Al publicar el recuerdo, el lugar aparecerá en **Nuestros lugares**.

No es obligatorio guardar coordenadas. Un recuerdo puede tener solo el nombre del lugar.


## v2.4 — Borradores y publicación

El editor ahora guarda automáticamente el texto del recuerdo en el mismo navegador.

### Qué significa "guardado"
El borrador está guardado localmente en ese iPhone/PC. Puedes salir y volver al editor sin perder el texto.

### Qué significa "publicado"
El recuerdo ya fue subido a GitHub y aparece en Nuestro lugar.

### Flujo recomendado
1. Abre **Guardar**.
2. Escribe fecha, título e historia.
3. Agrega lugar si quieres.
4. Selecciona tus fotos para comprobar los nombres.
5. Toca **Preparar para publicar**.
6. Descarga `recuerdo.md`.
7. Abre GitHub.
8. Crea la carpeta indicada.
9. Sube las fotos.
10. Sube o crea `recuerdo.md`.
11. Commit.

Las fotos seleccionadas en el editor son solo una previsualización. Por seguridad del navegador, si recargas la página tendrás que volver a seleccionarlas; el texto sí permanece guardado.


## Acceso al editor sin mostrarlo en la web pública

Desde esta versión, la navegación pública ya no muestra botones de administración ni de carga.

Guarda como favorito en tu iPhone esta dirección:

`https://fernandozl.github.io/404-Ideas/herramientas/editor.html`

También puedes añadir esa página a la pantalla de inicio de iOS para entrar directamente a **Guardar algo**.

Esto evita que la experiencia normal de Nuestro lugar muestre instrucciones de construcción o publicación.

Importante: la URL no es una autenticación real. El editor sigue siendo una página estática del sitio; simplemente no está enlazado desde la experiencia pública.

## Guardar una carta

Abre directamente:
`https://fernandozl.github.io/404-Ideas/herramientas/editor-carta.html`

Completa fecha, título y texto. Descarga `carta.md` y colócalo dentro de la ruta indicada.

## Guardar una frase

Abre directamente:
`https://fernandozl.github.io/404-Ideas/herramientas/editor-frase.html`

La fecha es opcional. Puedes guardar también un contexto breve.

## Guardar una fecha importante

Abre directamente:
`https://fernandozl.github.io/404-Ideas/herramientas/editor-fecha.html`

Puedes decidir si la fecha debe tener contador y si quieres recordarla cada año.


## Acceso recomendado desde el teléfono

Guarda como favorito o añade a la pantalla de inicio:

`https://fernandozl.github.io/404-Ideas/herramientas/`

Desde ahí puedes elegir Recuerdo, Carta, Frase o Fecha sin entrar a la navegación pública.


## Flujo privado

Las herramientas de edición ya no se publican junto con la web.

Para contenido desde el celular:

- usa `publicado: false` si quieres preparar algo sin mostrarlo;
- usa `contenido/inbox/` si solo quieres guardar fotos/notas y ordenar después;
- cambia a `publicado: true` únicamente cuando quieras que aparezca en Nuestro lugar.

Consulta `ADMIN_PRIVADO.md` para el flujo completo.
