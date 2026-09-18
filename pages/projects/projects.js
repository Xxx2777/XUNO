// pages/projects/projects.js
// 项目列表页：新建 / 编辑 / 删除项目，展示项目基本统计

var common = require("../../utils/common.js")

var projectUtil = require("../../utils/project.js")

var statsUtil = require("../../utils/stats.js")


Page({

  data: {
    themeClass: "theme-1",

    projectList: [],
    hasProjects: false,

    // 编辑面板（新建 / 编辑共用）
    showEditor: false,
    editingId: "",
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
    this.loadProjects()
  },

  onShow: function () {
    this.syncTheme()
    this.loadProjects()
  },

  syncTheme: function () {
    common.syncTheme(this)
  },

  // =========================
  // 加载项目列表（含统计）
  // =========================
  loadProjects: function () {
    var projects =
      wx.getStorageSync("projects") || []

    var todoData =
      wx.getStorageSync("todoList") || {}

    var allTasks =
      statsUtil.flattenTodoList(todoData)

    var learningHistory =
      wx.getStorageSync("learningHistory") || []

    var list = projects.map(function (p) {
      var project = projectUtil.normalizeProject(p)

      var stats = projectUtil.getProjectStats(
        project.id,
        allTasks,
        learningHistory
      )

      project.taskTotal = stats.taskTotal
      project.taskDone = stats.taskDone
      project.taskCompletionRate = stats.taskCompletionRate
      project.learningMinutes = stats.learningMinutes
      project.learningCount = stats.learningCount

      project.progressLevel = Math.round(project.progress / 10)

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

      return project
    })

    list.sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0)
    })

    this.setData({
      projectList: list,
      hasProjects: list.length > 0
    })
  },

  // =========================
  // 打开项目详情
  // =========================
  openProject: function (e) {
    var id = e.currentTarget.dataset.id

    wx.setStorageSync("selectedProjectId", id)

    wx.navigateTo({
      url: "/pages/projectDetail/projectDetail"
    })
  },

  // =========================
  // 新建
  // =========================
  openCreate: function () {
    this.setData({
      showEditor: true,
      editingId: "",
      editName: "",
      editDescription: "",
      editTypeIndex: 0,
      editStatusIndex: 0,
      editProgress: 0,
      editStartDate: "",
      editDeadline: ""
    })
  },

  // =========================
  // 编辑
  // =========================
  openEdit: function (e) {
    var id = e.currentTarget.dataset.id

    var project = null
    for (var i = 0; i < this.data.projectList.length; i++) {
      if (String(this.data.projectList[i].id) === String(id)) {
        project = this.data.projectList[i]
        break
      }
    }

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
      editingId: project.id,
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
    this.setData({
      showEditor: false
    })
  },

  noop: function () {},

  // =========================
  // 表单输入
  // =========================
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

  // =========================
  // 保存（新建 / 编辑）
  // =========================
  saveProject: function () {
    var name = (this.data.editName || "").trim()

    if (!name) {
      wx.showToast({
        title: "Enter a project name",
        icon: "none"
      })
      return
    }

    var projects =
      wx.getStorageSync("projects") || []

    var now = Date.now()

    var type =
      this.data.typeValues[this.data.editTypeIndex]

    var status =
      this.data.statusValues[this.data.editStatusIndex]

    if (this.data.editingId) {

      // 编辑：更新现有项目
      for (var i = 0; i < projects.length; i++) {
        if (String(projects[i].id) === String(this.data.editingId)) {
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
      this.loadProjects()

      wx.showToast({ title: "Updated", icon: "success" })

    } else {

      // 新建
      projects.push({
        id: "project_" + now,
        name: name,
        description: this.data.editDescription.trim(),
        type: type,
        status: status,
        progress: this.data.editProgress,
        startDate: this.data.editStartDate,
        deadline: this.data.editDeadline,
        createdAt: now,
        updatedAt: now
      })

      wx.setStorageSync("projects", projects)

      this.setData({ showEditor: false })
      this.loadProjects()

      wx.showToast({ title: "Created", icon: "success" })

    }
  },

  // =========================
  // 删除
  // =========================
  deleteProject: function (e) {
    var id = e.currentTarget.dataset.id

    var project = null
    for (var i = 0; i < this.data.projectList.length; i++) {
      if (String(this.data.projectList[i].id) === String(id)) {
        project = this.data.projectList[i]
        break
      }
    }

    if (!project) {
      return
    }

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

        projectUtil.deleteProjectCascade(id)

        that.loadProjects()

        wx.showToast({ title: "Deleted", icon: "success" })
      }
    })
  },

  goBack: function () {
    wx.navigateBack({
      delta: 1
    })
  }

})
