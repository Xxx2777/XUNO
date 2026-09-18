var common = require("../../utils/common.js")

var statsUtil = require("../../utils/stats.js")


Page({

  data: {

    themeClass: "theme-1",

    // 时间范围
    period: "week",
    periodText: "This Week",

    // Hero（顶部核心指标）
    heroText: "0m",
    heroCompareText: "",
    heroCompareClass: "flat",

    // What Changed
    prevPeriodText: "last week",
    compareList: [],

    // Learning
    learningTotalMinutes: 0,
    learningTrend: [],
    learningTypeList: [],
    averageDailyMinutes: 0,
    showAverageDaily: false,
    hasLearningData: false,

    // Teaching
    teachingTotal: 0,
    teachingCompletionRate: 0,
    teachingCompletionLevel: 0,
    teachingSegments: [],
    feedbackPending: 0,
    feedbackExpected: 0,
    hasTeachingData: false,

    // Tasks
    taskCompleted: 0,
    taskRemaining: 0,
    taskOverdue: 0,
    taskTrend: [],
    taskPriorityHigh: 0,
    taskPriorityMedium: 0,
    taskPriorityLow: 0,
    hasTaskData: false,

    // 底部摘要
    projectActive: 0,
    noteTotal: 0,

    updateTime: ""

  },


  // =========================================================
  // 同步统一主题
  // =========================================================

  syncTheme: function () {
    common.syncTheme(this)
  },


  onShow: function () {

    this.syncTheme()
    this.loadStatistics()

  },


  // =========================================================
  // 切换时间范围
  // =========================================================

  changePeriod: function () {

    var that = this

    wx.showActionSheet({

      itemList: [
        "Today",
        "This Week",
        "This Month"
      ],

      success: function (res) {

        var index = res.tapIndex

        var period = "week"
        var periodText = "This Week"

        if (index === 0) {
          period = "today"
          periodText = "Today"
        } else if (index === 1) {
          period = "week"
          periodText = "This Week"
        } else {
          period = "month"
          periodText = "This Month"
        }

        that.setData({
          period: period,
          periodText: periodText
        })

        that.loadStatistics()

      }

    })

  },


  // =========================================================
  // 百分比 → 0~10 档（class-based 进度 / 柱状高度）
  // =========================================================

  toLevel: function (value) {

    var v = Math.max(0, Math.min(100, Number(value) || 0))

    return Math.round(v / 10)

  },


  // =========================================================
  // 分钟 → "Xh Ym" / "Xm"
  // =========================================================

  formatDuration: function (minutes) {

    var m = Math.round(Number(minutes) || 0)

    if (m <= 0) {
      return "0m"
    }

    var h = Math.floor(m / 60)
    var mm = m % 60

    if (h > 0) {
      return h + "h" + (mm > 0 ? " " + mm + "m" : "")
    }

    return mm + "m"

  },


  // =========================================================
  // 上一周期文案
  // =========================================================

  prevPeriodLabel: function (period) {

    if (period === "today") {
      return "yesterday"
    }

    if (period === "week") {
      return "last week"
    }

    return "last month"

  },


  // =========================================================
  // 对比展示：deltaText / deltaClass
  // =========================================================

  formatCompareText: function (metric) {

    if (metric.percent === null) {
      return metric.current > 0 ? "New" : "—"
    }

    if (metric.delta > 0) {
      return "↑ " + metric.percent + "%"
    }

    if (metric.delta < 0) {
      return "↓ " + Math.abs(metric.percent) + "%"
    }

    return "—"

  },


  formatCompareClass: function (metric) {

    if (metric.percent === null || metric.delta === 0) {
      return "flat"
    }

    return metric.delta > 0 ? "up" : "down"

  },


  buildHeroCompare: function (metric, prevText) {

    if (metric.percent === null) {
      return metric.current > 0 ? "New activity" : "No previous data"
    }

    if (metric.delta > 0) {
      return "↑ " + metric.percent + "% from " + prevText
    }

    if (metric.delta < 0) {
      return "↓ " + Math.abs(metric.percent) + "% from " + prevText
    }

    return "No change from " + prevText

  },


  // =========================================================
  // 学习趋势
  //
  // today：当天单柱
  // week：本周 7 天逐日
  // month：按月内周聚合（每 7 天一段），避免 30 根拥挤柱
  // =========================================================

  buildLearningTrend: function (dailyList, period, today) {

    var weekMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    var buckets

    if (period === "month") {

      buckets = []

      for (var i = 0; i < dailyList.length; i += 7) {

        var chunk = dailyList.slice(i, i + 7)
        var minutes = 0

        for (var j = 0; j < chunk.length; j++) {
          minutes += chunk[j].learningMinutes
        }

        buckets.push({
          label: "W" + (buckets.length + 1),
          minutes: minutes,
          isToday: false
        })

      }

    } else {

      buckets = []

      for (var k = 0; k < dailyList.length; k++) {

        var d = dailyList[k]
        var label

        if (period === "today") {
          label = "Today"
        } else {
          label = weekMap[new Date(String(d.date).replace(/-/g, "/")).getDay()]
        }

        buckets.push({
          label: label,
          minutes: d.learningMinutes,
          isToday: d.date === today
        })

      }

    }


    var maxMinutes = 0

    for (var a = 0; a < buckets.length; a++) {
      if (buckets[a].minutes > maxMinutes) {
        maxMinutes = buckets[a].minutes
      }
    }

    for (var b = 0; b < buckets.length; b++) {
      buckets[b].level = maxMinutes > 0
        ? Math.round(buckets[b].minutes / maxMinutes * 10)
        : 0
    }

    return buckets

  },


  // =========================================================
  // 任务节奏：近 7 天每日完成任务数
  // =========================================================

  buildTaskTrend: function (dailyList, today) {

    var weekMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    var list = []

    var maxCount = 0

    for (var i = 0; i < dailyList.length; i++) {
      if (dailyList[i].taskCompleted > maxCount) {
        maxCount = dailyList[i].taskCompleted
      }
    }

    for (var j = 0; j < dailyList.length; j++) {

      var d = dailyList[j]

      list.push({
        label: d.date === today
          ? "Today"
          : weekMap[new Date(String(d.date).replace(/-/g, "/")).getDay()],
        count: d.taskCompleted,
        level: maxCount > 0
          ? Math.round(d.taskCompleted / maxCount * 10)
          : 0,
        isToday: d.date === today
      })

    }

    return list

  },


  // =========================================================
  // 加载统计
  // =========================================================

  loadStatistics: function () {

    var period = this.data.period

    var today = common.getToday()

    var range = statsUtil.getDateRange(period)


    // =====================================================
    // 更新时间
    // =====================================================

    var now = new Date()

    var hour = now.getHours()
    var minute = now.getMinutes()

    if (hour < 10) hour = "0" + hour
    if (minute < 10) minute = "0" + minute

    var updateTime = hour + ":" + minute


    // =====================================================
    // 读取数据
    // =====================================================

    var courses = wx.getStorageSync("courses") || []
    var history = wx.getStorageSync("history") || []
    var learningHistory = wx.getStorageSync("learningHistory") || []
    var todoList = wx.getStorageSync("todoList") || {}
    var projects = wx.getStorageSync("projects") || []
    var notes = wx.getStorageSync("notes") || []


    // =====================================================
    // 五大模块汇总
    // =====================================================

    var dash = statsUtil.getDashboardStats({
      courses: courses,
      learningHistory: learningHistory,
      todoList: todoList,
      projects: projects,
      notes: notes,
      range: range
    })


    // =====================================================
    // 周期对比（What Changed）
    // =====================================================

    var comp = statsUtil.getComparison(period, {
      courses: courses,
      learningHistory: learningHistory,
      todoList: todoList
    })


    // =====================================================
    // 课后反馈
    // =====================================================

    var feedback = statsUtil.getFeedbackStats(courses, history)

    var feedbackPending = Math.max(
      0,
      feedback.expectedCount - feedback.feedbackCount
    )


    // =====================================================
    // 学习趋势（period 内）
    // =====================================================

    var learningDaily = statsUtil.getDailyStats(
      range.startDate,
      range.endDate,
      {
        courses: courses,
        learningHistory: learningHistory,
        todoList: todoList,
        notes: notes
      }
    )

    var learningTrend = this.buildLearningTrend(
      learningDaily,
      period,
      today
    )


    // =====================================================
    // 任务节奏（近 7 天）
    // =====================================================

    var taskDaily = statsUtil.getDailyStats(
      statsUtil.addDays(today, -6),
      today,
      {
        courses: courses,
        learningHistory: learningHistory,
        todoList: todoList,
        notes: notes
      }
    )

    var taskTrend = this.buildTaskTrend(taskDaily, today)


    // =====================================================
    // 每日平均学习分钟（仅 week / month 有意义）
    // =====================================================

    var showAverageDaily = period !== "today"

    var rangeDays = statsUtil.countDays(range.startDate, range.endDate)

    var averageDailyMinutes = (showAverageDaily && rangeDays > 0)
      ? Math.round(dash.learning.totalMinutes / rangeDays * 10) / 10
      : 0


    // =====================================================
    // 学习类型分布
    // =====================================================

    var typeList = dash.learning.typeList || []

    for (var ti = 0; ti < typeList.length; ti++) {
      typeList[ti].name = common.getStudyTypeText(typeList[ti].name)
      typeList[ti].percentLevel = this.toLevel(typeList[ti].percent)
    }


    // =====================================================
    // 展示层：Hero / What Changed / Teaching 分布
    // =====================================================

    var prevPeriodText = this.prevPeriodLabel(period)

    var heroText = this.formatDuration(dash.learning.totalMinutes)
    var heroCompareText = this.buildHeroCompare(comp.learning, prevPeriodText)
    var heroCompareClass = this.formatCompareClass(comp.learning)

    var compareList = [
      {
        label: "Learning",
        value: this.formatDuration(comp.learning.current),
        deltaText: this.formatCompareText(comp.learning),
        deltaClass: this.formatCompareClass(comp.learning)
      },
      {
        label: "Teaching",
        value: comp.teaching.current + " scheduled",
        deltaText: this.formatCompareText(comp.teaching),
        deltaClass: this.formatCompareClass(comp.teaching)
      },
      {
        label: "Tasks",
        value: comp.tasks.current + " done",
        deltaText: this.formatCompareText(comp.tasks),
        deltaClass: this.formatCompareClass(comp.tasks)
      }
    ]

    var teachingStatuses = [
      { label: "Completed", count: dash.teaching.completed, dot: "dot-completed" },
      { label: "In Progress", count: dash.teaching.inProgress, dot: "dot-running" },
      { label: "Upcoming", count: dash.teaching.pending, dot: "dot-pending" },
      { label: "On Leave", count: dash.teaching.leave, dot: "dot-leave" },
      { label: "Cancelled", count: dash.teaching.cancelled, dot: "dot-cancel" }
    ]

    var teachingSegments = []

    for (var si = 0; si < teachingStatuses.length; si++) {
      var st = teachingStatuses[si]
      teachingSegments.push({
        label: st.label,
        dot: st.dot,
        count: st.count
      })
    }


    // =====================================================
    // 更新页面
    // =====================================================

    this.setData({

      updateTime: updateTime,

      heroText: heroText,
      heroCompareText: heroCompareText,
      heroCompareClass: heroCompareClass,

      prevPeriodText: prevPeriodText,
      compareList: compareList,

      learningTotalMinutes: dash.learning.totalMinutes,
      learningTrend: learningTrend,
      learningTypeList: typeList,
      averageDailyMinutes: averageDailyMinutes,
      showAverageDaily: showAverageDaily,
      hasLearningData: dash.learning.count > 0,

      teachingTotal: dash.teaching.total,
      teachingCompletionRate: dash.teaching.completionRate,
      teachingCompletionLevel: this.toLevel(dash.teaching.completionRate),
      teachingSegments: teachingSegments,
      feedbackPending: feedbackPending,
      feedbackExpected: feedback.expectedCount,
      hasTeachingData: dash.teaching.total > 0,

      taskCompleted: dash.tasks.completed,
      taskRemaining: dash.tasks.remaining,
      taskOverdue: dash.tasks.overdue,
      taskTrend: taskTrend,
      taskPriorityHigh: dash.tasks.priorityHigh,
      taskPriorityMedium: dash.tasks.priorityMedium,
      taskPriorityLow: dash.tasks.priorityLow,
      hasTaskData: dash.tasks.total > 0,

      projectActive: dash.projects.activeCount,
      noteTotal: dash.notes.total

    })

  },


  // =========================================================
  // 跳转待反馈
  // =========================================================

  goFeedback: function () {

    if (this.data.feedbackPending <= 0) {
      return
    }

    wx.navigateTo({
      url: "/pages/feedbackList/feedbackList",
      fail: function () {
        wx.showToast({
          title: "Pending feedback page not found",
          icon: "none"
        })
      }
    })

  },


  // =========================================================
  // 一级 Tab（reLaunch）
  // =========================================================

  goHome: function () {
    wx.reLaunch({ url: "/pages/index/index" })
  },

  goCalendar: function () {
    wx.reLaunch({ url: "/pages/calendar/calendar" })
  },

  goMine: function () {
    wx.reLaunch({ url: "/pages/mine/mine" })
  }

})
