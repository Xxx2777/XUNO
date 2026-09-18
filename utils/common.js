// ============================================================
// 公共工具函数
//
// 用于消除各页面之间的重复代码。
//
// 这些函数原本分散在多个页面中重复实现，现统一到此处。
// 页面内通过：
//
//   var common = require("../../utils/common.js")
//
// 引入后，用 common.xxx() 调用。
// ============================================================


// ============================================================
// 日期格式化：Date 对象 → "YYYY-MM-DD"
// ============================================================

function formatDate(date) {

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

  return (
    year +
    "-" +
    month +
    "-" +
    day
  )

}


// ============================================================
// 获取今天日期 "YYYY-MM-DD"
// ============================================================

function getToday() {

  return formatDate(
    new Date()
  )

}


// ============================================================
// 日期显示格式化 "YYYY-MM-DD" → "YYYY年MM月DD日"
// ============================================================

function formatDateText(dateString) {

  if (!dateString) {
    return ""
  }

  var parts =
    String(dateString).split("-")

  if (parts.length !== 3) {
    return dateString
  }

  var monthNames =
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  var monthIndex =
    Number(parts[1]) - 1

  if (
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return dateString
  }

  return (
    monthNames[monthIndex] +
    " " +
    Number(parts[2]) +
    ", " +
    parts[0]
  )

}


// ============================================================
// 时间转分钟 "HH:mm" → 分钟数
//
// 无效时间（格式错误、超出范围）返回 null。
//
// 注意：不同页面原先返回值不一致（null / 0 / -1），
// 这里统一为 null。调用方请用 === null 判断。
// ============================================================

function timeToMinutes(time) {

  if (!time) {
    return null
  }

  var parts =
    String(time).trim().split(":")

  if (parts.length !== 2) {
    return null
  }

  var hour =
    Number(parts[0])

  var minute =
    Number(parts[1])

  if (
    isNaN(hour) ||
    isNaN(minute)
  ) {
    return null
  }

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  return (
    hour * 60 +
    minute
  )

}


// ============================================================
// 获取当前主题编号
//
// 优先从 app.globalData 读取，不存在时从本地缓存读取。
// 编号非法时回退到 1。
// ============================================================

function getThemeMode() {

  var app =
    getApp()

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

  return themeMode

}


// ============================================================
// 同步页面主题
//
// 统一设置 themeMode 与 themeClass，并调用 app.applyTheme
// 更新系统导航栏和背景色。
//
// 页面内用法：
//
//   syncTheme: function () {
//     common.syncTheme(this)
//   }
//
// ============================================================

function syncTheme(page) {

  var themeMode =
    getThemeMode()

  page.setData({
    themeMode: themeMode,

    themeClass:
      themeMode === 2
        ? "theme-2"
        : "theme-1"
  })

  var app =
    getApp()

  if (
    app &&
    typeof app.applyTheme === "function"
  ) {
    app.applyTheme(themeMode)
  }

}


// ============================================================
// 判断课程状态（统一版本）
//
// 返回：待开始 / 进行中 / 已完成 / 学生请假 / 已取消
//
// 优先级：
//   1. 学生请假
//   2. 已取消
//   3. 课程日期 < 今天   → 已完成
//   4. 课程日期 > 今天   → 待开始
//   5. 课程日期 = 今天   → 按上下课时间判断
//   6. 没有日期          → 按上下课时间判断
//
// 相比各页面旧实现，本版本补齐了「已取消」判断，
// 让被取消的课程在所有页面都能正确显示。
// ============================================================

function getCourseStatus(course, today) {

  if (!course) {
    return "待开始"
  }

  if (
    course.status === "学生请假"
  ) {
    return "学生请假"
  }

  if (
    course.status === "已取消"
  ) {
    return "已取消"
  }

  var courseDate =
    String(course.date || "").trim()

  if (!today) {
    today = getToday()
  }

  if (!courseDate) {
    return getTodayTimeStatus(course)
  }

  if (courseDate < today) {
    return "已完成"
  }

  if (courseDate > today) {
    return "待开始"
  }

  return getTodayTimeStatus(course)

}


// ============================================================
// 判断「今天」课程的时间状态
//
// 只根据上下课时间与当前时间判断，不涉及日期。
// ============================================================

