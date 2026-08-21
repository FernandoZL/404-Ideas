document.addEventListener("DOMContentLoaded", async () => {
  const memories = await NL.readJson("data/generated/recuerdos.json", []);
  const search = NL.$("search"), category = NL.$("category"), year = NL.$("year"), grid = NL.$("allMemories"), meta = NL.$("resultMeta");
  const initialQuery = new URLSearchParams(location.search).get("q") || "";
  search.value = initialQuery;
  const categories = [...new Set(memories.map(m => m.categoria).filter(Boolean))].sort();
  const years = [...new Set(memories.map(m => m.fecha?.slice(0,4)).filter(Boolean))].sort().reverse();
  category.innerHTML += categories.map(v => `<option value="${NL.escapeHtml(v)}">${NL.escapeHtml(v)}</option>`).join("");
  year.innerHTML += years.map(v => `<option value="${v}">${v}</option>`).join("");

  function render() {
    const q = search.value.trim().toLowerCase(), cat = category.value, yr = year.value;
    const filtered = memories.filter(m => {
      const haystack = [m.titulo,m.texto,m.fecha,m.categoria,m.lugar,m.direccion,...(m.tags||[])].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) && (!cat || m.categoria === cat) && (!yr || m.fecha?.startsWith(yr));
    });
    meta.textContent = `${filtered.length} ${filtered.length === 1 ? "recuerdo encontrado" : "recuerdos encontrados"}`;
    if (!filtered.length) {
      grid.innerHTML = `<article class="empty-card"><span>Sin resultados</span><h3>No encontré ese recuerdo.</h3><p>Prueba con otra palabra, año o categoría.</p></article>`;
      return;
    }
    grid.innerHTML = filtered.map(m => {
      const photo = NL.mediaUrl(m,m.portada);
      return `<a href="${NL.memoryUrl(m)}" class="memory-card ${photo?"photo":""}" ${photo?`style="background-image:url('${NL.escapeHtml(photo)}')"`:""}><time>${NL.escapeHtml(NL.shortDate(m.fecha))}</time><h3>${NL.escapeHtml(m.titulo)}</h3><p>${NL.escapeHtml(NL.excerpt(m.texto))}</p></a>`;
    }).join("");
  }
  [search,category,year].forEach(el => el.addEventListener("input",render)); render();
});
