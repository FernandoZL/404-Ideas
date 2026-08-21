document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(location.search).get("id");
  const letters = await NL.readJson("data/generated/cartas.json", []);
  const letter = letters.find(item => item.id === id);
  const root = NL.$("letterDetail");

  if(!letter){
    root.innerHTML = `
      <article class="letter-empty">
        <span class="kicker">Carta</span>
        <p>Esa carta no está aquí.</p>
        <a href="cartas.html">Volver a cartas →</a>
      </article>`;
    return;
  }

  document.title = `${letter.titulo} · Nuestro lugar`;

  const cover = NL.mediaUrl(letter, letter.portada);
  const images = (letter.imagenes || []).filter(file => file !== letter.portada);
  const audio = (letter.audio || [])[0] || letter.musica;

  root.innerHTML = `
    <header class="letter-head">
      <time>${NL.escapeHtml(NL.formatDate(letter.fecha))}</time>
      <h1>${NL.escapeHtml(letter.titulo)}</h1>
    </header>

    ${cover ? `<img class="letter-cover" src="${NL.escapeHtml(cover)}" alt="${NL.escapeHtml(letter.titulo)}">` : ""}

    <article class="letter-paper">
      ${NL.renderMarkdown(letter.texto)}
    </article>

    ${images.length ? `
      <div class="detail-gallery">
        ${images.map(file => `<img loading="lazy" src="${NL.escapeHtml(NL.mediaUrl(letter,file))}" alt="">`).join("")}
      </div>` : ""}

    ${audio ? `
      <div class="audio-card">
        <span class="kicker">Para leerla con música</span>
        <audio controls preload="metadata" src="${NL.escapeHtml(NL.mediaUrl(letter,audio))}"></audio>
      </div>` : ""}

    <footer class="letter-footer">
      <a href="cartas.html">← Volver a cartas</a>
    </footer>
  `;
});
