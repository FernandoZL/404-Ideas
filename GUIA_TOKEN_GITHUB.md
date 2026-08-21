# GUÍA DEL TOKEN DE GITHUB — Nuestro lugar

Esta guía explica únicamente el acceso del panel privado.

## Para qué sirve

El panel:

```text
https://fernandozl.github.io/404-Ideas/gestion-8f3c6a91/
```

necesita permiso para crear y editar archivos en GitHub.

Por eso utiliza un **Fine-grained Personal Access Token**.

El token debe estar limitado a:

```text
Repository access:
Only select repositories
→ 404-Ideas

Repository permissions:
Contents → Read and write
Metadata → Read-only (GitHub puede agregarlo automáticamente)
```

No necesita permisos de Actions, Administration, Workflows, Secrets,
Deployments ni Pull requests.

---

# ¿Qué ocurre cuando vence?

GitHub revoca automáticamente el token al llegar a su fecha de vencimiento.

Un token vencido o revocado **no se puede reactivar**.

No afecta el contenido ya guardado.

No rompe GitHub Pages.

No borra recuerdos.

Simplemente el panel deja de poder autenticarse hasta que conectes otro token.

---

# Cómo reemplazarlo

## Opción A — el token ya venció

El panel detectará que GitHub responde como no autorizado y mostrará:

```text
El token ya no es válido.
```

Haz lo siguiente:

1. Pulsa el enlace para crear un token nuevo.
2. Crea otro Fine-grained token.
3. Selecciona solamente `404-Ideas`.
4. `Contents → Read and write`.
5. Copia el nuevo `github_pat_...`.
6. Vuelve al panel.
7. Pégalo.
8. Pulsa `Conectar`.

Listo.

No debes editar HTML, JavaScript ni Git.

## Opción B — quieres cambiarlo antes

En la parte superior del panel pulsa:

```text
Cambiar token
```

El panel olvidará el token guardado en ese navegador y volverá a la
pantalla de conexión.

Pega el nuevo.

---

# Crear un token nuevo

GitHub:

```text
Settings
→ Developer settings
→ Personal access tokens
→ Fine-grained tokens
→ Generate new token
```

Configuración recomendada:

```text
Token name:
Nuestro Lugar Admin

Expiration:
90 días (o el periodo que prefieras)

Repository access:
Only select repositories
→ 404-Ideas

Repository permissions:
Contents → Read and write
```

---

# Si pierdes el teléfono

En otro dispositivo entra a GitHub:

```text
Settings
→ Developer settings
→ Personal access tokens
→ Fine-grained tokens
```

Revoca el token que utilizabas en el teléfono perdido.

Después crea otro.

---

# Si GitHub muestra 403

Normalmente significa que:

- el token no tiene `Contents: Read and write`;
- no tiene acceso a `404-Ideas`; o
- GitHub limitó temporalmente las solicitudes.

El panel mostrará un mensaje específico.

---

# ¿Dónde se guarda?

Si NO marcas:

```text
Recordar en este dispositivo
```

se guarda en `sessionStorage`.

Si lo marcas, se guarda en `localStorage` del navegador.

Nunca se escribe dentro del repositorio ni forma parte de un Commit.

Marca "Recordar" únicamente en un dispositivo personal.
