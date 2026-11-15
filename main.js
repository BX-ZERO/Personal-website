/* ==========================================================
   BXZERO — 交互
   视图切换、鼠标视差、时钟、占位链接提示
   ========================================================== */

(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- 视图切换 ---------- */

  var navItems = Array.prototype.slice.call(document.querySelectorAll(".nav-item"));
  var views = Array.prototype.slice.call(document.querySelectorAll(".view"));

  function show(name) {
    views.forEach(function (v) {
      v.classList.toggle("is-on", v.id === "view-" + name);
    });
    navItems.forEach(function (a) {
      a.classList.toggle("is-active", a.dataset.view === name);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  Array.prototype.slice
    .call(document.querySelectorAll("[data-view]"))
    .forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        show(el.dataset.view);
      });
    });

  /* ---------- 鼠标视差 ---------- */

  var raf = 0;
  var tx = 0, ty = 0, cx = 0, cy = 0;

  window.addEventListener("pointermove", function (e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(step);
  });

  function step() {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    root.style.setProperty("--mx", cx.toFixed(3));
    root.style.setProperty("--my", cy.toFixed(3));
    raf = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001
      ? requestAnimationFrame(step)
      : (raf = 0);
  }

  /* ---------- 时钟 ---------- */

  var clock = document.getElementById("clock");

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function tick() {
    if (!clock) return;
    var d = new Date();
    clock.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  tick();
  setInterval(tick, 1000);

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 占位链接 ---------- */

  var tip = null;

  function toast(text) {
    if (!tip) {
      tip = document.createElement("div");
      tip.style.cssText = [
        "position:fixed", "left:50%", "bottom:42px", "transform:translateX(-50%) translateY(12px)",
        "padding:11px 20px", "font-size:12.5px", "letter-spacing:.16em",
        "color:#cfe9f5", "background:rgba(10,18,26,.94)",
        "border:1px solid rgba(53,216,255,.45)",
        "box-shadow:0 0 30px rgba(0,0,0,.6)",
        "opacity:0", "pointer-events:none", "transition:opacity .28s ease, transform .28s ease",
        "z-index:99", "clip-path:polygon(0 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)"
      ].join(";");
      document.body.appendChild(tip);
    }
    tip.textContent = text;
    tip.style.opacity = "1";
    tip.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(tip._t);
    tip._t = setTimeout(function () {
      tip.style.opacity = "0";
      tip.style.transform = "translateX(-50%) translateY(12px)";
    }, 1800);
  }

  Array.prototype.slice
    .call(document.querySelectorAll("[data-todo]"))
    .forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        toast("链接待填 · " + a.dataset.todo);
      });
    });

  /* ---------- 主题 ---------- */

  var THEME_KEY = "bxz-theme";
  var SOUND_KEY = "bxz-sound";
  var themeBtn = document.getElementById("theme-toggle");
  var soundBtn = document.getElementById("sound-toggle");

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* file:// 下可能被禁 */ }
  }

  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function applyTheme(t) {
    root.dataset.theme = t === "light" ? "light" : "dark";
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", root.dataset.theme === "light" ? "true" : "false");
    }
  }

  function applySound(s) {
    root.dataset.sound = s === "off" ? "off" : "on";
    if (soundBtn) {
      soundBtn.setAttribute("aria-pressed", root.dataset.sound === "off" ? "true" : "false");
    }
    Array.prototype.slice
      .call(document.querySelectorAll("audio, video"))
      .forEach(function (m) { m.muted = root.dataset.sound === "off"; });
  }

  applyTheme(load(THEME_KEY) === "light" ? "light" : "dark");
  applySound(load(SOUND_KEY) === "off" ? "off" : "on");

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.dataset.theme === "light" ? "dark" : "light";
      applyTheme(next);
      store(THEME_KEY, next);
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      var next = root.dataset.sound === "off" ? "on" : "off";
      applySound(next);
      store(SOUND_KEY, next);
    });
  }

  /* ---------- 动态渲染（数据在 moments.js） ---------- */

  var momentList = document.getElementById("moments-list");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function renderBody(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .filter(function (b) { return b.trim(); })
      .map(function (block) {
        return "<p>" + inline(block).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function renderMoments() {
    if (!momentList) return;
    var data = window.BX_MOMENTS;
    if (!Array.isArray(data) || !data.length) return;
    var sorted = data.slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
    momentList.innerHTML = sorted.map(function (m) {
      return '<li class="moment">' +
        '<time class="moment-date" datetime="' + esc(m.date) + '">' + esc(String(m.date).replace(/-/g, ".")) + '</time>' +
        '<div class="moment-body"><h3>' + inline(m.title) + "</h3>" + renderBody(m.body) + "</div>" +
        "</li>";
    }).join("");
  }

  renderMoments();
})();
