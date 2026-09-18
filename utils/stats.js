// ============================================================
// 统计工具函数
//
// 供 statistics 页面复用。
// 学习统计、任务数据展开等纯计算逻辑，不涉及 storage 读写。
// ============================================================

var common = require("./common.js")

var taskUtil = require("./task.js")

var projectUtil = require("./project.js")

var noteUtil = require("./note.js")


// ============================================================
// 日期格式化 Date → "YYYY-MM-DD"
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
// 汇总学习记录
//
// 输入：学习记录数组（learningHistory）
// 输出：{ totalMinutes, count, days, typeList }
//   typeList = [{ name, minutes, count, percent }]
// ============================================================

function summarizeStudy(list) {

  list = list || []

  var totalMinutes = 0

  var typeMap = {}

  var dayMap = {}


  for (var i = 0; i < list.length; i++) {

    var item = list[i]

    if (!item) {
      continue
    }

    var minutes =
      Number(item.minutes) || 0

    totalMinutes += minutes


    // 类型分布
    var type =
      item.type || "Uncategorized"

    if (!typeMap[type]) {
      typeMap[type] = {
        minutes: 0,
        count: 0
      }
    }

    typeMap[type].minutes += minutes
    typeMap[type].count++


    // 学习天数（按日期去重）
    if (item.date) {
      dayMap[item.date] = true
    }

  }


  // 类型列表（按时长降序）
  var typeList = []

  for (var key in typeMap) {

    if (!typeMap.hasOwnProperty(key)) {
      continue
    }

    typeList.push({

      name:
        key,

      minutes:
        typeMap[key].minutes,

      count:
        typeMap[key].count,

      percent:
        totalMinutes > 0
          ? Math.round(
            typeMap[key].minutes /
            totalMinutes *
            100
          )
          : 0

    })

  }

  typeList.sort(function (a, b) {
    return b.minutes - a.minutes
  })


  // 学习天数
  var days = 0

  for (var dayKey in dayMap) {
    if (dayMap.hasOwnProperty(dayKey)) {
      days++
    }
  }


  return {

    totalMinutes:
      totalMinutes,

    count:
      list.length,

    days:
      days,

    typeList:
      typeList

  }

}


// ============================================================
// 最近 N 天每日学习时长（用于趋势）
//
// 输入：完整学习记录数组（不做周期筛选，趋势固定看最近 N 天）
// 输出：[{ date, dateText, minutes, percent }] 正序
// ============================================================

function getDailyStudy(list, days) {

  list = list || []

  days = days || 7


  var result = []

  var now =
    new Date()

  var maxMinutes = 0


  // 先统计每天时长
  for (var i = days - 1; i >= 0; i--) {

    var d =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i
      )

    var dateStr =
      formatDate(d)

    var minutes = 0

    for (var j = 0; j < list.length; j++) {

      if (
        list[j] &&
        list[j].date === dateStr
      ) {

        minutes +=
          Number(list[j].minutes) || 0

      }

    }

    result.push({

      date:
        dateStr,

      dateText:
        (d.getMonth() + 1) + "/" + d.getDate(),

      minutes:
        minutes

    })

    if (minutes > maxMinutes) {
      maxMinutes = minutes
    }

  }


  // 计算相对百分比（用于柱状展示）
  for (var k = 0; k < result.length; k++) {

    result[k].percent =
      maxMinutes > 0
        ? Math.round(
          result[k].minutes /
          maxMinutes *
          100
        )
        : 0

  }


  return result

}


// ============================================================
// 从 todoList 对象展开所有任务
//
// 输入：todoList = { "YYYY-MM-DD": [task, ...] }
// 输出：[{ ...task, date: "YYYY-MM-DD" }, ...]
//
// 把外层 key（所属日期）注入为任务的 date 字段，方便按周期筛选。
// 不修改原始数据。
// ============================================================

function flattenTodoList(todoList) {

  var result = []

  if (
    !todoList ||
    typeof todoList !== "object"
  ) {
    return result
  }


  var keys =
    Object.keys(todoList)

  for (var i = 0; i < keys.length; i++) {

    var date =
      keys[i]

    var tasks =
      todoList[date]

    if (!Array.isArray(tasks)) {
      continue
    }

    for (var j = 0; j < tasks.length; j++) {

      if (!tasks[j]) {
        continue
      }

      var task =
        Object.assign({}, tasks[j])

      task.date =
        date

      result.push(task)

    }

  }


  return result

}


// ============================================================
// 日期字符串加 N 天 → "YYYY-MM-DD"
// ============================================================

