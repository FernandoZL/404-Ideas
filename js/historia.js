document.addEventListener("DOMContentLoaded", async () => {
  const memories = await NL.readJson("data/generated/recuerdos.json", []);
  const base = [
    {fecha:"2026-02-17",titulo:"Empezamos a hablar",texto:"El punto donde comenzó todo lo demás.",legacy:true},
    {fecha:"2026-03-27",titulo:"Nuestro primer beso",texto:"Uno de esos días que cambian el significado de los anteriores.",legacy:true},
    {fecha:"2026-06-06",titulo:"Oficialmente nosotros",texto:"El día de una pregunta bastante informal que terminó siendo muy importante.",legacy:true,featured:true}
  ];
  const dynamic = memories.map(m => ({...m,legacy:false}));
  let direction = "asc";
  function render(){
    const entries = [...base,...dynamic].sort((a,b)=>direction === "asc" ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha));
    NL.$("timeline").innerHTML = entries.map(e => {
      const date = new Date(`${e.fecha}T12:00:00`), day=String(date.getDate()).padStart(2,"0"), month=new Intl.DateTimeFormat("es-GT",{month:"short"}).format(date).replace(".","").toUpperCase(), year=date.getFullYear();
      const content = `<time><strong>${day}</strong>${month} ${year}</time><div><h3>${NL.escapeHtml(e.titulo)}</h3><p>${NL.escapeHtml(NL.excerpt(e.texto,180))}</p></div>`;
      return e.legacy ? `<article class="${e.featured?"featured":""}">${content}</article>` : `<article class="memory-timeline" data-url="${NL.memoryUrl(e)}">${content}</article>`;
    }).join("");
    document.querySelectorAll("[data-url]").forEach(el => el.addEventListener("click",()=>location.href=el.dataset.url));
  }
  NL.$("asc").onclick=()=>{direction="asc";NL.$("asc").classList.add("active");NL.$("desc").classList.remove("active");render()};
  NL.$("desc").onclick=()=>{direction="desc";NL.$("desc").classList.add("active");NL.$("asc").classList.remove("active");render()};
  render();
});
