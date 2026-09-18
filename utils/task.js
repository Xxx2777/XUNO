// ============================================================
// 任务工具函数
//
// 供 todo 页面、首页（今日工作台）、日历、统计复用。
//
// 任务对象存储结构（todoList[date] 数组的元素）：
//   { id, text, completed, priority?, deadline?, tags?, createdAt?, completedAt? }
//
// 任务的「所属日期」由 todoList 的外层 key 表达，
// 不在任务对象内冗余存储 date 字段，避免两个日期来源不一致。
// ============================================================


// ============================================================
// 获取今天日期 "YYYY-MM-DD"
// ============================================================

function getToday() {

  var d =
    new Date()

  var month =
    d.getMonth() + 1

  var day =
    d.getDate()

  if (month < 10) {
    month = "0" + month
  }

  if (day < 10) {
    day = "0" + day
  }

  return (
    d.getFullYear() +
    "-" +
    month +
    "-" +
    day
  )

}


// ============================================================
// 归一化任务对象
//
// 兼容旧任务（只有 id / text / completed），
// 补齐缺失字段的默认值，不报错、不改变原含义。
//
// date 由外层 key 传入（任务所属日期），
// 只作为视图/统计用的字段，不回写到存储。
// ============================================================

function normalizeTask(task, date) {

  if (!task) {
    return null
  }

  return {

    id:
      task.id,

    text:
      task.text || "",

    description:
      task.description || "",

    completed:
      !!task.completed,

    date:
      date || "",

    priority:
      task.priority || "",

    deadline:
      task.deadline || "",

    tags:
      Array.isArray(task.tags)
        ? task.tags
        : [],

    createdAt:
      task.createdAt || task.id || 0,

    completedAt:
      task.completedAt || "",

    projectId:
      task.projectId || ""

  }

}


// ============================================================
// 优先级权重（用于排序）
//
// 高 > 中 > 低 > 未设置
// ============================================================

function priorityWeight(priority) {

  if (priority === "高") {
    return 3
  }

  if (priority === "中") {
    return 2
  }

  if (priority === "低") {
    return 1
  }

  return 0

}


// ============================================================
// 判断任务是否逾期
//
// 规则：未完成 且 有截止日期 且 截止日期早于今天。
// 截止日期 == 今天 不算逾期（今天还没过完）。
// ============================================================

function isTaskOverdue(task, today) {

  if (!task) {
    return false
  }

  if (task.completed) {
    return false
  }

  if (!task.deadline) {
    return false
  }

  var todayStr =
    today || getToday()

  return (
    String(task.deadline) <
    todayStr
  )

}


// ============================================================
// 任务排序
//
// 1. 未完成在前
// 2. 逾期在前
// 3. 高优先级在前
// 4. 创建时间升序
// ============================================================

function sortTasks(tasks, today) {

  var list =
    (tasks || []).slice()

  list.sort(function (a, b) {

    if (
      !!a.completed !==
      !!b.completed
    ) {
      return a.completed ? 1 : -1
    }

    var aOverdue =
      isTaskOverdue(a, today) ? 1 : 0

    var bOverdue =
      isTaskOverdue(b, today) ? 1 : 0

    if (aOverdue !== bOverdue) {
      return bOverdue - aOverdue
    }

    var aWeight =
      priorityWeight(a.priority)

    var bWeight =
      priorityWeight(b.priority)

    if (aWeight !== bWeight) {
      return bWeight - aWeight
    }

    return (
      (a.createdAt || 0) -
      (b.createdAt || 0)
    )

  })

  return list

}


// ============================================================
// 统计摘要
//
// 返回 total / completed / remaining / overdue / completionRate
// ============================================================

function getTaskSummary(tasks, today) {

  var list =
    tasks || []

  var total =
    list.length

  var completed = 0

  var overdue = 0

  for (var i = 0; i < list.length; i++) {

    if (list[i].completed) {
      completed++
    } else if (
      isTaskOverdue(list[i], today)
    ) {
      overdue++
    }

  }

  return {

    total:
      total,

    completed:
      completed,

    remaining:
      total - completed,

    overdue:
      overdue,

    completionRate:
      total > 0
        ? Math.round(
          completed / total * 100
        )
        : 0

  }

}


// ============================================================
// 从 todoList 日期 Map 中按 id 查找任务
//
// 返回 { task, date }，date 为任务所在的外层日期 key。
// 找不到返回 null。
// ============================================================

function findTaskById(todoList, taskId) {

  todoList = todoList || {}

  var keys = Object.keys(todoList)

  for (var i = 0; i < keys.length; i++) {

    var tasks = todoList[keys[i]]

    if (!Array.isArray(tasks)) {
      continue
    }

    for (var j = 0; j < tasks.length; j++) {

      if (String(tasks[j].id) === String(taskId)) {
        return { task: tasks[j], date: keys[i] }
      }

    }

  }

  return null

}


// ============================================================
// 提取 deadline 的日期部分（兼容 "YYYY-MM-DD" 与 "YYYY-MM-DD HH:mm"）
// ============================================================

function deadlineDatePart(deadline) {

  if (!deadline) {
    return ""
  }

  return String(deadline).trim().substring(0, 10)

}


