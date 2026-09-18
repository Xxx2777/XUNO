// ============================================================
// 项目工具函数
//
// 供项目列表页、项目详情页复用。
// 项目数据模型：
//   { id, name, description, type, status, progress,
//     startDate, deadline, createdAt, updatedAt }
//
// 关联方式：
//   task.projectId、learningHistory[].projectId 指向项目 id
// ============================================================


// ============================================================
// 归一化项目对象（兼容缺字段的旧数据）
// ============================================================

function normalizeProject(project) {

  if (!project) {
    return null
  }

  return {

    id:
      project.id,

    name:
      project.name || "",

    description:
      project.description || "",

    type:
      project.type || "学习",

    status:
      project.status || "进行中",

    progress:
      Number(project.progress) || 0,

    startDate:
      project.startDate || "",

    deadline:
      project.deadline || "",

    createdAt:
      project.createdAt || 0,

    updatedAt:
      project.updatedAt || 0

  }

}


// ============================================================
// 计算项目基本统计
//
// 输入：
//   projectId       项目 id
//   tasks           已展开的任务数组（flattenTodoList 结果）
//   learningHistory 学习记录数组
//
// 输出：
//   { taskTotal, taskDone, taskCompletionRate,
//     learningMinutes, learningCount }
//
// 注意：任务完成率与项目整体进度（project.progress）是两个独立指标，
// 不互相覆盖。
// ============================================================

function getProjectStats(projectId, tasks, learningHistory) {

  var taskTotal = 0
  var taskDone = 0

  tasks = tasks || []

  for (var i = 0; i < tasks.length; i++) {

    if (
      String(tasks[i].projectId || "") ===
      String(projectId)
    ) {

      taskTotal++

      if (tasks[i].completed) {
        taskDone++
      }

    }

  }


  var learningMinutes = 0
  var learningCount = 0

  learningHistory = learningHistory || []

  for (var j = 0; j < learningHistory.length; j++) {

    if (
      String(learningHistory[j].projectId || "") ===
      String(projectId)
    ) {

      learningMinutes +=
        Number(learningHistory[j].minutes) || 0

      learningCount++

    }

  }


  return {

    taskTotal:
      taskTotal,

    taskDone:
      taskDone,

    taskCompletionRate:
      taskTotal > 0
        ? Math.round(taskDone / taskTotal * 100)
        : 0,

    learningMinutes:
      learningMinutes,

    learningCount:
      learningCount

  }

}


// ============================================================
// 删除项目并解除关联
//
// 1. 从 projects 移除该项目
// 2. 将关联任务的 projectId 清空为 ""
// 3. 将关联学习记录的 projectId 清空为 ""
// 4. 将关联笔记的 projectId 清空为 ""
// 5. 将关联学习计划的 projectId 清空为 ""
//
// 不删除关联任务、学习记录、笔记、学习计划本身
//（只是解除关联，不误删用户数据）。
// ============================================================

function deleteProjectCascade(projectId) {

  if (!projectId) {
    return
  }


  // =====================================================
  // 1. 从 projects 移除
  // =====================================================

  var projects =
    wx.getStorageSync("projects") || []

  var newProjects = []

  for (var i = 0; i < projects.length; i++) {

    if (
      String(projects[i].id) !==
      String(projectId)
    ) {

      newProjects.push(projects[i])

    }

  }

  wx.setStorageSync("projects", newProjects)


  // =====================================================
  // 2. 解除任务关联（projectId → ""）
  // =====================================================

  var todoData =
    wx.getStorageSync("todoList") || {}

  var dateKeys =
    Object.keys(todoData)

  var todoChanged = false

  for (var d = 0; d < dateKeys.length; d++) {

    var tasks =
      todoData[dateKeys[d]]

    if (!Array.isArray(tasks)) {
      continue
    }

    for (var t = 0; t < tasks.length; t++) {

      if (
        String(tasks[t].projectId || "") ===
        String(projectId)
      ) {

        tasks[t].projectId = ""
        todoChanged = true

      }

    }

  }

  if (todoChanged) {
    wx.setStorageSync("todoList", todoData)
  }


  // =====================================================
  // 3. 解除学习记录关联（projectId → ""）
  // =====================================================

  var learningHistory =
    wx.getStorageSync("learningHistory") || []

  var learningChanged = false

  for (var l = 0; l < learningHistory.length; l++) {

    if (
      String(learningHistory[l].projectId || "") ===
      String(projectId)
    ) {

      learningHistory[l].projectId = ""
      learningChanged = true

    }

  }

  if (learningChanged) {
    wx.setStorageSync("learningHistory", learningHistory)
  }


  // =====================================================
  // 4. 解除笔记关联（projectId → ""）
  // =====================================================

  var notes =
    wx.getStorageSync("notes") || []

  var notesChanged = false

  for (var n = 0; n < notes.length; n++) {

    if (
      String(notes[n].projectId || "") ===
      String(projectId)
    ) {

      notes[n].projectId = ""
      notesChanged = true

    }

  }

  if (notesChanged) {
    wx.setStorageSync("notes", notes)
  }


  // =====================================================
  // 5. 解除学习计划关联（projectId → ""）
  // =====================================================

  var studyPlans =
    wx.getStorageSync("studyPlans") || []

  var plansChanged = false

  for (var p = 0; p < studyPlans.length; p++) {

    if (
      String(studyPlans[p].projectId || "") ===
      String(projectId)
    ) {

      studyPlans[p].projectId = ""
      plansChanged = true

    }

  }

  if (plansChanged) {
    wx.setStorageSync("studyPlans", studyPlans)
  }

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  normalizeProject: normalizeProject,
  getProjectStats: getProjectStats,
  deleteProjectCascade: deleteProjectCascade
}
