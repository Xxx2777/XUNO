// pages/projectDetail/projectDetail.js
// 项目详情页：项目信息 + 统计 + 关联任务 + 关联学习

var common = require("../../utils/common.js")

var projectUtil = require("../../utils/project.js")

var taskUtil = require("../../utils/task.js")

var statsUtil = require("../../utils/stats.js")

var noteUtil = require("../../utils/note.js")


Page({

  data: {
    themeClass: "theme-1",

    project: null,
    hasProject: false,

    // 统计
    taskTotal: 0,
    taskDone: 0,
    taskCompletionRate: 0,
    learningMinutes: 0,
    learningCount: 0,

    // 关联任务
    taskList: [],
    hasTasks: false,

    // 关联学习
    learningList: [],
    hasLearning: false,

    // 关联笔记
    noteList: [],
    hasNotes: false,

    // 编辑面板
    showEditor: false,
    editName: "",
    editDescription: "",
    editTypeIndex: 0,
    editStatusIndex: 0,
    editProgress: 0,
    editStartDate: "",
    editDeadline: "",

    typeOptions: ["Learning", "Work", "Personal", "Custom"],
    typeValues: ["学习", "工作", "生活", "自定义"],
    statusOptions: ["In Progress", "Completed", "Paused"],
    statusValues: ["进行中", "已完成", "已暂停"]
  },

  onLoad: function () {
    this.syncTheme()
    this.loadData()
  },

  onShow: function () {
    this.syncTheme()
    this.loadData()
  },

  syncTheme: function () {
    common.syncTheme(this)
  },

  // =========================
  // 加载项目详情
  // =========================
  loadData: function () {
    var projectId = wx.getStorageSync("selectedProjectId")

    if (!projectId) {
      this.setData({
        hasProject: false,
        project: null
      })
      return
    }

    var projects = wx.getStorageSync("projects") || []

    var project = null
    for (var i = 0; i < projects.length; i++) {
      if (String(projects[i].id) === String(projectId)) {
        project = projects[i]
        break
      }
    }

    if (!project) {
      this.setData({
        hasProject: false,
        project: null
      })
      return
    }

    project = projectUtil.normalizeProject(project)

    var todoData = wx.getStorageSync("todoList") || {}
    var allTasks = statsUtil.flattenTodoList(todoData)
    var learningHistory = wx.getStorageSync("learningHistory") || []

    var stats = projectUtil.getProjectStats(
      projectId,
      allTasks,
      learningHistory
    )


    // =========================
    // 关联任务
    // =========================
    var projectTasks = allTasks.filter(function (t) {
      return String(t.projectId || "") === String(projectId)
    })

    var taskList = projectTasks.map(function (t) {
      return taskUtil.normalizeTask(t, t.date)
    })

    taskList = taskUtil.sortTasks(taskList)

    var today = common.getToday()

    taskList.forEach(function (item) {
      item.overdue = taskUtil.isTaskOverdue(item, today)

      if (item.priority === "高") {
        item.priorityClass = "high"
      } else if (item.priority === "中") {
        item.priorityClass = "medium"
      } else if (item.priority === "低") {
        item.priorityClass = "low"
      } else {
        item.priorityClass = ""
      }
    })


    // =========================
    // 关联学习（倒序，最近在前）
    // =========================
    var projectLearning = learningHistory.filter(function (l) {
      return String(l.projectId || "") === String(projectId)
    })

    projectLearning.sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""))
    })

    var learningList = projectLearning.slice(0, 10).map(function (l) {
      var item = Object.assign({}, l)
      item.displayDate = common.formatDateText(l.date)
      return item
    })


    // =========================
    // 关联笔记（倒序，最近在前）
    // =========================
    var notes = wx.getStorageSync("notes") || []

    var projectNotes = notes.filter(function (n) {
      return String(n.projectId || "") === String(projectId)
    })

    projectNotes.sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0)
    })

    var noteList = projectNotes.slice(0, 5).map(function (n) {
      var item = noteUtil.normalizeNote(n)
      var text = (item.content || "").replace(/\s+/g, " ").trim()
      item.summary = text.length > 40 ? text.substring(0, 40) + "…" : text
      item.displayTime = noteUtil.formatNoteTime(item.updatedAt)
      return item
    })


    project.progressLevel = Math.round(project.progress / 10)
    project.taskRateLevel = Math.round(stats.taskCompletionRate / 10)

    if (project.status === "已完成") {
      project.statusClass = "done"
      project.statusText = "Completed"
    } else if (project.status === "已暂停") {
      project.statusClass = "paused"
      project.statusText = "Paused"
    } else {
      project.statusClass = "active"
      project.statusText = "In Progress"
    }

    var typeMap = { "学习": "Learning", "工作": "Work", "生活": "Personal", "自定义": "Custom" }
    project.typeText = typeMap[project.type] || project.type || ""

    this.setData({
      project: project,
      hasProject: true,

      taskTotal: stats.taskTotal,
      taskDone: stats.taskDone,
      taskCompletionRate: stats.taskCompletionRate,
      learningMinutes: stats.learningMinutes,
      learningCount: stats.learningCount,

      taskList: taskList,
      hasTasks: taskList.length > 0,

      learningList: learningList,
      hasLearning: learningList.length > 0,

      noteList: noteList,
      hasNotes: noteList.length > 0
    })
  },

  // =========================
  // 任务完成 / 取消完成（复用 todo 页行为）
  // =========================
  toggleTask: function (e) {
    var taskId = e.currentTarget.dataset.id

    var todoData = wx.getStorageSync("todoList") || {}

    var dateKeys = Object.keys(todoData)

    for (var d = 0; d < dateKeys.length; d++) {
      var tasks = todoData[dateKeys[d]]

      if (!Array.isArray(tasks)) {
        continue
      }

      for (var t = 0; t < tasks.length; t++) {
        if (String(tasks[t].id) === String(taskId)) {
          tasks[t].completed = !tasks[t].completed

          if (tasks[t].completed) {
            tasks[t].completedAt = Date.now()
          } else {
            delete tasks[t].completedAt
          }

          wx.setStorageSync("todoList", todoData)

          this.loadData()
          return
        }
      }
    }
  },

  // =========================
  // 编辑项目
  // =========================
  openEdit: function () {
    var project = this.data.project
    if (!project) {
      return
    }

    var typeIndex = this.data.typeValues.indexOf(project.type)
    if (typeIndex < 0) {
      typeIndex = 0
    }

    var statusIndex = this.data.statusValues.indexOf(project.status)
    if (statusIndex < 0) {
      statusIndex = 0
    }

    this.setData({
      showEditor: true,
      editName: project.name,
      editDescription: project.description,
      editTypeIndex: typeIndex,
      editStatusIndex: statusIndex,
      editProgress: project.progress,
      editStartDate: project.startDate,
      editDeadline: project.deadline
    })
  },

  closeEditor: function () {
    this.setData({ showEditor: false })
  },

  noop: function () {},

  inputName: function (e) {
    this.setData({ editName: e.detail.value })
  },

  inputDescription: function (e) {
    this.setData({ editDescription: e.detail.value })
  },

  changeType: function (e) {
    this.setData({ editTypeIndex: Number(e.detail.value) })
  },

  changeStatus: function (e) {
    this.setData({ editStatusIndex: Number(e.detail.value) })
  },

  changeProgress: function (e) {
    this.setData({ editProgress: Number(e.detail.value) })
  },

  changeStartDate: function (e) {
    this.setData({ editStartDate: e.detail.value })
  },

  changeDeadline: function (e) {
    this.setData({ editDeadline: e.detail.value })
  },

  saveProject: function () {
    var name = (this.data.editName || "").trim()

    if (!name) {
      wx.showToast({ title: "Enter a project name", icon: "none" })
      return
    }

    var projectId = wx.getStorageSync("selectedProjectId")
    var projects = wx.getStorageSync("projects") || []

    var now = Date.now()

    var type = this.data.typeValues[this.data.editTypeIndex]
    var status = this.data.statusValues[this.data.editStatusIndex]

    for (var i = 0; i < projects.length; i++) {
      if (String(projects[i].id) === String(projectId)) {
        projects[i].name = name
        projects[i].description = this.data.editDescription.trim()
        projects[i].type = type
        projects[i].status = status
        projects[i].progress = this.data.editProgress
        projects[i].startDate = this.data.editStartDate
        projects[i].deadline = this.data.editDeadline
        projects[i].updatedAt = now
        break
      }
    }

    wx.setStorageSync("projects", projects)

    this.setData({ showEditor: false })
    this.loadData()

    wx.showToast({ title: "Updated", icon: "success" })
  },

  // =========================
  // 删除项目（解除关联，返回列表）
  // =========================
  deleteProject: function () {
    var project = this.data.project
    if (!project) {
      return
    }

    var projectId = project.id

    var that = this

    wx.showModal({
      title: "Delete Project",
      content: "Delete " + project.name + "? Linked tasks and learning records will be kept.",
      confirmText: "Delete",
      cancelText: "Cancel",
      success: function (res) {
        if (!res.confirm) {
          return
        }

        projectUtil.deleteProjectCascade(projectId)

        wx.removeStorageSync("selectedProjectId")

        var pages = getCurrentPages()
        if (pages.length > 1) {
          wx.navigateBack({ delta: 1 })
        } else {
          wx.redirectTo({ url: "/pages/projects/projects" })
        }
      }
    })
  },

  openLearning: function (e) {
    var id = e.currentTarget.dataset.id

    if (!id) {
      return
    }

    wx.setStorageSync("selectedLearningId", id)

    wx.navigateTo({
      url: "/pages/learningDetail/learningDetail"
    })
  },

  openTask: function (e) {
    var id = e.currentTarget.dataset.id

    if (!id) {
      return
    }

    wx.setStorageSync("selectedTaskId", id)

    wx.navigateTo({
      url: "/pages/taskDetail/taskDetail"
    })
  },

  openNote: function (e) {
    var id = e.currentTarget.dataset.id

    wx.setStorageSync("selectedNoteId", id)

    wx.navigateTo({
      url: "/pages/noteDetail/noteDetail"
    })
  },

  // =========================
  // 新建任务（自动关联当前项目）
  // =========================
  goCreateTask: function () {
    var project = this.data.project
    if (!project) {
      return
    }
    wx.setStorageSync("presetProjectId", project.id)
    wx.navigateTo({
      url: "/pages/todo/todo"
    })
  },

  // =========================
  // 记录学习（自动关联当前项目）
  // =========================
  goRecordStudy: function () {
    var project = this.data.project
    if (!project) {
      return
    }
    wx.setStorageSync("presetProjectId", project.id)
    wx.navigateTo({
      url: "/pages/study/study"
    })
  },

  // =========================
  // 新建笔记（自动关联当前项目，进入新建模式）
  // =========================
  goCreateNote: function () {
    var project = this.data.project
    if (!project) {
      return
    }
    wx.setStorageSync("presetProjectId", project.id)
    wx.removeStorageSync("selectedNoteId")
    wx.navigateTo({
      url: "/pages/noteDetail/noteDetail"
    })
  },

  goBack: function () {
    var pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      wx.redirectTo({ url: "/pages/projects/projects" })
    }
  }

})
