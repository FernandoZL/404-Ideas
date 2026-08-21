const S={config:null,memories:[],stats:null};
const J=async(p,f)=>{try{const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw 0;return await r.json()}catch{return f}};
const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const clean=s=>String(s??"").replace(/^#{1,6}\s+/gm,"").replace(/[*_`>#-]/g," ").replace(/\s+/g," ").trim();
const cut=(s,n=120)=>{const c=clean(s);return c.length>n?c.slice(0,n).trim()+"…":c};
const fmt=d=>new Intl.DateTimeFormat("es-GT",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(d+"T12:00:00"));
const days=d=>Math.floor(Math.max(0,new Date()-new Date(d+"T00:00:00"))/86400000);

function theme(t){document.body.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t==="dark"?"dark":"light";localStorage.setItem("nl-theme",t)}
function initTheme(){const saved=localStorage.getItem("nl-theme"),pref=matchMedia("(prefers-color-scheme:dark)").matches;theme(saved||(pref?"dark":"light"));themeBtn.onclick=()=>theme(document.body.classList.contains("dark")?"light":"dark")}

function stats(){
  memoryCount.textContent=`${S.stats?.recuerdos||0} ${(S.stats?.recuerdos||0)===1?"guardado":"guardados"}`;
  photoCount.textContent=`${S.stats?.fotografias||0} ${(S.stats?.fotografias||0)===1?"fotografía":"fotografías"}`;
  talkDays.textContent=days("2026-02-17").toLocaleString("es-GT");
  kissDays.textContent=days("2026-03-27").toLocaleString("es-GT");
  officialDays.textContent=days("2026-06-06").toLocaleString("es-GT");
}
function memories(){
  if(!S.memories.length)return;
  memoryGrid.innerHTML=S.memories.slice(0,6).map(m=>{
    const photo=m.portada&&m.carpeta?`${m.carpeta}/${m.portada}`:"";
    return `<article class="memory-card ${photo?"photo":""}" ${photo?`style="background-image:url('${esc(photo)}')"`:""}><time>${esc(fmt(m.fecha))}</time><h3>${esc(m.titulo)}</h3><p>${esc(cut(m.texto))}</p></article>`
  }).join("");
}
function today(){
  const n=new Date(),mo=n.getMonth()+1,da=n.getDate();
  const m=S.memories.find(x=>{const p=x.fecha.split("-");return +p[1]===mo&&+p[2]===da});
  if(!m)return;todayTitle.textContent=m.titulo;todayText.textContent=cut(m.texto,180);todayCard.hidden=false;
}
function random(){
  randomBtn.onclick=()=>{
    const m=S.memories.length?S.memories[Math.floor(Math.random()*S.memories.length)]:null;
    randomDate.textContent=m?fmt(m.fecha):"Nuestro archivo";
    randomTitle.textContent=m?m.titulo:"Todavía estamos empezando.";
    randomText.textContent=m?cut(m.texto,300):"Cuando guardemos el primer recuerdo nuevo, este botón podrá traerlo de vuelta cuando menos lo esperes.";
    modal.hidden=false;document.body.style.overflow="hidden";
  };
  document.querySelectorAll("[data-close]").forEach(x=>x.onclick=()=>{modal.hidden=true;document.body.style.overflow=""});
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function opening(){
  const lines=["› Abriendo nuestro archivo...","› Recuperando momentos...","› Ordenando nuestra historia...","› Todo listo 🤍"];
  if(matchMedia("(prefers-reduced-motion:reduce)").matches){opening.remove();app.hidden=false;return}
  for(let i=0;i<lines.length;i++){
    const el=document.getElementById(`o${i+1}`);
    for(const ch of lines[i]){el.textContent+=ch;await sleep(18)}
    const pct=Math.round((i+1)/lines.length*100);openingBar.style.width=pct+"%";openingPercent.textContent=pct+"%";await sleep(230)
  }
  await sleep(400);opening.style.opacity="0";opening.style.transition=".4s";await sleep(420);opening.remove();app.hidden=false;
}
async function init(){
  initTheme();
  [S.config,S.memories,S.stats]=await Promise.all([J("data/configuracion.json",null),J("data/generated/recuerdos.json",[]),J("data/generated/estadisticas.json",null)]);
  if(S.config?.subtitle)subtitle.textContent=S.config.subtitle;
  stats();memories();today();random();await opening();
}
addEventListener("DOMContentLoaded",init);
