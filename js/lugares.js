document.addEventListener("DOMContentLoaded", async () => {
  const places = await NL.readJson("data/generated/lugares.json", []);
  const grid = NL.$("placesGrid");

  if(!places.length) return;

  grid.innerHTML = places.map((place,index) => {
    const query =
      place.latitud && place.longitud
        ? `${place.latitud},${place.longitud}`
        : [place.nombre,place.direccion].filter(Boolean).join(", ");

    const mapsUrl =
      typeof place.maps === "string" && /^https?:\/\//i.test(place.maps)
        ? place.maps
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

    const memories = place.recuerdos || [];

    return `
      <article class="place-card">
        <div class="place-card-copy">
          <span class="kicker">${memories.length} ${memories.length === 1 ? "recuerdo" : "recuerdos"}</span>
          <h2>${NL.escapeHtml(place.nombre || "Lugar guardado")}</h2>
          ${place.direccion ? `<p>${NL.escapeHtml(place.direccion)}</p>` : ""}
          <div class="place-links">
            <button type="button"
                    class="place-map-button"
                    data-place-map="${index}"
                    data-query="${NL.escapeHtml(query)}">
              Ver mapa
            </button>
            ${place.nombre ? `<a href="recuerdos.html?q=${encodeURIComponent(place.nombre)}">Ver recuerdos aquí</a>` : ""}
            <a href="${NL.escapeHtml(mapsUrl)}" target="_blank" rel="noopener">Abrir Maps ↗</a>
          </div>
        </div>

        <div class="place-inline-map" id="placeMap${index}">
          <span>⌖</span>
          <small>El mapa se carga solo cuando lo abres.</small>
        </div>
      </article>`;
  }).join("");

  document.querySelectorAll("[data-place-map]").forEach(button => {
    button.addEventListener("click", () => {
      const index = button.dataset.placeMap;
      const query = button.dataset.query;
      const target = NL.$(`placeMap${index}`);

      if(!target || !query) return;

      const embed =
        `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;

      target.innerHTML =
        `<iframe loading="lazy"
                 referrerpolicy="no-referrer-when-downgrade"
                 src="${embed}"
                 title="Mapa del lugar"></iframe>`;

      button.textContent = "Mapa abierto";
      button.disabled = true;
    });
  });
});