function getTodayTimeStatus(course) {

  var startTime =
    course.startTime ||
    course.time ||
    ""

  var endTime =
    course.endTime ||
    ""

  if (!startTime) {
    return "待开始"
  }

  var startMinutes =
    timeToMinutes(startTime)

  var endMinutes =
    timeToMinutes(endTime)

  if (startMinutes === null) {
    return "待开始"
  }

  var now =
    new Date()

  var currentMinutes =
    now.getHours() * 60 +
    now.getMinutes()


  // --------------------------------------------------------
  // 没有结束时间：到开始时间后显示「进行中」
  // --------------------------------------------------------

  if (endMinutes === null) {

    if (
      currentMinutes >= startMinutes
    ) {
      return "进行中"
    }

    return "待开始"

  }


  // --------------------------------------------------------
  // 结束时间不晚于开始时间：视为无效，待开始
  // --------------------------------------------------------

  if (endMinutes <= startMinutes) {
    return "待开始"
  }


  // --------------------------------------------------------
  // 已结束
  // --------------------------------------------------------

  if (currentMinutes >= endMinutes) {
    return "已完成"
  }


  // --------------------------------------------------------
  // 进行中
  // --------------------------------------------------------

  if (
    currentMinutes >= startMinutes &&
    currentMinutes < endMinutes
  ) {
    return "进行中"
  }


  return "待开始"

}


// ============================================================
// 课程状态 → 英文显示文案
//
// getCourseStatus / getTodayTimeStatus 返回中文业务值（数据契约不变），
// UI 展示时用本函数映射为英文。
// ============================================================

function getCourseStatusText(status) {

  var map = {
    "待开始": "Upcoming",
    "进行中": "In Progress",
    "已完成": "Completed",
    "学生请假": "On Leave",
    "已取消": "Cancelled"
  }

  return map[status] || status || "Upcoming"

}


// ============================================================
// 检查是否存在「已完成但未填写反馈」的课程
//
// 返回 true / false。
// 用于底部导航反馈红点的显示。
// ============================================================

function checkUnwrittenFeedback(courses, history) {

  if (!courses || !history) {
    return false
  }

  for (
    var i = 0;
    i < courses.length;
    i++
  ) {

    var course =
      courses[i]

    if (!course || !course.id) {
      continue
    }

    if (
      course.status === "学生请假"
    ) {
      continue
    }

    if (
      getCourseStatus(course) !== "已完成"
    ) {
      continue
    }

    var hasFeedback = false

    for (
      var h = 0;
      h < history.length;
      h++
    ) {

      var record =
        history[h]

      if (
        record &&
        record.type === "feedback" &&
        String(record.courseId || "") ===
          String(course.id || "")
      ) {
        hasFeedback = true
        break
      }

    }

    if (!hasFeedback) {
      return true
    }

  }

  return false

}


// ============================================================
// 显示映射：把 storage 里的中文枚举值映射为英文 UI 文案
//
// 这些函数只用于「显示」，不修改 storage 里的原始中文值。
// 数据契约保持不变（storage 继续存「高一」等），UI 展示英文。
// ============================================================

function getGradeText(grade) {

  var map = {
    "初一": "Grade 7",
    "初二": "Grade 8",
    "初三": "Grade 9",
    "高一": "Grade 10",
    "高二": "Grade 11",
    "高三": "Grade 12"
  }

  return map[grade] || grade || ""

}

function getSubjectText(subject) {

  if (subject === "化学") {
    return "Chemistry"
  }

  return subject || "Chemistry"

}

function getPriorityText(priority) {

  var map = {
    "高": "High",
    "中": "Medium",
    "低": "Low"
  }

  return map[priority] || priority || ""

}

function getProjectStatusText(status) {

  var map = {
    "进行中": "In Progress",
    "已完成": "Completed",
    "已暂停": "Paused"
  }

  return map[status] || status || ""

}

function getStudyTypeText(type) {

  if (type === "化学") {
    return "Chemistry"
  }

  if (type === "雅思") {
    return "IELTS"
  }

  if (type === "未分类" || !type) {
    return "Uncategorized"
  }

  return type

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  formatDate: formatDate,
  getToday: getToday,
  formatDateText: formatDateText,
  timeToMinutes: timeToMinutes,
  getThemeMode: getThemeMode,
  syncTheme: syncTheme,
  getCourseStatus: getCourseStatus,
  getCourseStatusText: getCourseStatusText,
  getTodayTimeStatus: getTodayTimeStatus,
  checkUnwrittenFeedback: checkUnwrittenFeedback,
  getGradeText: getGradeText,
  getSubjectText: getSubjectText,
  getPriorityText: getPriorityText,
  getProjectStatusText: getProjectStatusText,
  getStudyTypeText: getStudyTypeText
}
