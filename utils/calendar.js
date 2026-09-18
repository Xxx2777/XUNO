// ============================================================
// 统一日历工具函数
//
// 把课程 / 任务 / 项目 / 学习记录实时转换成统一的日历事件，
// 供日历页聚合展示。
//
// 事件结构：
//   { id, type, sourceId, title, description, date, time,
//     projectId, projectName, completed, typeText, sortMinutes,
//     ...(渲染辅助字段) }
//
// type 取值（内部英文，不对用户展示）：
//   course / task / project / learning
//
// 只读数据，不新增 storage。删除课程、完成任务、修改项目截止日期后，
// 日历在 onShow / 刷新时自动同步。
// ============================================================

var common = require("./common.js")

var statsUtil = require("./stats.js")


// ============================================================
// 事件类型中文名
// ============================================================

function getEventTypeText(type) {

  if (type === "course") {
    return "Teaching"
  }

  if (type === "task") {
    return "Task"
  }

  if (type === "project") {
    return "Project"
  }

  if (type === "learning") {
    return "Learning"
  }

  return "Event"

}


// ============================================================
// 解析截止时间字段
//
// 支持 "YYYY-MM-DD" 与 "YYYY-MM-DD HH:mm"（或带 T 分隔）。
// 返回 { date: "YYYY-MM-DD", time: "HH:mm" }。
// time 只在确实含时间时才返回，不虚构时间。
// ============================================================

function splitDeadline(deadline) {

  var raw =
    String(deadline || "").trim()

  if (!raw) {
    return { date: "", time: "" }
  }

  var date =
    raw.substring(0, 10)

  var rest =
    raw.substring(10).trim()

  rest =
    rest.replace(/^[T\s]+/, "")

  var timeMatch =
    rest.match(/^(\d{1,2}:\d{2})/)

  var time =
    timeMatch ? timeMatch[1] : ""

  return { date: date, time: time }

}


// ============================================================
// 课程事件
//
// title 优先「学生 · 知识点」，字段缺失时降级。
// time 展示为 startTime - endTime。
// ============================================================

function buildCourseEvent(course) {

  var student =
    course.student || ""

  var topic =
    course.topic || ""

  var title = ""

  if (student && topic) {
    title = student + " · " + topic
  } else if (student) {
    title = student
  } else if (topic) {
    title = topic
  } else {
    title = "Course"
  }

  var grade =
    common.getGradeText(course.grade)

  var subject =
    common.getSubjectText(course.subject)

  var description =
    grade
      ? grade + " · " + subject
      : subject

  var startTime =
    course.startTime || course.time || ""

  var endTime =
    course.endTime || ""

  var timeText =
    startTime

  if (endTime) {
    timeText += " - " + endTime
  }

  return {

    id:
      "course_" + course.id,

    type:
      "course",

    sourceId:
      course.id,

    title:
      title,

    description:
      description,

    date:
      course.date || "",

    time:
      timeText,

    projectId:
      "",

    projectName:
      "",

    completed:
      false,

    typeText:
      "Teaching",

    sortMinutes:
      common.timeToMinutes(startTime),

    // 课程卡片渲染字段（保留原卡片视觉）
    student:
      student,

    grade:
      grade,

    topic:
      topic,

    startTime:
      startTime || "TBD",

    endTime:
      endTime || "TBD",

    repeat:
      !!course.repeat,

    statusText:
      common.getCourseStatusText(
        common.getCourseStatus(course)
      )

  }

}


// ============================================================
// 任务事件（按任务所属日期 task.date 显示，不依赖 deadline）
// ============================================================