function addDays(dateStr, n) {

  var parts =
    String(dateStr || "").split("-")

  if (parts.length !== 3) {
    return ""
  }

  var d =
    new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    )

  d.setDate(d.getDate() + n)

  return formatDate(d)

}


// ============================================================
// 时间戳 → "YYYY-MM-DD"（无效返回 ""）
// ============================================================

function tsToDate(timestamp) {

  var ts =
    Number(timestamp)

  if (!ts) {
    return ""
  }

  return formatDate(
    new Date(ts)
  )

}


// ============================================================
// 日期范围
//
// type: "today" | "week" | "month"
// referenceDate: "YYYY-MM-DD" 或 Date 对象，默认今天
// 返回 { startDate, endDate }
//
// custom 范围由调用方直接传入 startDate / endDate，不在此计算。
// ============================================================

function getDateRange(type, referenceDate) {

  var refStr = ""

  if (referenceDate instanceof Date) {

    refStr = formatDate(referenceDate)

  } else if (
    typeof referenceDate === "string" &&
    referenceDate
  ) {

    refStr = referenceDate

  } else {

    refStr = common.getToday()

  }

  var parts =
    refStr.split("-")

  if (parts.length !== 3) {
    return { startDate: "", endDate: "" }
  }

  var year = Number(parts[0])
  var month = Number(parts[1])
  var day = Number(parts[2])

  var refDate =
    new Date(year, month - 1, day)


  if (type === "today") {
    return { startDate: refStr, endDate: refStr }
  }


  if (type === "week") {

    var dow = refDate.getDay()

    if (dow === 0) {
      dow = 7
    }

    var monday =
      new Date(year, month - 1, day - dow + 1)

    var sunday =
      new Date(year, month - 1, day - dow + 7)

    return {
      startDate: formatDate(monday),
      endDate: formatDate(sunday)
    }

  }


  if (type === "month") {

    var first =
      new Date(year, month - 1, 1)

    var last =
      new Date(year, month, 0)

    return {
      startDate: formatDate(first),
      endDate: formatDate(last)
    }

  }


  return { startDate: "", endDate: "" }

}


// ============================================================
// 判断日期是否在 [startDate, endDate] 范围内（含边界）
// ============================================================

function isDateInRange(dateStr, startDate, endDate) {

  if (!dateStr) {
    return false
  }

  if (startDate && dateStr < startDate) {
    return false
  }

  if (endDate && dateStr > endDate) {
    return false
  }

  return true

}


// ============================================================
// 判断日期是否在最近 N 天内（含今天）
// ============================================================

function isDateRecent(dateStr, days, today) {

  if (!dateStr) {
    return false
  }

  var todayStr =
    today || common.getToday()

  var fromStr =
    addDays(todayStr, -(days - 1))

  return (
    dateStr >= fromStr &&
    dateStr <= todayStr
  )

}


// ============================================================
// 生成日期列表（正序，含起止边界）
// ============================================================

function buildDateList(startDate, endDate) {

  var list = []

  if (!startDate || !endDate) {
    return list
  }

  var cur = startDate
  var guard = 0

  while (cur <= endDate && guard < 400) {

    list.push(cur)

    cur = addDays(cur, 1)
    guard++

  }

  return list

}


// ============================================================
// 学习统计（兼容旧数据：缺失字段按 0 / 空处理）
//
// 输入：learningHistory
// 返回：totalMinutes / count / days / averageMinutes /
//       typeList / recent7Minutes / recent30Minutes
// ============================================================

function getLearningStats(learningHistory, options) {

  var list =
    learningHistory || []

  options = options || {}

  var today =
    common.getToday()

  var range =
    options.range || null


  // 按日期范围筛选（不传范围则统计全部）
  var filtered = list

  if (range && (range.startDate || range.endDate)) {

    filtered = []

    for (var i = 0; i < list.length; i++) {

      if (
        isDateInRange(
          list[i] && list[i].date,
          range.startDate,
          range.endDate
        )
      ) {

        filtered.push(list[i])

      }

    }

  }


  var summary =
    summarizeStudy(filtered)

  var averageMinutes =
    summary.count > 0
      ? Math.round(summary.totalMinutes / summary.count)
      : 0


  // 最近 7 / 30 天（基于全部记录，不受 range 影响）
  var recent7Minutes = 0
  var recent30Minutes = 0

  for (var j = 0; j < list.length; j++) {

    var item = list[j]

    if (!item || !item.date) {
      continue
    }

    var minutes =
      Number(item.minutes) || 0

    if (isDateRecent(item.date, 7, today)) {
      recent7Minutes += minutes
    }

    if (isDateRecent(item.date, 30, today)) {
      recent30Minutes += minutes
    }

  }


  return {
    totalMinutes: summary.totalMinutes,
    count: summary.count,
    days: summary.days,
    averageMinutes: averageMinutes,
    typeList: summary.typeList,
    recent7Minutes: recent7Minutes,
    recent30Minutes: recent30Minutes
  }

}


