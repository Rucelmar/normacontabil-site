/* Norma Contábil — interações do site migrado */
(function () {
  "use strict";

  /* Header ganha fundo ao rolar (throttle via rAF p/ evitar reflow) */
  var header = document.querySelector(".site-header");
  var headerTicking = false;
  var applyHeader = function (y) {
    if (y > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", function () {
    if (headerTicking) return;
    headerTicking = true;
    requestAnimationFrame(function () {
      applyHeader(window.scrollY);
      headerTicking = false;
    });
  }, { passive: true });
  applyHeader(window.scrollY);

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
    .filter(function (l) { var h = l.getAttribute("href"); return h && h.charAt(0) === "#"; })
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
    // Altura do hero é lida só no resize (evita reflow a cada scroll).
    var heroEl = canvas.closest(".hero");
    var heroLimit = heroEl ? heroEl.offsetHeight : window.innerHeight;
    var pTicking = false;
    window.addEventListener("resize", function () {
      heroLimit = heroEl ? heroEl.offsetHeight : window.innerHeight;
    });
    window.addEventListener("scroll", function () {
      if (pTicking) return;
      pTicking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset || 0;
        if (y <= heroLimit) canvas.style.transform = "translate3d(0," + (y * 0.35) + "px,0)";
        pTicking = false;
      });
    }, { passive: true });

    // Linha da onda: base inclinada + soma de senos (fluxo lento p/ direita)
    // Velocidades baixas = movimento delicado e equilibrado, como no original.
    // `o.phase` e `o.baseOff` permitem desenhar camadas defasadas (2 ondas).
    function waveY(x, t, o) {
      var ph = o ? (o.phase || 0) : 0;
      var boff = o ? (o.baseOff || 0) : 0;
      var n = x / W;                              // 0..1
      var base = H * (0.76 + boff) - n * H * 0.12; // sobe em direção à direita
      var amp = 0.5 + n * 0.8;                     // menor à esquerda (texto respira), maior à direita
      var y = base;
      y -= Math.sin(x * 0.0042 + t * 0.16 + ph) * H * 0.15 * amp;   // onda longa (lenta)
      y -= Math.sin(x * 0.0110 - t * 0.24 + ph) * H * 0.05 * amp;   // média
      y -= Math.sin(x * 0.0200 + t * 0.34 + ph) * H * 0.014 * amp;  // ondulação sutil
      return y;
    }

    // Desenha as barras de uma onda (uma camada).
    function drawBars(t, layer) {
      for (var x = 0; x <= W; x += BAR_GAP) {
        var y = waveY(x, t, layer);
        var n = x / W;
        var alpha = (0.5 + n * 0.4) * layer.alphaMul;
        var grad = ctx.createLinearGradient(0, y, 0, H);
        grad.addColorStop(0, "rgba(41,255,198," + alpha + ")");
        grad.addColorStop(0.15, "rgba(19,240,225," + (alpha * 0.75) + ")");
        grad.addColorStop(1, "rgba(12,235,235,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x - BAR_W / 2, y, BAR_W, H - y);
      }
    }

    // Desenha um quadro completo (duas ondas + ponto brilhante) no tempo t (s).
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // Duas ondas sobrepostas: a de trás (defasada, mais baixa e fraca) + a da frente.
      drawBars(t, { phase: 2.1, baseOff: 0.055, alphaMul: 0.5 });
      drawBars(t, { phase: 0, baseOff: 0, alphaMul: 1 });

      // Ponto brilhante que percorre a onda (ida e volta suave, sem salto)
      ctx.globalCompositeOperation = "source-over";
      var period = 26;                       // segundos para um trajeto de ida e volta
      var phase = (t % period) / period;     // 0..1
      var tri = phase < 0.5 ? phase * 2 : (1 - phase) * 2; // triângulo 0→1→0
      var eased = tri * tri * (3 - 2 * tri); // suaviza as extremidades
      var dotX = W * (0.06 + eased * 0.88);  // percorre de ~6% a ~94% da largura
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
    }

    // Loop limitado a ~30fps e pausado quando o hero não está visível.
    var t0 = null, lastDraw = -1, running = false, visible = true;
    var FRAME_MS = 1000 / 30;
    function frame(now) {
      if (!visible) { running = false; return; }
      requestAnimationFrame(frame);
      if (lastDraw >= 0 && now - lastDraw < FRAME_MS) return; // limita FPS
      lastDraw = now;
      if (t0 === null) t0 = now;
      draw((now - t0) / 1000);
    }
    function startLoop() {
      if (running || reduced || !visible) return;
      running = true;
      requestAnimationFrame(frame);
    }

    if (reduced) {
      draw(3.2); // sem animação: um quadro estático
    } else if ("IntersectionObserver" in window && heroEl) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) startLoop();
      }, { threshold: 0 }).observe(heroEl);
      startLoop();
    } else {
      startLoop();
    }
  })();

  /* Envio real dos formulários via rotas /api (Resend no Cloudflare) */
  function wireForm(formId, statusClass, endpoint, okMsg, errMsg) {
    var form = document.getElementById(formId);
    if (!form) return;
    var status = form.querySelector("." + statusClass);
    function setStatus(msg, cls) {
      if (!status) return;
      status.className = statusClass + (cls ? " " + cls : "");
      status.textContent = msg;
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) {
        setStatus(errMsg, "is-err");
        form.reportValidity();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      setStatus("Enviando…", "");
      var payload = Object.fromEntries(new FormData(form).entries());
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; });
        })
        .then(function (res) {
          if (res.ok && res.d && res.d.ok) {
            setStatus(okMsg, "is-ok");
            form.reset();
          } else {
            setStatus("Não foi possível enviar agora. Tente novamente ou escreva para contato@normacontabil.com.", "is-err");
          }
        })
        .catch(function () {
          setStatus("Falha de conexão. Tente novamente em instantes.", "is-err");
        })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  }
  wireForm("contato-form", "cform__status", "/api/contato", "Mensagem enviada! Retornaremos em breve.", "Preencha os campos obrigatórios.");
  wireForm("news-form", "news__status", "/api/newsletter", "Inscrição realizada. Obrigado!", "Informe um e-mail válido.");
})();
