var profileUtil = require("../../utils/profile.js")


Page({

  data: {

    // =======================================================
    // 当前主题
    // =======================================================

    themeMode: 1,

    themeName: "Theme 1",

    // =======================================================
    // 数据备份 / 恢复
    // =======================================================

    lastBackupText: "",

    showImport: false,

    importText: "",

    // =======================================================
    // 个人资料编辑弹层
    // =======================================================

    showProfile: false,

    profileNickname: "",

    profileStudyTarget: ""

  },


  // =========================================================
  // 页面显示
  // =========================================================

  onShow: function () {

    this.syncTheme()

    this.loadBackupInfo()

  },


  // =========================================================
  // 统一主题管理
  // =========================================================

  syncTheme: function () {

    var app = getApp()

    var themeMode = 1


    // -------------------------------------------------------
    // 优先从 app.js 全局主题读取
    // -------------------------------------------------------

    if (
      app &&
      app.globalData &&
      app.globalData.themeMode
    ) {

      themeMode =
        Number(app.globalData.themeMode)

    } else {

      themeMode =
        Number(
          wx.getStorageSync("themeMode") || 1
        )

    }


    // -------------------------------------------------------
    // 防止主题编号异常
    // -------------------------------------------------------

    if (
      !app ||
      !app.globalData ||
      !app.globalData.themes ||
      !app.globalData.themes[themeMode]
    ) {

      themeMode = 1

    }


    // -------------------------------------------------------
    // 获取当前主题
    // -------------------------------------------------------

    var theme =
      app.getTheme(themeMode)


    // -------------------------------------------------------
    // 更新页面主题信息
    // -------------------------------------------------------

    this.setData({

      themeMode: themeMode,

      themeName: theme.name

    })


    // -------------------------------------------------------
    // 应用全局主题
    // -------------------------------------------------------

    if (
      app &&
      typeof app.applyTheme === "function"
    ) {

      app.applyTheme(themeMode)

    }

  },


  // =========================================================
  // 主题设置
  // =========================================================

  goTheme: function () {

    var that = this

    var app = getApp()

    var themeList = []


    // -------------------------------------------------------
    // 自动读取 app.js 中的主题
    //
    // 以后增加主题3、主题4，
    // 这里不需要重新写颜色
    // -------------------------------------------------------

    if (
      app &&
      app.globalData &&
      app.globalData.themes
    ) {

      var themes = app.globalData.themes

      for (var key in themes) {

        themeList.push(
          themes[key].name
        )

      }

    }


    // -------------------------------------------------------
    // 防止主题列表异常
    // -------------------------------------------------------

    if (themeList.length === 0) {

      themeList = [
        "Theme 1",
        "Theme 2"
      ]

    }


    // -------------------------------------------------------
    // 弹出主题选择
    // -------------------------------------------------------

    wx.showActionSheet({

      itemList: themeList,

      success: function (res) {

        var themeMode =
          Number(res.tapIndex) + 1


        // ---------------------------------------------------
        // 获取全局主题配置
        // ---------------------------------------------------

        if (
          !app.globalData ||
          !app.globalData.themes ||
          !app.globalData.themes[themeMode]
        ) {

          themeMode = 1

        }


        var theme =
          app.getTheme(themeMode)


        // ---------------------------------------------------
        // 应用主题
        // ---------------------------------------------------

        app.applyTheme(themeMode)


        // ---------------------------------------------------
        // 更新设置页面
        // ---------------------------------------------------

        that.setData({

          themeMode: themeMode,

          themeName: theme.name

        })


        // ---------------------------------------------------
        // 提示
        // ---------------------------------------------------

        wx.showToast({

          title:
            "Switched to " + theme.name,

          icon: "success"

        })

      }

    })

  },


  // =========================================================
  // 个人资料
  // =========================================================

  goProfile: function () {

    var profile = profileUtil.getProfile()

    this.setData({

      showProfile: true,

      profileNickname:
        profile.nickname || "",

      profileStudyTarget:
        String(profile.dailyStudyTarget)

    })

  },


  // =========================================================
  // 个人资料 · 输入昵称
  // =========================================================

  inputNickname: function (e) {

    this.setData({

      profileNickname: e.detail.value

    })

  },


  // =========================================================
  // 个人资料 · 输入学习目标
  // =========================================================

  inputStudyTarget: function (e) {

    this.setData({

      profileStudyTarget: e.detail.value

    })

  },


  // =========================================================
  // 个人资料 · 关闭弹层
  // =========================================================

  closeProfile: function () {

    this.setData({

      showProfile: false

    })

  },


  // =========================================================
  // 个人资料 · 保存
  // =========================================================

  saveProfile: function () {

    var nickname =
      (this.data.profileNickname || "").trim()

    if (!nickname) {

      wx.showToast({
        title: "Enter a nickname",
        icon: "none"
      })

      return

    }

    var targetText =
      String(this.data.profileStudyTarget || "").trim()

    if (!targetText) {

      wx.showToast({
        title: "Enter a daily study target",
        icon: "none"
      })

      return

    }

    var target = Number(targetText)

    if (isNaN(target) || target <= 0) {

      wx.showToast({
        title: "Enter a valid study target",
        icon: "none"
      })

      return

    }

    profileUtil.saveProfile({

      nickname: nickname,

      dailyStudyTarget: target

    })

    this.setData({

      showProfile: false

    })

    wx.showToast({
      title: "Saved",
      icon: "success"
    })

  },


  // =========================================================
  // 数据管理 · 备份 / 恢复
  // =========================================================

  // -------------------------------------------------------
  // 备份默认值（collect / restore 共用，缺字段时补齐）
  // -------------------------------------------------------

  getBackupDefaults: function () {

    return {

      courses: [],

      history: [],

      learningHistory: [],

      todoList: {},

      projects: [],

      notes: [],

      userProfile: {},

      studyTargetMap: {},

      studyPlans: [],

      customStudyTypes: [],

      themeMode: 1

    }

  },


  // -------------------------------------------------------
  // 加载最近一次备份时间
  // -------------------------------------------------------

  loadBackupInfo: function () {

    var lastBackupAt = wx.getStorageSync("lastBackupAt")

    var text = ""

    if (lastBackupAt) {

      var d = new Date(lastBackupAt)

      if (!isNaN(d.getTime())) {

        var y = d.getFullYear()
        var m = d.getMonth() + 1
        var day = d.getDate()
        var h = d.getHours()
        var min = d.getMinutes()

        if (m < 10) m = "0" + m
        if (day < 10) day = "0" + day
        if (h < 10) h = "0" + h
        if (min < 10) min = "0" + min

        text = y + "-" + m + "-" + day + " " + h + ":" + min

      }

    }

    this.setData({

      lastBackupText: text

    })

  },


  // -------------------------------------------------------
  // 导出数据（复制到剪贴板）
  // -------------------------------------------------------

  exportData: function () {

    var backup = this.collectBackupData()

    var json = ""

    try {

      json = JSON.stringify(backup)

    } catch (e) {

      wx.showToast({

        title: "Backup failed",

        icon: "none"

      })

      return

    }

    var that = this

    wx.setClipboardData({

      data: json,

      success: function () {

        wx.setStorageSync("lastBackupAt", Date.now())

        that.loadBackupInfo()

        wx.showModal({

          title: "Backup complete",

          content: "All data copied to clipboard. Save it somewhere safe.",

          showCancel: false,

          confirmText: "OK"

        })

      },

      fail: function () {

        wx.showToast({

          title: "Copy failed, try again",

          icon: "none"

        })

      }

    })

  },


  // -------------------------------------------------------
  // 收集全部业务数据
  // -------------------------------------------------------

  collectBackupData: function () {

    var defaults = this.getBackupDefaults()

    var data = {}

    var fixedKeys = [
      "courses",
      "history",
      "learningHistory",
      "todoList",
      "projects",
      "notes",
      "userProfile",
      "studyTargetMap",
      "studyPlans",
      "customStudyTypes",
      "themeMode"
    ]

    for (var i = 0; i < fixedKeys.length; i++) {

      var key = fixedKeys[i]

      var value = wx.getStorageSync(key)

      if (value === "" || value === undefined || value === null) {

        value = defaults[key]

      }

      data[key] = value

    }


    // 动态 key：homework_{courseId} / homeworkEvaluation_{courseId}
    var homework = {}
    var homeworkEvaluation = {}

    var info = wx.getStorageInfoSync()

    var keys = (info && info.keys) || []

    for (var k = 0; k < keys.length; k++) {

      var storageKey = keys[k]

      if (storageKey.indexOf("homeworkEvaluation_") === 0) {

        homeworkEvaluation[
          storageKey.substring("homeworkEvaluation_".length)
        ] = wx.getStorageSync(storageKey)

      } else if (storageKey.indexOf("homework_") === 0) {

        homework[
          storageKey.substring("homework_".length)
        ] = wx.getStorageSync(storageKey)

      }

    }

    data.homework = homework
    data.homeworkEvaluation = homeworkEvaluation

    return {

      version: 1,

      app: "XUNO",

      exportedAt: new Date().toISOString(),

      data: data

    }

  },


  // -------------------------------------------------------
  // 打开导入面板
  // -------------------------------------------------------

  openImport: function () {

    this.setData({

      showImport: true,

      importText: ""

    })

  },


  // -------------------------------------------------------
  // 关闭导入面板
  // -------------------------------------------------------

  closeImport: function () {

    this.setData({

      showImport: false

    })

  },


  // -------------------------------------------------------
  // 输入备份内容
  // -------------------------------------------------------

  inputImport: function (e) {

    this.setData({

      importText: e.detail.value

    })

  },


  // -------------------------------------------------------
  // 校验并确认恢复
  // -------------------------------------------------------

  confirmImport: function () {

    var text = (this.data.importText || "").trim()

    if (!text) {

      wx.showToast({

        title: "Paste the backup content",

        icon: "none"

      })

      return

    }

    var backup = null

    try {

      backup = JSON.parse(text)

    } catch (e) {

      wx.showToast({

        title: "Invalid backup format",

        icon: "none"

      })

      return

    }

    if (
      !backup ||
      backup.version !== 1 ||
      (backup.app !== "炫记" && backup.app !== "XUNO") ||
      !backup.data ||
      typeof backup.data !== "object"
    ) {

      wx.showToast({

        title: "Unsupported backup file",

        icon: "none"

      })

      return

    }

    var that = this

    wx.showModal({

      title: "Restore Data?",

      content: "Restoring will overwrite all current data. Continue?",

      confirmText: "Restore",

      cancelText: "Cancel",

      success: function (res) {

        if (res.confirm) {

          that.doRestore(backup)

        }

      }

    })

  },


  // -------------------------------------------------------
  // 执行恢复
  // -------------------------------------------------------

  doRestore: function (backup) {

    var data = backup.data || {}

    var defaults = this.getBackupDefaults()

    var fixedKeys = [
      "courses",
      "history",
      "learningHistory",
      "todoList",
      "projects",
      "notes",
      "userProfile",
      "studyTargetMap",
      "studyPlans",
      "customStudyTypes",
      "themeMode"
    ]

    try {

      // 1. 写入固定业务 key
      for (var i = 0; i < fixedKeys.length; i++) {

        var key = fixedKeys[i]

        var value = data[key]

        if (value === undefined || value === null) {

          value = defaults[key]

        }

        wx.setStorageSync(key, value)

      }


      // 2. 清空现有动态 key（homework_* / homeworkEvaluation_*）
      var info = wx.getStorageInfoSync()

      var keys = (info && info.keys) || []

      for (var k = 0; k < keys.length; k++) {

        var storageKey = keys[k]

        if (
          storageKey.indexOf("homework_") === 0 ||
          storageKey.indexOf("homeworkEvaluation_") === 0
        ) {

          wx.removeStorageSync(storageKey)

        }

      }


      // 3. 写入备份中的动态 key
      var homework = data.homework || {}

      for (var cid in homework) {

        if (homework.hasOwnProperty(cid)) {

          wx.setStorageSync("homework_" + cid, homework[cid])

        }

      }

      var homeworkEvaluation = data.homeworkEvaluation || {}

      for (var eid in homeworkEvaluation) {

        if (homeworkEvaluation.hasOwnProperty(eid)) {

          wx.setStorageSync("homeworkEvaluation_" + eid, homeworkEvaluation[eid])

        }

      }

    } catch (e) {

      wx.showToast({

        title: "Restore failed, data may be incomplete",

        icon: "none"

      })

      return

    }


    // 重新应用主题
    var app = getApp()

    if (app && typeof app.applyTheme === "function") {

      app.applyTheme(Number(wx.getStorageSync("themeMode") || 1))

    }

    this.syncTheme()

    this.setData({

      showImport: false

    })

    wx.showModal({

      title: "Restore complete",

      content: "Data restored. Reopen pages to view.",

      showCancel: false,

      confirmText: "OK"

    })

  },


  // -------------------------------------------------------
  // 阻止冒泡（导入面板）
  // -------------------------------------------------------

  noop: function () {},


  // =========================================================
  // 清理缓存
  // =========================================================

  clearCache: function () {

    wx.showModal({

      title: "Clear Cache",

      content:
        "Clear temporary cache? Courses, students, and records will be kept.",

      confirmText: "Clear",

      cancelText: "Cancel",

      success: function (res) {

        if (res.confirm) {

          wx.showToast({

            title: "Cache cleared",

            icon: "success"

          })

        }

      }

    })

  },


  // =========================================================
  // 关于
  // =========================================================

  goAbout: function () {

    wx.showModal({

      title: "About XUNO",

      content:
        "XUNO\n\n" +
        "Personal Work & Study Assistant\n\n" +
        "Version 1.0.0\n\n" +
        "Ocean University of China · 2026 Summer · Mobile Software Development",

      showCancel: false,

      confirmText: "OK"

    })

  }

})