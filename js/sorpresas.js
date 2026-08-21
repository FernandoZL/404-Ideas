document.addEventListener("DOMContentLoaded", async () => {
  const specials = await NL.readJson("data/generated/especiales.json", []);
  const grid = NL.$("specialsGrid");

  if(!specials.length){
    grid.hidden = true;
    return;
  }

  grid.innerHTML = specials.map(item => {
    const cover =
      item.portada
        ? `${item.carpeta}/${item.portada}`
        : "";

    return `
      <a class="special-card ${cover ? "with-cover" : ""}"
         href="${NL.escapeHtml(item.url)}"
         ${cover ? `style="background-image:url('${NL.escapeHtml(cover)}')"` : ""}>
        <span class="special-index">✦</span>
        <div>
          ${item.fecha ? `<time>${NL.escapeHtml(NL.formatDate(item.fecha))}</time>` : ""}
          <h2>${NL.escapeHtml(item.titulo)}</h2>
          <p>${NL.escapeHtml(NL.excerpt(item.texto,150))}</p>
          <strong>Abrir sorpresa →</strong>
        </div>
      </a>`;
  }).join("");
});
