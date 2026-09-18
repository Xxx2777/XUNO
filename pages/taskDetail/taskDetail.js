var common = require("../../utils/common.js")

var taskUtil = require("../../utils/task.js")


Page({

  data: {

    themeClass: "theme-1",

    hasTask: false,
    task: null,
    taskDate: "",

    isEditing: false,
    editName: "",
    editDescription: "",
    editPriority: "",
    editDeadline: "",
    editProjectIndex: 0,
    editTagsText: "",

    projectPickerList: ["No Project"],
    projectIdList: [""],
    priorityOptions: ["高", "中", "低"]

  },


  // =========================================================
  // 生命周期
  // =========================================================

  onLoad: function () {
    this.syncTheme()
    this.loadProjects()
  },

  onShow: function () {
    this.syncTheme()
    this.loadProjects()
    this.loadTask()
  },

  syncTheme: function () {
    common.syncTheme(this)
  },


  // =========================================================
  // 加载项目列表（供编辑选择）
  // =========================================================

  loadProjects: function () {

    var projects = wx.getStorageSync("projects") || []

    var pickerList = ["No Project"]
    var idList = [""]

    for (var i = 0; i < projects.length; i++) {
      pickerList.push(projects[i].name || "Unnamed Project")
      idList.push(projects[i].id)
    }

    this.setData({
      projectPickerList: pickerList,
      projectIdList: idList
    })

  },


  // =========================================================
  // 根据 selectedTaskId 从 todoList 所有日期中查找任务
  // =========================================================

  loadTask: function () {

    var taskId = wx.getStorageSync("selectedTaskId")

    if (!taskId) {
      this.setData({ hasTask: false, task: null })
      return
    }

    var todoList = wx.getStorageSync("todoList") || {}

    var found = taskUtil.findTaskById(todoList, taskId)

    if (!found) {
      this.setData({ hasTask: false, task: null })
      return
    }

    var task = taskUtil.normalizeTask(found.task, found.date)

    // 注入展示字段
    task.displayDeadline = this.formatDeadline(task.deadline)
    task.displayCreated = this.formatCreated(task.createdAt)
    task.projectName = this.getProjectName(task.projectId)

    if (task.priority === "高") {
      task.priorityClass = "high"
      task.priorityText = "High"
    } else if (task.priority === "中") {
      task.priorityClass = "medium"
      task.priorityText = "Medium"
    } else if (task.priority === "低") {
      task.priorityClass = "low"
      task.priorityText = "Low"
    } else {
      task.priorityClass = ""
      task.priorityText = ""
    }

    this.setData({
      hasTask: true,
      task: task,
      taskDate: found.date
    })

  },


  // =========================================================
  // 截止时间展示：兼容 "YYYY-MM-DD" 与 "YYYY-MM-DD HH:mm"
  // =========================================================

  formatDeadline: function (deadline) {

    if (!deadline) {
      return ""
    }

    var raw = String(deadline).trim()

    var datePart = raw.substring(0, 10)
    var rest = raw.substring(10).replace(/^[T\s]+/, "").trim()

    var parts = datePart.split("-")

    if (parts.length !== 3) {
      return raw
    }

    var text = Number(parts[1]) + "/" + Number(parts[2])

    if (rest) {
      text += " " + rest
    }

    return text

  },


  // =========================================================
  // 创建时间展示
  // =========================================================

  formatCreated: function (createdAt) {

    var ts = Number(createdAt)

    if (!ts) {
      return ""
    }

    var d = new Date(ts)

    var y = d.getFullYear()
    var m = d.getMonth() + 1
    var day = d.getDate()

    if (m < 10) m = "0" + m
    if (day < 10) day = "0" + day

    return y + "-" + m + "-" + day

  },


  // =========================================================
  // 项目名
  // =========================================================

  getProjectName: function (projectId) {

    if (!projectId) {
      return ""
    }

    var projects = wx.getStorageSync("projects") || []

    for (var i = 0; i < projects.length; i++) {
      if (String(projects[i].id) === String(projectId)) {
        return projects[i].name || ""
      }
    }

    return ""

  },


  // =========================================================
  // 编辑
  // =========================================================

  openEdit: function () {

    var task = this.data.task

    if (!task) {
      return
    }

    var projectIndex = 0
    var pid = task.projectId || ""
    var idList = this.data.projectIdList

    for (var i = 0; i < idList.length; i++) {
      if (String(idList[i]) === String(pid)) {
        projectIndex = i
        break
      }
    }

    this.setData({
      isEditing: true,
      editName: task.text,
      editDescription: task.description || "",
      editPriority: task.priority || "",
      editDeadline: task.deadline || "",
      editProjectIndex: projectIndex,
      editTagsText: (task.tags || []).join(",")
    })

  },

  closeEdit: function () {
    this.setData({ isEditing: false })
  },


  // =========================================================
  // 编辑字段输入
  // =========================================================

  inputName: function (e) {
    this.setData({ editName: e.detail.value })
  },

  inputDescription: function (e) {
    this.setData({ editDescription: e.detail.value })
  },

  inputTags: function (e) {
    this.setData({ editTagsText: e.detail.value })
  },

  changeDeadline: function (e) {
    this.setData({ editDeadline: e.detail.value })
  },

  clearDeadline: function () {
    this.setData({ editDeadline: "" })
  },

  changeProject: function (e) {
    this.setData({ editProjectIndex: Number(e.detail.value) })
  },

  selectPriority: function (e) {
    this.setData({ editPriority: e.currentTarget.dataset.value })
  },

  clearPriority: function () {
    this.setData({ editPriority: "" })
  },


  // =========================================================
  // 保存任务（局部更新，保留 todoList 日期 Map 与其它任务）
  // =========================================================

  saveTask: function () {

    var name = (this.data.editName || "").trim()

    if (!name) {
      wx.showToast({ title: "Enter a task name", icon: "none" })
      return
    }

    var todoList = wx.getStorageSync("todoList") || {}
    var taskDate = this.data.taskDate
    var taskId = this.data.task.id

    var tasks = todoList[taskDate]

    if (!Array.isArray(tasks)) {
      wx.showToast({ title: "Task data error", icon: "none" })
      return
    }

    for (var i = 0; i < tasks.length; i++) {

      if (String(tasks[i].id) !== String(taskId)) {
        continue
      }

      tasks[i].text = name
      tasks[i].description = this.data.editDescription.trim()
      tasks[i].priority = this.data.editPriority
      tasks[i].deadline = this.data.editDeadline
      tasks[i].projectId = this.data.projectIdList[this.data.editProjectIndex] || ""

      // 标签：通过 parseTags 统一转换
      tasks[i].tags = taskUtil.parseTags(this.data.editTagsText)

      break

    }

    todoList[taskDate] = tasks
    wx.setStorageSync("todoList", todoList)

    this.setData({ isEditing: false })
    this.loadTask()

    wx.showToast({ title: "Saved", icon: "success" })

  },


  // =========================================================
  // 完成 / 取消完成
  // =========================================================

  toggleCompleted: function () {

    var task = this.data.task

    if (!task) {
      return
    }

    var todoList = wx.getStorageSync("todoList") || {}
    var taskDate = this.data.taskDate
    var taskId = task.id

    var tasks = todoList[taskDate]

    if (!Array.isArray(tasks)) {
      return
    }

    for (var i = 0; i < tasks.length; i++) {

      if (String(tasks[i].id) !== String(taskId)) {
        continue
      }

      tasks[i].completed = !tasks[i].completed

      if (tasks[i].completed) {
        tasks[i].completedAt = Date.now()
      } else {
        delete tasks[i].completedAt
      }

      break

    }

    todoList[taskDate] = tasks
    wx.setStorageSync("todoList", todoList)

    this.loadTask()

  },


  // =========================================================
  // 删除任务（二次确认，不影响项目/学习/课程/笔记）
  // =========================================================

  deleteTask: function () {

    var that = this

    wx.showModal({
      title: "Delete Task",
      content: "Delete this task?",
      confirmText: "Delete",
      cancelText: "Cancel",
      success: function (res) {

        if (!res.confirm) {
          return
        }

        var todoList = wx.getStorageSync("todoList") || {}
        var taskDate = that.data.taskDate
        var taskId = that.data.task.id

        var tasks = todoList[taskDate]

        if (!Array.isArray(tasks)) {
          return
        }

        var newTasks = []

        for (var i = 0; i < tasks.length; i++) {
          if (String(tasks[i].id) !== String(taskId)) {
            newTasks.push(tasks[i])
          }
        }

        todoList[taskDate] = newTasks
        wx.setStorageSync("todoList", todoList)

        wx.removeStorageSync("selectedTaskId")

        wx.navigateBack({ delta: 1 })

      }
    })

  }

})
