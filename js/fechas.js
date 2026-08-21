document.addEventListener("DOMContentLoaded", async () => {
  const dates = await NL.readJson("data/generated/fechas.json", []);
  const list = NL.$("datesList");

  if(!dates.length){
    list.hidden = true;
    return;
  }

  list.innerHTML = dates.map(item => {
    const days = item.contador ? NL.daysSince(item.fecha) : null;
    const months = item.contador ? NL.completeMonthsSince(item.fecha) : null;

    return `
      <article class="date-card ${item.destacada ? "featured-date" : ""}">
        <div class="date-card-date">
          <time datetime="${NL.escapeHtml(item.fecha)}">
            ${NL.escapeHtml(NL.formatDate(item.fecha))}
          </time>
          ${item.destacada ? '<span>Una fecha especial</span>' : ""}
        </div>

        <div class="date-card-copy">
          <h2>${NL.escapeHtml(item.titulo)}</h2>
          <p>${NL.escapeHtml(item.texto)}</p>

          ${item.contador ? `
            <div class="date-live-count">
              <strong>${days.toLocaleString("es-GT")}</strong>
              <span>días</span>
              <small>${months.toLocaleString("es-GT")} meses completos</small>
            </div>` : ""}

          ${item.enlace ? `
            <a href="${NL.escapeHtml(item.enlace)}">Volver a ese capítulo →</a>
          ` : ""}
        </div>
      </article>`;
  }).join("");
});
