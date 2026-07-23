/* Norma Contábil — interações do site migrado */
(function () {
  "use strict";

  /* Header ganha fundo ao rolar */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    nav.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Marca item de navegação ativo conforme a seção visível */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  var sections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute("href")); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (l) {
            l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* Reveal ao entrar na viewport */
  var revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealables.forEach(function (el) { revObserver.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------------------------------------------------
     Animação da onda do hero (canvas 2D)
     Reproduz o mesmo visual do WebGL original: barras teal
     seguindo uma onda multi-frequência que flui + ponto brilhante.
     --------------------------------------------------------- */
  (function heroWave() {
    var canvas = document.getElementById("wave-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var BAR_GAP = 8;   // distância entre barras
    var BAR_W = 4;     // largura da barra (linhas mais grossas, como no original)

    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // Parallax suave: a onda desloca mais devagar que o conteúdo ao rolar.
    var heroEl = canvas.closest(".hero");
    function onParallax() {
      var y = window.scrollY || window.pageYOffset || 0;
      var limit = heroEl ? heroEl.offsetHeight : window.innerHeight;
      if (y > limit) return; // fora do hero, não precisa atualizar
      canvas.style.transform = "translate3d(0," + (y * 0.35) + "px,0)";
    }
    window.addEventListener("scroll", onParallax, { passive: true });
    onParallax();

    // Linha da onda: base inclinada + soma de senos (fluxo lento p/ direita)
    // Velocidades baixas = movimento delicado e equilibrado, como no original.
    function waveY(x, t) {
      var n = x / W;                              // 0..1
      var base = H * 0.76 - n * H * 0.12;         // sobe em direção à direita
      var amp = 0.5 + n * 0.8;                     // menor à esquerda (texto respira), maior à direita
      var y = base;
      y -= Math.sin(x * 0.0042 + t * 0.16) * H * 0.15 * amp;   // onda longa (lenta)
      y -= Math.sin(x * 0.0110 - t * 0.24) * H * 0.05 * amp;   // média
      y -= Math.sin(x * 0.0200 + t * 0.34) * H * 0.014 * amp;  // ondulação sutil
      return y;
    }

    var t0 = null;
    function frame(now) {
      if (t0 === null) t0 = now;
      var t = reduced ? 3.2 : (now - t0) / 1000;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      for (var x = 0; x <= W; x += BAR_GAP) {
        var y = waveY(x, t);
        var n = x / W;
        var alpha = 0.5 + n * 0.4;                // barras vivas na largura toda
        var grad = ctx.createLinearGradient(0, y, 0, H);
        grad.addColorStop(0, "rgba(41,255,198," + alpha + ")");
        grad.addColorStop(0.15, "rgba(19,240,225," + (alpha * 0.75) + ")");
        grad.addColorStop(1, "rgba(12,235,235,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x - BAR_W / 2, y, BAR_W, H - y);
      }

      // Ponto brilhante sobre a onda (fixo em x, a onda passa por baixo)
      ctx.globalCompositeOperation = "source-over";
      var dotX = W * 0.66;
      var dotY = waveY(dotX, t);
      var glow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 26);
      glow.addColorStop(0, "rgba(200,255,240,0.95)");
      glow.addColorStop(0.4, "rgba(41,255,198,0.45)");
      glow.addColorStop(1, "rgba(41,255,198,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#eafff8";
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fill();

      if (!reduced) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* Envio simulado (sem backend) — reaproveitável p/ os formulários */
  function wireForm(formId, statusClass, okMsg, errMsg) {
    var form = document.getElementById(formId);
    if (!form) return;
    var status = form.querySelector("." + statusClass);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (status) status.className = statusClass;
      if (!form.checkValidity()) {
        if (status) { status.textContent = errMsg; status.classList.add("is-err"); }
        form.reportValidity();
        return;
      }
      if (status) { status.textContent = okMsg; status.classList.add("is-ok"); }
      form.reset();
    });
  }
  wireForm("contato-form", "cform__status", "Mensagem enviada! Retornaremos em breve.", "Preencha os campos obrigatórios.");
  wireForm("news-form", "news__status", "Inscrição realizada. Obrigado!", "Informe um e-mail válido.");
})();
