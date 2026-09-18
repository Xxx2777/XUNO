// pages/index/index.js

var common = require("../../utils/common.js")

var taskUtil = require("../../utils/task.js")

var profileUtil = require("../../utils/profile.js")

var courseUtil = require("../../utils/course.js")

var noteUtil = require("../../utils/note.js")


Page({
  data: {
    themeClass: "theme-1",

    // 问候 + 日期
    greeting: "",
    todayText: "",

    // 学习
    studyMinutes: 0,
    studyTarget: 60,
    studyPercent: 0,
    studyProgressStyle: "width: 0%;",
    studyProgressLevel: 0,
    studyType: "",
    studyTypeList: [],

    // 任务
    taskList: [],
    taskDone: 0,
    taskTotal: 0,
    taskPercent: 0,
    taskProgressStyle: "width: 0%;",

    // 接下来
    nextItem: null,

    // 课程
    todayCourses: [],
    courseCount: 0,
    hasTodayCourses: false,

    // 笔记
    todayNotes: [],
    todayNoteCount: 0,

    // 待反馈
    hasUnwrittenFeedback: false,
    unwrittenCount: 0,

    // 滑动删除
    touchStartX: 0,
    touchCurrentX: 0,
    swipeIndex: -1,
    isSwiping: false
  },

  onLoad: function () {
    this.syncTheme()
    this.loadData()

    this.statusTimer = setInterval(function () {
      this.loadData()
    }.bind(this), 60000)
  },

  onShow: function () {
    this.syncTheme()
    this.loadData()
  },

  onUnload: function () {
    if (this.statusTimer) {
      clearInterval(this.statusTimer)
    }
  },

  // =========================
  // 主题（统一到 common）
  // =========================
  syncTheme: function () {
    common.syncTheme(this)
  },

  // =========================
  // 加载今日工作台数据
  // =========================
  loadData: function () {
    var today = common.getToday()

    var profile = profileUtil.getProfile()


    // =========================
    // 问候 + 日期
    // =========================
    var greeting = this.getGreeting(profile.nickname)
    var todayText = this.getTodayText()


    // =========================
    // 学习（直接读 learningHistory，通用类型）
    // =========================
    var learningHistory =
      wx.getStorageSync("learningHistory") || []

    var studyMinutes = 0
    var typeMap = {}

    learningHistory.forEach(function (item) {
      if (!item || item.date !== today) {
        return
      }

      var minutes = Number(item.minutes) || 0
      studyMinutes += minutes

      var type = item.type || "Uncategorized"
      typeMap[type] = (typeMap[type] || 0) + minutes
    })

    var studyTarget = profile.dailyStudyTarget

    var studyPercent =
      studyTarget > 0
        ? Math.round(studyMinutes / studyTarget * 100)
        : 0

    if (studyPercent > 100) {
      studyPercent = 100
    }

    var studyTypeList = []
    for (var key in typeMap) {
      if (typeMap.hasOwnProperty(key)) {
        studyTypeList.push({
          name: key,
          minutes: typeMap[key]
        })
      }
    }
    studyTypeList.sort(function (a, b) {
      return b.minutes - a.minutes
    })

    var studyProgressLevel =
      Math.floor(studyPercent / 10)

    if (studyProgressLevel > 10) {
      studyProgressLevel = 10
    }

    var studyType =
      studyTypeList.length > 0
        ? studyTypeList[0].name
        : "Study Today"


    // =========================
    // 任务（复用 task.js）
    // =========================
    var todoData =
      wx.getStorageSync("todoList") || {}

    var todayTodo = todoData[today] || []

    var taskList = todayTodo.map(function (item) {
      return taskUtil.normalizeTask(item, today)
    })

    taskList = taskUtil.sortTasks(taskList, today)

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

    var taskSummary = taskUtil.getTaskSummary(taskList, today)

    var taskPercent = taskSummary.completionRate


    // =========================
    // 课程（复用 common.getCourseStatus）
    // =========================
    var courses = wx.getStorageSync("courses") || []

    var todayCoursesAll = courses.filter(function (course) {
      return course && course.date === today
    })

    todayCoursesAll = todayCoursesAll.map(function (course) {
      var newCourse = Object.assign({}, course)
      var rawStatus = common.getCourseStatus(course)
      newCourse.status = rawStatus
      newCourse.statusText = common.getCourseStatusText(rawStatus)
      newCourse.grade = common.getGradeText(course.grade)
      return newCourse
    })

    todayCoursesAll = this.sortCoursesByTime(todayCoursesAll)


    // =========================
    // 待反馈
    // =========================
    var history = wx.getStorageSync("history") || []

    var hasUnwrittenFeedback =
      common.checkUnwrittenFeedback(courses, history)

    var unwrittenCount = 0

    courses.forEach(function (course) {
      if (!course || !course.id) {
        return
      }

      if (course.status === "学生请假") {
        return
      }

      if (common.getCourseStatus(course) !== "已完成") {
        return
      }

      var hasFeedback = false
      for (var h = 0; h < history.length; h++) {
        if (
          history[h] &&
          history[h].type === "feedback" &&
          String(history[h].courseId) === String(course.id)
        ) {
          hasFeedback = true
          break
        }
      }

      if (!hasFeedback) {
        unwrittenCount++
      }
    })


    // =========================
    // 笔记（今天更新过的笔记）
    // =========================
    var notes = wx.getStorageSync("notes") || []

    var todayNotesAll = notes
      .map(function (n) {
        return noteUtil.normalizeNote(n)
      })
      .filter(function (n) {
        if (!n) {
          return false
        }
        var ts = n.updatedAt
        if (!ts) {
          return false
        }
        var d = new Date(ts)
        if (isNaN(d.getTime())) {
          return false
        }
        return common.formatDate(d) === today
      })
      .sort(function (a, b) {
        return (b.updatedAt || 0) - (a.updatedAt || 0)
      })

    var todayNotes = todayNotesAll.slice(0, 2)


    // =========================
    // 接下来
    // =========================
    var nextItem = this.calcNextItem(
      todayCoursesAll,
      taskList,
      hasUnwrittenFeedback,
      today
    )


    // =========================
    // 展示裁剪（控制信息密度）
    // =========================
    var displayCourses = todayCoursesAll.slice(0, 3)
    var displayTasks = taskList.slice(0, 3)


    this.setData({
      greeting: greeting,
      todayText: todayText,

      studyMinutes: studyMinutes,
      studyTarget: studyTarget,
      studyPercent: studyPercent,
      studyProgressStyle: "width: " + studyPercent + "%;",
      studyProgressLevel: studyProgressLevel,
      studyType: studyType,
      studyTypeList: studyTypeList,

      taskList: displayTasks,
      taskDone: taskSummary.completed,
      taskTotal: taskSummary.total,
      taskPercent: taskPercent,
      taskProgressStyle: "width: " + taskPercent + "%;",

      nextItem: nextItem,

      todayCourses: displayCourses,
      courseCount: todayCoursesAll.length,
      hasTodayCourses: todayCoursesAll.length > 0,

      todayNotes: todayNotes,
      todayNoteCount: todayNotesAll.length,

      hasUnwrittenFeedback: hasUnwrittenFeedback,
      unwrittenCount: unwrittenCount,

      swipeIndex: -1,
      touchStartX: 0,
      touchCurrentX: 0,
      isSwiping: false
    })
  },

  // =========================
  // 个性化问候
  // =========================
  getGreeting: function (nickname) {
    var hour = new Date().getHours()

    var prefix = ""

    if (hour < 5) {
      prefix = "Good evening"
    } else if (hour < 11) {
      prefix = "Good morning"
    } else if (hour < 14) {
      prefix = "Good afternoon"
    } else if (hour < 18) {
      prefix = "Good afternoon"
    } else {
      prefix = "Good evening"
    }

    return prefix + ", " + (nickname || "there")
  },

  // =========================
  // 今日日期文字
  // =========================
  getTodayText: function () {
    var date = new Date()

    var weekList = [
      "Sun", "Mon", "Tue", "Wed",
      "Thu", "Fri", "Sat"
    ]

    return (
      (date.getMonth() + 1) +
      " " +
      date.getDate() +
      " · " +
      weekList[date.getDay()]
    )
  },

  // =========================
  // 课程按开始时间排序
  // =========================
  sortCoursesByTime: function (courses) {
    return courses.sort(function (a, b) {
      var timeA = a.startTime || a.time || ""
      var timeB = b.startTime || b.time || ""

      if (!timeA && !timeB) {
        return 0
      }

      if (!timeA) {
        return 1
      }

      if (!timeB) {
        return -1
      }

      var partsA = String(timeA).split(":")
      var partsB = String(timeB).split(":")

      if (partsA.length !== 2 || partsB.length !== 2) {
        return 0
      }

      var minutesA = Number(partsA[0]) * 60 + Number(partsA[1])
      var minutesB = Number(partsB[0]) * 60 + Number(partsB[1])

      if (isNaN(minutesA)) {
        return 1
      }

      if (isNaN(minutesB)) {
        return -1
      }

      return minutesA - minutesB
    })
  },

  // =========================
  // 「接下来」判断
  // =========================
  calcNextItem: function (
    todayCourses,
    taskList,
    hasUnwrittenFeedback,
    today
  ) {
    var i

    // 1. 进行中课程
    for (i = 0; i < todayCourses.length; i++) {
      if (todayCourses[i].status === "进行中") {
        return {
          type: "course",
          icon: "course",
          title: "In session",
          desc:
            (todayCourses[i].student || "Student") +
            " · " +
            (todayCourses[i].startTime || "") +
            "-" +
            (todayCourses[i].endTime || ""),
          courseId: todayCourses[i].id
        }
      }
    }

    // 2. 今日待开始课程（最早）
    var pending = []
    for (i = 0; i < todayCourses.length; i++) {
      if (todayCourses[i].status === "待开始") {
        pending.push(todayCourses[i])
      }
    }

    if (pending.length > 0) {
      return {
        type: "course",
        icon: "course",
        title: "Up next",
        desc:
          (pending[0].student || "Student") +
          " · " +
          (pending[0].startTime || "TBD"),
        courseId: pending[0].id
      }
    }

    // 3. 逾期任务
    var overdue = []
    for (i = 0; i < taskList.length; i++) {
      if (taskList[i].overdue) {
        overdue.push(taskList[i])
      }
    }

    if (overdue.length > 0) {
      return {
        type: "task",
        icon: "task",
        title: "Tasks overdue",
        desc: overdue[0].text,
        courseId: ""
      }
    }

    // 4. 今日截止任务
    var todayDeadline = []
    for (i = 0; i < taskList.length; i++) {
      if (
        !taskList[i].completed &&
        taskList[i].deadline === today
      ) {
        todayDeadline.push(taskList[i])
      }
    }

    if (todayDeadline.length > 0) {
      return {
        type: "task",
        icon: "task",
        title: "Due today",
        desc: todayDeadline[0].text,
        courseId: ""
      }
    }

    // 5. 今日项目截止（deadline 最早优先）
    var projects = wx.getStorageSync("projects") || []

    var todayProjects = []

    for (i = 0; i < projects.length; i++) {
      if (
        projects[i] &&
        projects[i].status !== "已完成" &&
        String(projects[i].deadline || "").substring(0, 10) === today
      ) {
        todayProjects.push(projects[i])
      }
    }

    if (todayProjects.length > 0) {
      todayProjects.sort(function (a, b) {
        return String(a.deadline || "").localeCompare(String(b.deadline || ""))
      })
      return {
        type: "project",
        icon: "project",
        title: todayProjects[0].name || "Project",
        desc: "Due today",
        sourceId: todayProjects[0].id
      }
    }

    // 6. 待反馈课程
    if (hasUnwrittenFeedback) {
      return {
        type: "feedback",
        icon: "feedback",
        title: "Courses pending feedback",
        desc: "Complete feedback after class",
        courseId: ""
      }
    }

    // 7. 空
    return null
  },

  // =========================
  // 点击「接下来」
  // =========================
  tapNext: function () {
    var nextItem = this.data.nextItem

    if (!nextItem) {
      return
    }

    if (nextItem.type === "course" && nextItem.courseId) {
      wx.setStorageSync("selectedCourseId", nextItem.courseId)
      wx.navigateTo({
        url: "/pages/courseDetail/courseDetail"
      })
    } else if (nextItem.type === "task") {
      wx.navigateTo({
        url: "/pages/todo/todo"
      })
    } else if (nextItem.type === "feedback") {
      wx.navigateTo({
        url: "/pages/feedbackList/feedbackList"
      })
    } else if (nextItem.type === "project") {
      wx.setStorageSync("selectedProjectId", nextItem.sourceId)
      wx.navigateTo({
        url: "/pages/projectDetail/projectDetail"
      })
    }
  },

  // =========================
  // 任务完成 / 取消完成（复用 id 定位 + completedAt）
  // =========================
  toggleTask: function (e) {
    var id = e.currentTarget.dataset.id

    var today = common.getToday()

    var todoData = wx.getStorageSync("todoList") || {}

    var todayList = todoData[today] || []

    var targetIndex = -1
    for (var i = 0; i < todayList.length; i++) {
      if (String(todayList[i].id) === String(id)) {
        targetIndex = i
        break
      }
    }

    if (targetIndex < 0) {
      return
    }

    var target = todayList[targetIndex]

    target.completed = !target.completed

    if (target.completed) {
      target.completedAt = Date.now()
    } else {
      delete target.completedAt
    }

    todoData[today] = todayList
    wx.setStorageSync("todoList", todoData)

    this.loadData()
  },

  // =========================
  // 打开课程详情
  // =========================
  openCourse: function (e) {
    this.setData({
      swipeIndex: -1,
      touchStartX: 0,
      touchCurrentX: 0,
      isSwiping: false
    })

    var index = e.currentTarget.dataset.index
    var course = this.data.todayCourses[index]

    if (!course) {
      return
    }

    wx.setStorageSync("selectedCourse", course)
    wx.setStorageSync("selectedCourseId", course.id)

    wx.navigateTo({
      url: "/pages/courseDetail/courseDetail"
    })
  },

  // =========================
  // 课程滑动删除
  // =========================
  touchStart: function (e) {
    var startX = e.touches[0].clientX

    this.setData({
      touchStartX: startX,
      touchCurrentX: startX,
      isSwiping: false
    })
  },

  touchMove: function (e) {
    var currentX = e.touches[0].clientX
    var startX = this.data.touchStartX
    var distance = Math.abs(currentX - startX)

    if (distance > 10) {
      this.setData({
        touchCurrentX: currentX,
        isSwiping: true
      })
    }
  },

  touchEnd: function (e) {
    var startX = this.data.touchStartX
    var endX = e.changedTouches[0].clientX
    var index = e.currentTarget.dataset.index
    var distance = startX - endX

    if (distance > 50) {
      this.setData({
        swipeIndex: index,
        touchStartX: 0,
        touchCurrentX: 0,
        isSwiping: false
      })
      return
    }

    if (distance < -50) {
      this.setData({
        swipeIndex: -1,
        touchStartX: 0,
        touchCurrentX: 0,
        isSwiping: false
      })
      return
    }

    this.setData({
      touchStartX: 0,
      touchCurrentX: 0,
      isSwiping: false
    })
  },

  deleteCourse: function (e) {
    var index = e.currentTarget.dataset.index
    var course = this.data.todayCourses[index]

    if (!course) {
      return
    }

    var that = this

    wx.showModal({
      title: "Delete Course",
      content: "Delete this course for " + (course.student || "this student") + "?",
      confirmText: "Delete",
      cancelText: "Cancel",
      success: function (res) {
        if (res.confirm) {
          that.removeCourseData(course)
        } else if (res.cancel) {
          that.setData({
            swipeIndex: -1,
            touchStartX: 0,
            touchCurrentX: 0,
            isSwiping: false
          })
        }
      }
    })
  },

  removeCourseData: function (course) {
    courseUtil.deleteCourseCascade(course.id)

    this.setData({
      swipeIndex: -1
    })

    this.loadData()

    wx.showToast({
      title: "Deleted",
      icon: "success"
    })
  },

  // =========================
  // 一级 Tab（reLaunch）
  // =========================
  goHome: function () {
    wx.reLaunch({
      url: "/pages/index/index"
    })
  },

  goCalendar: function () {
    wx.reLaunch({
      url: "/pages/calendar/calendar"
    })
  },

  goStatistics: function () {
    wx.reLaunch({
      url: "/pages/statistics/statistics"
    })
  },

  goMine: function () {
    wx.reLaunch({
      url: "/pages/mine/mine"
    })
  },

  // =========================
  // 二级入口（navigateTo）
  // =========================
  goCreate: function () {
    wx.setStorageSync("createCourseReturnPage", "/pages/index/index")

    wx.navigateTo({
      url: "/pages/create/create"
    })
  },

  goStudy: function () {
    wx.navigateTo({
      url: "/pages/study/study"
    })
  },

  goTodo: function () {
    wx.navigateTo({
      url: "/pages/todo/todo"
    })
  },

  goFeedbackList: function () {
    wx.navigateTo({
      url: "/pages/feedbackList/feedbackList"
    })
  },

  goNotes: function () {
    wx.navigateTo({
      url: "/pages/notes/notes"
    })
  },

  openNote: function (e) {
    var id = e.currentTarget.dataset.id

    if (!id) {
      return
    }

    wx.setStorageSync("selectedNoteId", id)

    wx.navigateTo({
      url: "/pages/noteDetail/noteDetail"
    })
  }
})
