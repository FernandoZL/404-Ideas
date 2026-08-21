# PANEL WEB DE GESTIÓN — Nuestro lugar

## Dirección

Después de publicar esta versión, tu panel será:

```text
https://fernandozl.github.io/404-Ideas/gestion-8f3c6a91/
```

**No existe ningún enlace hacia esta dirección desde la web principal.**

Aun así, el nombre de la ruta no constituye seguridad real. La autorización para
modificar GitHub la proporciona tu token.

---

# Primera configuración

## 1. Crear un Fine-grained Personal Access Token

En GitHub abre:

```text
https://github.com/settings/personal-access-tokens/new
```

Configura:

```text
Token name:
Nuestro Lugar Admin

Expiration:
La que prefieras (por ejemplo 90 días)

Repository access:
Only select repositories

Repository:
404-Ideas
```

En Repository permissions:

```text
Contents:
Read and write
```

No necesitas conceder permisos para workflows, administración, issues, etc.

Guarda el token cuando GitHub lo muestre.

---

# 2. Entrar al panel

Abre:

```text
https://fernandozl.github.io/404-Ideas/gestion-8f3c6a91/
```

Pega el token.

Puedes marcar:

```text
Recordar en este dispositivo
```

Si no lo marcas, la sesión se conserva únicamente en la pestaña/sesión del navegador.

El token **nunca forma parte de un Commit ni de los archivos del proyecto**.

---

# Qué puedes hacer desde el panel

## Nuevo

Crear directamente:

- Recuerdo
- Carta
- Frase
- Fecha
- Canción
- Video
- Sorpresa HTML

Puedes adjuntar archivos desde Fotos/Archivos del iPhone.

Al pulsar:

```text
Guardar en GitHub
```

el panel crea la estructura, genera el Markdown, sube los archivos y crea un único Commit.

## Borrador

Deja apagado:

```text
Publicar en Nuestro lugar
```

Se guarda:

```yaml
publicado: false
```

No aparece en la página.

## Publicar

Activa:

```text
Publicar en Nuestro lugar
```

o publica después desde la pestaña Archivo.

## Archivo

Permite:

- ver contenido existente;
- buscar;
- filtrar;
- abrir el Markdown;
- editarlo;
- añadir fotos/archivos posteriormente;
- publicar;
- ocultar;
- eliminar.

## Inbox

Puedes subir cualquier cosa sin organizar.

El panel crea algo parecido a:

```text
contenido/inbox/2026-08-21/025400-algo-de-hoy/
├── nota.txt
├── IMG_1001.jpeg
└── video.mp4
```

Inbox nunca se copia a GitHub Pages.

---

# Subir fotografías después

1. Panel → Archivo.
2. Busca el recuerdo.
3. Editar.
4. `Agregar archivos a esta carpeta`.
5. Selecciona las fotos.
6. Guardar cambios.

No necesitas volver a escribir el recuerdo.

---

# Sorpresa HTML

Nuevo → Sorpresa.

Completa título y descripción.

Adjunta, por ejemplo:

```text
index.html
style.css
script.js
foto.jpeg
musica.mp3
```

Mientras esté en borrador no se publica.

Cuando la publiques, el constructor copiará la carpeta completa.

---

# Videos grandes

GitHub bloquea objetos mayores de 100 MiB.

Por seguridad, este panel limita cada archivo a:

```text
90 MiB
```

Para videos mayores:

- usa un enlace de YouTube; o
- comprime/exporta una versión web antes de subir.

La futura fase de optimización automatizará parte de este proceso.

---

# Seguridad

La configuración actual ofrece:

- panel sin enlace público;
- `noindex`;
- token no incluido en el repositorio;
- token fine-grained limitado a un único repositorio;
- permiso mínimo `Contents: Read and write`;
- opción de no persistir el token;
- ningún script externo dentro del panel.

Si posteriormente quieres que ni siquiera tengas que usar un token en el navegador,
la evolución será autenticación GitHub OAuth mediante un pequeño backend/serverless.
