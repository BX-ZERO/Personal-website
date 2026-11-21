/* ==========================================================
   BXZERO — 登录票据
   登录走 Cloudflare Worker（bxzero-auth），回头时带 #auth=<票据>，
   这里把它收进 localStorage，之后调 /me 确认、调 /save 提交。
   ========================================================== */

(function () {
  "use strict";

  var WORKER = "https://api.bxzero.cn";
  var TICKET_KEY = "bxz-ticket";
  /* 上次登录的账号名，用来在等 /me 的时候先把界面画出来 */
  var LOGIN_KEY = "bxz-login";
  var KEEP_DAYS = 30;

  /* 票据同时写 localStorage 与 cookie：
     localStorage 按「协议 + 主机 + 端口」隔离，换端口就没了；
     cookie 只按主机隔离，localhost 下换端口还能认出来。 */

  function get(key) {
    var v = null;
    try { v = localStorage.getItem(key); } catch (e) { v = null; }
    if (v) return v;
    var m = document.cookie.match(new RegExp("(?:^|; )" + key + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function put(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 忽略 */ }
    try {
      document.cookie = key + "=" + encodeURIComponent(value) +
        "; max-age=" + (KEEP_DAYS * 24 * 3600) + "; path=/; SameSite=Lax";
    } catch (e) { /* 忽略 */ }
  }

  function drop(key) {
    try { localStorage.removeItem(key); } catch (e) { /* 忽略 */ }
    try { document.cookie = key + "=; max-age=0; path=/"; } catch (e) { /* 忽略 */ }
  }

  /* 访客标识：第一次访问随机生成，之后一直带着它。
     它不代表任何个人信息，只用来让同一台设备一天只算一个独立访客。 */

  var VID_KEY = "bxz-vid";

  function visitorId() {
    var v = get(VID_KEY);
    if (v && /^[0-9a-f]{32}$/.test(v)) return v;
    var out = "";
    try {
      var arr = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(arr);
      for (var i = 0; i < arr.length; i++) {
        out += ("0" + arr[i].toString(16)).slice(-2);
      }
    } catch (e) { out = ""; }
    if (!out) {
      for (var k = 0; k < 32; k++) out += Math.floor(Math.random() * 16).toString(16);
    }
    try { localStorage.setItem(VID_KEY, out); } catch (e) { /* 忽略 */ }
    try {
      document.cookie = VID_KEY + "=" + out +
        "; max-age=" + (365 * 24 * 3600) + "; path=/; SameSite=Lax";
    } catch (e) { /* 忽略 */ }
    return out;
  }

  /* 从 GitHub 回来时，地址里带 #auth=... */

  (function capture() {
    var hash = location.hash || "";
    var hit = hash.match(/[#&]auth=([^&]+)/);
    if (!hit) return;
    put(TICKET_KEY, decodeURIComponent(hit[1]));
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {
      location.hash = "";
    }
  })();

  /* /me 的结果在这里存五分钟，免得每次切页都等一次网络 */
  var meCache = null;
  var meAt = 0;

  var auth = {
    worker: WORKER,

    ticket: function () {
      return get(TICKET_KEY);
    },

    /* 上次登录记住的名字，没有就 null */
    cachedLogin: function () {
      return get(LOGIN_KEY);
    },

    /* 有没有票，页面先用这个判断，没有就直接按未登录渲染，不发请求 */
    signedIn: function () {
      return !!get(TICKET_KEY);
    },

    login: function () {
      if (location.protocol === "file:") {
        window.alert("本地双击打开时登录走不通。要么用线上页面登录，要么在本机起一个 http 服务再访问，比如在站点目录执行 python -m http.server 8000，然后打开 http://localhost:8000/edit.html");
        return;
      }
      var back = location.href.split("#")[0];
      location.href = WORKER + "/login?to=" + encodeURIComponent(back);
    },

    /* 密码登录：不跳 GitHub，Worker 核对后直接给一张票 */
    /* 密码登录：不跳 GitHub，Worker 核对后直接给一张票 */
    loginWithPassword: function (password) {
      /* 十二秒没回应就当连不上：国内直连 Cloudflare 常被阻断 */
      var ctrl = null;
      var timer = null;
      try {
        if (window.AbortController) {
          ctrl = new AbortController();
          timer = setTimeout(function () { try { ctrl.abort(); } catch (e) { /* 忽略 */ } }, 12000);
        }
      } catch (e) { ctrl = null; }
      return fetch(WORKER + "/passport", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: String(password || "") }),
        signal: ctrl ? ctrl.signal : undefined
      }).catch(function (e) {
        if (timer) clearTimeout(timer);
        if (e && e.name === "AbortError") {
          throw new Error("十二秒没有回应，多半是直连不到 api.bxzero.cn。开代理再试。");
        }
        /* fetch 自己抛 TypeError 只有两种可能：跨域被拒，或者根本连不上 */
        if (e && e.name === "TypeError") {
          throw new Error(location.protocol === "file:"
            ? "现在是用 file:// 打开的文件，浏览器不许它连 Worker。改用 http://localhost:8123 打开这一页。"
            : "连不上 api.bxzero.cn。Cloudflare 在国内常被阻断，先开代理再试。");
        }
        throw e;
      }).then(function (r) {
        if (timer) clearTimeout(timer);
        return r.json().then(function (data) {
          if (!r.ok || !data.ticket) throw new Error(data.error || ("HTTP " + r.status));
          put(TICKET_KEY, data.ticket);
          put(LOGIN_KEY, data.login || "BX-ZERO");
          meCache = null;
          meAt = 0;
          return data;
        });
      });
    },

    logout: function () {
      drop(TICKET_KEY);
      drop(LOGIN_KEY);
      meCache = null;
      meAt = 0;
      location.reload();
    },

    me: function (force) {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.resolve({ ok: false, reason: "none" });
      /* 五分钟内复用上一次结果，切页、切视图不再重复打 Worker */
      if (!force && meCache && Date.now() - meAt < 300000) return meCache;
      /* 二十秒还没回应就当连不上：Worker 冷启动实测要 10.4 秒 */
      var ctrl = null;
      var timer = null;
      try {
        if (window.AbortController) {
          ctrl = new AbortController();
          timer = setTimeout(function () { try { ctrl.abort(); } catch (e) { /* 忽略 */ } }, 20000);
        }
      } catch (e) { ctrl = null; }
      meCache = fetch(WORKER + "/me", {
        headers: { authorization: "Bearer " + ticket },
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (data && data.ok && data.login) put(LOGIN_KEY, data.login);
            return { ok: !!data.ok, status: r.status, login: data.login, reason: r.ok ? "" : (data.error || ("HTTP " + r.status)) };
          });
        })
        .catch(function (e) {
          meCache = null;
          return { ok: false, status: 0, reason: (e && e.name === "AbortError") ? "Worker 二十秒没回应" : "连不上 Worker" };
        })
        .then(function (v) {
          if (timer) clearTimeout(timer);
          return v;
        });
      meAt = Date.now();
      return meCache;
    },

    read: function (path) {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.reject(new Error("没有登录"));
      return fetch(WORKER + "/read?path=" + encodeURIComponent(path), {
        headers: { authorization: "Bearer " + ticket }
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || data.error) throw new Error(data.error || ("HTTP " + r.status));
          return data;
        });
      });
    },

    save: function (path, content, message) {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.reject(new Error("没有登录"));
      return fetch(WORKER + "/save", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + ticket
        },
        body: JSON.stringify({ path: path, content: content, message: message })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || data.error) throw new Error(data.error || ("HTTP " + r.status));
          return data;
        });
      });
    },

    upload: function (path, base64, message) {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.reject(new Error("没有登录"));
      return fetch(WORKER + "/upload", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + ticket
        },
        body: JSON.stringify({ path: path, base64: base64, message: message })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || data.error) throw new Error(data.error || ("HTTP " + r.status));
          return data;
        });
      });
    },

    cleanup: function (opts) {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.reject(new Error("没有登录"));
      var body = opts || {};
      return fetch(WORKER + "/cleanup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + ticket
        },
        body: JSON.stringify({
          dryRun: body.dryRun === true,
          minAgeHours: body.minAgeHours || 24
        })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || data.error) throw new Error(data.error || ("HTTP " + r.status));
          return data;
        });
      });
    },

    /* 访问统计：站主自己带着票打开页面时不计数 */
    hit: function () {
      if (get(TICKET_KEY)) return Promise.resolve({ ok: false, skipped: "owner" });
      /* 同一个标签页里翻来翻去只算一次，刷新也不重复计 */
      try {
        if (sessionStorage.getItem("bxz-hit") === "1") {
          return Promise.resolve({ ok: false, skipped: "session" });
        }
        sessionStorage.setItem("bxz-hit", "1");
      } catch (e) { /* 存不了就照常报一次 */ }
      try {
        return fetch(WORKER + "/hit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ vid: visitorId() }),
          keepalive: true
        })
          .then(function (r) {
            return r.json().catch(function () { return { ok: r.ok }; });
          })
          .catch(function () { return { ok: false }; });
      } catch (e) {
        return Promise.resolve({ ok: false });
      }
    },

    stats: function () {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.reject(new Error("没有登录"));
      return fetch(WORKER + "/stats", {
        headers: { authorization: "Bearer " + ticket }
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data.ok) throw new Error(data.error || ("HTTP " + r.status));
          return data;
        });
      });
    },

    resetStats: function () {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.reject(new Error("没有登录"));
      return fetch(WORKER + "/reset-stats", {
        method: "POST",
        headers: { authorization: "Bearer " + ticket }
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data.ok) throw new Error(data.error || ("HTTP " + r.status));
          return data;
        });
      });
    },

    comments: function (post) {
      return fetch(WORKER + "/comments?post=" + encodeURIComponent(post))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data || !data.ok) throw new Error((data && data.error) || "取评论失败");
          return data.items || [];
        });
    },

    comment: function (post, text) {
      var ticket = get(TICKET_KEY);
      var headers = { "content-type": "application/json" };
      if (ticket) headers.authorization = "Bearer " + ticket;
      return fetch(WORKER + "/comment", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ post: post, text: text, vid: visitorId() })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data.ok) throw new Error(data.error || ("HTTP " + r.status));
          return data;
        });
      });
    },

    deleteComment: function (post, time) {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.reject(new Error("没有登录"));
      return fetch(WORKER + "/comment-del", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + ticket },
        body: JSON.stringify({ post: post, time: time })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data.ok) throw new Error(data.error || ("HTTP " + r.status));
          return data;
        });
      });
    }
  };

  window.BXAuth = auth;
})();
