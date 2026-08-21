document.addEventListener("DOMContentLoaded", async () => {
  const [memories, dates] = await Promise.all([
    NL.readJson("data/generated/recuerdos.json", []),
    NL.readJson("data/generated/fechas.json", [])
  ]);

  const importantDates = dates.map(item => ({
    ...item,
    sourceType: "date"
  }));

  const dynamicMemories = memories.map(item => ({
    ...item,
    sourceType: "memory"
  }));

  let direction = "asc";

  function render(){
    const entries = [...importantDates, ...dynamicMemories]
      .sort((a,b) =>
        direction === "asc"
          ? a.fecha.localeCompare(b.fecha)
          : b.fecha.localeCompare(a.fecha)
      );

    NL.$("timeline").innerHTML = entries.map(entry => {
      const date = new Date(`${entry.fecha}T12:00:00`);
      const day = String(date.getDate()).padStart(2,"0");
      const month = new Intl.DateTimeFormat("es-GT",{month:"short"})
        .format(date).replace(".","").toUpperCase();
      const year = date.getFullYear();

      const content = `
        <time>
          <strong>${day}</strong>
          ${month} ${year}
        </time>
        <div>
          <h3>${NL.escapeHtml(entry.titulo)}</h3>
          <p>${NL.escapeHtml(NL.excerpt(entry.texto,180))}</p>
        </div>`;

      if(entry.sourceType === "memory"){
        return `
          <article class="memory-timeline" data-url="${NL.memoryUrl(entry)}">
            ${content}
          </article>`;
      }

      if(entry.enlace){
        return `
          <article class="${entry.destacada ? "featured " : ""}memory-timeline"
                   data-url="${NL.escapeHtml(entry.enlace)}">
            ${content}
          </article>`;
      }

      return `
        <article class="${entry.destacada ? "featured" : ""}">
          ${content}
        </article>`;
    }).join("");

    document
      .querySelectorAll("[data-url]")
      .forEach(element => {
        element.addEventListener("click", () => {
          location.href = element.dataset.url;
        });
      });
  }

  NL.$("asc").onclick = () => {
    direction = "asc";
    NL.$("asc").classList.add("active");
    NL.$("desc").classList.remove("active");
    render();
  };

  NL.$("desc").onclick = () => {
    direction = "desc";
    NL.$("desc").classList.add("active");
    NL.$("asc").classList.remove("active");
    render();
  };

  render();
});
