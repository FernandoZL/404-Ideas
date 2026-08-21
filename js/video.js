document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(location.search).get("id");
  const videos = await NL.readJson("data/generated/videos.json", []);
  const item = videos.find(entry => entry.id === id);
  const root = NL.$("videoDetail");

  function youtubeId(url){
    if(!url) return "";
    try{
      const value = new URL(url);
      if(value.hostname.includes("youtu.be")){
        return value.pathname.replace(/^\/+/,"").split("/")[0];
      }
      if(value.pathname.includes("/shorts/")){
        return value.pathname.split("/shorts/")[1].split("/")[0];
      }
      if(value.pathname.includes("/embed/")){
        return value.pathname.split("/embed/")[1].split("/")[0];
      }
      return value.searchParams.get("v") || "";
    }catch{
      return "";
    }
  }

  if(!item){
    root.innerHTML = `
      <article class="media-empty">
        <span class="kicker">Video</span>
        <p>Ese video no está aquí.</p>
        <a href="videos.html">Volver a videos →</a>
      </article>`;
    return;
  }

  document.title = `${item.titulo} · Nuestro lugar`;

  const cover = item.portada ? `${item.carpeta}/${item.portada}` : "";
  const yt = youtubeId(item.youtube);

  root.innerHTML = `
    <header class="media-detail-head">
      <span class="kicker">Un momento para volver a ver</span>
      <time>${NL.escapeHtml(NL.formatDate(item.fecha))}</time>
      <h1>${NL.escapeHtml(item.titulo)}</h1>
    </header>

    ${item.src ? `
      <div class="video-player-shell">
        <video controls preload="metadata"
               ${cover ? `poster="${NL.escapeHtml(cover)}"` : ""}
               src="${NL.escapeHtml(item.src)}"></video>
      </div>` : ""}

    ${!item.src && yt ? `
      <div class="video-player-shell">
        <iframe
          loading="lazy"
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}"
          title="${NL.escapeHtml(item.titulo)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>` : ""}

    ${item.texto ? `
      <article class="media-story">
        ${NL.renderMarkdown(item.texto)}
      </article>` : ""}

    ${item.youtube ? `
      <nav class="stream-links">
        <a target="_blank" rel="noopener" href="${NL.escapeHtml(item.youtube)}">Abrir en YouTube ↗</a>
      </nav>` : ""}

    <footer class="media-detail-footer">
      <a href="videos.html">← Volver a videos</a>
    </footer>`;
});