// ============================================================
// 教学统计（课程状态统一走 common.getCourseStatus）
//
// 输入：courses
// 返回：total / completed / inProgress / pending / leave /
//       cancelled / completionRate / recent7Count / recent30Count
//
// 其中「授课数量」（recent7Count / recent30Count）统计已完成课程。
// ============================================================

function getTeachingStats(courses, options) {

  var list =
    courses || []

  options = options || {}

  var today =
    common.getToday()


  var total = 0
  var completed = 0
  var inProgress = 0
  var pending = 0
  var leave = 0
  var cancelled = 0


  for (var i = 0; i < list.length; i++) {

    var course = list[i]

    if (!course) {
      continue
    }

    total++

    var status =
      common.getCourseStatus(course, today)

    if (status === "已完成") {
      completed++
    } else if (status === "进行中") {
      inProgress++
    } else if (status === "待开始") {
      pending++
    } else if (status === "学生请假") {
      leave++
    } else if (status === "已取消") {
      cancelled++
    }

  }


  var completionRate =
    total > 0
      ? Math.round(completed / total * 100)
      : 0


  // 最近 7 / 30 天已完成授课数量
  var recent7Count = 0
  var recent30Count = 0

  for (var j = 0; j < list.length; j++) {

    var c = list[j]

    if (!c || !c.date) {
      continue
    }

    if (common.getCourseStatus(c, today) !== "已完成") {
      continue
    }

    if (isDateRecent(c.date, 7, today)) {
      recent7Count++
    }

    if (isDateRecent(c.date, 30, today)) {
      recent30Count++
    }

  }


  return {
    total: total,
    completed: completed,
    inProgress: inProgress,
    pending: pending,
    leave: leave,
    cancelled: cancelled,
    completionRate: completionRate,
    recent7Count: recent7Count,
    recent30Count: recent30Count
  }

}


// ============================================================
// 任务统计（复用 task.js 的 normalizeTask / getTaskSummary）
//
// 输入：todoList（日期 Map，不修改存储结构）
// 返回：total / completed / remaining / overdue / completionRate /
//       todayCount / recent7Done / recent30Done /
//       priorityHigh / priorityMedium / priorityLow
// ============================================================

function getTaskStats(todoList, options) {

  var today =
    common.getToday()

  var allTasks =
    flattenTodoList(todoList)


  var normalized = []

  for (var i = 0; i < allTasks.length; i++) {

    normalized.push(
      taskUtil.normalizeTask(
        allTasks[i],
        allTasks[i].date
      )
    )

  }


  var summary =
    taskUtil.getTaskSummary(normalized, today)


  var priorityHigh = 0
  var priorityMedium = 0
  var priorityLow = 0
  var todayCount = 0
  var recent7Done = 0
  var recent30Done = 0


  for (var j = 0; j < normalized.length; j++) {

    var t = normalized[j]

    if (t.priority === "高") {
      priorityHigh++
    } else if (t.priority === "中") {
      priorityMedium++
    } else if (t.priority === "低") {
      priorityLow++
    }

    if (t.date === today) {
      todayCount++
    }

    if (t.completed) {

      var doneDate =
        tsToDate(t.completedAt) || t.date

      if (isDateRecent(doneDate, 7, today)) {
        recent7Done++
      }

      if (isDateRecent(doneDate, 30, today)) {
        recent30Done++
      }

    }

  }


  return {
    total: summary.total,
    completed: summary.completed,
    remaining: summary.remaining,
    overdue: summary.overdue,
    completionRate: summary.completionRate,
    todayCount: todayCount,
    recent7Done: recent7Done,
    recent30Done: recent30Done,
    priorityHigh: priorityHigh,
    priorityMedium: priorityMedium,
    priorityLow: priorityLow
  }

}


// ============================================================
// 项目统计（复用 project.js 的 normalizeProject / getProjectStats）
//
// 手动进度 project.progress 与任务完成率是两个独立指标，不混用。
// ============================================================

