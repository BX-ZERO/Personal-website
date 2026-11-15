/* ==========================================================
   BXZERO — 登录票据
   登录走 Cloudflare Worker（bxzero-auth），回头时带 #auth=<票据>，
   这里把它收进 localStorage，之后调 /me 确认、调 /save 提交。
   ========================================================== */

(function () {
  "use strict";

  var WORKER = "https://bxzero-auth.dosomethingforme.workers.dev";
  var TICKET_KEY = "bxz-ticket";
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

  var auth = {
    worker: WORKER,

    ticket: function () {
      return get(TICKET_KEY);
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
    loginWithPassword: function (password) {
      return fetch(WORKER + "/passport", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: String(password || "") })
      }).catch(function (e) {
        /* fetch 自己抛 TypeError 只有两种可能：跨域被拒，或者根本连不上 */
        if (e && e.name === "TypeError") {
          throw new Error(location.protocol === "file:"
            ? "现在是用 file:// 打开的文件，浏览器不许它连 Worker。改用 http://localhost:8123 打开这一页。"
            : "连不上 Worker，检查这台机器能不能访问 workers.dev。");
        }
        throw e;
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data.ticket) throw new Error(data.error || ("HTTP " + r.status));
          put(TICKET_KEY, data.ticket);
          return data;
        });
      });
    },

    logout: function () {
      drop(TICKET_KEY);
      location.reload();
    },

    me: function () {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.resolve({ ok: false, reason: "none" });
      return fetch(WORKER + "/me", {
        headers: { authorization: "Bearer " + ticket }
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: !!data.ok, status: r.status, login: data.login, reason: r.ok ? "" : (data.error || ("HTTP " + r.status)) };
          });
        })
        .catch(function (e) {
          return { ok: false, status: 0, reason: "连不上 Worker" };
        });
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
    }
  };

  window.BXAuth = auth;
})();
