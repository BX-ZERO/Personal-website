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

  function bodyToHtml(text) {
    var s = String(text || "");
    if (!s.trim()) return "";
    if (/<\/?(p|div|h[1-6]|ul|ol|li|blockquote|pre|img|br|strong|em|span|a|table|hr|figure)\b/i.test(s)) return s;
    return renderBody(s);
  }

  function excerpt(html, limit) {
    var div = document.createElement("div");
    div.innerHTML = html;
    var text = (div.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "…";
  }

  function postHref(index, title) {
    return "post.html?i=" + index + "&t=" + encodeURIComponent(title || "");
  }

  function renderMoments() {
    if (!momentList) return;
    var data = window.BX_MOMENTS;
    if (!Array.isArray(data) || !data.length) return;
    var sorted = data.map(function (m, i) { return { item: m, index: i }; }).sort(function (a, b) {
      return String(b.item.date || "").localeCompare(String(a.item.date || ""));
    });
    momentList.innerHTML = sorted.map(function (o) {
      var m = o.item;
      var href = postHref(o.index, m.title);
      var brief = excerpt(bodyToHtml(m.body), 120);
      return '<li class="moment" data-i="' + o.index + '">' +
        '<time class="moment-date" datetime="' + esc(m.date) + '">' + esc(String(m.date).replace(/-/g, ".")) + '</time>' +
        '<div class="moment-body">' +
        '<h3><a class="moment-link" href="' + href + '">' + inline(m.title) + "</a></h3>" +
        (brief ? "<p>" + esc(brief) + "</p>" : "") +
        '<a class="moment-more" href="' + href + '">阅读全文 →</a>' +
        "</div>" +
        "</li>";
    }).join("");
  }

  renderMoments();


  /* ---------- 首页：左侧时间线 ---------- */

  var homeNav = document.getElementById("home-nav");
  var homeBody = document.getElementById("home-body");
  var toolList = document.getElementById("tool-list");
  var HOME = window.BX_HOME || {};
  var tlItems = [];

  var KIND_LABEL = { post: "动态", tool: "工具", note: "随笔" };

  function buildTimeline() {
    var out = [];
    Array.prototype.forEach.call(HOME.entries || [], function (e) {
      out.push({
        date: String(e.date || ""),
        kind: e.kind || "note",
        title: e.title || "",
        desc: e.desc || "",
        href: e.href || ""
      });
    });
    var ms = window.BX_MOMENTS;
    if (Array.isArray(ms)) {
      ms.map(function (m, i) { return { item: m, index: i }; })
        .sort(function (a, b) { return String(b.item.date || "").localeCompare(String(a.item.date || "")); })
        .forEach(function (o) {
          out.push({
            date: String(o.item.date || ""),
            kind: "post",
            title: o.item.title || "无标题",
            desc: excerpt(bodyToHtml(o.item.body), 150),
            href: postHref(o.index, o.item.title)
          });
        });
    }
    out.sort(function (a, b) { return b.date.localeCompare(a.date); });
    return out;
  }

  function showHomeItem(i) {
    var it = tlItems[i];
    if (!it || !homeBody) return;
    Array.prototype.forEach.call(homeNav.querySelectorAll(".tl-item"), function (b) {
      b.classList.toggle("is-on", Number(b.dataset.i) === i);
    });
    var titleHtml = it.href
      ? '<h4><a class="info-link" href="' + esc(it.href) + '"' +
        (it.kind === "post" ? "" : ' target="_blank" rel="noopener"') + ">" + esc(it.title) + "</a></h4>"
      : "<h4>" + esc(it.title) + "</h4>";
    homeBody.innerHTML =
      '<div class="info-item">' +
      '<div class="info-meta"><time>' + esc(it.date.replace(/-/g, ".")) + "</time>" +
      '<span class="info-kind">' + esc(KIND_LABEL[it.kind] || it.kind) + "</span></div>" +
      titleHtml +
      (it.desc ? "<p>" + esc(it.desc) + "</p>" : "") +
      "</div>";
  }

  function applySlab(id, val, dEn, dCn) {
    var el = document.getElementById(id);
    if (!el) return;
    var en = (val && val.en) || dEn;
    var cn = (val && val.cn) || dCn;
    el.innerHTML = '<span class="en">' + esc(en) + '</span><span class="cn">' + esc(cn) + "</span>";
  }

  function renderHome() {
    applySlab("slab-home", HOME.slab && HOME.slab.home, "INFORMATION", "情报");
    if (!homeNav || !homeBody) return;
    tlItems = buildTimeline();
    if (!tlItems.length) {
      homeNav.innerHTML = "";
      homeBody.innerHTML = '<p class="info-empty">还没有条目。</p>';
      return;
    }
    homeNav.innerHTML = '<ol class="tl">' + tlItems.map(function (it, i) {
      return '<li><button class="tl-item' + (i === 0 ? " is-on" : "") + '" type="button" data-i="' + i + '">' +
        '<span class="tl-date">' + esc(it.date.replace(/-/g, ".")) + "</span>" +
        '<span class="tl-title">' + esc(it.title) + "</span>" +
        '<span class="tl-kind">' + esc(KIND_LABEL[it.kind] || it.kind) + "</span>" +
        "</button></li>";
    }).join("") + "</ol>";
    showHomeItem(0);
  }

  function renderTools() {
    applySlab("slab-tools", HOME.slab && HOME.slab.tools, "AVAILABLE", "可用");
    if (!toolList) return;
    var tools = HOME.tools || [];
    if (!tools.length) {
      toolList.innerHTML = '<li><span class="tool-row"><span class="tool-cn">还没有工具</span></span></li>';
      return;
    }
    toolList.innerHTML = tools.map(function (t) {
      return '<li><a class="tool-row" href="' + esc(t.href || "#") + '" target="_blank" rel="noopener">' +
        '<span class="tool-cn">' + esc(t.cn || "") + "</span>" +
        '<span class="tool-en">' + esc(t.en || "") + "</span>" +
        (t.desc ? '<span class="tool-desc">' + esc(t.desc) + "</span>" : "") +
        "</a></li>";
    }).join("");
  }

  if (homeNav) {
    homeNav.addEventListener("click", function (e) {
      var btn = e.target.closest(".tl-item");
      if (!btn) return;
      showHomeItem(Number(btn.dataset.i));
    });
  }

  renderHome();
  renderTools();

  /* ---------- 背景音乐（没有播放器界面，只用音量按钮管开关） ---------- */

  (function music() {
    var cfg = HOME.music || {};
    var tracks = Array.isArray(cfg.tracks)
      ? cfg.tracks.filter(function (t) { return t && t.src; })
      : [];
    if (!tracks.length) return;

    var audio = document.createElement("audio");
    audio.preload = "auto";
    audio.volume = typeof cfg.volume === "number" ? Math.max(0, Math.min(1, cfg.volume)) : 0.35;
    audio.muted = root.dataset.sound === "off";
    audio.style.display = "none";
    document.body.appendChild(audio);

    var index = 0;

    function load(k) {
      index = (k + tracks.length) % tracks.length;
      audio.src = tracks[index].src;
    }

    function play() {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { /* 浏览器拦下了，等一次交互 */ });
    }

    audio.addEventListener("ended", function () {
      load(index + 1);
      play();
    });

    load(0);
    play();

    ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
      var once = function () {
        if (audio.paused) play();
        window.removeEventListener(evt, once);
      };
      window.addEventListener(evt, once, { passive: true });
    });
  })();


  /* ---------- 站主入口 ---------- */

  var editEntry = document.getElementById("edit-entry");
  var editHome = document.getElementById("edit-home");

  if (window.BXAuth) {
    window.BXAuth.me().then(function (who) {
      if (!who || !who.ok) return;
      if (editEntry) editEntry.hidden = false;
      if (editHome) editHome.hidden = false;
      var accLink = document.getElementById("account-link");
      if (accLink) accLink.classList.add("is-on");
    });
  }
})();
