document.addEventListener("DOMContentLoaded", async () => {
  const songs = await NL.readJson("data/generated/canciones.json", []);
  const grid = NL.$("songsGrid");

  if(!songs.length){
    grid.innerHTML = `
      <article class="media-empty">
        <span class="kicker">Canciones</span>
        <p>Hay canciones que todavía no tienen su página aquí.</p>
      </article>`;
    return;
  }

  grid.innerHTML = songs.map(song => {
    const cover = song.portada ? `${song.carpeta}/${song.portada}` : "";

    return `
      <a class="media-library-card ${cover ? "with-cover" : ""}"
         href="cancion.html?id=${encodeURIComponent(song.id)}"
         ${cover ? `style="background-image:url('${NL.escapeHtml(cover)}')"` : ""}>
        <span class="media-kind">♪ Canción</span>
        <div class="media-card-bottom">
          ${song.fecha ? `<time>${NL.escapeHtml(NL.formatDate(song.fecha))}</time>` : ""}
          <h2>${NL.escapeHtml(song.titulo)}</h2>
          ${song.artista ? `<p>${NL.escapeHtml(song.artista)}</p>` : ""}
          <strong>Escuchar →</strong>
        </div>
      </a>`;
  }).join("");
});
