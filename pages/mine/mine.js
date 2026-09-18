var common = require("../../utils/common.js")

Page({

  data: {

    themeClass: "theme-1",

    courseCount: 0,
    studentCount: 0,
    recordCount: 0,

    hasUnwrittenFeedback: false

  },

  onLoad: function () {

    this.syncTheme()

  },

  onShow: function () {

    this.syncTheme()

    if (wx.hideHomeButton) {
      wx.hideHomeButton()
    }

    this.loadData()

    // 每次进入“我的”页面都重新检查反馈
    this.updateFeedbackBadge()

  },

  // =========================================================
  // 统一主题管理
  // =========================================================

  syncTheme: function () {

    var app = getApp()

    var themeMode = 1

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

    if (
      !app ||
      !app.globalData ||
      !app.globalData.themes ||
      !app.globalData.themes[themeMode]
    ) {

      themeMode = 1

    }

    this.setData({

      themeClass:
        themeMode === 2
          ? "theme-2"
          : "theme-1"

    })

    if (
      app &&
      typeof app.applyTheme === "function"
    ) {

      app.applyTheme(themeMode)

    }

  },

  // =========================================================
  // 加载“我的”页面数据
  // =========================================================

  loadData: function () {

    var courses =
      wx.getStorageSync("courses") || []

    var history =
      wx.getStorageSync("history") || []


    // =====================================================
    // 统计实际学生人数
    //
    // 不再使用 students 数据。
    // 直接根据当前课程中的学生进行统计。
    //
    // 同一个学生有多节课程：
    // 只计算 1 人。
    //
    // 已取消课程：
    // 不参与学生人数统计。
    // =====================================================

    var studentMap = {}

    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      var course =
        courses[i]

      if (!course) {
        continue
      }

      // 已取消课程不计算
      if (
        course.status === "已取消"
      ) {
        continue
      }

      var studentName =
        course.student

      if (
        studentName === undefined ||
        studentName === null
      ) {
        continue
      }

      studentName =
        String(studentName)
          .replace(/\s+/g, "")
          .trim()

      if (!studentName) {
        continue
      }

      studentMap[
        studentName
      ] = true

    }


    // =====================================================
    // 得到实际学生数量
    // =====================================================

    var studentCount = 0

    for (
      var studentKey in studentMap
    ) {

      if (
        studentMap.hasOwnProperty(
          studentKey
        )
      ) {

        studentCount++

      }

    }


    // =====================================================
    // 统计真正的反馈数量
    //
    // 只统计：
    // record.type === "feedback"
    //
    // 不再统计：
    // 其他 history 数据
    // 作业评价
    // =====================================================

    var feedbackMap = {}

    for (
      var h = 0;
      h < history.length;
      h++
    ) {

      var record =
        history[h]

      if (!record) {
        continue
      }

      // 只统计真正的反馈记录
      if (
        record.type !== "feedback"
      ) {
        continue
      }


      // =================================================
      // 如果有课程 ID：
      // 同一节课程只算一条反馈
      // =================================================

      var courseId =
        record.courseId

      if (
        courseId !== undefined &&
        courseId !== null &&
        String(courseId).trim() !== ""
      ) {

        feedbackMap[
          String(courseId)
        ] = true

      } else {

        // 没有 courseId 的旧反馈记录
        // 使用自身 id 统计
        var recordId =
          record.id

        if (
          recordId !== undefined &&
          recordId !== null &&
          String(recordId).trim() !== ""
        ) {

          feedbackMap[
            "record_" +
            String(recordId)
          ] = true

        }

      }

    }


    // =====================================================
    // 得到反馈数量
    // =====================================================

    var feedbackCount = 0

    for (
      var feedbackKey in feedbackMap
    ) {

      if (
        feedbackMap.hasOwnProperty(
          feedbackKey
        )
      ) {

        feedbackCount++

      }

    }


    // =====================================================
    // 更新页面数据
    // =====================================================

    this.setData({

      // 当前课程数量
      courseCount:
        courses.length,

      // 实际学生数量
      studentCount:
        studentCount,

      // 真正保存的反馈数量
      recordCount:
        feedbackCount

    })

  },

  // =========================================================
  // 获取今天日期
  // =========================================================

  getToday: function () {

    var date =
      new Date()

    var year =
      date.getFullYear()

    var month =
      date.getMonth() + 1

    var day =
      date.getDate()

    if (
      month < 10
    ) {

      month =
        "0" + month

    }

    if (
      day < 10
    ) {

      day =
        "0" + day

    }

    return (
      year +
      "-" +
      month +
      "-" +
      day
    )

  },

  // =========================================================
  // 更新反馈红点
  // =========================================================

  updateFeedbackBadge: function () {

    var courses =
      wx.getStorageSync(
        "courses"
      ) || []

    var history =
      wx.getStorageSync(
        "history"
      ) || []

    var hasUnwrittenFeedback =
      common.checkUnwrittenFeedback(
        courses,
        history
      )

    this.setData({

      hasUnwrittenFeedback:
        hasUnwrittenFeedback

    })

  },

  // =========================================================
  // 主页面：日程
  // 不保留历史栈
  // =========================================================

  goCalendar: function () {

    wx.reLaunch({

      url:
        "/pages/calendar/calendar"

    })

  },

  goTeachingHistory: function () {

    wx.navigateTo({

      url:
        "/pages/teachingHistory/teachingHistory"

    })

  },

  goHistory: function () {

    wx.navigateTo({

      url:
        "/pages/history/history"

    })

  },

  goProjects: function () {

    wx.navigateTo({

      url:
        "/pages/projects/projects"

    })

  },

  goNotes: function () {

    wx.navigateTo({

      url:
        "/pages/notes/notes"

    })

  },

  goTodo: function () {

    wx.navigateTo({

      url:
        "/pages/todo/todo?view=all"

    })

  },

  goTimeline: function () {

    wx.navigateTo({

      url:
        "/pages/timeline/timeline"

    })

  },

  goStatistics: function () {

    wx.reLaunch({

      url:
        "/pages/statistics/statistics"

    })

  },

  // =========================================================
  // 反馈（二级页面）
  // 进入待反馈课程列表
  // =========================================================

  goFeedback: function () {

    wx.navigateTo({

      url:
        "/pages/feedbackList/feedbackList"

    })

  },

  // =========================================================
  // 新建课程
  // =========================================================

  goCreate: function () {

    wx.setStorageSync(
      "createCourseReturnPage",
      "/pages/mine/mine"
    )

    wx.navigateTo({

      url:
        "/pages/create/create"

    })

  },

  goSettings: function () {

    wx.navigateTo({

      url:
        "/pages/settings/settings"

    })

  },

  // =========================================================
  // 主页面：首页
  // 不保留历史栈
  // =========================================================

  goHome: function () {

    wx.reLaunch({

      url:
        "/pages/index/index"

    })

  }

})