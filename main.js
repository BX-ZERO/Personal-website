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
  var lastView = "home";

  function show(name) {
    if (name === "write" && window.BXWriteBoot) window.BXWriteBoot();
    if (name === "home-edit" && window.BXHomeEditBoot) window.BXHomeEditBoot();
    if (name !== "post") lastView = name;
    views.forEach(function (v) {
      v.classList.toggle("is-on", v.id === "view-" + name);
    });
    navItems.forEach(function (a) {
      a.classList.toggle("is-active", a.dataset.view === name);
    });
    if (name === "account") renderAccount();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  Array.prototype.slice
    .call(document.querySelectorAll("[data-view]"))
    .forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        var name = el.dataset.view;
        if (location.hash === "#/" + name) show(name);
        else location.hash = "#/" + name;
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
  var SOUND_KEY = "bxz-sound-2";
  var themeBtn = document.getElementById("theme-toggle");
  var soundBtn = document.getElementById("sound-toggle");

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* file:// 下可能被禁 */ }
    try {
      document.cookie = key + "=" + encodeURIComponent(value) +
        "; max-age=31536000; path=/; SameSite=Lax";
    } catch (e) { /* cookie 也写不了就算了 */ }
  }

  function load(key) {
    try {
      var v = localStorage.getItem(key);
      if (v !== null) return v;
    } catch (e) { /* 继续试 cookie */ }
    try {
      var m = new RegExp("(?:^|; )" + key + "=([^;]*)").exec(document.cookie);
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
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
      .call(document.querySelectorAll("audio:not([data-pl]), video"))
      .forEach(function (m) { m.muted = root.dataset.sound === "off"; });
  }

  /* 没手动选过就跟随系统；选过就一直用他选的 */
  function systemTheme() {
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    } catch (e) { /* 忽略 */ }
    return "dark";
  }

  function pickedTheme() {
    var saved = load(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  }

  applyTheme(pickedTheme() || systemTheme());
  applySound(load(SOUND_KEY) === "off" ? "off" : "on");

  try {
    var mqLight = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
    if (mqLight && mqLight.addEventListener) {
      mqLight.addEventListener("change", function () {
        if (!pickedTheme()) applyTheme(systemTheme());
      });
    }
  } catch (e) { /* 忽略 */ }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.dataset.theme === "light" ? "dark" : "light";
      applyTheme(next);
      store(THEME_KEY, next);
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (window.BXPlayer) window.BXPlayer.togglePanel();
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

  function previewHtml(html) {
    var m = /<img\b[^>]*>/i.exec(html || "");
    if (!m) return html || "";
    var end = (m.index || 0) + m[0].length;
    return html.slice(0, end);
  }

  function firstImage(html) {
    var m = /<img[^>]+src="([^"]+)"/i.exec(html || "");
    return m ? m[1] : "";
  }

  function excerpt(html, limit) {
    var div = document.createElement("div");
    div.innerHTML = html;
    var text = (div.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "…";
  }

  function postHref(index) {
    return "#/post/" + index;
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
          var html = bodyToHtml(o.item.body);
          out.push({
            date: String(o.item.date || ""),
            kind: "post",
            title: o.item.title || "无标题",
            desc: excerpt(html, 150),
            cover: firstImage(html),
            bodyHtml: previewHtml(html),
            href: postHref(o.index, o.item.title),
            postIndex: o.index
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
    /* 手写条目的说明文字放中栏；动态的正文在右侧预览里，中栏只留标题 */
    var descHtml = it.kind !== "post" && it.desc
      ? '<p class="info-desc">' + inline(it.desc) + "</p>"
      : "";
    var goText = "";
    if (it.kind === "post") goText = "点击标题读全文 ↑";
    else if (it.kind === "tool" && it.href) goText = "点击标题跳转工具网站";
    var goHtml = goText ? '<span class="info-go">' + goText + "</span>" : "";
    var side = it.bodyHtml
      ? '<div class="info-peek">' +
        '<div class="info-meta"><time>' + esc(it.date.replace(/-/g, ".")) + "</time>" +
        '<span class="info-kind">' + esc(KIND_LABEL[it.kind] || it.kind) + "</span></div>" +
        "<h5>" + inline(it.title || "（无标题）") + "</h5>" +
        '<div class="info-peek-body">' + it.bodyHtml + "</div>" +
        "</div>"
      : "";
    homeBody.classList.toggle("is-textonly", !it.bodyHtml);
    homeBody.innerHTML =
      '<div class="info-item" data-i="' + i + '">' +
      '<div class="info-meta"><time>' + esc(it.date.replace(/-/g, ".")) + "</time>" +
      '<span class="info-kind">' + esc(KIND_LABEL[it.kind] || it.kind) + "</span></div>" +
      titleHtml +
      descHtml +
      goHtml +
      "</div>" +
      side;
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

  /* ---------- 文章视图：改 hash 不换页，音乐就不会断 ---------- */

  var postBody = document.getElementById("post-body");
  var postBack = document.getElementById("post-back");
  var BASE_TITLE = document.title;

  function renderPost(index) {
    var data = window.BX_MOMENTS;
    if (!postBody) return false;
    if (!Array.isArray(data) || !data[index]) {
      postBody.innerHTML = '<p class="post-hint">这条动态不在了。</p>';
      document.title = BASE_TITLE;
      return false;
    }
    var m = data[index];
    document.title = BASE_TITLE + " — " + (m.title || "动态");
    postBody.innerHTML =
      '<div class="post-date">' + esc(String(m.date || "").replace(/-/g, ".")) + "</div>" +
      '<h1 class="post-title">' + inline(m.title || "（无标题）") + "</h1>" +
      '<div class="article">' + bodyToHtml(m.body) + "</div>";
    return true;
  }

  function route() {
    var h = location.hash || "";
    var post = /^#\/post\/(\d+)$/.exec(h);
    if (post) {
      var ok = renderPost(parseInt(post[1], 10));
      show(ok ? "post" : "moments");
      return;
    }
    var name = (/^#\/(home|home-edit|moments|tools|account|write)$/.exec(h) || [])[1];
    if (!name) {
      name = "home";
      if (h !== "#/home") history.replaceState(null, "", "#/home");
    }
    document.title = BASE_TITLE;
    show(name);
  }

  if (postBack) {
    postBack.addEventListener("click", function (e) {
      e.preventDefault();
      history.replaceState(null, "", "#/" + (lastView || "home"));
      route();
    });
  }

  window.addEventListener("hashchange", route);

  /* ---------- 背景音乐播放器 ---------- */


  var PLAY_KEY = "bxz-play";
  var MODE_KEY = "bxz-mode";

var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  var ICON_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5l11 7-11 7z"/></svg>';
  var ICON_MODE_ORDER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v2.2L21 5.6 17 2v2.2H5V11h2V7zm10 10H7v-2.2L3 18.4 7 22v-2.2h12V13h-2v4z"/></svg>';
  var ICON_MODE_ONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v2.2L21 5.6 17 2v2.2H5V11h2V7zm10 10H7v-2.2L3 18.4 7 22v-2.2h12V13h-2v4z"/><path d="M12.6 9.1h-1.3l-1.6.9v1.2l1.5-.9v4.6h1.4z"/></svg>';
  var ICON_MODE_SHUFFLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 3H22v5.6h-2V6.4l-4.6 4.6-1.4-1.4L18.6 5h-2.2V3zM2 5h4.1l3.6 3.6-1.4 1.4L5.2 7H2V5zm14.4 10.6 1.4 1.4 1.8-1.8v2H22V21h-2.2v-2l-1.8 1.8-1.4-1.4 1.9-2-1.9-2zM2 17h3.2l3.1-3.1 1.4 1.4L5.8 19H2v-2z"/></svg>';
  var ICON_LIST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z"/></svg>';

  (function music() {
    var box = document.getElementById("player");
    var nameEl = document.getElementById("pl-name");
    var playBtn = document.getElementById("pl-play");
    var prevBtn = document.getElementById("pl-prev");
    var nextBtn = document.getElementById("pl-next");
    var modeBtn = document.getElementById("pl-mode");
    var listBtn = document.getElementById("pl-list-btn");
    var listEl = document.getElementById("pl-list");
    if (!box) return;

    var cfg = HOME.music || {};
    var tracks = Array.isArray(cfg.tracks)
      ? cfg.tracks.filter(function (t) { return t && t.src; })
      : [];
    if (!tracks.length) {
      if (soundBtn) soundBtn.hidden = true;
      box.hidden = true;
      return;
    }

    var audio = document.createElement("audio");
    audio.preload = "auto";
    audio.setAttribute("data-pl", "1");
    audio.style.display = "none";
    document.body.appendChild(audio);

    var index = 0;
    var vol = typeof cfg.volume === "number" ? cfg.volume : 0.5;
    audio.volume = vol;

    var MODES = ["order", "one", "shuffle"];
    var MODE_LABEL = { order: "顺序播放", one: "单曲循环", shuffle: "随机播放" };
    var MODE_ICON = { order: ICON_MODE_ORDER, one: ICON_MODE_ONE, shuffle: ICON_MODE_SHUFFLE };
    var mode = load(MODE_KEY);
    if (MODES.indexOf(mode) < 0) mode = "order";

    function load2(k) {
      index = (k + tracks.length) % tracks.length;
      audio.src = tracks[index].src;
      renderList();
    }

    function renderList() {
      if (!listEl) return;
      listEl.innerHTML = tracks.map(function (t, i) {
        return '<li><button class="pl-track' + (i === index ? " is-on" : "") + '" type="button" data-i="' + i + '">' +
          '<span class="pl-track-i">' + (i + 1) + "</span>" +
          '<span class="pl-track-t">' + esc(t.title || ("第 " + (i + 1) + " 首")) + "</span>" +
          "</button></li>";
      }).join("");
    }

    function refresh() {
      if (nameEl) nameEl.textContent = tracks[index].title || ("第 " + (index + 1) + " 首");
      if (playBtn) playBtn.innerHTML = audio.paused ? ICON_PLAY : ICON_PAUSE;
      if (prevBtn) prevBtn.innerHTML = ICON_PREV;
      if (nextBtn) nextBtn.innerHTML = ICON_NEXT;
      if (listBtn) listBtn.innerHTML = ICON_LIST;
      if (modeBtn) {
        modeBtn.innerHTML = MODE_ICON[mode];
        modeBtn.title = "播放方式：" + MODE_LABEL[mode];
        modeBtn.classList.toggle("is-on", mode !== "order");
      }
      if (soundBtn) soundBtn.setAttribute("aria-pressed", audio.paused ? "true" : "false");
      renderList();
    }

    function pickNext() {
      if (mode === "shuffle" && tracks.length > 1) {
        var k = index;
        while (k === index) k = Math.floor(Math.random() * tracks.length);
        return k;
      }
      return (index + 1) % tracks.length;
    }

    function play() {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { /* 浏览器拦下了，等一次交互 */ });
      refresh();
    }

    audio.addEventListener("ended", function () {
      if (mode === "one") {
        audio.currentTime = 0;
        play();
        return;
      }
      load2(pickNext());
      play();
    });
    audio.addEventListener("play", refresh);
    audio.addEventListener("pause", refresh);

    load2(0);
    refresh();
    var wantPlay = load(PLAY_KEY) !== "off";
    if (wantPlay) play();

    if (playBtn) playBtn.addEventListener("click", function () {
      if (audio.paused) {
        store(PLAY_KEY, "on");
        play();
      } else {
        audio.pause();
        store(PLAY_KEY, "off");
      }
    });
    if (prevBtn) prevBtn.addEventListener("click", function () {
      load2(index - 1);
      store(PLAY_KEY, "on");
      play();
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      load2(index + 1);
      store(PLAY_KEY, "on");
      play();
    });

    if (modeBtn) modeBtn.addEventListener("click", function () {
      var at = MODES.indexOf(mode);
      mode = MODES[(at + 1) % MODES.length];
      store(MODE_KEY, mode);
      refresh();
    });

    if (listBtn && listEl) listBtn.addEventListener("click", function () {
      listEl.hidden = !listEl.hidden;
      if (!listEl.hidden) renderList();
    });

    if (listEl) listEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (!b) return;
      load2(Number(b.dataset.i));
      store(PLAY_KEY, "on");
      play();
    });

    /* 开与关都走这两个函数，关的时候先放渐出动画再隐藏 */
    var closeTimer = null;

    function openPanel() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      box.classList.remove("is-closing");
      box.hidden = false;
      refresh();
    }

    function closePanel() {
      if (box.hidden || box.classList.contains("is-closing")) return;
      if (listEl) listEl.hidden = true;
      box.classList.add("is-closing");
      closeTimer = setTimeout(function () {
        box.hidden = true;
        box.classList.remove("is-closing");
        closeTimer = null;
      }, 180);
    }

    window.BXPlayer = {
      togglePanel: function () {
        if (box.hidden) openPanel();
        else closePanel();
      }
    };

    /* 面板里的点击一律拦在面板内：按钮刷新会替换节点，等冒泡到 document 时
       原来的 target 已经不在文档里，contains 会误判成外部点击把面板关掉。 */
    box.addEventListener("click", function (e) { e.stopPropagation(); });

    document.addEventListener("click", function (e) {
      if (box.hidden) return;
      var path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(box) >= 0) return;
      if (box.contains(e.target)) return;
      if (soundBtn && (path.indexOf(soundBtn) >= 0 || soundBtn.contains(e.target))) return;
      closePanel();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) closePanel();
    });

    /* 只有上次是要听的时候，才等一次交互把被拦下的播放接着放；
       上次是关的，就别再被任何点击唤醒。 */
    if (wantPlay) {
      ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
        var once = function () {
          if (audio.paused) play();
          window.removeEventListener(evt, once);
        };
        window.addEventListener(evt, once, { passive: true });
      });
    }
  })();

  /* ---------- 账号 ---------- */

  var accBox = document.getElementById("acc-box");
  var accLoaded = false;

  var ACC_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M1.8 12S5.4 5.6 12 5.6 22.2 12 22.2 12 18.6 18.4 12 18.4 1.8 12 1.8 12Z"/>' +
    '<circle cx="12" cy="12" r="2.9"/>' +
    '<path class="pw-slash" d="M4.2 19.8 19.8 4.2"/></svg>';

  function accSignedOut() {
    if (!accBox) return;
    accBox.innerHTML =
      '<p class="acc-note">请输入密钥</p>' +
      '<div class="pw">' +
      '<input type="password" id="acc-pass" autocomplete="current-password" placeholder="请输入密钥">' +
      '<button class="pw-eye" id="acc-eye" type="button" aria-label="显示密码" aria-pressed="false">' + ACC_EYE + "</button>" +
      "</div>" +
      '<p class="acc-msg" id="acc-msg"></p>' +
      '<div class="acc-actions"><button class="m-btn m-btn-main" id="acc-login" type="button">进入</button></div>';
    bindAccGate();
    accLoaded = true;
  }

  function bindAccGate() {
    var input = document.getElementById("acc-pass");
    var eye = document.getElementById("acc-eye");
    var msg = document.getElementById("acc-msg");
    var btn = document.getElementById("acc-login");

    if (eye && input) {
      eye.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        eye.classList.toggle("is-on", show);
        eye.setAttribute("aria-pressed", show ? "true" : "false");
        eye.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
        input.focus();
      });
    }

    function go() {
      var pw = (input && input.value ? input.value : "").trim();
      if (!pw) {
        msg.textContent = "先填密钥。";
        msg.className = "acc-msg err";
        return;
      }
      msg.textContent = "正在核对…";
      msg.className = "acc-msg";
      window.BXAuth.loginWithPassword(pw).then(function (data) {
        /* 票已经在手里，直接按登录态渲染，不等 /me 那一次网络往返 */
        accSignedIn({ ok: true, login: (data && data.login) || "" });
        if (editEntry) editEntry.hidden = false;
        if (editHome) editHome.hidden = false;
      }).catch(function (e) {
        msg.textContent = (e && e.message) ? e.message : "密钥不对";
        msg.className = "acc-msg err";
        if (input) input.select();
      });
    }

    if (btn) btn.addEventListener("click", go);
    if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
  }

  function accSignedIn(who) {
    if (!accBox) return;
    var name = (who && who.login) || "BX-ZERO";
    accBox.innerHTML =
      '<div class="acc-card"><div class="acc-who">' +
      '<div class="acc-name">' + esc(String(name).toUpperCase()) + "</div>" +
      '<div class="acc-sub">已登录，可以改动态与主页信息了。</div>' +
      "</div></div>" +
      '<div class="acc-actions">' +
      '<a class="m-btn m-btn-main" href="#/write" data-view="write">进入写作台</a>' +
      '<a class="m-btn" href="#/home-edit" data-view="home-edit">改主页信息</a>' +
      '<button class="m-btn" id="acc-logout" type="button">退出登录</button>' +
      "</div>" +
      '<div class="acc-stats" id="acc-stats">' +
      '<div class="acc-stat"><b>—</b><span>总访问</span></div>' +
      '<div class="acc-stat"><b>—</b><span>今天</span></div>' +
      '<div class="acc-stat"><b>—</b><span>独立访客</span></div>' +
      '<div class="acc-foot"><button class="acc-reset" id="acc-reset" type="button">重置统计</button></div>' +
      "</div>";
    accLoaded = true;
    loadStats();
    var out = document.getElementById("acc-logout");
    if (out) {
      out.addEventListener("click", function () {
        accSignedOut();
        if (window.BXAuth) window.BXAuth.logout();
        syncOwner();
      });
    }
    var resetBtn = document.getElementById("acc-reset");
    if (resetBtn) resetBtn.addEventListener("click", doResetStats);
  }

  function renderAccount(force) {
    /* 首次路由可能早于本模块初始化，这里每次重新取一次节点 */
    if (!accBox) accBox = document.getElementById("acc-box");
    if (!accBox) return;
    if (accLoaded && !force) return;
    if (!window.BXAuth) {
      accBox.innerHTML = '<p class="acc-note">auth.js 没加载，登录不可用。</p>';
      return;
    }
    /* 没有票就不用发请求，直接按未登录渲染 */
    if (window.BXAuth.signedIn && !window.BXAuth.signedIn()) {
      accSignedOut();
      return;
    }
    window.BXAuth.me().then(function (who) {
      if (who && who.ok) accSignedIn(who);
      else accSignedOut();
    }).catch(function () { accSignedOut(); });
  }

  /* ---------- 站主入口 ---------- */

  var editEntry = document.getElementById("edit-entry");
  var editHome = document.getElementById("edit-home");

  function syncOwner() {
    if (!window.BXAuth) return;
    window.BXAuth.me().then(function (who) {
      var ok = !!(who && who.ok);
      if (editEntry) editEntry.hidden = !ok;
      if (editHome) editHome.hidden = !ok;
    }).catch(function () { /* 忽略 */ });
  }

  /* ---------- 访问统计 ---------- */

  function fmtNum(n) {
    var v = Math.round(Number(n) || 0);
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function loadStats() {
    var box = document.getElementById("acc-stats");
    if (!box || !window.BXAuth || !window.BXAuth.stats) return;
    window.BXAuth.stats().then(function (d) {
      var nums = box.querySelectorAll("b");
      if (nums.length < 3) return;
      nums[0].textContent = fmtNum(d.total);
      nums[1].textContent = fmtNum(d.today);
      nums[2].textContent = fmtNum(d.uv);
    }).catch(function () {
      box.classList.add("is-off");
    });
  }

  function doResetStats() {
    if (!window.BXAuth || !window.BXAuth.resetStats) return;
    if (!window.confirm("把总访问、今天、独立访客全部清零？删掉的数据找不回来。")) return;
    var btn = document.getElementById("acc-reset");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "重置中…";
    }
    window.BXAuth.resetStats().then(function (d) {
      /* KV 删除要几十秒才传播，先把数字就地抹平，别让人以为没生效 */
      var box = document.getElementById("acc-stats");
      if (box) {
        var nums = box.querySelectorAll("b");
        for (var k = 0; k < nums.length; k++) nums[k].textContent = "0";
      }
      if (btn) btn.textContent = "已清掉 " + fmtNum(d.deleted) + " 条";
      /* 按钮两秒后复位 */
      setTimeout(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "重置统计";
        }
      }, 2200);
      /* 不再回拉：KV 的 list 最长要一分钟才看不到已删除的键，
         这时候查回来的还是旧数字，会把刚抹平的 0 又盖回去。 */
    }).catch(function (e) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "重置统计";
      }
      window.alert("重置失败：" + (e && e.message ? e.message : "未知错误"));
    });
  }

  /* 所有节点与函数都定义完之后再走首屏路由，避免拿到 undefined */
  route();

  syncOwner();

  /* 站主带着票打开页面时不计数，游客每次打开汇报一次 */
  if (window.BXAuth && window.BXAuth.hit) window.BXAuth.hit();
})();
