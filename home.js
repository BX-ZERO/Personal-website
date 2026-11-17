/* ==========================================================
   首页信息
   这个文件可以直接手改，也可以用 在首页的主页信息编辑里改后保存

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
      "desc": "",
      "href": "https://bx-zero.github.io/quiz-review/",
      "tag": "WEB TOOL"
    },
    {
      "cn": "明日方舟活动代币计算器",
      "en": "arknights-event-calc",
      "desc": "",
      "href": "https://bx-zero.github.io/arknights-event-calc/",
      "tag": "CALCULATOR"
    },
    {
      "cn": "部落冲突通知助手",
      "en": "coc-notify",
      "desc": "",
      "href": "https://bx-zero.github.io/coc-notify/",
      "tag": "NOTIFY"
    }
  ],
  "music": {
    "volume": 0.5,
    "tracks": [
      {
        "title": "KNOW MY NAME",
        "src": "music/know-my-name.mp3"
      }
    ]
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
  "entries": [
    {
      "date": "2026-11-17",
      "kind": "note",
      "title": "coc-notify更新至v1.0.7",
      "desc": "官方动作太快了，刚出资讯马上就在夯木节结束更新19本了，这谁追的上这更新速度😅",
      "href": ""
    },
    {
      "date": "2026-11-15",
      "kind": "tool",
      "title": "错题复习工具",
      "desc": "在备考安全员，刷题的微信小程序太垃圾了，让DSH搓了一个",
      "href": "https://bx-zero.github.io/quiz-review/"
    },
    {
      "date": "2026-11-05",
      "kind": "tool",
      "title": "明日方舟活动代币计算器",
      "desc": "全网没找到能用的活动代币计算器，让DSH搓了一个",
      "href": "https://bx-zero.github.io/arknights-event-calc/"
    },
    {
      "date": "2026-11-12",
      "kind": "tool",
      "title": "部落冲突升级通知助手",
      "desc": "微信小程序那个要反复增加订阅也太烦了，借助CF能一直通知了",
      "href": "https://bx-zero.github.io/coc-notify/"
    }
  ]
};