function buildTaskEvent(task, projectNameMap) {

  return {

    id:
      "task_" + task.id,

    type:
      "task",

    sourceId:
      task.id,

    title:
      task.text || "Untitled Task",

    description:
      task.completed
        ? "Completed"
        : (task.deadline
          ? "Due " + task.deadline
          : "Pending"),

    date:
      task.date || "",

    time:
      "",

    projectId:
      task.projectId || "",

    projectName:
      (task.projectId && projectNameMap[task.projectId])
        ? projectNameMap[task.projectId]
        : "",

    completed:
      !!task.completed,

    typeText:
      "Task",

    sortMinutes:
      null,

    priority:
      task.priority || "",

    priorityText:
      common.getPriorityText(task.priority)

  }

}


// ============================================================
// 项目事件（仅存在 deadline 的项目进入日历）
// ============================================================

function buildProjectEvent(project) {

  var split =
    splitDeadline(project.deadline)

  if (!split.date) {
    return null
  }

  var status =
    project.status || "进行中"

  return {

    id:
      "project_" + project.id,

    type:
      "project",

    sourceId:
      project.id,

    title:
      project.name || "Untitled Project",

    description:
      "Project due",

    date:
      split.date,

    time:
      split.time,

    projectId:
      project.id,

    projectName:
      "",

    completed:
      status === "已完成",

    typeText:
      "Project",

    sortMinutes:
      split.time
        ? common.timeToMinutes(split.time)
        : null,

    statusText:
      common.getProjectStatusText(status)

  }

}


// ============================================================
// 学习记录事件（存在 date 的学习记录进入日历）
//
// 学习记录是「已发生的事情」，用弱化历史视觉，不当待办。
// ============================================================

function buildLearningEvent(learning, projectNameMap, index) {

  if (!learning.date) {
    return null
  }

  var sourceId =
    (learning.id !== undefined && learning.id !== null)
      ? learning.id
      : ("L" + index)

  var minutes =
    Number(learning.minutes) || 0

  return {

    id:
      "learning_" + sourceId + "_" + index,

    type:
      "learning",

    sourceId:
      sourceId,

    title:
      learning.topic || "Learning Record",

    description:
      "Learning " + minutes + " min",

    date:
      learning.date,

    time:
      learning.time || "",

    projectId:
      learning.projectId || "",

    projectName:
      (learning.projectId && projectNameMap[learning.projectId])
        ? projectNameMap[learning.projectId]
        : "",

    completed:
      false,

    typeText:
      "Learning",

    sortMinutes:
      learning.time
        ? common.timeToMinutes(learning.time)
        : null

  }

}


// ============================================================
// 构建全量日历事件（实时计算，不落 storage）
//
// 输入：{ courses, todoList, projects, learningHistory }
// 输出：统一事件数组（未排序）
// ============================================================

function buildCalendarEvents(data) {

  data =
    data || {}

  var courses =
    data.courses || []

  var todoList =
    data.todoList || {}

  var projects =
    data.projects || []

  var learningHistory =
    data.learningHistory || []


  // 项目名映射（projectId → 项目名）
  var projectNameMap = {}

  for (var p = 0; p < projects.length; p++) {

    var proj =
      projects[p]

    if (proj && proj.id) {
      projectNameMap[proj.id] = proj.name
    }

  }


  var events = []

  var i


  // =====================================================
  // A. 课程
  // =====================================================

  for (i = 0; i < courses.length; i++) {

    var course =
      courses[i]

    if (!course || !course.id || !course.date) {
      continue
    }

    events.push(buildCourseEvent(course))

  }


  // =====================================================
  // B. 任务（展开 todoList，仅取有 deadline 的）
  // =====================================================

  var allTasks =
    statsUtil.flattenTodoList(todoList)

  for (i = 0; i < allTasks.length; i++) {

    var taskEvent =
      buildTaskEvent(allTasks[i], projectNameMap)

    if (taskEvent) {
      events.push(taskEvent)
    }

  }


  // =====================================================
  // C. 项目（仅取有 deadline 的）
  // =====================================================

  for (i = 0; i < projects.length; i++) {

    var project =
      projects[i]

    if (!project || !project.id) {
      continue
    }

    var projectEvent =
      buildProjectEvent(project)

    if (projectEvent) {
      events.push(projectEvent)
    }

  }


  // =====================================================
  // D. 学习记录（有 date 的）
  // =====================================================

  for (i = 0; i < learningHistory.length; i++) {

    var learning =
      learningHistory[i]

    if (!learning) {
      continue
    }

    var learningEvent =
      buildLearningEvent(learning, projectNameMap, i)

    if (learningEvent) {
      events.push(learningEvent)
    }

  }


  return events

}