function getProjectsStats(projects, todoList, learningHistory) {

  projects = projects || []

  var allTasks =
    flattenTodoList(todoList)

  learningHistory = learningHistory || []


  var total = projects.length
  var activeCount = 0
  var doneCount = 0
  var pausedCount = 0
  var progressSum = 0
  var linkedTaskTotal = 0
  var linkedTaskDone = 0
  var linkedLearningMinutes = 0


  for (var i = 0; i < projects.length; i++) {

    var p =
      projectUtil.normalizeProject(projects[i])

    if (!p) {
      continue
    }

    if (p.status === "已完成") {
      doneCount++
    } else if (p.status === "已暂停") {
      pausedCount++
    } else {
      activeCount++
    }

    progressSum += p.progress

    var s =
      projectUtil.getProjectStats(
        p.id,
        allTasks,
        learningHistory
      )

    linkedTaskTotal += s.taskTotal
    linkedTaskDone += s.taskDone
    linkedLearningMinutes += s.learningMinutes

  }


  var averageProgress =
    total > 0
      ? Math.round(progressSum / total)
      : 0

  var linkedTaskCompletionRate =
    linkedTaskTotal > 0
      ? Math.round(linkedTaskDone / linkedTaskTotal * 100)
      : 0


  return {
    total: total,
    activeCount: activeCount,
    doneCount: doneCount,
    pausedCount: pausedCount,
    averageProgress: averageProgress,
    linkedTaskTotal: linkedTaskTotal,
    linkedTaskDone: linkedTaskDone,
    linkedTaskCompletionRate: linkedTaskCompletionRate,
    linkedLearningMinutes: linkedLearningMinutes
  }

}


// ============================================================
// 笔记统计（复用 note.js 的 normalizeNote / getNoteStats）
//
// 输入：notes
// 返回：total / typeMap / linkedCount /
//       recent7Created / recent30Created
// ============================================================

function getNotesStats(notes) {

  notes = notes || []

  var stats =
    noteUtil.getNoteStats(notes)

  var today =
    common.getToday()


  var linkedCount = 0
  var recent7Created = 0
  var recent30Created = 0


  for (var i = 0; i < notes.length; i++) {

    var n =
      noteUtil.normalizeNote(notes[i])

    if (!n) {
      continue
    }

    if (n.projectId) {
      linkedCount++
    }

    var createdDate =
      tsToDate(n.createdAt)

    if (isDateRecent(createdDate, 7, today)) {
      recent7Created++
    }

    if (isDateRecent(createdDate, 30, today)) {
      recent30Created++
    }

  }


  return {
    total: stats.total,
    typeMap: stats.typeMap,
    linkedCount: linkedCount,
    recent7Created: recent7Created,
    recent30Created: recent30Created
  }

}


// ============================================================
// 每日趋势（正序）
//
// 每天返回：date / learningMinutes / teachingCount /
//           taskCompleted / noteCreated
// ============================================================

function getDailyStats(startDate, endDate, data) {

  data = data || {}

  var courses = data.courses || []
  var learningHistory = data.learningHistory || []
  var todoList = data.todoList || {}
  var notes = data.notes || []

  var dates =
    buildDateList(startDate, endDate)


  var map = {}

  for (var i = 0; i < dates.length; i++) {

    map[dates[i]] = {
      date: dates[i],
      learningMinutes: 0,
      teachingCount: 0,
      taskCompleted: 0,
      noteCreated: 0
    }

  }


  var j


  // 学习分钟数
  for (j = 0; j < learningHistory.length; j++) {

    var l = learningHistory[j]

    if (!l || !l.date) {
      continue
    }

    var bucket = map[l.date]

    if (bucket) {
      bucket.learningMinutes += Number(l.minutes) || 0
    }

  }


  // 教学（已完成课程）
  for (j = 0; j < courses.length; j++) {

    var c = courses[j]

    if (!c || !c.date) {
      continue
    }

    var cb = map[c.date]

    if (!cb) {
      continue
    }

    if (common.getCourseStatus(c) === "已完成") {
      cb.teachingCount++
    }

  }


  // 任务完成
  var allTasks =
    flattenTodoList(todoList)

  for (j = 0; j < allTasks.length; j++) {

    var t = allTasks[j]

    if (!t || !t.completed) {
      continue
    }

    var doneDate =
      tsToDate(t.completedAt) || t.date

    var tb = map[doneDate]

    if (tb) {
      tb.taskCompleted++
    }

  }


  // 笔记新增
  for (j = 0; j < notes.length; j++) {

    var n = notes[j]

    if (!n) {
      continue
    }

    var createdDate =
      tsToDate(n.createdAt)

    var nb = map[createdDate]

    if (nb) {
      nb.noteCreated++
    }

  }


  var result = []

  for (j = 0; j < dates.length; j++) {
    result.push(map[dates[j]])
  }

  return result

}


