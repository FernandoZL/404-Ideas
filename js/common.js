(() => {
  const NL = window.NL = window.NL || {};

  NL.$ = (id) => document.getElementById(id);

  NL.escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  NL.stripMarkdown = (text) => String(text ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[\*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  NL.excerpt = (text, max = 140) => {
    const clean = NL.stripMarkdown(text);
    return clean.length > max ? clean.slice(0, max).trim() + "…" : clean;
  };

  NL.readJson = async (path, fallback) => {
    try {
      const url = new URL(path, document.baseURI);
      url.searchParams.set("_fresh", Date.now().toString());

      const response = await fetch(url.href, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url.pathname}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("Nuestro lugar:", error);
      return fallback;
    }
  };

  NL.formatDate = (dateText, options = {}) => {
    if (!dateText) return "";
    const date = new Date(`${dateText}T12:00:00`);
    return new Intl.DateTimeFormat("es-GT", {
      day: "2-digit", month: "long", year: "numeric", ...options
    }).format(date);
  };

  NL.shortDate = (dateText) => {
    if (!dateText) return "";
    const date = new Date(`${dateText}T12:00:00`);
    return new Intl.DateTimeFormat("es-GT", {
      day: "2-digit", month: "short", year: "numeric"
    }).format(date);
  };

  NL.daysSince = (dateText) => {
    const start = new Date(`${dateText}T00:00:00`);
    return Math.floor(Math.max(0, Date.now() - start.getTime()) / 86400000);
  };

  NL.memoryUrl = (memory) => `recuerdo.html?id=${encodeURIComponent(memory.id)}`;
  NL.mediaUrl = (memory, file) => file && memory?.carpeta ? `${memory.carpeta}/${file}` : "";

  NL.renderMarkdown = (markdown) => {
    const safe = NL.escapeHtml(markdown || "");
    const blocks = safe.split(/\n{2,}/).map(v => v.trim()).filter(Boolean);
    return blocks.map(block => {
      if (/^#\s/.test(block)) return `<h2>${block.replace(/^#\s+/, "")}</h2>`;
      if (/^##\s/.test(block)) return `<h3>${block.replace(/^##\s+/, "")}</h3>`;
      const inline = block
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
      return `<p>${inline}</p>`;
    }).join("");
  };

  const applyTheme = (theme) => {
    const dark = theme === "dark";
    document.body.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    localStorage.setItem("nl-theme", theme);
    document.querySelectorAll("[data-theme-icon]").forEach(el => el.textContent = dark ? "☀" : "◐");
  };

  NL.initTheme = () => {
    const saved = localStorage.getItem("nl-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  };

  NL.goBack = (fallback = "index.html") => {
    try {
      if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
        history.back();
      } else {
        location.href = fallback;
      }
    } catch {
      location.href = fallback;
    }
  };

  function chrome() {
    const page = document.body.dataset.page || "";
    const header = document.querySelector("[data-site-header]");
    const nav = document.querySelector("[data-mobile-nav]");

    if (header) {
      header.innerHTML = `
        <div class="chrome-left">
          ${page !== "home" ? '<button class="nav-back" type="button" data-back aria-label="Volver">←</button>' : ''}
          <a class="brand" href="index.html">Nuestro lugar <span>🤍</span></a>
        </div>
        <div class="chrome-actions">
          <button class="circle-btn" type="button" data-theme aria-label="Cambiar tema"><span data-theme-icon>◐</span></button>
          <button class="circle-btn menu-btn" type="button" data-menu-open aria-label="Abrir menú">☰</button>
        </div>`;
    }

    if (nav) {
      nav.innerHTML = `
        <a href="index.html" class="${page === 'home' ? 'active' : ''}"><span>⌂</span>Inicio</a>
        <a href="historia.html" class="${page === 'history' ? 'active' : ''}"><span>⌁</span>Historia</a>
        <a href="recuerdos.html" class="${page === 'memories' ? 'active' : ''}"><span>◇</span>Recuerdos</a>
        <a href="archivo.html" class="${page === 'archive' ? 'active' : ''}"><span>◫</span>Archivo</a>`;
    }

    const overlay = document.createElement("aside");
    overlay.id = "siteMenu";
    overlay.className = "site-menu";
    overlay.hidden = true;
    overlay.innerHTML = `
      <button class="menu-scrim" data-menu-close aria-label="Cerrar menú"></button>
      <div class="menu-panel" role="dialog" aria-modal="true" aria-label="Navegación">
        <div class="menu-top">
          <span class="kicker">Nuestro lugar</span>
          <button class="circle-btn" data-menu-close aria-label="Cerrar">×</button>
        </div>
        <nav class="menu-links">
          <a href="index.html"><span>01</span><strong>Inicio</strong><small>Volver a nuestro lugar</small></a>
          <a href="historia.html"><span>02</span><strong>Nuestra historia</strong><small>Todo en orden, desde el comienzo</small></a>
          <a href="recuerdos.html"><span>03</span><strong>Recuerdos</strong><small>Buscar, filtrar y volver a un momento</small></a>
          <a href="fotos.html"><span>04</span><strong>Nosotros en fotos</strong><small>La galería completa</small></a>
          <a href="lugares.html"><span>05</span><strong>Nuestros lugares</strong><small>Los sitios que también se volvieron recuerdo</small></a>
          <a href="frases.html"><span>06</span><strong>Frases nuestras</strong><small>Esas cosas que solo nosotros entendemos</small></a>
          <a href="cartas.html"><span>07</span><strong>Cartas</strong><small>Palabras que merecían quedarse</small></a>
          <a href="archivo.html"><span>08</span><strong>Todo el archivo</strong><small>Distintas formas de volver</small></a>
          <a href="expediente-0606.html"><span>09</span><strong>Expediente #0606</strong><small>La página con la que empezó todo</small></a>
        </nav>
      </div>`;
    document.body.appendChild(overlay);

    const openMenu = () => {
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add("open"));
      document.body.classList.add("menu-open");
    };
    const closeMenu = () => {
      overlay.classList.remove("open");
      document.body.classList.remove("menu-open");
      setTimeout(() => { overlay.hidden = true; }, 220);
    };

    document.querySelectorAll("[data-menu-open]").forEach(el => el.addEventListener("click", openMenu));
    overlay.querySelectorAll("[data-menu-close]").forEach(el => el.addEventListener("click", closeMenu));
    document.querySelectorAll("[data-back]").forEach(el => el.addEventListener("click", () => NL.goBack()));
    document.querySelectorAll("[data-theme]").forEach(el => el.addEventListener("click", () => {
      applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
    }));

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !overlay.hidden) closeMenu();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    NL.initTheme();
    chrome();
    document.body.classList.add("page-enter");
  });
})();
