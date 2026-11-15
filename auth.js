/* ==========================================================
   BXZERO — 登录票据
   登录走 Cloudflare Worker（bxzero-auth），回头时带 #auth=<票据>，
   这里把它收进 localStorage，之后调 /me 确认、调 /save 提交。
   ========================================================== */

(function () {
  "use strict";

  var WORKER = "https://bxzero-auth.dosomethingforme.workers.dev";
  var TICKET_KEY = "bxz-ticket";

  function get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function put(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function drop(key) {
    try { localStorage.removeItem(key); } catch (e) {}
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
      location.href = WORKER + "/login";
    },

    logout: function () {
      drop(TICKET_KEY);
      location.reload();
    },

    me: function () {
      var ticket = get(TICKET_KEY);
      if (!ticket) return Promise.resolve({ ok: false });
      return fetch(WORKER + "/me", {
        headers: { authorization: "Bearer " + ticket }
      })
        .then(function (r) { return r.json(); })
        .catch(function () { return { ok: false }; });
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
    }
  };

  window.BXAuth = auth;
})();
