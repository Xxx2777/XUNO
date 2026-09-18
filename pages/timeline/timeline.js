// pages/timeline/timeline.js
// 时间线：从现有数据实时计算活动流

var common = require("../../utils/common.js")

var timelineUtil = require("../../utils/timeline.js")


Page({

  data: {
    themeClass: "theme-1",

    timelineGroups: [],
    hasTimeline: false,

    filterOptions: ["All", "Learning", "Teaching", "Tasks", "Notes"],
    filterValues: ["全部", "学习", "教学", "任务", "笔记"],
    filter: "全部"
  },

  onLoad: function () {
    this.syncTheme()
    this.loadTimeline()
  },

  onShow: function () {
    this.syncTheme()
    this.loadTimeline()
  },

  syncTheme: function () {
    common.syncTheme(this)
  },

  // =========================
  // 加载时间线
  // =========================
  loadTimeline: function () {
    var courses = wx.getStorageSync("courses") || []
    var todoData = wx.getStorageSync("todoList") || {}
    var learningHistory = wx.getStorageSync("learningHistory") || []
    var notes = wx.getStorageSync("notes") || []
    var history = wx.getStorageSync("history") || []
    var projects = wx.getStorageSync("projects") || []

    var items = timelineUtil.buildTimelineData({
      courses: courses,
      todoList: todoData,
      learningHistory: learningHistory,
      notes: notes,
      history: history,
      projects: projects
    })

    // 筛选
    var filter = this.data.filter

    if (filter === "学习") {
      items = items.filter(function (i) { return i.type === "learning" })
    } else if (filter === "教学") {
      items = items.filter(function (i) {
        return i.type === "course_done" || i.type === "feedback_done"
      })
    } else if (filter === "任务") {
      items = items.filter(function (i) { return i.type === "task_done" })
    } else if (filter === "笔记") {
      items = items.filter(function (i) { return i.type === "note" })
    }

    // 项目名映射
    var projectNameMap = {}
    projects.forEach(function (p) {
      projectNameMap[p.id] = p.name
    })

    // 注入类型中文名 + 项目名
    items.forEach(function (item) {
      item.typeText = timelineUtil.getTimelineTypeText(item.type)
      item.projectName =
        (item.projectId && projectNameMap[item.projectId])
          ? projectNameMap[item.projectId]
          : ""
    })

    // 按日期分组
    var groups = []
    var currentDate = ""
    var currentGroup = null

    items.forEach(function (item) {
      if (item.date !== currentDate) {
        currentDate = item.date
        currentGroup = {
          date: item.date,
          dateText: timelineUtil.formatTimelineDate(item.date),
          items: []
        }
        groups.push(currentGroup)
      }
      currentGroup.items.push(item)
    })

    this.setData({
      timelineGroups: groups,
      hasTimeline: items.length > 0
    })
  },

  // =========================
  // 筛选
  // =========================
  changeFilter: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var filter = this.data.filterValues[index] || "全部"
    this.setData({ filter: filter })
    this.loadTimeline()
  },

  // =========================
  // 点击事件（第一版只支持笔记）
  // =========================
  openItem: function (e) {
    var type = e.currentTarget.dataset.type
    var sourceId = e.currentTarget.dataset.sourceId

    if (type === "learning" && sourceId) {
      wx.setStorageSync("selectedLearningId", sourceId)
      wx.navigateTo({
        url: "/pages/learningDetail/learningDetail"
      })
      return
    }

    if (type === "note" && sourceId) {
      wx.setStorageSync("selectedNoteId", sourceId)
      wx.navigateTo({
        url: "/pages/noteDetail/noteDetail"
      })
    }

    if (type === "task_done" && sourceId) {
      wx.setStorageSync("selectedTaskId", sourceId)
      wx.navigateTo({
        url: "/pages/taskDetail/taskDetail"
      })
      return
    }

    if (type === "course_done" && sourceId) {
      wx.setStorageSync("selectedCourseId", sourceId)
      wx.navigateTo({
        url: "/pages/courseDetail/courseDetail"
      })
      return
    }
  },

  goBack: function () {
    wx.navigateBack({
      delta: 1
    })
  }

})