// ============================================================
// 事件排序
//
// 1. 有明确时间的按时间升序在前
// 2. 没有时间的放在后面
// 3. 同时间 / 无时间保持稳定（构建顺序）
// ============================================================

function sortEvents(events) {

  var list =
    (events || []).slice()

  list.sort(function (a, b) {

    var hasA =
      a.sortMinutes !== null &&
      a.sortMinutes !== undefined

    var hasB =
      b.sortMinutes !== null &&
      b.sortMinutes !== undefined

    if (hasA && hasB) {
      return a.sortMinutes - b.sortMinutes
    }

    if (hasA && !hasB) {
      return -1
    }

    if (!hasA && hasB) {
      return 1
    }

    return 0

  })

  return list

}


// ============================================================
// 当天概览
//
// 返回 { total, courseCount, taskCount, projectCount, learningCount }
// ============================================================

function getDayOverview(events) {

  var list =
    events || []

  var overview = {

    total:
      list.length,

    courseCount: 0,
    taskCount: 0,
    projectCount: 0,
    learningCount: 0

  }

  for (var i = 0; i < list.length; i++) {

    var type =
      list[i].type

    if (type === "course") {
      overview.courseCount++
    } else if (type === "task") {
      overview.taskCount++
    } else if (type === "project") {
      overview.projectCount++
    } else if (type === "learning") {
      overview.learningCount++
    }

  }

  return overview

}


// ============================================================
// 周课程表（Weekly Course Schedule）
//
// 把 courses 中落在目标周（周一~周日）的课程，转换成可绝对定位
// 渲染的课程块，供「日历 · 课程表」视图使用。
//
// 纯展示层计算：只读 courses，不写 storage，不改数据模型。
// 每周重复课在创建时已展开为带具体 date 的实例，因此这里
// 只需按 date 过滤，无需再做规则展开。
// ============================================================


// 课程块渲染常量（与 calendar.wxss 保持一致）
var SCHEDULE_GUTTER = 72      // 左侧时间轴列宽（rpx）
var SCHEDULE_COL_WIDTH = 92   // 单列宽（rpx，7 列 + 时间轴正好一屏宽）
var SCHEDULE_CELL_PAD = 3     // 块在列内左右内缩（rpx）
var SCHEDULE_DAY_START = 8 * 60   // 时间轴起点 08:00（分钟）
var SCHEDULE_DAY_END = 22 * 60    // 时间轴终点 22:00（分钟）
var SCHEDULE_TOTAL_MINUTES = 14 * 60 // 08:00–22:00 共 14 小时


// 解析 "YYYY-MM-DD" → Date
function parseDate(dateString) {

  var parts =
    String(dateString || "").split("-")

  if (parts.length !== 3) {
    return new Date()
  }

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  )

}


// 分钟数 → "HH:mm"
function minutesToHHMM(minutes) {

  var h =
    Math.floor(minutes / 60)

  var m =
    minutes % 60

  return (
    (h < 10 ? "0" + h : String(h)) +
    ":" +
    (m < 10 ? "0" + m : String(m))
  )

}


// 求某日期所在周的周一（周一为一周开始）
function getWeekStart(dateString) {

  var date =
    parseDate(dateString)

  var day =
    date.getDay()

  if (day === 0) {
    day = 7
  }

  var offset =
    day - 1

  date.setDate(
    date.getDate() - offset
  )

  return common.formatDate(date)

}