// ============================================================
// 搜索匹配：text / description / tags
// ============================================================

function matchTaskSearch(task, keyword) {

  if (!keyword) {
    return true
  }

  var kw = String(keyword).trim().toLowerCase()

  if (!kw) {
    return true
  }

  var text = String(task.text || "").toLowerCase()
  var desc = String(task.description || "").toLowerCase()
  var tags = (task.tags || []).join(" ").toLowerCase()

  return (
    text.indexOf(kw) !== -1 ||
    desc.indexOf(kw) !== -1 ||
    tags.indexOf(kw) !== -1
  )

}


// ============================================================
// 综合筛选（纯函数，不修改原数组）
//
// filters: { keyword, status, priority, project, deadline }
//   status:   all / unfinished / finished / overdue
//   priority: all / 高 / 中 / 低 / none
//   project:  all / none / <projectId>
//   deadline: all / none / today / future / overdue
// ============================================================

function filterTasks(tasks, filters, today) {

  filters = filters || {}

  var list = (tasks || []).slice()

  today = today || getToday()

  var result = []

  for (var i = 0; i < list.length; i++) {

    var t = list[i]

    if (!t) {
      continue
    }


    // 搜索
    if (!matchTaskSearch(t, filters.keyword)) {
      continue
    }


    // 状态
    if (filters.status === "unfinished" && t.completed) {
      continue
    }
    if (filters.status === "finished" && !t.completed) {
      continue
    }
    if (filters.status === "overdue" && !isTaskOverdue(t, today)) {
      continue
    }


    // 优先级
    if (filters.priority === "none" && t.priority) {
      continue
    }
    if (
      filters.priority &&
      filters.priority !== "all" &&
      filters.priority !== "none" &&
      t.priority !== filters.priority
    ) {
      continue
    }


    // 项目
    if (filters.project === "none" && t.projectId) {
      continue
    }
    if (
      filters.project &&
      filters.project !== "all" &&
      filters.project !== "none" &&
      String(t.projectId) !== String(filters.project)
    ) {
      continue
    }


    // 截止时间
    if (filters.deadline === "none" && t.deadline) {
      continue
    }
    if (
      filters.deadline === "today" &&
      (!t.deadline || deadlineDatePart(t.deadline) !== today)
    ) {
      continue
    }
    if (
      filters.deadline === "future" &&
      (!t.deadline || deadlineDatePart(t.deadline) <= today)
    ) {
      continue
    }
    if (filters.deadline === "overdue" && !isTaskOverdue(t, today)) {
      continue
    }


    result.push(t)

  }

  return result

}


// ============================================================
// 综合排序（纯函数，不修改原数组）
//
// sortType: default / deadline / priority / created
// ============================================================

function sortTasksBy(tasks, sortType, today) {

  var list = (tasks || []).slice()

  today = today || getToday()


  if (sortType === "deadline") {

    list.sort(function (a, b) {

      var da = a.deadline || ""
      var db = b.deadline || ""

      if (da && db) {
        return String(da).localeCompare(String(db))
      }
      if (da && !db) {
        return -1
      }
      if (!da && db) {
        return 1
      }
      return 0

    })

    return list

  }


  if (sortType === "priority") {

    list.sort(function (a, b) {
      return priorityWeight(b.priority) - priorityWeight(a.priority)
    })

    return list

  }


  if (sortType === "created") {

    list.sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0)
    })

    return list

  }


  // 默认：未完成优先 → 有 deadline 优先 → deadline 早 → 高优先级 → 创建时间新
  list.sort(function (a, b) {

    if (!!a.completed !== !!b.completed) {
      return a.completed ? 1 : -1
    }

    var hasA = !!a.deadline
    var hasB = !!b.deadline

    if (hasA !== hasB) {
      return hasA ? -1 : 1
    }

    if (hasA && hasB) {
      var dc = String(a.deadline).localeCompare(String(b.deadline))
      if (dc !== 0) {
        return dc
      }
    }

    var w = priorityWeight(b.priority) - priorityWeight(a.priority)

    if (w !== 0) {
      return w
    }

    return (b.createdAt || 0) - (a.createdAt || 0)

  })

  return list

}


// ============================================================
// 解析标签文本 → 字符串数组
//
// 支持英文逗号 / 中文逗号分隔，自动 trim 并删除空标签。
// 输入为空返回 []。纯函数，不读写 storage。
// ============================================================

function parseTags(text) {

  if (!text) {
    return []
  }

  var raw = String(text).trim()

  if (!raw) {
    return []
  }

  var parts = raw.split(/[,，]/)

  var result = []

  for (var i = 0; i < parts.length; i++) {

    var t = parts[i].trim()

    if (t) {
      result.push(t)
    }

  }

  return result

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  getToday: getToday,
  normalizeTask: normalizeTask,
  priorityWeight: priorityWeight,
  isTaskOverdue: isTaskOverdue,
  sortTasks: sortTasks,
  getTaskSummary: getTaskSummary,
  findTaskById: findTaskById,
  deadlineDatePart: deadlineDatePart,
  matchTaskSearch: matchTaskSearch,
  filterTasks: filterTasks,
  sortTasksBy: sortTasksBy,
  parseTags: parseTags
}
