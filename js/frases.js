document.addEventListener("DOMContentLoaded", async () => {
  const phrases = await NL.readJson("data/generated/frases.json", []);
  const grid = NL.$("phrasesGrid");
  const random = NL.$("randomPhrase");
  const context = NL.$("randomPhraseContext");
  const button = NL.$("anotherPhrase");

  function cleanPhrase(text){
    return String(text || "").trim();
  }

  function showRandom(){
    if(!phrases.length){
      random.textContent = "Hay cosas que solo necesitan su momento.";
      context.hidden = true;
      button.hidden = true;
      return;
    }

    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    random.textContent = cleanPhrase(phrase.texto);

    if(phrase.contexto){
      context.textContent = phrase.contexto;
      context.hidden = false;
    }else{
      context.hidden = true;
    }
  }

  if(phrases.length){
    grid.innerHTML = phrases.map(phrase => `
      <article class="phrase-card">
        <blockquote>${NL.escapeHtml(cleanPhrase(phrase.texto))}</blockquote>
        ${phrase.fecha ? `<time>${NL.escapeHtml(NL.shortDate(phrase.fecha))}</time>` : ""}
        ${phrase.contexto ? `<p>${NL.escapeHtml(phrase.contexto)}</p>` : ""}
      </article>
    `).join("");
  }else{
    grid.innerHTML = `
      <article class="empty-card">
        <span>Frases nuestras</span>
        <h3>Hay cosas que no necesitan explicación.</h3>
      </article>`;
  }

  showRandom();
  button.addEventListener("click", showRandom);
});