// 返回某周周一~周日 7 天日期数组
function getWeekDays(weekStart) {

  var date =
    parseDate(weekStart)

  var days =
    []

  for (var i = 0; i < 7; i++) {

    days.push(
      common.formatDate(date)
    )

    date.setDate(
      date.getDate() + 1
    )

  }

  return days

}


// 课程状态 → 渲染 class
function getScheduleStateClass(status) {

  if (status === "进行中") {
    return "ongoing"
  }

  if (status === "学生请假") {
    return "leave"
  }

  if (status === "已取消") {
    return "cancelled"
  }

  if (status === "已完成") {
    return "done"
  }

  return "upcoming"

}


// 课程状态 → 第三行短标签
// 正常状态（待开始/进行中/已完成）返回空串，仅占位不显示；
// 非正常状态（请假/取消）返回对应英文短文案。
function getScheduleStatusLabel(status) {

  if (status === "学生请假") {
    return "Leave"
  }

  if (status === "已取消") {
    return "Cancelled"
  }

  return ""

}


// ============================================================
// 构建周课程表
//
// 输入：courses、weekStart（周一日期）、today（可选）
// 输出：{ days, dayLabels, axis, gridHeight, gridWidth,
//         gutterWidth, colWidth, blocks, hasCourses }
//
// blocks 每项含：id, date, colIndex, left, top, width, height,
//   startTime, endTime, student, grade, topic, statusText,
//   stateClass, isToday, laneIndex, laneCount
// ============================================================

