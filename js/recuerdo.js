document.addEventListener("DOMContentLoaded", async () => {
  const normalizePlaceText = value =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const id = new URLSearchParams(location.search).get("id");
  const memories = await NL.readJson("data/generated/recuerdos.json", []);
  const memory = memories.find(item => item.id === id);
  const root = NL.$("memoryDetail");

  if(!memory){
    root.innerHTML = `
      <article class="empty-card">
        <span>No encontrado</span>
        <h3>Ese recuerdo no está aquí.</h3>
        <p>Puede que se haya movido o todavía no se haya publicado.</p>
        <a href="recuerdos.html">Volver a recuerdos →</a>
      </article>`;
    return;
  }

  document.title = `${memory.titulo} · Nuestro lugar`;

  const cover = NL.mediaUrl(memory, memory.portada);
  const other = (memory.imagenes || []).filter(file => file !== memory.portada);
  const tags = memory.tags || [];
  const audio = (memory.audio || [])[0] || memory.musica;

  const hasCoordinates =
    memory.latitud !== "" &&
    memory.longitud !== "" &&
    Number.isFinite(Number(memory.latitud)) &&
    Number.isFinite(Number(memory.longitud));

  const placeQuery = hasCoordinates
    ? `${memory.latitud},${memory.longitud}`
    : [memory.lugar, memory.direccion].filter(Boolean).join(", ");

  const generatedMapsUrl = placeQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`
    : "";

  const savedMapsUrl =
    typeof memory.maps === "string" &&
    /^https?:\/\//i.test(memory.maps)
      ? memory.maps
      : "";

  const mapsUrl = savedMapsUrl || generatedMapsUrl;

  const embedUrl = placeQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(placeQuery)}&z=16&output=embed`
    : "";

  const placeName = String(memory.lugar || "").trim();
  const address = String(memory.direccion || "").trim();

  const showAddress =
    address &&
    normalizePlaceText(address) !== normalizePlaceText(placeName);

  const locationBlock = (placeName || address || embedUrl)
    ? `
      <section class="place-detail">
        <div class="place-detail-copy">
          <span class="kicker">Dónde pasó</span>
          <h2>${NL.escapeHtml(placeName || "Ubicación guardada")}</h2>
          ${showAddress ? `<p>${NL.escapeHtml(address)}</p>` : ""}
          ${mapsUrl ? `<a href="${NL.escapeHtml(mapsUrl)}" target="_blank" rel="noopener">Ver ubicación →</a>` : ""}
        </div>
        ${embedUrl ? `
          <div class="place-map">
            <iframe
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              src="${NL.escapeHtml(embedUrl)}"
              title="Mapa de este recuerdo">
            </iframe>
          </div>` : ""}
      </section>`
    : "";

  root.innerHTML = `
    <header class="detail-head">
      <span class="detail-date">${NL.escapeHtml(NL.formatDate(memory.fecha))}</span>
      <h1 class="detail-title">${NL.escapeHtml(memory.titulo)}</h1>

      <div class="detail-meta">
        ${memory.categoria ? `<span class="meta-pill">${NL.escapeHtml(memory.categoria)}</span>` : ""}
        ${memory.favorito ? '<span class="meta-pill">♡ favorito</span>' : ""}
      </div>
    </header>

    ${cover ? `
      <img class="detail-cover"
           src="${NL.escapeHtml(cover)}"
           alt="${NL.escapeHtml(memory.titulo)}">` : ""}

    <article class="detail-story">
      ${NL.renderMarkdown(memory.texto)}
    </article>

    ${locationBlock}

    ${other.length ? `
      <div class="detail-gallery">
        ${other.map(file => `
          <img src="${NL.escapeHtml(NL.mediaUrl(memory,file))}"
               loading="lazy"
               alt="${NL.escapeHtml(memory.titulo)}">`).join("")}
      </div>` : ""}

    ${audio ? `
      <div class="audio-card">
        <span class="kicker">Una canción para este recuerdo</span>
        <audio controls preload="metadata"
               src="${NL.escapeHtml(NL.mediaUrl(memory,audio))}">
        </audio>
      </div>` : ""}

    <footer class="detail-footer">
      <div class="tag-list">
        ${tags.map(tag => `<span class="tag">#${NL.escapeHtml(tag)}</span>`).join("")}
      </div>
      <a href="recuerdos.html">Volver a recuerdos →</a>
    </footer>
  `;
});
