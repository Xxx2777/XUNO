// pages/notes/notes.js
// 笔记列表页：搜索 / 类型筛选 / 新建 / 查看

var common = require("../../utils/common.js")

var noteUtil = require("../../utils/note.js")


Page({

  data: {
    themeClass: "theme-1",

    noteList: [],
    hasNotes: false,

    // 搜索
    keyword: "",

    // 类型筛选
    typeOptions: ["All", "Learning", "Lesson Prep", "Work", "Ideas", "Other"],
    typeValues: ["全部", "学习", "备课", "工作", "灵感", "其他"],
    typeFilter: "全部"
  },

  onLoad: function () {
    this.syncTheme()
    this.loadNotes()
  },

  onShow: function () {
    this.syncTheme()
    this.loadNotes()
  },

  syncTheme: function () {
    common.syncTheme(this)
  },

  // =========================
  // 加载笔记（normalize → 筛选 → 排序）
  // =========================
  loadNotes: function () {
    var notes = wx.getStorageSync("notes") || []

    var keyword = (this.data.keyword || "").trim().toLowerCase()
    var typeFilter = this.data.typeFilter

    // 归一化
    var list = notes.map(function (n) {
      return noteUtil.normalizeNote(n)
    })

    // 类型筛选
    if (typeFilter !== "全部") {
      list = list.filter(function (n) {
        return n.type === typeFilter
      })
    }

    // 搜索（标题 + 正文）
    if (keyword) {
      list = list.filter(function (n) {
        return (
          (n.title || "").toLowerCase().indexOf(keyword) !== -1 ||
          (n.content || "").toLowerCase().indexOf(keyword) !== -1
        )
      })
    }

    // 按更新时间倒序
    list.sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0)
    })

    // 注入项目名 + 摘要 + 时间
    var projects = wx.getStorageSync("projects") || []
    var projectNameMap = {}
    projects.forEach(function (p) {
      projectNameMap[p.id] = p.name
    })

    list.forEach(function (n) {
      n.projectName =
        (n.projectId && projectNameMap[n.projectId])
          ? projectNameMap[n.projectId]
          : ""

      var noteTypeMap = { "学习": "Learning", "备课": "Lesson Prep", "工作": "Work", "灵感": "Ideas", "其他": "Other" }
      n.typeText = noteTypeMap[n.type] || n.type || ""

      n.summary = this.getSummary(n.content)

      n.displayTime = noteUtil.formatNoteTime(n.updatedAt)
    }.bind(this))

    this.setData({
      noteList: list,
      hasNotes: list.length > 0
    })
  },

  // =========================
  // 摘要（正文前 60 字）
  // =========================
  getSummary: function (content) {
    var text = (content || "").replace(/\s+/g, " ").trim()
    if (text.length > 60) {
      return text.substring(0, 60) + "…"
    }
    return text
  },

  // =========================
  // 搜索
  // =========================
  inputKeyword: function (e) {
    this.setData({ keyword: e.detail.value })
    this.loadNotes()
  },

  clearKeyword: function () {
    this.setData({ keyword: "" })
    this.loadNotes()
  },

  // =========================
  // 类型筛选
  // =========================
  changeTypeFilter: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var type = this.data.typeValues[index] || "全部"
    this.setData({ typeFilter: type })
    this.loadNotes()
  },

  // =========================
  // 新建 / 查看
  // =========================
  openCreate: function () {
    wx.removeStorageSync("selectedNoteId")
    wx.navigateTo({
      url: "/pages/noteDetail/noteDetail"
    })
  },

  openNote: function (e) {
    var id = e.currentTarget.dataset.id
    wx.setStorageSync("selectedNoteId", id)
    wx.navigateTo({
      url: "/pages/noteDetail/noteDetail"
    })
  },

  goBack: function () {
    wx.navigateBack({
      delta: 1
    })
  }

})