// ============================================================
// 按日期范围筛选课程
// ============================================================

function filterCoursesByRange(courses, range) {

  courses = courses || []

  if (!range || (!range.startDate && !range.endDate)) {
    return courses
  }

  var result = []

  for (var i = 0; i < courses.length; i++) {

    var c = courses[i]

    if (c && isDateInRange(c.date, range.startDate, range.endDate)) {
      result.push(c)
    }

  }

  return result

}


// ============================================================
// 按日期范围筛选学习记录
// ============================================================

function filterLearningByRange(list, range) {

  list = list || []

  if (!range || (!range.startDate && !range.endDate)) {
    return list
  }

  var result = []

  for (var i = 0; i < list.length; i++) {

    var l = list[i]

    if (l && isDateInRange(l.date, range.startDate, range.endDate)) {
      result.push(l)
    }

  }

  return result

}


// ============================================================
// 按日期范围筛选任务（todoList 日期 Map，不修改原结构）
// ============================================================

function filterTodoListByRange(todoList, range) {

  todoList = todoList || {}

  if (!range || (!range.startDate && !range.endDate)) {
    return todoList
  }

  var result = {}

  var keys = Object.keys(todoList)

  for (var i = 0; i < keys.length; i++) {

    var date = keys[i]

    if (isDateInRange(date, range.startDate, range.endDate)) {
      result[date] = todoList[date]
    }

  }

  return result

}


// ============================================================
// 按创建时间范围筛选笔记
// ============================================================

function filterNotesByRange(notes, range) {

  notes = notes || []

  if (!range || (!range.startDate && !range.endDate)) {
    return notes
  }

  var result = []

  for (var i = 0; i < notes.length; i++) {

    var n = notes[i]

    if (n && isDateInRange(tsToDate(n.createdAt), range.startDate, range.endDate)) {
      result.push(n)
    }

  }

  return result

}


// ============================================================
// 课后反馈统计
//
// 输入：courses（通常为筛选到范围内的课程）+ history（全部反馈）
// 返回：feedbackCount（已完成课程中已反馈）/ expectedCount（已完成课程数）/ rate
// ============================================================

function getFeedbackStats(courses, history) {

  courses = courses || []
  history = history || []

  var expectedCount = 0
  var feedbackCount = 0

  for (var i = 0; i < courses.length; i++) {

    var c = courses[i]

    if (!c || !c.id) {
      continue
    }

    if (common.getCourseStatus(c) !== "已完成") {
      continue
    }

    expectedCount++

    var hasFeedback = false

    for (var h = 0; h < history.length; h++) {

      var r = history[h]

      if (
        r &&
        r.type === "feedback" &&
        String(r.courseId) === String(c.id)
      ) {
        hasFeedback = true
        break
      }

    }

    if (hasFeedback) {
      feedbackCount++
    }

  }

  var rate = expectedCount > 0
    ? Math.round(feedbackCount / expectedCount * 100)
    : 0

  return {
    feedbackCount: feedbackCount,
    expectedCount: expectedCount,
    rate: rate
  }

}


// ============================================================
// 综合统计
//
// 一次返回五大模块统计，供数据中心页面 / 后续页面复用。
// 不产生重复存储，不修改原始数据。
//
// options.range：可选日期范围 { startDate, endDate }
//   learning / teaching / tasks 按 range 筛选
//   projects / notes 统计全部（项目为长期对象，笔记总数为全量）
// ============================================================

function getDashboardStats(options) {

  options = options || {}

  var range = options.range || null

  return {
    learning: getLearningStats(
      filterLearningByRange(options.learningHistory, range)
    ),
    teaching: getTeachingStats(
      filterCoursesByRange(options.courses, range)
    ),
    tasks: getTaskStats(
      filterTodoListByRange(options.todoList, range)
    ),
    projects: getProjectsStats(
      options.projects,
      options.todoList,
      options.learningHistory
    ),
    notes: getNotesStats(options.notes)
  }

}


// ============================================================
// 计算两个日期之间的天数（含起止）
// ============================================================

