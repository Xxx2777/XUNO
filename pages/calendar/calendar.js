var common = require("../../utils/common.js")

var courseUtil = require("../../utils/course.js")

var calendarUtil = require("../../utils/calendar.js")

Page({

  data: {

    year: 2026,
    month: 8,
    monthName: "September",

    today: "",
    selectedDate: "",
    selectedDateText: "Today",

    calendarDays: [],

    selectedEvents: [],
    hasSelectedEvents: false,
    overviewText: "",

    courseEvents: [],
    learningEvents: [],
    taskEvents: [],
    projectEvents: [],

    hasCourseEvents: false,
    hasLearningEvents: false,
    hasTaskEvents: false,
    hasProjectEvents: false,

    monthEventCount: 0,

    hasUnwrittenFeedback: false,

    themeClass: "theme-1",

    // =========================
    // 视图：month 月历 / week 周课程表
    // =========================

    viewMode: "month",

    // 周课程表数据
    weekStart: "",
    weekRangeText: "",
    scheduleDayHeaders: [],
    scheduleAxis: [],
    scheduleBlocks: [],
    hasScheduleCourses: false,
    scheduleTotalWidth: 0,
    scheduleGutterWidth: 0,
    scheduleColWidth: 0,
    isThisWeek: true

  },


  onLoad: function () {

    var today = this.getToday()
    var date = new Date()

    var app = getApp()

    var themeMode =
      app &&
      app.globalData &&
      app.globalData.themeMode
        ? Number(app.globalData.themeMode)
        : 1

    if (
      !app ||
      !app.globalData ||
      !app.globalData.themes ||
      !app.globalData.themes[themeMode]
    ) {

      themeMode = 1

    }

    this.setData({

      year:
        date.getFullYear(),

      month:
        date.getMonth() + 1,

      today:
        today,

      selectedDate:
        today,

      themeClass:
        themeMode === 2
          ? "theme-2"
          : "theme-1"

    })

    // 隐藏微信自带的小房子按钮
    if (wx.hideHomeButton) {
      wx.hideHomeButton()
    }

    // 系统导航栏和背景统一交给 app.js
    if (
      app &&
      typeof app.applyTheme === "function"
    ) {

      app.applyTheme(themeMode)

    }

    this.createCalendar()
    this.loadSelectedEvents()

    this.buildWeekSchedule()

    this.updateFeedbackBadge()

    this.statusTimer =
      setInterval(function () {

        this.loadSelectedEvents()
        this.updateFeedbackBadge()

      }.bind(this), 60000)

  },


  onShow: function () {

    // 每次显示日程页面都隐藏小房子按钮
    if (wx.hideHomeButton) {
      wx.hideHomeButton()
    }

    var app = getApp()

    var themeMode =
      app &&
      app.globalData &&
      app.globalData.themeMode
        ? Number(app.globalData.themeMode)
        : 1

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

    // 系统导航栏和背景统一交给 app.js
    if (
      app &&
      typeof app.applyTheme === "function"
    ) {

      app.applyTheme(themeMode)

    }

    this.createCalendar()
    this.loadSelectedEvents()

    this.buildWeekSchedule()

    this.updateFeedbackBadge()

  },


  onUnload: function () {

    if (this.statusTimer) {

      clearInterval(
        this.statusTimer
      )

      this.statusTimer = null

    }

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

    if (month < 10) {

      month =
        "0" + month

    }

    if (day < 10) {

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
  // 创建日历
  // =========================================================

  createCalendar: function () {

    var year =
      this.data.year

    var month =
      this.data.month

    var today =
      this.data.today

    var selectedDate =
      this.data.selectedDate

    var events =
      this.getAllEvents()

    var dateCountMap = {}

    for (
      var e = 0;
      e < events.length;
      e++
    ) {

      var eventDate =
        events[e].date

      if (!eventDate) {
        continue
      }

      dateCountMap[eventDate] =
        (dateCountMap[eventDate] || 0) + 1

    }

    var days = []

    var firstDay =
      new Date(
        year,
        month - 1,
        1
      ).getDay()

    if (
      firstDay === 0
    ) {

      firstDay = 7

    }

    var daysInMonth =
      new Date(
        year,
        month,
        0
      ).getDate()

    var previousMonthDays =
      firstDay - 1

    var previousMonth =
      month - 1

    var previousYear =
      year

    if (
      previousMonth === 0
    ) {

      previousMonth = 12
      previousYear = year - 1

    }

    var previousMonthTotal =
      new Date(
        previousYear,
        previousMonth,
        0
      ).getDate()

    var i

    // =====================================================
    // 上个月日期
    // =====================================================

    for (
      i =
      previousMonthTotal -
      previousMonthDays +
      1;

      i <= previousMonthTotal;

      i++
    ) {

      var prevMonthText =
        previousMonth < 10
          ? "0" + previousMonth
          : String(previousMonth)

      var prevDayText =
        i < 10
          ? "0" + i
          : String(i)

      var prevDateString =
        previousYear +
        "-" +
        prevMonthText +
        "-" +
        prevDayText

      days.push({

        day:
          i,

        date:
          prevDateString,

        current:
          false,

        selected:
          false,

        today:
          false,

        hasEvent:
          false,

        eventCount:
          0,

        className:
          "other-month"

      })

    }


    // =====================================================
    // 当前月份日期
    // =====================================================

    for (
      i = 1;
      i <= daysInMonth;
      i++
    ) {

      var monthText =
        month

      var dayText =
        i

      if (
        monthText < 10
      ) {

        monthText =
          "0" +
          monthText

      }

      if (
        dayText < 10
      ) {

        dayText =
          "0" +
          dayText

      }

      var dateString =
        year +
        "-" +
        monthText +
        "-" +
        dayText

      var eventCount =
        dateCountMap[dateString] || 0

      var className =
        ""

      if (
        dateString ===
        today
      ) {

        className +=
          " today"

      }

      if (
        dateString ===
        selectedDate
      ) {

        className +=
          " selected"

      }

      if (
        eventCount > 0
      ) {

        className +=
          " has-event"

      }

      days.push({

        day:
          i,

        date:
          dateString,

        current:
          true,

        selected:
          dateString ===
          selectedDate,

        today:
          dateString ===
          today,

        hasEvent:
          eventCount > 0,

        eventCount:
          eventCount,

        className:
          className

      })

    }


    // =====================================================
    // 下个月日期
    // =====================================================

    var nextMonth =
      month + 1

    var nextYear =
      year

    if (
      nextMonth === 13
    ) {

      nextMonth = 1
      nextYear = year + 1

    }

    // 动态行数：只渲染到最后一个含本月日期的周，
    // 避免底部出现一整行纯下月灰色日期。
    var usedCells =
      previousMonthDays + daysInMonth

    var totalCells =
      Math.ceil(usedCells / 7) * 7

    while (
      days.length <
      totalCells
    ) {

      var nextDay =
        days.length -
        daysInMonth -
        previousMonthDays +
        1

      var nextMonthText =
        nextMonth < 10
          ? "0" + nextMonth
          : String(nextMonth)

      var nextDayText =
        nextDay < 10
          ? "0" + nextDay
          : String(nextDay)

      var nextDateString =
        nextYear +
        "-" +
        nextMonthText +
        "-" +
        nextDayText

      days.push({

        day:
          nextDay,

        date:
          nextDateString,

        current:
          false,

        selected:
          false,

        today:
          false,

        hasEvent:
          false,

        eventCount:
          0,

        className:
          "other-month"

      })

    }


    // =====================================================
    // 当前月份事项数量
    // =====================================================

    var monthEventCount =
      0

    for (
      var k = 0;
      k < events.length;
      k++
    ) {

      var eventDate2 =
        events[k].date

      if (!eventDate2) {
        continue
      }

      var parts =
        eventDate2.split("-")

      if (
        Number(parts[0]) ===
        year &&
        Number(parts[1]) ===
        month
      ) {

        monthEventCount++

      }

    }

    this.setData({

      calendarDays:
        days,

      monthEventCount:
        monthEventCount,

      monthName:
        ["January", "February", "March", "April", "May", "June",
         "July", "August", "September", "October", "November", "December"][month - 1]

    })

  },


  // =========================================================
  // 选择日期
  // =========================================================

  selectDay: function (e) {

    var date =
      e.currentTarget.dataset.date

    if (!date) {

      return

    }

    this.setData({

      selectedDate:
        date

    })

    this.updateSelectedDateText()

    this.loadSelectedEvents()

    this.createCalendar()

  },


  // =========================================================
  // 更新选中日期文字
  // =========================================================

  updateSelectedDateText: function () {

    var date =
      this.data.selectedDate

    var today =
      this.data.today

    var text =
      date

    if (
      date ===
      today
    ) {

      text =
        "Today"

    } else {

      text =
        common.formatDateText(date)

    }

    this.setData({

      selectedDateText:
        text

    })

  },


  // =========================================================
  // 读取所有数据，构建统一日历事件
  // =========================================================

  getAllEvents: function () {

    var courses =
      wx.getStorageSync("courses") || []

    var todoList =
      wx.getStorageSync("todoList") || {}

    var projects =
      wx.getStorageSync("projects") || []

    var learningHistory =
      wx.getStorageSync("learningHistory") || []

    return calendarUtil.buildCalendarEvents({
      courses: courses,
      todoList: todoList,
      projects: projects,
      learningHistory: learningHistory
    })

  },


  // =========================================================
  // 加载选中日期的统一事件
  // =========================================================

  loadSelectedEvents: function () {

    var events =
      this.getAllEvents()

    var selectedDate =
      this.data.selectedDate

    var list =
      []

    for (
      var i = 0;
      i < events.length;
      i++
    ) {

      if (
        events[i].date ===
        selectedDate
      ) {

        list.push(events[i])

      }

    }

    list =
      calendarUtil.sortEvents(list)

    var overview =
      calendarUtil.getDayOverview(list)


    // =====================================================
    // 按类型分组，便于分组展示
    // =====================================================

    var courseEvents = []
    var learningEvents = []
    var taskEvents = []
    var projectEvents = []

    for (var k = 0; k < list.length; k++) {

      var ev = list[k]

      if (ev.type === "course") {
        courseEvents.push(ev)
      } else if (ev.type === "learning") {
        learningEvents.push(ev)
      } else if (ev.type === "task") {
        taskEvents.push(ev)
      } else if (ev.type === "project") {
        projectEvents.push(ev)
      }

    }


    // 课程 / 学习 / 项目：按 sortMinutes 升序
    var byTime = function (a, b) {
      return (a.sortMinutes || 0) - (b.sortMinutes || 0)
    }

    courseEvents.sort(byTime)
    learningEvents.sort(byTime)
    projectEvents.sort(byTime)


    // 任务：未完成优先，再按优先级（高 > 中 > 低）
    var priorityWeight = function (p) {
      if (p === "高") return 3
      if (p === "中") return 2
      if (p === "低") return 1
      return 0
    }

    taskEvents.sort(function (a, b) {
      if (!!a.completed !== !!b.completed) {
        return a.completed ? 1 : -1
      }
      return priorityWeight(b.priority) - priorityWeight(a.priority)
    })


    this.setData({

      selectedEvents:
        list,

      hasSelectedEvents:
        list.length > 0,

      overviewText:
        this.buildOverviewText(overview),

      courseEvents:
        courseEvents,

      learningEvents:
        learningEvents,

      taskEvents:
        taskEvents,

      projectEvents:
        projectEvents,

      hasCourseEvents:
        courseEvents.length > 0,

      hasLearningEvents:
        learningEvents.length > 0,

      hasTaskEvents:
        taskEvents.length > 0,

      hasProjectEvents:
        projectEvents.length > 0

    })

    this.updateSelectedDateText()

  },


  // =========================================================
  // 生成「当日安排」描述文案（overviewText）
  // =========================================================

  buildOverviewText: function (overview) {

    if (!overview || overview.total === 0) {
      return "No events"
    }

    var text =
      overview.total + " items"

    var parts =
      []

    if (overview.courseCount) {
      parts.push("Teaching " + overview.courseCount)
    }

    if (overview.taskCount) {
      parts.push("Tasks " + overview.taskCount)
    }

    if (overview.projectCount) {
      parts.push("Projects " + overview.projectCount)
    }

    if (overview.learningCount) {
      parts.push("Learning " + overview.learningCount)
    }

    if (parts.length) {
      text += " · " + parts.join(" · ")
    }

    return text

  },


  // =========================================================
  // 上个月
  // =========================================================

  prevMonth: function () {

    var year =
      this.data.year

    var month =
      this.data.month

    month--

    if (
      month === 0
    ) {

      month = 12
      year--

    }

    this.setData({

      year:
        year,

      month:
        month

    })

    this.createCalendar()

  },


  // =========================================================
  // 下个月
  // =========================================================

  nextMonth: function () {

    var year =
      this.data.year

    var month =
      this.data.month

    month++

    if (
      month === 13
    ) {

      month = 1
      year++

    }

    this.setData({

      year:
        year,

      month:
        month

    })

    this.createCalendar()

  },


  // =========================================================
  // 回到今天
  // =========================================================

  goToday: function () {

    var today =
      this.getToday()

    var date =
      new Date()

    this.setData({

      year:
        date.getFullYear(),

      month:
        date.getMonth() + 1,

      today:
        today,

      selectedDate:
        today

    })

    this.createCalendar()

    this.loadSelectedEvents()

  },


  // =========================================================
  // 删除课程
  // =========================================================

  deleteCourse: function (e) {

    var id =
      e.currentTarget.dataset.id

    if (!id) {

      wx.showToast({

        title:
          "Course information error",

        icon:
          "none"

      })

      return

    }

    wx.showModal({

      title:
        "Delete Course",

      content:
        "Delete this course?",

      success:
        function (res) {

          if (!res.confirm) {

            return

          }

          courseUtil.deleteCourseCascade(id)

          this.createCalendar()
          this.loadSelectedEvents()
          this.updateFeedbackBadge()

          wx.showToast({

            title:
              "Deleted",

            icon:
              "success"

          })

        }.bind(this)

    })

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
  // 添加课程
  // =========================================================

  addCourse: function () {

    wx.setStorageSync(
      "createCourseDate",
      this.data.selectedDate
    )

    wx.setStorageSync(
      "createCourseReturnPage",
      "/pages/calendar/calendar"
    )

    wx.removeStorageSync(
      "selectedCourseId"
    )

    wx.navigateTo({

      url:
        "/pages/create/create"

    })

  },


  // =========================================================
  // 添加安排（教学 / 学习 / 任务）
  // =========================================================

  addSchedule: function () {

    var that = this

    wx.showActionSheet({

      itemList: ["Teaching", "Learning", "Tasks"],

      success: function (res) {

        var index = res.tapIndex

        if (index === 0) {

          that.addCourse()

        } else if (index === 1) {

          wx.setStorageSync(
            "createStudyDate",
            that.data.selectedDate
          )

          wx.navigateTo({
            url: "/pages/study/study"
          })

        } else if (index === 2) {

          wx.setStorageSync(
            "createTaskDate",
            that.data.selectedDate
          )

          wx.navigateTo({
            url: "/pages/todo/todo"
          })

        }

      }

    })

  },


  // =========================================================
  // 打开课程详情
  // =========================================================

  openCourse: function (e) {

    var id =
      e.currentTarget.dataset.id

    if (!id) {

      wx.showToast({

        title:
          "Course information error",

        icon:
          "none"

      })

      return

    }

    wx.setStorageSync(
      "selectedCourseId",
      id
    )

    wx.navigateTo({

      url:
        "/pages/courseDetail/courseDetail"

    })

  },


  // =========================================================
  // 打开统一事件（任务 / 项目；课程走 openCourse，学习只展示）
  // =========================================================

  openEvent: function (e) {

    var type =
      e.currentTarget.dataset.type

    var id =
      e.currentTarget.dataset.id

    if (type === "task" && id) {

      wx.setStorageSync("selectedTaskId", id)

      wx.navigateTo({
        url: "/pages/taskDetail/taskDetail"
      })

      return

    }

    if (type === "project" && id) {

      wx.setStorageSync("selectedProjectId", id)

      wx.navigateTo({
        url: "/pages/projectDetail/projectDetail"
      })

      return

    }

    if (type === "learning" && id) {

      wx.setStorageSync("selectedLearningId", id)

      wx.navigateTo({
        url: "/pages/learningDetail/learningDetail"
      })

      return

    }

  },


  // =========================================================
  // 首页
  // =========================================================

  goHome: function () {

    wx.reLaunch({

      url:
        "/pages/index/index"

    })

  },


  // =========================================================
  // 统计
  // =========================================================

  goStatistics: function () {

    wx.reLaunch({

      url:
        "/pages/statistics/statistics"

    })

  },


  // =========================================================
  // 我的
  // =========================================================

  goMine: function () {

    wx.reLaunch({

      url:
        "/pages/mine/mine"

    })

  },


  // =========================================================
  // 切换视图（月历 / 课程表）
  // =========================================================

  switchView: function (e) {

    var mode =
      e.currentTarget.dataset.mode

    if (
      mode !== "month" &&
      mode !== "week"
    ) {
      return
    }

    if (mode === this.data.viewMode) {
      return
    }

    this.setData({
      viewMode: mode
    })

    if (mode === "week") {
      this.buildWeekSchedule()
    }

  },


  // =========================================================
  // 计算本周周一
  // =========================================================

  getThisWeekStart: function () {

    return calendarUtil.getWeekStart(
      this.getToday()
    )

  },


  // =========================================================
  // 构建周课程表
  // =========================================================

  buildWeekSchedule: function () {

    var weekStart =
      this.data.weekStart

    if (!weekStart) {
      weekStart = this.getThisWeekStart()
    }

    var courses =
      wx.getStorageSync("courses") || []

    var today =
      this.getToday()

    var schedule =
      calendarUtil.buildWeekSchedule(
        courses,
        weekStart,
        today
      )


    // 组装星期表头
    var dayHeaders =
      []

    for (
      var i = 0;
      i < schedule.days.length;
      i++
    ) {

      var dateStr =
        schedule.days[i]

      var parts =
        dateStr.split("-")

      dayHeaders.push({

        date: dateStr,
        label: schedule.dayLabels[i],
        dayNum: Number(parts[2]),
        isToday: dateStr === today,
        isWeekend: i >= 5

      })

    }


    // 周范围文案：2026.09.14 – 2026.09.20
    var startParts =
      schedule.days[0].split("-")

    var endParts =
      schedule.days[6].split("-")

    var rangeText =
      startParts[0] + "." +
      startParts[1] + "." +
      startParts[2] +
      " – " +
      endParts[0] + "." +
      endParts[1] + "." +
      endParts[2]


    this.setData({

      weekStart: weekStart,
      weekRangeText: rangeText,
      scheduleDayHeaders: dayHeaders,
      scheduleAxis: schedule.axis,
      scheduleBlocks: schedule.blocks,
      hasScheduleCourses: schedule.hasCourses,
      scheduleTotalWidth: schedule.totalWidth,
      scheduleGutterWidth: schedule.gutterWidth,
      scheduleColWidth: schedule.colWidth,
      isThisWeek:
        weekStart === this.getThisWeekStart()

    })

  },


  // =========================================================
  // 周偏移（上一周 / 下一周）
  // =========================================================

  shiftWeek: function (delta) {

    var weekStart =
      this.data.weekStart

    if (!weekStart) {
      weekStart = this.getThisWeekStart()
    }

    var parts =
      weekStart.split("-")

    var date =
      new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
      )

    date.setDate(
      date.getDate() + delta * 7
    )

    var year =
      date.getFullYear()

    var month =
      date.getMonth() + 1

    var day =
      date.getDate()

    if (month < 10) {
      month = "0" + month
    }

    if (day < 10) {
      day = "0" + day
    }

    this.setData({
      weekStart:
        year + "-" + month + "-" + day
    })

    this.buildWeekSchedule()

  },


  // =========================================================
  // 上一周
  // =========================================================

  prevWeek: function () {

    this.shiftWeek(-1)

  },


  // =========================================================
  // 下一周
  // =========================================================

  nextWeek: function () {

    this.shiftWeek(1)

  },


  // =========================================================
  // 回到本周
  // =========================================================

  goThisWeek: function () {

    this.setData({
      weekStart: this.getThisWeekStart()
    })

    this.buildWeekSchedule()

  },


  // =========================================================
  // 月历左右滑动切换月份
  //
  // 仅在水平位移明显大于垂直位移、且超过最小阈值时，
  // 才判定为左右滑动，避免上下滚动或点击日期误触发。
  // =========================================================

  onCalendarTouchStart: function (e) {

    var touch = e.touches[0]

    if (!touch) {
      return
    }

    this._calTouchX = touch.clientX
    this._calTouchY = touch.clientY

  },


  onCalendarTouchEnd: function (e) {

    var touch = e.changedTouches[0]

    if (!touch) {
      return
    }

    var dx =
      touch.clientX - this._calTouchX

    var dy =
      touch.clientY - this._calTouchY

    if (
      Math.abs(dx) > 30 &&
      Math.abs(dx) > Math.abs(dy)
    ) {

      if (dx > 0) {
        this.prevMonth()
      } else {
        this.nextMonth()
      }

    }

  },


  // =========================================================
  // 课程表左右滑动切换周
  // =========================================================

  onScheduleTouchStart: function (e) {

    var touch = e.touches[0]

    if (!touch) {
      return
    }

    this._schTouchX = touch.clientX
    this._schTouchY = touch.clientY

  },


  onScheduleTouchEnd: function (e) {

    var touch = e.changedTouches[0]

    if (!touch) {
      return
    }

    var dx =
      touch.clientX - this._schTouchX

    var dy =
      touch.clientY - this._schTouchY

    if (
      Math.abs(dx) > 30 &&
      Math.abs(dx) > Math.abs(dy)
    ) {

      if (dx > 0) {
        this.prevWeek()
      } else {
        this.nextWeek()
      }

    }

  }

})