// ============================================================
// 时间线工具函数
//
// 从现有数据（课程 / 任务 / 学习记录 / 笔记 / 反馈）实时计算活动流，
// 不新增持久化 storage。
// ============================================================

var common = require("./common.js")


// ============================================================
// 把 "YYYY-MM-DD" + "HH:mm" 组合成时间戳
// 使用 "/" 分隔，避免 iOS 解析问题。
// ============================================================

function dateTimeToTimestamp(date, time) {

  if (!date) {
    return 0
  }

  var dateStr = String(date).replace(/-/g, "/")

  var full = time ? (dateStr + " " + time) : dateStr

  var d = new Date(full)

  return isNaN(d.getTime()) ? 0 : d.getTime()

}


// ============================================================
// 时间戳 → "YYYY-MM-DD"
// ============================================================

function timestampToDate(timestamp) {

  if (!timestamp) {
    return ""
  }

  var d = new Date(timestamp)

  var y = d.getFullYear()
  var m = d.getMonth() + 1
  var day = d.getDate()

  if (m < 10) m = "0" + m
  if (day < 10) day = "0" + day

  return y + "-" + m + "-" + day

}


// ============================================================
// 时间戳 → "HH:mm"
// ============================================================

function timestampToTime(timestamp) {

  if (!timestamp) {
    return ""
  }

  var d = new Date(timestamp)

  var h = d.getHours()
  var m = d.getMinutes()

  if (h < 10) h = "0" + h
  if (m < 10) m = "0" + m

  return h + ":" + m

}


// ============================================================
// 归一化时间线项目（补默认值，兼容缺字段）
// ============================================================

function normalizeTimelineItem(item) {

  if (!item) {
    return null
  }

  return {
    id: item.id || "",
    type: item.type || "",
    sourceId: item.sourceId || "",
    projectId: item.projectId || "",
    title: item.title || "",
    description: item.description || "",
    date: item.date || "",
    timeText: item.timeText || "",
    sortTime: item.sortTime || 0,
    meta: item.meta || {}
  }

}


// ============================================================
// 按时间倒序排序
// ============================================================

function sortTimeline(items) {

  var list = (items || []).slice()

  list.sort(function (a, b) {
    return (b.sortTime || 0) - (a.sortTime || 0)
  })

  return list

}


// ============================================================
// 时间线类型中文名
// ============================================================

function getTimelineTypeText(type) {

  if (type === "learning") {
    return "Learning"
  }

  if (type === "task_done") {
    return "Task"
  }

  if (type === "note") {
    return "Note"
  }

  if (type === "course_done") {
    return "Teaching"
  }

  if (type === "feedback_done") {
    return "Feedback"
  }

  return "Activity"

}


// ============================================================
// 笔记类型中文 → 英文显示
// ============================================================

function getNoteTypeText(type) {

  var map = {
    "学习": "Learning",
    "备课": "Lesson Prep",
    "工作": "Work",
    "灵感": "Ideas",
    "其他": "Other"
  }

  return map[type] || type || "Learning"

}


// ============================================================
// 日期分组显示文字：今天 / 昨天 / 2026年9月14日
// ============================================================

function formatTimelineDate(dateStr) {

  if (!dateStr) {
    return ""
  }

  var today = common.getToday()

  if (dateStr === today) {
    return "Today"
  }

  var yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  var yY = yesterday.getFullYear()
  var yM = yesterday.getMonth() + 1
  var yD = yesterday.getDate()
  if (yM < 10) yM = "0" + yM
  if (yD < 10) yD = "0" + yD

  if (dateStr === (yY + "-" + yM + "-" + yD)) {
    return "Yesterday"
  }

  return common.formatDateText(dateStr)

}


// ============================================================
// 从现有数据构建时间线（实时计算）
//
// 输入：{ courses, todoList, learningHistory, notes, history, projects }
// 输出：统一 timeline 数组（已按时间倒序）
// ============================================================