function buildWeekSchedule(courses, weekStart, today) {

  courses =
    courses || []

  today =
    today || common.getToday()

  var days =
    getWeekDays(weekStart)

  var dayLabels =
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  // 每 1 分钟占整个课表高度的百分比（14 小时 = 100%）
  var percentPerMinute =
    100 / SCHEDULE_TOTAL_MINUTES


  // =====================================================
  // 收集目标周课程，并解析时间
  // =====================================================

  var inWeek =
    []

  for (var i = 0; i < courses.length; i++) {

    var c =
      courses[i]

    if (!c || !c.id || !c.date) {
      continue
    }

    var colIndex =
      days.indexOf(c.date)

    if (colIndex === -1) {
      continue
    }

    var startMinutes =
      common.timeToMinutes(
        c.startTime || c.time
      )

    // 无有效开始时间的课程无法定位，跳过（月历仍会展示）
    if (startMinutes === null) {
      continue
    }

    var endMinutes =
      common.timeToMinutes(c.endTime)

    if (
      endMinutes === null ||
      endMinutes <= startMinutes
    ) {
      // 旧课程缺结束时间：按项目默认 2 小时补齐
      endMinutes = startMinutes + 120
    }

    // 结束时间字符串（旧课程缺字段时按补齐结果生成）
    var endTimeText = c.endTime || ""

    if (!endTimeText) {

      var eh = Math.floor(endMinutes / 60)
      var em = endMinutes % 60

      endTimeText =
        (eh < 10 ? "0" + eh : String(eh)) +
        ":" +
        (em < 10 ? "0" + em : String(em))

    }

    inWeek.push({

      id: c.id,
      date: c.date,
      colIndex: colIndex,

      startMinutes: startMinutes,
      endMinutes: endMinutes,

      startTime:
        c.startTime || c.time || "",
      endTime:
        endTimeText,

      student: c.student || "",
      grade: common.getGradeText(c.grade),
      topic: c.topic || "",

      statusText:
        common.getCourseStatus(c, today),

      isToday:
        c.date === today,

      repeat: !!c.repeat

    })

  }


  // =====================================================
  // 时间轴：固定 08:00–22:00
  //
  // 位置用「占整个课表可用高度的百分比」表达：
  // 08:00 = 0%，22:00 = 100%，1 小时 = 100/14 %。
  // 这样无论屏幕多高，14 小时始终完整显示在一屏内。
  // =====================================================

  // 时间轴刻度：08:00–22:00 每个整点一个刻度。
  // 前 14 项为节次（no 1-14，时间 08:00-21:00），
  // 最后一项为 22:00 结束刻度（no 0）。
  var axis =
    []

  var periodNo =
    0

  for (
    var t = SCHEDULE_DAY_START;
    t < SCHEDULE_DAY_END;
    t += 60
  ) {

    periodNo++

    axis.push({

      no: periodNo,
      time: minutesToHHMM(t),

      topPercent:
        (t - SCHEDULE_DAY_START) *
        percentPerMinute

    })

  }

  axis.push({

    no: 0,
    time: minutesToHHMM(SCHEDULE_DAY_END),

    topPercent: 100

  })


  var colInnerWidth =
    SCHEDULE_COL_WIDTH -
    SCHEDULE_CELL_PAD * 2

  var totalWidth =
    SCHEDULE_GUTTER +
    SCHEDULE_COL_WIDTH * 7


  // =====================================================
  // 课程块定位 + 列内重叠分泳道
  // =====================================================

  var blocks =
    []

  for (var di = 0; di < 7; di++) {

    var colBlocks =
      []

    for (var b = 0; b < inWeek.length; b++) {

      if (inWeek[b].colIndex === di) {
        colBlocks.push(inWeek[b])
      }

    }

    if (colBlocks.length === 0) {
      continue
    }

    colBlocks.sort(function (a, b) {
      return a.startMinutes - b.startMinutes
    })


    // 泳道分配：重叠的课并排，不重叠的课复用同一泳道
    var laneEnds = []
    var assignedLane = []

    for (var cb = 0; cb < colBlocks.length; cb++) {

      var block = colBlocks[cb]
      var placed = false

      for (
        var lane = 0;
        lane < laneEnds.length;
        lane++
      ) {

        if (laneEnds[lane] <= block.startMinutes) {

          laneEnds[lane] = block.endMinutes
          assignedLane.push(lane)
          placed = true
          break

        }

      }

      if (!placed) {

        laneEnds.push(block.endMinutes)
        assignedLane.push(laneEnds.length - 1)

      }

    }

    var maxLanes = laneEnds.length || 1


    for (var cb2 = 0; cb2 < colBlocks.length; cb2++) {

      var blk = colBlocks[cb2]
      var laneIndex = assignedLane[cb2]
      var laneWidth = colInnerWidth / maxLanes

      blocks.push({

        id: blk.id,
        date: blk.date,
        colIndex: di,

        left:
          SCHEDULE_GUTTER +
          di * SCHEDULE_COL_WIDTH +
          SCHEDULE_CELL_PAD +
          laneIndex * laneWidth,

        topPercent:
          (blk.startMinutes - SCHEDULE_DAY_START) *
          percentPerMinute,

        width: laneWidth,

        heightPercent:
          (blk.endMinutes - blk.startMinutes) *
          percentPerMinute,

        student: blk.student,
        grade: blk.grade,
        statusLabel: getScheduleStatusLabel(blk.statusText),

        stateClass: getScheduleStateClass(blk.statusText),
        isToday: blk.isToday,

        laneIndex: laneIndex,
        laneCount: maxLanes

      })

    }

  }


  return {

    days: days,
    dayLabels: dayLabels,
    axis: axis,

    gutterWidth: SCHEDULE_GUTTER,
    colWidth: SCHEDULE_COL_WIDTH,
    totalWidth: totalWidth,

    blocks: blocks,
    hasCourses: inWeek.length > 0

  }

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  getEventTypeText: getEventTypeText,
  splitDeadline: splitDeadline,
  buildCourseEvent: buildCourseEvent,
  buildTaskEvent: buildTaskEvent,
  buildProjectEvent: buildProjectEvent,
  buildLearningEvent: buildLearningEvent,
  buildCalendarEvents: buildCalendarEvents,
  sortEvents: sortEvents,
  getDayOverview: getDayOverview,
  getWeekStart: getWeekStart,
  getWeekDays: getWeekDays,
  buildWeekSchedule: buildWeekSchedule
}
