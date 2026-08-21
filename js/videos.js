document.addEventListener("DOMContentLoaded", async () => {
  const videos = await NL.readJson("data/generated/videos.json", []);
  const grid = NL.$("videosGrid");

  if(!videos.length){
    grid.innerHTML = `
      <article class="media-empty">
        <span class="kicker">Videos</span>
        <p>Algunos momentos se guardan mejor cuando se pueden volver a ver.</p>
      </article>`;
    return;
  }

  grid.innerHTML = videos.map(item => {
    const cover = item.portada ? `${item.carpeta}/${item.portada}` : "";

    return `
      <a class="media-library-card ${cover ? "with-cover" : ""}"
         href="video.html?id=${encodeURIComponent(item.id)}"
         ${cover ? `style="background-image:url('${NL.escapeHtml(cover)}')"` : ""}>
        <span class="media-kind">▶ Video</span>
        <div class="media-card-bottom">
          <time>${NL.escapeHtml(NL.formatDate(item.fecha))}</time>
          <h2>${NL.escapeHtml(item.titulo)}</h2>
          <p>${NL.escapeHtml(NL.excerpt(item.texto, 105))}</p>
          <strong>Ver →</strong>
        </div>
      </a>`;
  }).join("");
});
