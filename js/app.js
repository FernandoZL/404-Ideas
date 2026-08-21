document.addEventListener("DOMContentLoaded", async () => {
  const $ = NL.$;
  const [config, memories, stats, phrases, dates] = await Promise.all([
    NL.readJson("data/configuracion.json", null),
    NL.readJson("data/generated/recuerdos.json", []),
    NL.readJson("data/generated/estadisticas.json", null),
    NL.readJson("data/generated/frases.json", []),
    NL.readJson("data/generated/fechas.json", [])
  ]);

  if (config?.subtitle && $("subtitle")) $("subtitle").textContent = config.subtitle;
  const memoryCount = stats?.recuerdos || 0;
  const photoCount = stats?.fotografias || 0;
  $("memoryCount").textContent = `${memoryCount} ${memoryCount === 1 ? "guardado" : "guardados"}`;
  $("photoCount").textContent = `${photoCount} ${photoCount === 1 ? "fotografía" : "fotografías"}`;

  const dateByKey = key => dates.find(item => item.clave === key);
  const startedTalking = dateByKey("startedTalking");
  const firstKiss = dateByKey("firstKiss");
  const official = dateByKey("official");

  const numberItems = [];

  if(startedTalking){
    numberItems.push({
      value: NL.daysSince(startedTalking.fecha),
      label: "días desde que empezamos a hablar"
    });
  }

  if(firstKiss){
    numberItems.push({
      value: NL.daysSince(firstKiss.fecha),
      label: "días desde nuestro primer beso"
    });
  }

  if(official){
    numberItems.push({
      value: NL.daysSince(official.fecha),
      label: "días siendo oficialmente nosotros"
    });

    numberItems.push({
      value: NL.completeMonthsSince(official.fecha),
      label: "meses completos juntos"
    });

    const years = NL.completeYearsSince(official.fecha);
    if(years > 0){
      numberItems.push({
        value: years,
        label: years === 1 ? "año juntos" : "años juntos"
      });
    }
  }

  if(memoryCount > 0){
    numberItems.push({
      value: memoryCount,
      label: memoryCount === 1 ? "recuerdo guardado" : "recuerdos guardados"
    });
  }

  if(photoCount > 0){
    numberItems.push({
      value: photoCount,
      label: photoCount === 1 ? "fotografía" : "fotografías"
    });
  }

  if((stats?.cartas || 0) > 0){
    numberItems.push({
      value: stats.cartas,
      label: stats.cartas === 1 ? "carta" : "cartas"
    });
  }

  if((stats?.frases || 0) > 0){
    numberItems.push({
      value: stats.frases,
      label: stats.frases === 1 ? "frase nuestra" : "frases nuestras"
    });
  }

  if((stats?.canciones || 0) > 0){
    numberItems.push({
      value: stats.canciones,
      label: stats.canciones === 1 ? "canción" : "canciones"
    });
  }

  if((stats?.videosArchivo || 0) > 0){
    numberItems.push({
      value: stats.videosArchivo,
      label: stats.videosArchivo === 1 ? "video" : "videos"
    });
  }

  $("numberGrid").innerHTML = numberItems.map(item => `
    <div>
      <strong>${Number(item.value).toLocaleString("es-GT")}</strong>
      <span>${NL.escapeHtml(item.label)}</span>
    </div>
  `).join("");

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

  const now = new Date();

  const anniversary =
    dates.find(item =>
      item.aniversario &&
      NL.sameMonthDay(item.fecha, now)
    );

  const todayMemory =
    memories.find(memory =>
      NL.sameMonthDay(memory.fecha, now)
    );

  const todayItem = anniversary || todayMemory;

  if(todayItem){
    $("todayTitle").textContent = todayItem.titulo;

    $("todayText").textContent =
      anniversary
        ? (anniversary.mensajeAniversario || anniversary.texto)
        : NL.excerpt(todayMemory.texto, 180);

    $("todayCard").hidden = false;
  }

  const modal = $("randomModal");
  const randomButton = $("randomBtn");
  let randomPreviousFocus = null;

  const closeRandomModal = () => {
    if(!modal || modal.hidden) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    setTimeout(() => {
      modal.hidden = true;
      if(randomPreviousFocus) randomPreviousFocus.focus();
    }, 220);
  };

  const openRandomModal = () => {
    const memory = memories.length
      ? memories[Math.floor(Math.random() * memories.length)]
      : null;

    $("randomDate").textContent = memory ? NL.shortDate(memory.fecha) : "Nuestro archivo";
    $("randomTitle").textContent = memory ? memory.titulo : "Volvamos al comienzo.";
    $("randomText").textContent = memory
      ? NL.excerpt(memory.texto, 300)
      : "A veces el mejor lugar para volver es donde empezó todo.";
    $("randomOpen").href = memory ? NL.memoryUrl(memory) : "historia.html";
    $("randomOpen").textContent = memory ? "Abrir recuerdo" : "Ir a nuestra historia";

    randomPreviousFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    requestAnimationFrame(() => {
      modal.classList.add("open");
      const close = modal.querySelector(".random-close");
      if(close) close.focus();
    });
  };

  if(randomButton && modal){
    randomButton.addEventListener("click", openRandomModal);
    modal.querySelectorAll("[data-random-close]").forEach(el =>
      el.addEventListener("click", closeRandomModal)
    );
    document.addEventListener("keydown", event => {
      if(event.key === "Escape" && !modal.hidden) closeRandomModal();
    });
  }

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
