var common = require("../../utils/common.js")

var taskUtil = require("../../utils/task.js")

var statsUtil = require("../../utils/stats.js")


Page({
  data: {
    themeClass: "theme-1",

    todayText: "",
    todayKey: "",

    // 视图：today（今日）/ all（全部）
    todoView: "today",

    todoInput: "",
    todoDescription: "",
    todoTags: "",

    // 今日任务（全量，归一化后）
    allTasks: [],
    allCount: 0,
    completedCount: 0,
    remainingCount: 0,
    overdueCount: 0,

    // 渲染列表（搜索 + 筛选 + 排序后）
    displayList: [],
    displayCount: 0,
    hasTodo: false,

    // 搜索与筛选
    searchText: "",
    statusFilter: "all",
    priorityFilter: "all",
    projectFilter: "all",
    deadlineFilter: "all",
    sortType: "default",
    sortText: "Default",
    filterOpen: false,
    filterProjectList: [],

    // 优先级
    priorityOptions: ["High", "Medium", "Low"],
    priorityValues: ["高", "中", "低"],
    selectedPriority: "",
    selectedPriorityText: "",
    priorityOpen: false,

    // 截止日期
    deadline: "",

    // 所属项目
    projectPickerList: ["No Project"],
    projectIdList: [""],
    selectedProjectIndex: 0,

    // 更多选项（高级创建字段）
    showMore: false
  },

  onLoad(options) {
    this.syncTheme()

    // 从 query 读取视图：?view=all 进入全部视图，否则默认今日
    const view = options && options.view
    this.setData({
      todoView: view === "all" ? "all" : "today"
    })

    this.initToday()

    // 从日历指定日期进入时，覆盖为选中日期
    const presetDate = wx.getStorageSync("createTaskDate")
    if (presetDate) {
      wx.removeStorageSync("createTaskDate")
      this.setToday(presetDate)
    }

    this.loadProjects()
    this.loadTodo()
  },

  onShow() {
    this.syncTheme()
    this.loadProjects()
    this.loadTodo()
  },

  // =========================
  // 主题同步（统一到 common）
  // =========================
  syncTheme() {
    common.syncTheme(this)
  },

  initToday() {
    this.setToday(taskUtil.getToday())
  },

  setToday(dateStr) {
    const parts = String(dateStr).split("-")
    const year = Number(parts[0])
    const month = Number(parts[1])
    const day = Number(parts[2])

    const d = new Date(year, month - 1, day)
    const weekList = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ]
    const week = weekList[d.getDay()]

    this.setData({
      todayKey: dateStr,
      todayText: `${monthNames[month - 1]} ${day}, ${year} · ${week}`
    })
  },

  // =========================
  // 加载项目列表（供选择）
  // =========================
  loadProjects() {
    const projects = wx.getStorageSync("projects") || []

    const pickerList = ["No Project"]
    const idList = [""]

    const filterProjectList = []

    projects.forEach(function (p) {
      let label = p.name || "Unnamed Project"
      if (p.status === "已完成") {
        label = label + " (Completed)"
      } else if (p.status === "已暂停") {
        label = label + " (Paused)"
      }
      pickerList.push(label)
      idList.push(p.id)
      filterProjectList.push({ id: p.id, name: p.name || "Unnamed Project" })
    })

    const dataObj = {
      projectPickerList: pickerList,
      projectIdList: idList,
      filterProjectList: filterProjectList
    }

    // 预设项目（从项目详情进入时自动选中，仅设置不重置）
    const presetProjectId = wx.getStorageSync("presetProjectId")

    if (presetProjectId) {
      for (let k = 0; k < idList.length; k++) {
        if (String(idList[k]) === String(presetProjectId)) {
          dataObj.selectedProjectIndex = k
          break
        }
      }
      wx.removeStorageSync("presetProjectId")
    }

    this.setData(dataObj)
  },

  changeProject(e) {
    this.setData({
      selectedProjectIndex: Number(e.detail.value)
    })
  },

  // =========================
  // 加载今日任务
  // =========================
  loadTodo() {
    const today = this.data.todayKey || taskUtil.getToday()

    const allTodo =
      wx.getStorageSync("todoList") || {}

    const todoView = this.data.todoView || "today"

    let list

    if (todoView === "all") {
      // 全部视图：跨日期展开所有任务，保留原始归属日期
      const flat = statsUtil.flattenTodoList(allTodo)

      list = flat.map(function (item) {
        return taskUtil.normalizeTask(item, item.date)
      })
    } else {
      // 今日视图：只读今天
      const todayTodo =
        allTodo[today] || []

      list = todayTodo.map(function (item) {
        return taskUtil.normalizeTask(item, today)
      })
    }

    // 注入视图字段：逾期标记、优先级样式类、项目名
    const projects = wx.getStorageSync("projects") || []
    const projectNameMap = {}
    projects.forEach(function (p) {
      projectNameMap[p.id] = p.name
    })

    list.forEach(function (item) {
      item.overdue = taskUtil.isTaskOverdue(item, today)

      if (item.priority === "高") {
        item.priorityClass = "high"
        item.priorityText = "High"
      } else if (item.priority === "中") {
        item.priorityClass = "medium"
        item.priorityText = "Medium"
      } else if (item.priority === "低") {
        item.priorityClass = "low"
        item.priorityText = "Low"
      } else {
        item.priorityClass = ""
        item.priorityText = ""
      }

      if (item.projectId && projectNameMap[item.projectId]) {
        item.projectName = projectNameMap[item.projectId]
      } else {
        item.projectName = ""
      }
    })

    const summary = taskUtil.getTaskSummary(list, today)

    this.setData({
      allTasks: list,
      allCount: list.length,
      completedCount: summary.completed,
      remainingCount: summary.remaining,
      overdueCount: summary.overdue
    })

    this.applyFilter()
  },

  // =========================
  // 搜索 / 筛选 / 排序
  // =========================
  applyFilter() {
    const today = this.data.todayKey || taskUtil.getToday()

    const filters = {
      keyword: this.data.searchText,
      status: this.data.statusFilter,
      priority: this.data.priorityFilter,
      project: this.data.projectFilter,
      deadline: this.data.deadlineFilter
    }

    const filtered = taskUtil.filterTasks(this.data.allTasks, filters, today)
    const sorted = taskUtil.sortTasksBy(filtered, this.data.sortType, today)

    this.setData({
      displayList: sorted,
      displayCount: sorted.length,
      hasTodo: sorted.length > 0
    })
  },

  inputSearch(e) {
    this.setData({ searchText: e.detail.value })
    this.applyFilter()
  },

  toggleFilter() {
    this.setData({ filterOpen: !this.data.filterOpen })
  },

  selectStatus(e) {
    this.setData({ statusFilter: e.currentTarget.dataset.value })
    this.applyFilter()
  },

  selectPriorityFilter(e) {
    this.setData({ priorityFilter: e.currentTarget.dataset.value })
    this.applyFilter()
  },

  selectProjectFilter(e) {
    this.setData({ projectFilter: e.currentTarget.dataset.value })
    this.applyFilter()
  },

  selectDeadlineFilter(e) {
    this.setData({ deadlineFilter: e.currentTarget.dataset.value })
    this.applyFilter()
  },

  changeSort() {
    const that = this
    const map = ["default", "deadline", "priority", "created"]
    const mapText = ["Default", "Due Date", "Priority", "Created"]

    wx.showActionSheet({
      itemList: ["Default", "Due Date", "Priority", "Created"],
      success(res) {
        const index = res.tapIndex
        that.setData({
          sortType: map[index],
          sortText: mapText[index]
        })
        that.applyFilter()
      }
    })
  },

  switchView(e) {
    const view = e.currentTarget.dataset.view

    if (view !== "today" && view !== "all") {
      return
    }

    this.setData({ todoView: view })
    this.loadTodo()
  },

  toggleMore() {
    this.setData({ showMore: !this.data.showMore })
  },

  inputTodo(e) {
    this.setData({
      todoInput: e.detail.value
    })
  },

  inputDescription(e) {
    this.setData({
      todoDescription: e.detail.value
    })
  },

  inputTags(e) {
    this.setData({
      todoTags: e.detail.value
    })
  },

  // =========================
  // 优先级
  // =========================
  togglePriority() {
    this.setData({
      priorityOpen: !this.data.priorityOpen
    })
  },

  selectPriority(e) {
    const index =
      Number(e.currentTarget.dataset.index)

    const value =
      this.data.priorityValues[index] || ""

    const text =
      this.data.priorityOptions[index] || ""

    this.setData({
      selectedPriority: value,
      selectedPriorityText: text,
      priorityOpen: false
    })
  },

  clearPriority() {
    this.setData({
      selectedPriority: "",
      selectedPriorityText: "",
      priorityOpen: false
    })
  },

  // =========================
  // 截止日期
  // =========================
  changeDeadline(e) {
    this.setData({
      deadline: e.detail.value
    })
  },

  clearDeadline() {
    this.setData({
      deadline: ""
    })
  },

  // =========================
  // 添加任务
  // =========================
  addTodo() {
    const text =
      (this.data.todoInput || "").trim()

    if (!text) {
      wx.showToast({
        title: "Enter a task",
        icon: "none"
      })
      return
    }

    const today =
      this.data.todayKey || taskUtil.getToday()

    const allTodo =
      wx.getStorageSync("todoList") || {}

    const todayList =
      allTodo[today] || []

    const now = Date.now()

    const task = {
      id: now,
      text: text,
      completed: false,
      createdAt: now
    }

    // 可选字段：有值才写入，避免给任务补造无意义字段
    if (this.data.selectedPriority) {
      task.priority = this.data.selectedPriority
    }

    if (this.data.deadline) {
      task.deadline = this.data.deadline
    }

    task.projectId =
      this.data.projectIdList[this.data.selectedProjectIndex] || ""

    // 描述（有值才写）
    const description = (this.data.todoDescription || "").trim()

    if (description) {
      task.description = description
    }

    // 标签：通过 parseTags 统一转换（非空才写）
    const tags = taskUtil.parseTags(this.data.todoTags)

    if (tags.length > 0) {
      task.tags = tags
    }

    todayList.push(task)

    allTodo[today] = todayList

    wx.setStorageSync("todoList", allTodo)

    this.setData({
      todoInput: "",
      todoDescription: "",
      todoTags: "",
      selectedPriority: "",
      deadline: "",
      priorityOpen: false,
      selectedProjectIndex: 0
    })

    this.loadTodo()

    wx.showToast({
      title: "Added",
      icon: "success"
    })
  },

  // =========================
  // 完成 / 取消完成
  // =========================
  toggleTodo(e) {
    const id =
      e.currentTarget.dataset.id

    const date =
      e.currentTarget.dataset.date ||
      this.data.todayKey ||
      taskUtil.getToday()

    const allTodo =
      wx.getStorageSync("todoList") || {}

    const dateList =
      allTodo[date] || []

    let targetIndex = -1

    for (let i = 0; i < dateList.length; i++) {
      if (String(dateList[i].id) === String(id)) {
        targetIndex = i
        break
      }
    }

    if (targetIndex < 0) {
      return
    }

    const target = dateList[targetIndex]

    target.completed = !target.completed

    if (target.completed) {
      target.completedAt = Date.now()
    } else {
      // 取消完成：清除完成时间
      delete target.completedAt
    }

    allTodo[date] = dateList

    wx.setStorageSync("todoList", allTodo)

    this.loadTodo()
  },

  // =========================
  // 删除任务
  // =========================
  deleteTodo(e) {
    const id =
      e.currentTarget.dataset.id

    const date =
      e.currentTarget.dataset.date ||
      this.data.todayKey ||
      taskUtil.getToday()

    const that = this

    wx.showModal({
      title: "Delete Task",
      content: "Delete this task?",
      confirmText: "Delete",
      cancelText: "Cancel",
      success: function (res) {
        if (!res.confirm) {
          return
        }

        const allTodo =
          wx.getStorageSync("todoList") || {}

        const dateList =
          allTodo[date] || []

        let targetIndex = -1

        for (let i = 0; i < dateList.length; i++) {
          if (String(dateList[i].id) === String(id)) {
            targetIndex = i
            break
          }
        }

        if (targetIndex < 0) {
          return
        }

        dateList.splice(targetIndex, 1)

        allTodo[date] = dateList

        wx.setStorageSync("todoList", allTodo)

        that.loadTodo()

        wx.showToast({
          title: "Deleted",
          icon: "success"
        })
      }
    })
  },

  openTask(e) {
    const id = e.currentTarget.dataset.id

    if (!id) {
      return
    }

    wx.setStorageSync("selectedTaskId", id)

    wx.navigateTo({
      url: "/pages/taskDetail/taskDetail"
    })
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    })
  }
})