function countDays(startDate, endDate) {

  if (!startDate || !endDate) {
    return 0
  }

  var start = new Date(String(startDate).replace(/-/g, "/"))
  var end = new Date(String(endDate).replace(/-/g, "/"))

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0
  }

  return Math.round((end - start) / 86400000) + 1

}


// ============================================================
// 上一周期范围（用于周期对比）
// ============================================================

function getPreviousRange(type, referenceDate) {

  var cur = getDateRange(type, referenceDate)

  if (!cur.startDate) {
    return { startDate: "", endDate: "" }
  }

  if (type === "today") {
    var prevDay = addDays(cur.startDate, -1)
    return { startDate: prevDay, endDate: prevDay }
  }

  if (type === "week") {
    return {
      startDate: addDays(cur.startDate, -7),
      endDate: addDays(cur.endDate, -7)
    }
  }

  if (type === "month") {
    var parts = cur.startDate.split("-")
    var y = Number(parts[0])
    var m = Number(parts[1])
    return {
      startDate: formatDate(new Date(y, m - 2, 1)),
      endDate: formatDate(new Date(y, m - 1, 0))
    }
  }

  return { startDate: "", endDate: "" }

}


// ============================================================
// 周期对比（What Changed）
//
// 返回 { learning, teaching, tasks }，每项：
//   { current, previous, delta, percent }
//   percent 在 previous 为 0 时为 null（表示无历史数据）
//
// 口径：
//   learning = 范围内学习分钟数
//   teaching = 范围内排课数（course.date 落在范围内）
//   tasks    = 范围内完成任务数（按完成日期）
// ============================================================

function getComparison(period, data) {

  data = data || {}

  var range = getDateRange(period)
  var prevRange = getPreviousRange(period)

  function metric(current, previous) {
    var delta = current - previous
    var percent = null
    if (previous > 0) {
      percent = Math.round(delta / previous * 1000) / 10
    }
    return {
      current: current,
      previous: previous,
      delta: delta,
      percent: percent
    }
  }

  return {
    learning: metric(
      sumLearningMinutesInRange(data.learningHistory, range),
      sumLearningMinutesInRange(data.learningHistory, prevRange)
    ),
    teaching: metric(
      countScheduledCourses(data.courses, range),
      countScheduledCourses(data.courses, prevRange)
    ),
    tasks: metric(
      countCompletedTasks(data.todoList, range),
      countCompletedTasks(data.todoList, prevRange)
    )
  }

}


// ============================================================
// 对比辅助：范围内学习分钟数 / 排课数 / 完成任务数
// ============================================================

function sumLearningMinutesInRange(list, range) {

  var total = 0
  list = list || []

  for (var i = 0; i < list.length; i++) {
    var l = list[i]
    if (l && isDateInRange(l.date, range.startDate, range.endDate)) {
      total += Number(l.minutes) || 0
    }
  }

  return total

}

function countScheduledCourses(courses, range) {

  var count = 0
  courses = courses || []

  for (var i = 0; i < courses.length; i++) {
    var c = courses[i]
    if (c && isDateInRange(c.date, range.startDate, range.endDate)) {
      count++
    }
  }

  return count

}

function countCompletedTasks(todoList, range) {

  var allTasks = flattenTodoList(todoList)
  var count = 0

  for (var i = 0; i < allTasks.length; i++) {
    var t = allTasks[i]
    if (!t || !t.completed) {
      continue
    }
    var doneDate = tsToDate(t.completedAt) || t.date
    if (isDateInRange(doneDate, range.startDate, range.endDate)) {
      count++
    }
  }

  return count

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  formatDate: formatDate,
  summarizeStudy: summarizeStudy,
  getDailyStudy: getDailyStudy,
  flattenTodoList: flattenTodoList,

  addDays: addDays,
  tsToDate: tsToDate,
  getDateRange: getDateRange,
  isDateInRange: isDateInRange,
  isDateRecent: isDateRecent,
  buildDateList: buildDateList,

  getLearningStats: getLearningStats,
  getTeachingStats: getTeachingStats,
  getTaskStats: getTaskStats,
  getProjectsStats: getProjectsStats,
  getNotesStats: getNotesStats,
  getDailyStats: getDailyStats,
  getDashboardStats: getDashboardStats,

  filterCoursesByRange: filterCoursesByRange,
  filterLearningByRange: filterLearningByRange,
  filterTodoListByRange: filterTodoListByRange,
  filterNotesByRange: filterNotesByRange,
  getFeedbackStats: getFeedbackStats,
  countDays: countDays,

  getPreviousRange: getPreviousRange,
  getComparison: getComparison
}
