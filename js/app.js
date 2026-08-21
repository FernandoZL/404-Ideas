document.addEventListener("DOMContentLoaded", async () => {
  const $ = NL.$;
  const [config, memories, stats, phrases] = await Promise.all([
    NL.readJson("data/configuracion.json", null),
    NL.readJson("data/generated/recuerdos.json", []),
    NL.readJson("data/generated/estadisticas.json", null),
    NL.readJson("data/generated/frases.json", [])
  ]);

  if (config?.subtitle && $("subtitle")) $("subtitle").textContent = config.subtitle;
  const memoryCount = stats?.recuerdos || 0;
  const photoCount = stats?.fotografias || 0;
  $("memoryCount").textContent = `${memoryCount} ${memoryCount === 1 ? "guardado" : "guardados"}`;
  $("photoCount").textContent = `${photoCount} ${photoCount === 1 ? "fotografía" : "fotografías"}`;
  $("talkDays").textContent = NL.daysSince("2026-02-17").toLocaleString("es-GT");
  $("kissDays").textContent = NL.daysSince("2026-03-27").toLocaleString("es-GT");
  $("officialDays").textContent = NL.daysSince("2026-06-06").toLocaleString("es-GT");

  if (memories.length) {
    $("memoryGrid").innerHTML = memories.slice(0, 6).map(memory => {
      const photo = NL.mediaUrl(memory, memory.portada);
      return `<a href="${NL.memoryUrl(memory)}" class="memory-card ${photo ? "photo" : ""}" ${photo ? `style="background-image:url('${NL.escapeHtml(photo)}')"` : ""}><time>${NL.escapeHtml(NL.shortDate(memory.fecha))}</time><h3>${NL.escapeHtml(memory.titulo)}</h3><p>${NL.escapeHtml(NL.excerpt(memory.texto))}</p></a>`;
    }).join("");
  } else if ($("recentSection")) {
    $("recentSection").hidden = true;
  }


  if (phrases.length && $("homePhraseSection")) {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    $("homePhrase").textContent = phrase.texto;
    $("homePhraseSection").hidden = false;
  }

  const now = new Date(), month = now.getMonth() + 1, day = now.getDate();
  const today = memories.find(memory => { const p = memory.fecha.split("-"); return +p[1] === month && +p[2] === day; });
  if (today) {
    $("todayTitle").textContent = today.titulo;
    $("todayText").textContent = NL.excerpt(today.texto, 180);
    $("todayCard").hidden = false;
  }

  const modal = $("modal");
  $("randomBtn").addEventListener("click", () => {
    const memory = memories.length ? memories[Math.floor(Math.random() * memories.length)] : null;
    $("randomDate").textContent = memory ? NL.shortDate(memory.fecha) : "Nuestro archivo";
    $("randomTitle").textContent = memory ? memory.titulo : "Volvamos al comienzo.";
    $("randomText").textContent = memory ? NL.excerpt(memory.texto, 300) : "A veces el mejor lugar para volver es donde empezó todo.";
    $("randomOpen").href = memory ? NL.memoryUrl(memory) : "historia.html";
    $("randomOpen").textContent = memory ? "Abrir recuerdo" : "Ir a nuestra historia";
    modal.hidden = false; requestAnimationFrame(() => modal.classList.add("open")); document.body.classList.add("menu-open");
  });
  document.querySelectorAll("[data-random-close]").forEach(el => el.addEventListener("click", () => { modal.classList.remove("open"); modal.hidden = true; document.body.classList.remove("menu-open"); }));

  async function runOpening() {
    const screen = $("opening"), app = $("app");
    if (!screen || !app) return;
    if (sessionStorage.getItem("nl-opened") === "1" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      screen.remove(); app.hidden = false; return;
    }
    const lines = ["› Abriendo nuestro archivo...", "› Recuperando momentos...", "› Ordenando nuestra historia...", "› Todo listo 🤍"];
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    for (let i = 0; i < lines.length; i++) {
      const el = $(`o${i + 1}`);
      for (const ch of lines[i]) { el.textContent += ch; await sleep(16); }
      const pct = Math.round(((i + 1) / lines.length) * 100);
      $("openingBar").style.width = `${pct}%`; $("openingPercent").textContent = `${pct}%`; await sleep(210);
    }
    sessionStorage.setItem("nl-opened", "1");
    await sleep(320); screen.style.opacity = "0"; screen.style.transition = "opacity .35s ease"; await sleep(360); screen.remove(); app.hidden = false;
  }
  await runOpening();
});
