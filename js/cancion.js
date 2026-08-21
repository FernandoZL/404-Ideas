document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(location.search).get("id");
  const songs = await NL.readJson("data/generated/canciones.json", []);
  const song = songs.find(item => item.id === id);
  const root = NL.$("songDetail");

  if(!song){
    root.innerHTML = `
      <article class="media-empty">
        <span class="kicker">Canción</span>
        <p>Esa canción no está aquí.</p>
        <a href="canciones.html">Volver a canciones →</a>
      </article>`;
    return;
  }

  document.title = `${song.titulo} · Nuestro lugar`;

  const cover = song.portada ? `${song.carpeta}/${song.portada}` : "";

  const links = [
    song.spotify ? `<a target="_blank" rel="noopener" href="${NL.escapeHtml(song.spotify)}">Spotify ↗</a>` : "",
    song.appleMusic ? `<a target="_blank" rel="noopener" href="${NL.escapeHtml(song.appleMusic)}">Apple Music ↗</a>` : "",
    song.youtube ? `<a target="_blank" rel="noopener" href="${NL.escapeHtml(song.youtube)}">YouTube ↗</a>` : ""
  ].filter(Boolean).join("");

  root.innerHTML = `
    <header class="media-detail-head">
      <span class="kicker">Nuestra música</span>
      ${song.fecha ? `<time>${NL.escapeHtml(NL.formatDate(song.fecha))}</time>` : ""}
      <h1>${NL.escapeHtml(song.titulo)}</h1>
      ${song.artista ? `<p>${NL.escapeHtml(song.artista)}</p>` : ""}
    </header>

    ${cover ? `<img class="media-detail-cover" src="${NL.escapeHtml(cover)}" alt="${NL.escapeHtml(song.titulo)}">` : ""}

    ${song.src ? `
      <div class="player-card">
        <span class="kicker">Escuchar</span>
        <audio controls preload="metadata" src="${NL.escapeHtml(song.src)}"></audio>
        <small>La reproducción comienza únicamente cuando tú la inicias.</small>
      </div>` : ""}

    ${song.texto ? `
      <article class="media-story">
        ${NL.renderMarkdown(song.texto)}
      </article>` : ""}

    ${links ? `<nav class="stream-links">${links}</nav>` : ""}

    <footer class="media-detail-footer">
      <a href="canciones.html">← Volver a canciones</a>
    </footer>`;
});
