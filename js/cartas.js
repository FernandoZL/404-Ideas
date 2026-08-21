document.addEventListener("DOMContentLoaded", async () => {
  const letters = await NL.readJson("data/generated/cartas.json", []);
  const grid = NL.$("lettersGrid");

  if(!letters.length){
    grid.innerHTML = `
      <article class="letter-empty">
        <span class="kicker">Cartas</span>
        <p>
          Hay palabras que todavía están esperando el momento correcto para ser escritas.
        </p>
      </article>`;
    return;
  }

  grid.innerHTML = letters.map(letter => {
    const cover = NL.mediaUrl(letter, letter.portada);

    return `
      <a class="letter-card ${cover ? "has-cover" : ""}"
         href="carta.html?id=${encodeURIComponent(letter.id)}"
         ${cover ? `style="background-image:url('${NL.escapeHtml(cover)}')"` : ""}>
        <time>${NL.escapeHtml(NL.formatDate(letter.fecha))}</time>
        <h2>${NL.escapeHtml(letter.titulo)}</h2>
        <p>${NL.escapeHtml(NL.excerpt(letter.texto, 170))}</p>
        <span>Leer carta →</span>
      </a>`;
  }).join("");
});
