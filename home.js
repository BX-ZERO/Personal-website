/* ==========================================================
   首页信息
   这个文件可以直接手改，也可以用 home-edit.html 在线改后保存

   entries 里是手写的条目（工具上线、杂事），动态会从 moments.js 自动并进来。
   kind 取值：post（动态，自动的） / tool（工具） / note（随手记）
   ========================================================== */

window.BX_HOME = {
  "title": "BXZERO",
  "intro": [
    "写代码，做小工具，偶尔记录一点过程。",
    "这里是入口，不是简历。"
  ],
  "stats": [
    {
      "num": "03",
      "label": "项目"
    },
    {
      "num": "01",
      "label": "工具箱"
    }
  ],
  "tools": [
    {
      "cn": "错题复习",
      "en": "quiz-review",
      "desc": "浏览器里直接用，数据存在本地。",
      "href": "https://bx-zero.github.io/quiz-review/",
      "tag": "WEB TOOL"
    },
    {
      "cn": "明日方舟活动代币计算器",
      "en": "arknights-event-calc",
      "desc": "纯前端计算，不联网也能算。",
      "href": "https://bx-zero.github.io/arknights-event-calc/",
      "tag": "CALCULATOR"
    },
    {
      "cn": "部落冲突通知助手",
      "en": "coc-notify",
      "desc": "需要常驻进程与推送通道，目前跑在本机。",
      "href": "https://bx-zero.github.io/coc-notify/",
      "tag": "NOTIFY"
    }
  ],
  "music": {
    "volume": 0.35,
    "tracks": []
  },
  "slab": {
    "home": {
      "en": "INFORMATION",
      "cn": "情报"
    },
    "tools": {
      "en": "AVAILABLE",
      "cn": "可用"
    }
  },
  "entries": []
};
