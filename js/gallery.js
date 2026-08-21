document.addEventListener("DOMContentLoaded", async () => {
  const photos = await NL.readJson("data/generated/galeria.json", []), gallery=NL.$("gallery"), box=NL.$("lightbox");
  NL.$("photoMeta").textContent = `${photos.length} ${photos.length===1?"fotografía":"fotografías"}`;
  if(!photos.length){gallery.innerHTML='<article class="empty-card"><span>La galería está preparada</span><h3>Las primeras fotos aparecerán aquí.</h3><p>Sube fotografías dentro de un recuerdo y el sistema las reunirá automáticamente.</p><a href="herramientas/editor.html">Guardar un recuerdo →</a></article>';return}
  gallery.innerHTML=photos.map((p,i)=>`<button class="gallery-item" data-photo="${i}"><img src="${NL.escapeHtml(p.src)}" loading="lazy" alt="${NL.escapeHtml(p.titulo)}"><span>${NL.escapeHtml(p.titulo)}</span></button>`).join("");
  let current=0,touchStartX=null;
  function show(i){current=(i+photos.length)%photos.length;const p=photos[current];NL.$("lightboxImage").src=p.src;NL.$("lightboxImage").alt=p.titulo;NL.$("lightboxTitle").textContent=p.titulo;NL.$("lightboxDate").textContent=NL.shortDate(p.fecha);NL.$("lightboxCount").textContent=`${current+1} / ${photos.length}`;box.hidden=false;document.body.style.overflow="hidden"}
  function close(){box.hidden=true;document.body.style.overflow=""}
  document.querySelectorAll("[data-photo]").forEach(el=>el.onclick=()=>show(+el.dataset.photo));NL.$("prevPhoto").onclick=()=>show(current-1);NL.$("nextPhoto").onclick=()=>show(current+1);document.querySelectorAll("[data-close-lightbox]").forEach(el=>el.onclick=close);
  box.addEventListener("touchstart",e=>touchStartX=e.changedTouches[0].clientX,{passive:true});box.addEventListener("touchend",e=>{if(touchStartX===null)return;const d=e.changedTouches[0].clientX-touchStartX;if(Math.abs(d)>55)show(current+(d<0?1:-1));touchStartX=null},{passive:true});
  document.addEventListener("keydown",e=>{if(box.hidden)return;if(e.key==="Escape")close();if(e.key==="ArrowRight")show(current+1);if(e.key==="ArrowLeft")show(current-1)});
});
