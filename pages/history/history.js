Page({

  data: {
    themeClass: "theme-1",

    records: [],
    recordCount: 0,
    totalMinutes: 0,
    topicCount: 0
  },

  onShow: function () {
    this.syncTheme()
    this.loadRecords()
  },

  // =========================
  // 同步首页主题
  // =========================

  syncTheme: function () {

    var app = getApp()
    var themeMode = 1

    // 优先读取全局主题
    if (
      app &&
      app.globalData &&
      app.globalData.themeMode
    ) {

      themeMode =
        Number(app.globalData.themeMode)

    } else {

      // 全局主题不存在时读取本地缓存
      themeMode =
        Number(
          wx.getStorageSync("themeMode") || 1
        )
    }

    // 检查主题是否存在
    if (
      !app ||
      !app.globalData ||
      !app.globalData.themes ||
      !app.globalData.themes[themeMode]
    ) {
      themeMode = 1
    }

    // 设置页面主题
    this.setData({
      themeClass:
        themeMode === 2
          ? "theme-2"
          : "theme-1"
    })

    // 交给 app.js 统一处理系统导航栏和背景色
    if (
      app &&
      typeof app.applyTheme === "function"
    ) {
      app.applyTheme(themeMode)
    }
  },


  loadRecords: function () {

    // 学习记录使用独立的数据
    var learningHistory =
      wx.getStorageSync("learningHistory") || []

    var totalMinutes = 0
    var topics = {}

    for (var i = 0; i < learningHistory.length; i++) {

      var record = learningHistory[i]

      totalMinutes += Number(
        record.minutes || 0
      )

      if (record.topic) {
        topics[record.topic] = true
      }
    }


    // 展示排序：最新在前（date + time 倒序）
    var records = learningHistory.slice()

    records.sort(function (a, b) {
      var ka = (a.date || "") + " " + (a.time || "")
      var kb = (b.date || "") + " " + (b.time || "")
      if (ka === kb) return 0
      return ka > kb ? -1 : 1
    })

    this.setData({

      records: records,

      recordCount:
        learningHistory.length,

      totalMinutes:
        totalMinutes,

      topicCount:
        Object.keys(topics).length

    })
  },

  openRecord: function (e) {

    var id =
      e.currentTarget.dataset.id

    if (!id) {
      return
    }

    wx.setStorageSync(
      "selectedLearningId",
      id
    )

    wx.navigateTo({
      url: "/pages/learningDetail/learningDetail"
    })

  },

  copyRecord: function (e) {

    var id =
      e.currentTarget.dataset.id

    var history =
      wx.getStorageSync(
        "learningHistory"
      ) || []

    var target = null

    for (var i = 0; i < history.length; i++) {

      if (
        String(history[i].id) ===
        String(id)
      ) {

        target = history[i]

        break
      }
    }

    if (!target) {

      wx.showToast({
        title: "Record not found",
        icon: "none"
      })

      return
    }

    var text = ""

    text +=
      "Learning Record\n"

    if (target.date) {
      text +=
        "Date: " +
        target.date +
        "\n"
    }

    if (target.minutes) {
      text +=
        "Duration: " +
        target.minutes +
        " min\n"
    }

    if (target.topic) {
      text +=
        "Topics: " +
        target.topic +
        "\n"
    }

    if (target.content) {
      text +=
        "Content: " +
        target.content +
        "\n"
    }

    if (target.note) {
      text +=
        "Notes: " +
        target.note
    }

    wx.setClipboardData({

      data: text,

      success: function () {

        wx.showToast({
          title: "Copied",
          icon: "success"
        })

      }

    })
  },

  deleteRecord: function (e) {

    var id =
      e.currentTarget.dataset.id

    var that = this

    wx.showModal({

      title: "Delete Learning Record",

      content:
        "Delete this learning record?",

      success: function (res) {

        if (!res.confirm) {
          return
        }

        var history =
          wx.getStorageSync(
            "learningHistory"
          ) || []

        var newHistory = []

        for (
          var i = 0;
          i < history.length;
          i++
        ) {

          if (
            String(history[i].id) !==
            String(id)
          ) {

            newHistory.push(
              history[i]
            )
          }
        }

        wx.setStorageSync(
          "learningHistory",
          newHistory
        )

        that.loadRecords()

        wx.showToast({
          title: "Deleted",
          icon: "success"
        })

      }

    })
  },

})