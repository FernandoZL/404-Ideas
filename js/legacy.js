/* ======================================
   NAVEGACIÓN
====================================== */

function show(id){
  document
    .querySelectorAll('.section')
    .forEach(section => {
      section.classList.remove('active');
    });

  document
    .getElementById(id)
    .classList
    .add('active');

  if(id !== "loading"){
    document.body.classList.add("ready");
  }

  window.scrollTo({
    top:0,
    behavior:'smooth'
  });
}


/* ======================================
   MODO OSCURO
====================================== */

function toggleTheme(){
  document
    .body
    .classList
    .toggle('dark');
}


/* ======================================
   MÚSICA
====================================== */

let playing = false;

function toggleMusic(){
  const music =
    document.getElementById('music');

  if(!playing){
    music
      .play()
      .catch(() => {});

    playing = true;
  }else{
    music.pause();
    playing = false;
  }
}


/* ======================================
   CONTADORES
====================================== */

function fillCounter(prefix,dateText){
  const start =
    new Date(dateText);

  const now =
    new Date();

  let diff =
    now - start;

  if(diff < 0){
    diff = 0;
  }

  const seconds =
    Math.floor(diff / 1000);

  const days =
    Math.floor(seconds / 86400);

  const hours =
    Math.floor(
      (seconds % 86400) / 3600
    );

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const secs =
    seconds % 60;

  document
    .getElementById(prefix + "Days")
    .textContent = days;

  document
    .getElementById(prefix + "Hours")
    .textContent = hours;

  document
    .getElementById(prefix + "Minutes")
    .textContent = minutes;

  document
    .getElementById(prefix + "Seconds")
    .textContent = secs;
}

function updateCounters(){
  fillCounter(
    "chat",
    "2026-02-17T00:00:00"
  );

  fillCounter(
    "kiss",
    "2026-03-27T00:00:00"
  );

  fillCounter(
    "gf",
    "2026-06-06T00:00:00"
  );
}

setInterval(
  updateCounters,
  1000
);

updateCounters();


/* ======================================
   CARGA INICIAL
====================================== */

const loadingSteps = [
  "› Abriendo expediente privado...",
  "› Verificando acceso...",
  "› Revisando primeras conversaciones...",
  "› Recuperando detalles importantes...",
  "› Ordenando recuerdos...",
  "› Preparando mensaje...",
  "› Acceso concedido 🤍",
  "› Abriendo..."
];

function typeLine(
  element,
  text,
  speed,
  callback
){
  let i = 0;
  element.textContent = "";

  const typing =
    setInterval(() => {
      element.textContent +=
        text.charAt(i);

      i++;

      if(i >= text.length){
        clearInterval(typing);

        if(callback){
          callback();
        }
      }
    },speed);
}

function startLoading(){
  let index = 0;
  let percent = 0;

  const bar =
    document.getElementById("bar");

  const percentText =
    document.getElementById("percent");

  function nextStep(){
    if(index >= loadingSteps.length){
      setTimeout(() => {
        show("inicio");
      },900);

      return;
    }

    const line =
      document.getElementById(
        "l" + (index + 1)
      );

    percent =
      Math.round(
        ((index + 1) /
        loadingSteps.length)
        * 100
      );

    typeLine(
      line,
      loadingSteps[index],
      22,
      () => {
        bar.style.width =
          percent + "%";

        percentText.textContent =
          percent + "%";

        index++;

        setTimeout(
          nextStep,
          450
        );
      }
    );
  }

  setTimeout(
    nextStep,
    600
  );
}


/* ======================================
   TE AMO X1000
====================================== */

let loveTimer = null;
let loveRunning = false;

function runLove(){
  if(loveRunning){
    return;
  }

  loveRunning = true;

  const btn =
    document.getElementById("loveRun");

  const status =
    document.getElementById("loveStatus");

  const message =
    document.getElementById("loveMessage");

  const final =
    document.getElementById("loveFinal");

  btn.disabled = true;
  btn.textContent =
    "Ejecutando...";

  final
    .classList
    .remove("show");

  let i = 0;

  loveTimer =
    setInterval(() => {
      i += 7;

      if(i > 1000){
        i = 1000;
      }

      status.textContent =
        "Te amo número "
        + i
        + " de 1000";

      message.textContent =
        "Te amo ❤️";

      if(i >= 1000){
        clearInterval(
          loveTimer
        );

        status.textContent =
          "Programa completado correctamente ✓";

        message.textContent =
          "Te amo 1,000 veces ❤️";

        final
          .classList
          .add("show");

        btn.textContent =
          "✓ Ejecutado";

        loveRunning = false;

        burstHearts();
      }
    },18);
}


/* ======================================
   REINICIAR TE AMO
====================================== */

function resetLove(){
  clearInterval(
    loveTimer
  );

  loveRunning = false;

  const btn =
    document.getElementById("loveRun");

  const status =
    document.getElementById("loveStatus");

  const message =
    document.getElementById("loveMessage");

  const final =
    document.getElementById("loveFinal");

  btn.disabled = false;
  btn.textContent =
    "▶ Ejecutar programa";

  status.textContent =
    "Esperando ejecución...";

  message.textContent =
    "♡";

  final
    .classList
    .remove("show");
}


/* ======================================
   EXPLOSIÓN DE CORAZONES
====================================== */

function burstHearts(){
  const centerX =
    window.innerWidth / 2;

  const centerY =
    window.innerHeight / 2;

  for(
    let i = 0;
    i < 38;
    i++
  ){
    const heart =
      document.createElement(
        "span"
      );

    heart.className =
      "burst-heart";

    heart.textContent =
      Math.random() > .45
      ? "❤️"
      : "💕";

    heart.style.left =
      centerX + "px";

    heart.style.top =
      centerY + "px";

    const angle =
      Math.random()
      * Math.PI
      * 2;

    const distance =
      90
      + Math.random()
      * 240;

    heart
      .style
      .setProperty(
        "--x",
        Math.cos(angle)
        * distance
        + "px"
      );

    heart
      .style
      .setProperty(
        "--y",
        Math.sin(angle)
        * distance
        + "px"
      );

    document
      .body
      .appendChild(
        heart
      );

    setTimeout(() => {
      heart.remove();
    },1300);
  }
}


/* ======================================
   INICIAR
====================================== */

window.addEventListener(
  "load",
  startLoading
);