function buildTimelineData(data) {

  var items = []

  data = data || {}

  var courses = data.courses || []
  var todoData = data.todoList || {}
  var learningHistory = data.learningHistory || []
  var notes = data.notes || []
  var history = data.history || []
  var projects = data.projects || []


  // 项目名映射
  var projectNameMap = {}
  projects.forEach(function (p) {
    projectNameMap[p.id] = p.name
  })


  // =====================================================
  // A. 学习记录
  // =====================================================
  learningHistory.forEach(function (l) {
    if (!l) return

    var ts = dateTimeToTimestamp(l.date, l.time)

    items.push({
      id: "learning_" + (l.id || ts || Date.now()),
      type: "learning",
      sourceId: l.id || "",
      projectId: l.projectId || "",
      title: l.topic || "Learning Record",
      description: "Learning " + (Number(l.minutes) || 0) + " min",
      date: l.date || timestampToDate(ts),
      timeText: l.time || timestampToTime(ts),
      sortTime: ts,
      meta: { type: l.type || "" }
    })
  })


  // =====================================================
  // B. 已完成任务（只处理 completed=true）
  // =====================================================
  var dateKeys = Object.keys(todoData)

  dateKeys.forEach(function (dateKey) {
    var tasks = todoData[dateKey] || []
    if (!Array.isArray(tasks)) return

    tasks.forEach(function (t) {
      if (!t || !t.completed) return

      var ts = t.completedAt || t.createdAt || 0

      items.push({
        id: "task_" + (t.id || ts || Date.now()),
        type: "task_done",
        sourceId: t.id || "",
        projectId: t.projectId || "",
        title: "Completed task: " + (t.text || "Untitled task"),
        description:
          (t.projectId && projectNameMap[t.projectId])
            ? "Project: " + projectNameMap[t.projectId]
            : "",
        date: timestampToDate(ts) || dateKey,
        timeText: timestampToTime(ts),
        sortTime: ts,
        meta: {}
      })
    })
  })


  // =====================================================
  // C. 笔记（最近更新）
  // =====================================================
  notes.forEach(function (n) {
    if (!n) return

    var createdAt = n.createdAt || 0
    var updatedAt = n.updatedAt || createdAt || 0

    var isUpdate =
      updatedAt &&
      createdAt &&
      updatedAt !== createdAt

    items.push({
      id: "note_" + (n.id || updatedAt || Date.now()),
      type: "note",
      sourceId: n.id || "",
      projectId: n.projectId || "",
      title:
        (isUpdate ? "Updated note: " : "Created note: ") +
        (n.title || "Untitled note"),
      description:
        getNoteTypeText(n.type) +
        ((n.projectId && projectNameMap[n.projectId])
          ? " · Project: " + projectNameMap[n.projectId]
          : ""),
      date: timestampToDate(updatedAt),
      timeText: timestampToTime(updatedAt),
      sortTime: updatedAt,
      meta: {}
    })
  })


  // =====================================================
  // D. 已完成课程
  // =====================================================
  courses.forEach(function (c) {
    if (!c) return

    if (common.getCourseStatus(c) !== "已完成") return

    var date = c.date || ""
    var endTime = c.endTime || c.startTime || c.time || ""

    var ts = dateTimeToTimestamp(date, endTime)

    items.push({
      id: "course_" + (c.id || ts || Date.now()),
      type: "course_done",
      sourceId: c.id || "",
      projectId: "",
      title:
        "Completed teaching: " +
        (c.student || "Student") +
        (c.topic ? " · " + c.topic : ""),
      description:
        common.getGradeText(c.grade) +
        (c.subject ? " · " + common.getSubjectText(c.subject) : ""),
      date: date || timestampToDate(ts),
      timeText: endTime || timestampToTime(ts),
      sortTime: ts,
      meta: {}
    })
  })


  // =====================================================
  // E. 课后反馈
  // =====================================================
  history.forEach(function (h) {
    if (!h || h.type !== "feedback") return

    var ts = h.savedAt || h.time || 0

    if (typeof ts === "string") {
      var parsed = new Date(String(ts).replace(/-/g, "/")).getTime()
      ts = isNaN(parsed) ? 0 : parsed
    }

    ts = Number(ts) || 0

    items.push({
      id: "feedback_" + (h.id || ts || Date.now()),
      type: "feedback_done",
      sourceId: h.courseId || "",
      projectId: "",
      title: "Completed feedback: " + (h.student || "Student"),
      description: h.topic || "",
      date: timestampToDate(ts) || h.date || "",
      timeText: timestampToTime(ts),
      sortTime: ts,
      meta: {}
    })
  })


  // 排序
  return sortTimeline(items)

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  dateTimeToTimestamp: dateTimeToTimestamp,
  timestampToDate: timestampToDate,
  timestampToTime: timestampToTime,
  normalizeTimelineItem: normalizeTimelineItem,
  sortTimeline: sortTimeline,
  getTimelineTypeText: getTimelineTypeText,
  formatTimelineDate: formatTimelineDate,
  buildTimelineData: buildTimelineData
}
