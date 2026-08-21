
(() => {
  "use strict";

  const OWNER = "FernandoZL";
  const REPO = "404-Ideas";
  const BRANCH = "main";
  const API = "https://api.github.com";
  const API_VERSION = "2026-03-10";
  const PUBLIC_BASE = "https://fernandozl.github.io/404-Ideas/";
  const MAX_FILE_BYTES = 90 * 1024 * 1024;
  const MOBILE_WARNING_BYTES = 28 * 1024 * 1024;

  const $ = id => document.getElementById(id);

  let token = "";
  let treeCache = [];
  let contentItems = [];
  let activeType = "recuerdo";
  let newFiles = [];
  let inboxFiles = [];
  let editFiles = [];
  let editingItem = null;

  const typeNames = {
    recuerdo: "Recuerdo",
    carta: "Carta",
    frase: "Frase",
    fecha: "Fecha",
    cancion: "Canción",
    video: "Video",
    especial: "Sorpresa"
  };

  function toast(message, duration = 2300){
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), duration);
  }

  function setBusy(button, busy, label = "Guardando…"){
    if(!button) return;
    if(busy){
      button.dataset.original = button.textContent;
      button.textContent = label;
      button.disabled = true;
    }else{
      button.textContent = button.dataset.original || button.textContent;
      button.disabled = false;
    }
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function slugify(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/^-+|-+$/g,"")
      .slice(0,70);
  }

  function yaml(value){
    return '"' + String(value || "")
      .replace(/\\/g,"\\\\")
      .replace(/"/g,'\\"') + '"';
  }

  function today(){
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth()+1).padStart(2,"0"),
      String(d.getDate()).padStart(2,"0")
    ].join("-");
  }

  function timeStamp(){
    const d = new Date();
    return [
      String(d.getHours()).padStart(2,"0"),
      String(d.getMinutes()).padStart(2,"0"),
      String(d.getSeconds()).padStart(2,"0")
    ].join("");
  }

  function formatBytes(bytes){
    if(bytes < 1024) return bytes + " B";
    if(bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KiB";
    return (bytes/(1024*1024)).toFixed(1) + " MiB";
  }

  function parseFrontMatter(text){
    if(!String(text).startsWith("---")) return {meta:{},body:String(text || "")};

    const parts = String(text).split("---");
    if(parts.length < 3) return {meta:{},body:String(text || "")};

    const raw = parts[1].trim().split(/\r?\n/);
    const body = parts.slice(2).join("---").replace(/^\s+/,"");
    const meta = {};
    let currentList = "";

    for(const line of raw){
      if(!line.trim()) continue;

      const li = line.match(/^\s*-\s+(.+)$/);
      if(li && currentList){
        if(!Array.isArray(meta[currentList])) meta[currentList] = [];
        meta[currentList].push(li[1].trim());
        continue;
      }

      const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if(!match) continue;

      const [,key,rawValue] = match;
      let value = rawValue.trim();

      if(value === ""){
        meta[key] = "";
        currentList = key;
        continue;
      }

      currentList = "";

      if(value === "true") value = true;
      else if(value === "false") value = false;
      else if(value === "[]") value = [];
      else if(
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ){
        value = value.slice(1,-1);
      }

      meta[key] = value;
    }

    return {meta,body};
  }

  function setPublishedInMarkdown(text, published){
    const value = published ? "true" : "false";

    if(/^publicado:\s*.*$/m.test(text)){
      return text.replace(/^publicado:\s*.*$/m, `publicado: ${value}`);
    }

    if(/^tipo:\s*.*$/m.test(text)){
      return text.replace(/^tipo:\s*.*$/m, match => `${match}\npublicado: ${value}`);
    }

    if(text.startsWith("---")){
      return text.replace(/^---\s*\n/, `---\npublicado: ${value}\n`);
    }

    return `---\npublicado: ${value}\n---\n\n${text}`;
  }

  function clearStoredToken(){
    sessionStorage.removeItem("nl_admin_token");
    localStorage.removeItem("nl_admin_token");
  }

  function showLoginNotice(title, message){
    const box = $("authNotice");
    if(!box) return;

    $("authNoticeTitle").textContent = title;
    $("authNoticeText").textContent = message;
    box.hidden = false;
  }

  function returnToLogin(title = "", message = ""){
    clearStoredToken();
    token = "";

    $("tokenInput").value = "";
    $("loginView").hidden = false;
    $("appView").hidden = true;
    $("logoutBtn").hidden = true;
    $("changeTokenBtn").hidden = true;

    if(title || message){
      showLoginNotice(
        title || "Debes volver a conectar GitHub.",
        message || "Pega un token válido para continuar."
      );
    }else{
      $("authNotice").hidden = true;
    }

    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function api(path, options = {}){
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Accept":"application/vnd.github+json",
        "Authorization":`Bearer ${token}`,
        "X-GitHub-Api-Version":API_VERSION,
        ...(options.headers || {})
      }
    });

    if(response.status === 204) return null;

    let payload = null;
    const text = await response.text();

    if(text){
      try{ payload = JSON.parse(text); }
      catch{ payload = text; }
    }

    if(!response.ok){
      const githubMessage =
        payload?.message ||
        (typeof payload === "string" ? payload : "") ||
        `GitHub respondió ${response.status}`;

      if(response.status === 401){
        returnToLogin(
          "El token ya no es válido.",
          "Puede haber vencido, haber sido revocado o haberse reemplazado. Crea un token nuevo con acceso a 404-Ideas y Contents: Read and write, luego conéctalo aquí."
        );

        const error = new Error(
          "El token venció, fue revocado o no es válido. Debes crear y conectar uno nuevo."
        );
        error.code = "AUTH_EXPIRED";
        throw error;
      }

      if(response.status === 403){
        const remaining = response.headers.get("x-ratelimit-remaining");

        if(remaining === "0"){
          throw new Error(
            "GitHub alcanzó temporalmente el límite de solicitudes. Espera unos minutos y vuelve a intentar."
          );
        }

        throw new Error(
          "GitHub rechazó la operación. Revisa que el token pertenezca a 404-Ideas y tenga Contents: Read and write."
        );
      }

      if(response.status === 409){
        throw new Error(
          "El repositorio cambió mientras estabas trabajando. Pulsa Actualizar y vuelve a intentar."
        );
      }

      throw new Error(githubMessage);
    }

    return payload;
  }

  function getStoredToken(){
    return (
      sessionStorage.getItem("nl_admin_token") ||
      localStorage.getItem("nl_admin_token") ||
      ""
    );
  }

  function storeToken(value, remember){
    sessionStorage.removeItem("nl_admin_token");
    localStorage.removeItem("nl_admin_token");

    if(remember){
      localStorage.setItem("nl_admin_token",value);
    }else{
      sessionStorage.setItem("nl_admin_token",value);
    }
  }

  function logout(){
    returnToLogin();
    toast("Sesión cerrada.");
  }

  function changeToken(){
    returnToLogin(
      "Conecta un token nuevo.",
      "Crea o pega el reemplazo. No necesitas cambiar ningún archivo del proyecto."
    );
  }

  async function connect(value, remember = false){
    token = value.trim();
    if(!token) throw new Error("Escribe el token.");

    const user = await api("/user");

    if(String(user.login || "").toLowerCase() !== OWNER.toLowerCase()){
      token = "";
      throw new Error(`Este panel espera la cuenta ${OWNER}.`);
    }

    await api(`/repos/${OWNER}/${REPO}`);

    storeToken(token, remember);

    $("connectedUser").textContent = `Conectado como ${user.login}`;
    $("loginView").hidden = true;
    $("appView").hidden = false;
    $("logoutBtn").hidden = false;
    $("changeTokenBtn").hidden = false;
    $("authNotice").hidden = true;

    await refreshRepository();
  }

  async function getTree(){
    const data = await api(
      `/repos/${OWNER}/${REPO}/git/trees/${encodeURIComponent(BRANCH)}?recursive=1`
    );

    treeCache = (data.tree || []).filter(item => item.type === "blob");
    return treeCache;
  }

  function detectDescriptor(path){
    if(/^contenido\/recuerdos\/.+\/recuerdo\.md$/.test(path)) return "recuerdo";
    if(/^contenido\/cartas\/.+\/carta\.md$/.test(path)) return "carta";
    if(/^contenido\/frases\/.+\.md$/.test(path)) return "frase";
    if(/^contenido\/fechas\/.+\.md$/.test(path)) return "fecha";
    if(/^contenido\/canciones\/.+\.md$/.test(path)) return "cancion";
    if(/^contenido\/videos\/.+\.md$/.test(path)) return "video";
    if(/^contenido\/especiales\/.+\/info\.md$/.test(path)) return "especial";
    return "";
  }

  function itemFolder(item){
    if(item.type === "fecha" || item.type === "frase"){
      return item.path.includes("/") ? item.path.slice(0,item.path.lastIndexOf("/")) : "";
    }
    return item.path.slice(0,item.path.lastIndexOf("/"));
  }

  function itemPublicUrl(item){
    const folder = itemFolder(item);
    const id = folder.split("/").pop();

    const page = (() => {
      switch(item.type){
        case "recuerdo":
          return `recuerdo.html?id=${encodeURIComponent(id)}`;
        case "carta":
          return `carta.html?id=${encodeURIComponent(id)}`;
        case "frase":
          return "frases.html";
        case "fecha":
          return "fechas.html";
        case "cancion":
          return "canciones.html";
        case "video":
          return "videos.html";
        case "especial":{
          const filename = item.meta.archivo || "index.html";
          return `${folder}/${filename}`;
        }
        default:
          return "";
      }
    })();

    return new URL(page, PUBLIC_BASE).href;
  }

  async function getRawFile(path){
    const response = await fetch(
      `${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`,
      {
        headers:{
          "Accept":"application/vnd.github.raw+json",
          "Authorization":`Bearer ${token}`,
          "X-GitHub-Api-Version":API_VERSION
        }
      }
    );

    if(!response.ok){
      let msg = `No pude leer ${path}`;
      try{
        const body = await response.json();
        msg = body.message || msg;
      }catch{}
      throw new Error(msg);
    }

    return response.text();
  }

  async function loadContentItems(){
    if(!treeCache.length) await getTree();

    const descriptors = treeCache
      .map(node => ({...node,type:detectDescriptor(node.path)}))
      .filter(node => node.type);

    const items = [];

    // Serial batches avoid hammering the API and make mobile behavior stable.
    for(let i=0;i<descriptors.length;i+=6){
      const batch = descriptors.slice(i,i+6);

      const rows = await Promise.all(
        batch.map(async node => {
          try{
            const raw = await getRawFile(node.path);
            const parsed = parseFrontMatter(raw);
            const fallback =
              node.path.split("/").pop().replace(/\.md$/,"").replaceAll("-"," ");

            return {
              ...node,
              raw,
              meta:parsed.meta,
              body:parsed.body,
              title:
                parsed.meta.titulo ||
                String(parsed.body || "").split(/\r?\n/)[0].replace(/^#+\s*/,"") ||
                fallback,
              date:parsed.meta.fecha || "",
              published: parsed.meta.publicado !== false
            };
          }catch(error){
            return {
              ...node,
              raw:"",
              meta:{},
              body:"",
              title:node.path,
              date:"",
              published:false,
              loadError:error.message
            };
          }
        })
      );

      items.push(...rows);
    }

    contentItems = items.sort((a,b) => {
      const dateA = a.date || "0000-00-00";
      const dateB = b.date || "0000-00-00";
      return dateB.localeCompare(dateA) || a.title.localeCompare(b.title);
    });

    renderManageList();
  }

  async function refreshRepository(){
    treeCache = [];
    contentItems = [];

    await getTree();

    if($("tab-manage").classList.contains("active")){
      await loadContentItems();
    }
  }

  function fieldHtml(field){
    const id = `field-${field.name}`;
    const full = field.full ? " full" : "";

    if(field.type === "textarea"){
      return `
        <div class="form-field${full}">
          <label for="${id}">${escapeHtml(field.label)}</label>
          <textarea id="${id}" data-field="${field.name}"
                    placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(field.value || "")}</textarea>
          ${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}
        </div>`;
    }

    if(field.type === "select"){
      return `
        <div class="form-field${full}">
          <label for="${id}">${escapeHtml(field.label)}</label>
          <select id="${id}" data-field="${field.name}">
            ${field.options.map(([value,label]) =>
              `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
            ).join("")}
          </select>
          ${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}
        </div>`;
    }

    if(field.type === "checkbox"){
      return `
        <div class="form-field${full}">
          <label class="check-row" for="${id}">
            <input id="${id}" data-field="${field.name}" type="checkbox"
                   ${field.checked ? "checked" : ""}>
            <span>${escapeHtml(field.label)}</span>
          </label>
          ${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}
        </div>`;
    }

    return `
      <div class="form-field${full}">
        <label for="${id}">${escapeHtml(field.label)}</label>
        <input id="${id}" data-field="${field.name}"
               type="${field.type || "text"}"
               placeholder="${escapeHtml(field.placeholder || "")}"
               value="${escapeHtml(field.value || "")}">
        ${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}
      </div>`;
  }

  function fieldsFor(type){
    const date = today();

    const commonTitle = {
      name:"titulo",
      label:"Título",
      placeholder:"Un momento bonito",
      full:true
    };

    switch(type){
      case "recuerdo":
        return [
          {name:"fecha",label:"Fecha",type:"date",value:date},
          {name:"categoria",label:"Categoría",type:"select",options:[
            ["momento","Momento"],["cita","Cita"],["viaje","Viaje"],
            ["regalo","Regalo"],["aniversario","Aniversario"],
            ["cotidiano","Cotidiano"],["especial","Especial"]
          ]},
          commonTitle,
          {name:"historia",label:"¿Qué pasó?",type:"textarea",full:true,
           placeholder:"Hoy pasó algo que no quiero olvidar..."},
          {name:"tags",label:"Etiquetas",placeholder:"nosotros, momento, especial",full:true},
          {name:"lugar",label:"Lugar",placeholder:"Un lugar especial"},
          {name:"direccion",label:"Dirección / referencia",placeholder:"Opcional"},
          {name:"latitud",label:"Latitud",placeholder:"Opcional"},
          {name:"longitud",label:"Longitud",placeholder:"Opcional"},
          {name:"maps",label:"Enlace de mapa",type:"url",placeholder:"Opcional",full:true},
          {name:"favorito",label:"Marcar como favorito",type:"checkbox",full:true}
        ];

      case "carta":
        return [
          {name:"fecha",label:"Fecha",type:"date",value:date},
          commonTitle,
          {name:"texto",label:"Carta",type:"textarea",full:true,
           placeholder:"Rocío,\n\nHoy quería escribirte algo..."},
          {name:"musica",label:"Canción asociada",placeholder:"Opcional",full:true}
        ];

      case "frase":
        return [
          {name:"fecha",label:"Fecha",type:"date",value:"",help:"Opcional"},
          {name:"frase",label:"Frase",type:"textarea",full:true,
           placeholder:"“Una frase que quiero guardar.”"},
          {name:"contexto",label:"Contexto",placeholder:"Opcional",full:true},
          {name:"favorito",label:"Marcar como favorita",type:"checkbox",full:true}
        ];

      case "fecha":
        return [
          {name:"fecha",label:"Fecha",type:"date",value:date},
          commonTitle,
          {name:"texto",label:"Por qué importa",type:"textarea",full:true,
           placeholder:"Aquí escribo por qué esta fecha importa."},
          {name:"contador",label:"Mostrar contador",type:"checkbox",checked:true},
          {name:"aniversario",label:"Recordar cada año",type:"checkbox"},
          {name:"destacada",label:"Destacarla",type:"checkbox"},
          {name:"mensaje",label:"Mensaje de aniversario",placeholder:"Opcional",full:true}
        ];

      case "cancion":
        return [
          {name:"fecha",label:"Fecha",type:"date",value:"",help:"Opcional"},
          commonTitle,
          {name:"artista",label:"Artista",placeholder:"Opcional"},
          {name:"spotify",label:"Spotify",type:"url",placeholder:"Opcional",full:true},
          {name:"youtube",label:"YouTube",type:"url",placeholder:"Opcional",full:true},
          {name:"apple",label:"Apple Music",type:"url",placeholder:"Opcional",full:true},
          {name:"texto",label:"¿Por qué importa?",type:"textarea",full:true,
           placeholder:"Esta canción me recuerda a..."},
          {name:"favorito",label:"Marcar como favorita",type:"checkbox",full:true}
        ];

      case "video":
        return [
          {name:"fecha",label:"Fecha",type:"date",value:date},
          commonTitle,
          {name:"youtube",label:"YouTube",type:"url",placeholder:"Opcional",full:true},
          {name:"texto",label:"¿Qué quieres recordar?",type:"textarea",full:true,
           placeholder:"Aquí escribo qué quiero recordar de este video."},
          {name:"favorito",label:"Marcar como favorito",type:"checkbox",full:true}
        ];

      case "especial":
        return [
          {name:"fecha",label:"Fecha",type:"date",value:"",help:"Opcional"},
          {name:"titulo",label:"Título",placeholder:"Una sorpresa",full:true},
          {name:"archivo",label:"Archivo principal",value:"index.html",full:true,
           help:"Normalmente index.html"},
          {name:"texto",label:"Descripción",type:"textarea",full:true,
           placeholder:"Una experiencia especial que quiero preparar."},
          {name:"favorito",label:"Marcar como favorita",type:"checkbox",full:true}
        ];

      default:
        return [];
    }
  }

  function fileAcceptFor(type){
    switch(type){
      case "recuerdo":
        return "image/*,.heic,.heif,.mp3,.m4a,.aac,.wav,.mp4,.mov,.m4v";
      case "carta":
        return "image/*,.heic,.heif,.mp3,.m4a,.aac,.wav";
      case "cancion":
        return "audio/*,.mp3,.m4a,.aac,.wav,image/*,.heic,.heif";
      case "video":
        return "video/*,.mp4,.mov,.m4v,image/*,.heic,.heif";
      case "especial":
        return "*/*";
      case "frase":
      case "fecha":
        return "";
      default:
        return "*/*";
    }
  }

  function fileHelpFor(type){
    switch(type){
      case "recuerdo": return "Fotos, audio o video. Las fotos se detectan automáticamente.";
      case "carta": return "Puedes adjuntar portada, fotografías o música.";
      case "cancion": return "Adjunta el audio local y, si quieres, una portada.";
      case "video": return "Adjunta un video local y, si quieres, una portada.";
      case "especial": return "Sube index.html y todos sus CSS, JS, imágenes, audio u otros archivos.";
      case "frase":
      case "fecha": return "Este tipo normalmente no necesita archivos.";
      default: return "Adjunta los archivos que necesites.";
    }
  }

  function renderType(type){
    activeType = type;
    newFiles = [];

    document.querySelectorAll("[data-type]").forEach(button => {
      button.classList.toggle("active",button.dataset.type === type);
    });

    $("dynamicFields").innerHTML =
      `<div class="form-grid">${fieldsFor(type).map(fieldHtml).join("")}</div>`;

    const accept = fileAcceptFor(type);
    $("filesInput").accept = accept;
    $("fileHelp").textContent = fileHelpFor(type);
    $("fileSection").hidden = (type === "frase" || type === "fecha");
    $("fileList").innerHTML = "";
    $("publishToggle").checked = false;

    document.querySelectorAll("[data-field]").forEach(input => {
      input.addEventListener("input",updateSavePreview);
      input.addEventListener("change",updateSavePreview);
    });

    updateSavePreview();
  }

  function readFields(){
    const data = {};

    document.querySelectorAll("[data-field]").forEach(input => {
      data[input.dataset.field] =
        input.type === "checkbox" ? input.checked : input.value.trim();
    });

    return data;
  }

  function selectedMediaFile(exts){
    return newFiles.find(file => exts.includes(
      "." + file.name.split(".").pop().toLowerCase()
    ));
  }

  function firstImageFile(){
    return newFiles.find(file =>
      /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
    );
  }

  function createPayload(type, fields, published){
    const date = fields.fecha || "";
    const title =
      fields.titulo ||
      (type === "frase"
        ? fields.frase?.replace(/^["“”']+|["“”']+$/g,"").slice(0,45)
        : "") ||
      typeNames[type];

    const slug = slugify(title) || type;
    const year = date ? date.slice(0,4) : "sin-fecha";
    const tags = String(fields.tags || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);

    let folder = "";
    let descriptor = "";
    let markdown = "";

    if(type === "recuerdo"){
      if(!date || !fields.titulo){
        throw new Error("Fecha y título son obligatorios.");
      }

      folder = `contenido/recuerdos/${year}/${date}-${slug}`;
      descriptor = `${folder}/recuerdo.md`;

      const tagBlock =
        tags.length
          ? `tags:\n${tags.map(tag => `  - ${tag}`).join("\n")}`
          : "tags: []";

      markdown =
`---
tipo: recuerdo
publicado: ${published}
fecha: ${date}
titulo: ${yaml(fields.titulo)}
categoria: ${fields.categoria || "momento"}
favorito: ${Boolean(fields.favorito)}
portada:
${tagBlock}
musica:
lugar: ${yaml(fields.lugar)}
direccion: ${yaml(fields.direccion)}
latitud: ${yaml(fields.latitud)}
longitud: ${yaml(fields.longitud)}
maps: ${yaml(fields.maps)}
---

# ${fields.titulo}

${fields.historia || "Hoy pasó algo que no quiero olvidar..."}
`;
    }

    if(type === "carta"){
      if(!date || !fields.titulo || !fields.texto){
        throw new Error("Fecha, título y texto son obligatorios.");
      }

      folder = `contenido/cartas/${year}/${date}-${slug}`;
      descriptor = `${folder}/carta.md`;

      markdown =
`---
tipo: carta
publicado: ${published}
fecha: ${date}
titulo: ${yaml(fields.titulo)}
portada:
musica: ${yaml(fields.musica)}
---

${fields.texto}
`;
    }

    if(type === "frase"){
      if(!fields.frase){
        throw new Error("Escribe una frase.");
      }

      const prefix = date ? `${date}-` : "";
      folder = `contenido/frases/${year}/${prefix}${slug}`;
      descriptor = `${folder}/frase.md`;

      markdown =
`---
tipo: frase
publicado: ${published}
fecha: ${date}
favorito: ${Boolean(fields.favorito)}
contexto: ${yaml(fields.contexto)}
---

${fields.frase}
`;
    }

    if(type === "fecha"){
      if(!date || !fields.titulo){
        throw new Error("Fecha y título son obligatorios.");
      }

      folder = "contenido/fechas";
      descriptor = `${folder}/${date}-${slug}.md`;

      markdown =
`---
tipo: fecha
publicado: ${published}
clave:
fecha: ${date}
titulo: ${yaml(fields.titulo)}
contador: ${Boolean(fields.contador)}
aniversario: ${Boolean(fields.aniversario)}
destacada: ${Boolean(fields.destacada)}
enlace:
mensaje_aniversario: ${yaml(fields.mensaje)}
---

${fields.texto || "Aquí escribo por qué esta fecha importa."}
`;
    }

    if(type === "cancion"){
      if(!fields.titulo){
        throw new Error("El título es obligatorio.");
      }

      const audio = selectedMediaFile([".mp3",".m4a",".aac",".wav"]);

      folder = `contenido/canciones/${year}/${date ? date+"-" : ""}${slug}`;
      descriptor = `${folder}/cancion.md`;

      markdown =
`---
tipo: cancion
publicado: ${published}
fecha: ${date}
titulo: ${yaml(fields.titulo)}
artista: ${yaml(fields.artista)}
archivo: ${yaml(audio?.name || "")}
archivo_raiz: false
spotify: ${yaml(fields.spotify)}
youtube: ${yaml(fields.youtube)}
apple_music: ${yaml(fields.apple)}
portada:
favorito: ${Boolean(fields.favorito)}
---

${fields.texto || "Esta canción me recuerda a..."}
`;
    }

    if(type === "video"){
      if(!date || !fields.titulo){
        throw new Error("Fecha y título son obligatorios.");
      }

      const video = selectedMediaFile([".mp4",".mov",".m4v"]);

      folder = `contenido/videos/${year}/${date}-${slug}`;
      descriptor = `${folder}/video.md`;

      markdown =
`---
tipo: video
publicado: ${published}
fecha: ${date}
titulo: ${yaml(fields.titulo)}
archivo: ${yaml(video?.name || "")}
youtube: ${yaml(fields.youtube)}
portada:
favorito: ${Boolean(fields.favorito)}
---

${fields.texto || "Aquí escribo qué quiero recordar de este video."}
`;
    }

    if(type === "especial"){
      if(!fields.titulo){
        throw new Error("El título es obligatorio.");
      }

      folder = `contenido/especiales/${slug}`;
      descriptor = `${folder}/info.md`;

      const principal = fields.archivo || "index.html";

      if(published && !treeCache.some(node => node.path === `${folder}/${principal}`) &&
         !newFiles.some(file => file.name === principal)){
        throw new Error(
          `Para publicarla debes adjuntar ${principal}. Puedes guardarla como borrador mientras la preparas.`
        );
      }

      markdown =
`---
tipo: especial
publicado: ${published}
fecha: ${date}
titulo: ${yaml(fields.titulo)}
archivo: ${yaml(principal)}
portada:
favorito: ${Boolean(fields.favorito)}
---

${fields.texto || "Una experiencia especial que quiero preparar."}
`;
    }

    return {folder,descriptor,markdown,title};
  }

  function updateSavePreview(){
    try{
      const fields = readFields();
      const payload = createPayload(activeType,fields,$("publishToggle").checked);
      $("savePreview").textContent =
        `${payload.descriptor} · ${newFiles.length} archivo(s) adjunto(s)`;
    }catch{
      $("savePreview").textContent = "Completa los datos para preparar la ruta.";
    }
  }

  function renderFiles(files, target){
    target.innerHTML = files.map(file => `
      <div class="file-pill">
        <span>${escapeHtml(file.name)}</span>
        <small>${formatBytes(file.size)}</small>
      </div>
    `).join("");
  }

  function validateFiles(files){
    const duplicate = new Set();
    const isCompactDevice =
      matchMedia("(max-width: 760px), (pointer: coarse)").matches;

    for(const file of files){
      if(file.size > MAX_FILE_BYTES){
        throw new Error(
          `${file.name} pesa ${formatBytes(file.size)}. El panel limita cada archivo a 90 MiB.`
        );
      }

      if(
        isCompactDevice &&
        file.size > MOBILE_WARNING_BYTES &&
        !confirm(
          `${file.name} pesa ${formatBytes(file.size)}.\n\n` +
          "En un teléfono una subida de este tamaño puede consumir bastante memoria. " +
          "¿Quieres intentarlo de todas formas?"
        )
      ){
        throw new Error("Carga cancelada.");
      }

      if(duplicate.has(file.name)){
        throw new Error(`Hay dos archivos llamados ${file.name}.`);
      }

      duplicate.add(file.name);
    }
  }

  function bytesToBase64(buffer){
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    let binary = "";

    for(let i=0;i<bytes.length;i+=chunk){
      binary += String.fromCharCode(...bytes.subarray(i,i+chunk));
    }

    return btoa(binary);
  }

  async function createBlobFromFile(file){
    const buffer = await file.arrayBuffer();
    const content = bytesToBase64(buffer);

    const blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({content,encoding:"base64"})
    });

    return blob.sha;
  }

  async function createBlobFromText(text){
    const blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({content:text,encoding:"utf-8"})
    });

    return blob.sha;
  }

  async function commitChanges(changes,message){
    if(!changes.length) throw new Error("No hay cambios para guardar.");

    // Fresh head prevents overwriting a newer commit accidentally.
    const ref = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const parentSha = ref.object.sha;

    const parentCommit = await api(
      `/repos/${OWNER}/${REPO}/git/commits/${parentSha}`
    );

    const treeEntries = [];

    for(const change of changes){
      if(change.delete){
        treeEntries.push({
          path:change.path,
          mode:"100644",
          type:"blob",
          sha:null
        });
        continue;
      }

      let sha = "";

      if(change.file){
        sha = await createBlobFromFile(change.file);
      }else{
        sha = await createBlobFromText(change.text ?? "");
      }

      treeEntries.push({
        path:change.path,
        mode:"100644",
        type:"blob",
        sha
      });
    }

    const tree = await api(`/repos/${OWNER}/${REPO}/git/trees`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        base_tree:parentCommit.tree.sha,
        tree:treeEntries
      })
    });

    const commit = await api(`/repos/${OWNER}/${REPO}/git/commits`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        message,
        tree:tree.sha,
        parents:[parentSha]
      })
    });

    await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`,{
      method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        sha:commit.sha,
        force:false
      })
    });

    treeCache = [];
    contentItems = [];

    return commit;
  }

  async function saveNewContent(event){
    event.preventDefault();

    const button = $("saveContentBtn");

    try{
      validateFiles(newFiles);

      const fields = readFields();
      const published = $("publishToggle").checked;
      const payload = createPayload(activeType,fields,published);

      if(treeCache.some(node => node.path === payload.descriptor)){
        throw new Error(
          "Ya existe contenido con esa ruta. Puedes editarlo desde la pestaña Archivo."
        );
      }

      const changes = [
        {path:payload.descriptor,text:payload.markdown},
        ...newFiles.map(file => ({
          path:`${payload.folder}/${file.name}`,
          file
        }))
      ];

      setBusy(button,true,"Subiendo…");

      await commitChanges(
        changes,
        `${published ? "Publicar" : "Guardar borrador"}: ${payload.title}`
      );

      toast(
        published
          ? "✓ Publicado en GitHub. GitHub Actions actualizará la web."
          : "✓ Borrador guardado en GitHub."
      );

      $("contentForm").reset();
      newFiles = [];
      $("fileList").innerHTML = "";
      renderType(activeType);
    }catch(error){
      console.error(error);
      alert(error.message);
    }finally{
      setBusy(button,false);
    }
  }

  function renderManageList(){
    const query = $("manageSearch").value.trim().toLowerCase();
    const filter = $("manageFilter").value;

    const rows = contentItems.filter(item => {
      if(filter && item.type !== filter) return false;

      if(!query) return true;

      return [
        item.title,item.date,item.type,item.path,item.body
      ].join(" ").toLowerCase().includes(query);
    });

    const target = $("manageList");

    if(!rows.length){
      target.innerHTML = `<div class="empty-card">No encontré contenido con esos filtros.</div>`;
      return;
    }

    target.innerHTML = rows.map((item,index) => `
      <article class="manage-card">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.path)}</p>
          <div class="manage-meta">
            <span class="meta-chip">${escapeHtml(typeNames[item.type] || item.type)}</span>
            ${item.date ? `<span class="meta-chip">${escapeHtml(item.date)}</span>` : ""}
            <span class="meta-chip ${item.published ? "public" : "draft"}">
              ${item.published ? "Publicado" : "Borrador"}
            </span>
          </div>
        </div>

        <div class="manage-actions">
          <button type="button" data-edit-index="${index}">Editar</button>
          ${item.published
            ? `<button type="button" data-open-index="${index}">Abrir ↗</button>`
            : ""}
        </div>
      </article>
    `).join("");

    // Index here belongs to filtered rows, so capture row directly.
    target.querySelectorAll("[data-edit-index]").forEach((button,i) => {
      button.onclick = () => openEditor(rows[i]);
    });

    target.querySelectorAll("[data-open-index]").forEach((button,i) => {
      const publishedRows = rows.filter(row => row.published);
      // Find item by title/path instead of assuming index alignment.
      const card = button.closest(".manage-card");
      const pathText = card.querySelector("p")?.textContent || "";
      const item = rows.find(row => row.path === pathText);
      if(item){
        button.onclick = () => window.open(itemPublicUrl(item),"_blank","noopener");
      }
    });
  }

  async function ensureManageLoaded(){
    if(!contentItems.length){
      $("manageList").innerHTML = `<div class="loading-card">Cargando archivo…</div>`;
      await getTree();
      await loadContentItems();
    }else{
      renderManageList();
    }
  }

  function openEditor(item){
    editingItem = item;
    editFiles = [];

    $("editTitle").textContent = item.title;
    $("editPath").textContent = item.path;
    $("rawEditor").value = item.raw;
    $("editFileList").innerHTML = "";

    $("togglePublishBtn").textContent =
      item.published ? "Ocultar de la web" : "Publicar en la web";

    $("drawerBackdrop").hidden = false;
    $("editDrawer").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeEditor(){
    editingItem = null;
    editFiles = [];
    $("drawerBackdrop").hidden = true;
    $("editDrawer").hidden = true;
    document.body.style.overflow = "";
  }

  async function saveEdit(){
    if(!editingItem) return;

    const button = $("saveEditBtn");

    try{
      validateFiles(editFiles);

      const folder = itemFolder(editingItem);
      const changes = [
        {path:editingItem.path,text:$("rawEditor").value},
        ...editFiles.map(file => ({
          path:`${folder}/${file.name}`,
          file
        }))
      ];

      setBusy(button,true,"Guardando…");

      await commitChanges(
        changes,
        `Actualizar: ${editingItem.title}`
      );

      toast("✓ Cambios guardados.");
      closeEditor();
      await getTree();
      await loadContentItems();
    }catch(error){
      console.error(error);
      alert(error.message);
    }finally{
      setBusy(button,false);
    }
  }

  async function togglePublish(){
    if(!editingItem) return;

    const next = !editingItem.published;

    try{
      const raw = setPublishedInMarkdown($("rawEditor").value,next);

      // A special being published must already contain its declared HTML.
      if(next && editingItem.type === "especial"){
        const parsed = parseFrontMatter(raw);
        const mainFile = parsed.meta.archivo || "index.html";
        const folder = itemFolder(editingItem);

        const exists =
          treeCache.some(node => node.path === `${folder}/${mainFile}`) ||
          editFiles.some(file => file.name === mainFile);

        if(!exists){
          throw new Error(`Antes de publicar adjunta ${mainFile}.`);
        }
      }

      await commitChanges(
        [
          {path:editingItem.path,text:raw},
          ...editFiles.map(file => ({
            path:`${itemFolder(editingItem)}/${file.name}`,
            file
          }))
        ],
        `${next ? "Publicar" : "Ocultar"}: ${editingItem.title}`
      );

      toast(next ? "✓ Publicado." : "✓ Oculto de la web.");
      closeEditor();
      await getTree();
      await loadContentItems();
    }catch(error){
      console.error(error);
      alert(error.message);
    }
  }

  async function deleteItem(){
    if(!editingItem) return;

    const folder = itemFolder(editingItem);

    const message =
      editingItem.type === "fecha" || editingItem.type === "frase"
        ? `¿Eliminar ${editingItem.title}?`
        : `¿Eliminar ${editingItem.title} y TODOS los archivos dentro de ${folder}?`;

    if(!confirm(message)) return;

    const second = prompt('Escribe ELIMINAR para confirmar:');
    if(second !== "ELIMINAR") return;

    try{
      let paths = [editingItem.path];

      if(!["fecha","frase"].includes(editingItem.type)){
        if(!treeCache.length) await getTree();
        paths = treeCache
          .map(node => node.path)
          .filter(path => path === folder || path.startsWith(folder + "/"));
      }

      const changes = paths.map(path => ({path,delete:true}));

      await commitChanges(
        changes,
        `Eliminar: ${editingItem.title}`
      );

      toast("✓ Contenido eliminado.");
      closeEditor();
      await getTree();
      await loadContentItems();
    }catch(error){
      console.error(error);
      alert(error.message);
    }
  }

  async function saveInbox(event){
    event.preventDefault();

    const title = $("inboxTitle").value.trim() || "algo";
    const note = $("inboxNote").value.trim();
    const date = today();
    const folder =
      `contenido/inbox/${date}/${timeStamp()}-${slugify(title) || "entrada"}`;

    try{
      validateFiles(inboxFiles);

      if(!note && !inboxFiles.length){
        throw new Error("Escribe una nota o selecciona al menos un archivo.");
      }

      const changes = [
        ...(note ? [{path:`${folder}/nota.txt`,text:note + "\n"}] : []),
        ...inboxFiles.map(file => ({
          path:`${folder}/${file.name}`,
          file
        }))
      ];

      const button = event.submitter;
      setBusy(button,true,"Guardando…");

      await commitChanges(
        changes,
        `Guardar en inbox: ${title}`
      );

      $("inboxForm").reset();
      inboxFiles = [];
      $("inboxFileList").innerHTML = "";
      toast("✓ Guardado en Inbox. No aparecerá en la web.");

      setBusy(button,false);
    }catch(error){
      console.error(error);
      alert(error.message);
      if(event.submitter) setBusy(event.submitter,false);
    }
  }

  async function switchTab(tab){
    document.querySelectorAll(".tab").forEach(button => {
      button.classList.toggle("active",button.dataset.tab === tab);
    });

    document.querySelectorAll(".tab-panel").forEach(panel => {
      panel.classList.toggle("active",panel.id === `tab-${tab}`);
    });

    if(tab === "manage"){
      try{
        await ensureManageLoaded();
      }catch(error){
        $("manageList").innerHTML =
          `<div class="empty-card">${escapeHtml(error.message)}</div>`;
      }
    }
  }

  // -----------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------

  $("loginForm").addEventListener("submit",async event => {
    event.preventDefault();

    const button = $("connectBtn");
    setBusy(button,true,"Conectando…");

    try{
      await connect(
        $("tokenInput").value,
        $("rememberToken").checked
      );
      toast("✓ GitHub conectado.");
    }catch(error){
      console.error(error);

      if(error.code !== "AUTH_EXPIRED"){
        alert(
          "No pude conectar con GitHub.\n\n" +
          error.message +
          "\n\nRevisa que el token sea fine-grained, del repositorio 404-Ideas y tenga Contents: Read and write."
        );
        token = "";
      }
    }finally{
      setBusy(button,false);
    }
  });

  $("showTokenBtn").onclick = () => {
    const input = $("tokenInput");
    input.type = input.type === "password" ? "text" : "password";
    $("showTokenBtn").textContent = input.type === "password" ? "Ver" : "Ocultar";
  };

  $("logoutBtn").onclick = logout;
  $("changeTokenBtn").onclick = changeToken;

  $("refreshBtn").onclick = async () => {
    try{
      await refreshRepository();
      toast("✓ Repositorio actualizado.");
    }catch(error){
      alert(error.message);
    }
  };

  document.querySelectorAll(".tab").forEach(button => {
    button.onclick = () => switchTab(button.dataset.tab);
  });

  $("typeGrid").addEventListener("click",event => {
    const button = event.target.closest("[data-type]");
    if(button) renderType(button.dataset.type);
  });

  $("filesInput").addEventListener("change",event => {
    newFiles = [...event.target.files];
    try{
      validateFiles(newFiles);
      renderFiles(newFiles,$("fileList"));
      updateSavePreview();
    }catch(error){
      newFiles = [];
      event.target.value = "";
      $("fileList").innerHTML = "";
      alert(error.message);
    }
  });

  $("contentForm").addEventListener("submit",saveNewContent);

  $("manageSearch").addEventListener("input",renderManageList);
  $("manageFilter").addEventListener("change",renderManageList);

  $("reloadContentBtn").onclick = async () => {
    try{
      treeCache = [];
      contentItems = [];
      await ensureManageLoaded();
      toast("✓ Archivo recargado.");
    }catch(error){
      alert(error.message);
    }
  };

  $("inboxFiles").addEventListener("change",event => {
    inboxFiles = [...event.target.files];

    try{
      validateFiles(inboxFiles);
      renderFiles(inboxFiles,$("inboxFileList"));
    }catch(error){
      inboxFiles = [];
      event.target.value = "";
      $("inboxFileList").innerHTML = "";
      alert(error.message);
    }
  });

  $("inboxForm").addEventListener("submit",saveInbox);

  $("editFilesInput").addEventListener("change",event => {
    editFiles = [...event.target.files];

    try{
      validateFiles(editFiles);
      renderFiles(editFiles,$("editFileList"));
    }catch(error){
      editFiles = [];
      event.target.value = "";
      $("editFileList").innerHTML = "";
      alert(error.message);
    }
  });

  $("saveEditBtn").onclick = saveEdit;
  $("togglePublishBtn").onclick = togglePublish;
  $("deleteItemBtn").onclick = deleteItem;
  $("closeDrawerBtn").onclick = closeEditor;
  $("drawerBackdrop").onclick = closeEditor;

  document.addEventListener("keydown",event => {
    if(event.key === "Escape" && !$("editDrawer").hidden){
      closeEditor();
    }
  });

  // -----------------------------------------------------------------
  // Start
  // -----------------------------------------------------------------

  renderType("recuerdo");

  const savedToken = getStoredToken();

  if(savedToken){
    $("tokenInput").value = savedToken;
    $("rememberToken").checked =
      Boolean(localStorage.getItem("nl_admin_token"));

    connect(savedToken,$("rememberToken").checked)
      .then(() => toast("✓ Sesión recuperada."))
      .catch(error => {
        console.warn(error);

        if(error.code !== "AUTH_EXPIRED"){
          returnToLogin(
            "No pude recuperar la sesión.",
            "Vuelve a pegar tu token o crea uno nuevo si ya venció."
          );
        }
      });
  }
})();
