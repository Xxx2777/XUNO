// ============================================================
// 学习记录工具函数
//
// 学习记录数据模型（learningHistory 数组元素）：
//   { id, date, time, minutes, type, topic, content,
//     learningRecord, projectId }
//
// 关联方式：learningHistory[].projectId 指向项目 id
//
// 纯工具模块：不读写 storage，不写页面逻辑。
// ============================================================


// ============================================================
// 归一化学习记录（兼容缺字段的旧数据）
//
// 缺 id 时不擅自生成新的持久化 id，保持原值。
// ============================================================

function normalizeLearningRecord(record) {

  if (!record) {
    return null
  }

  var type = record.type || ""

  var normalized = Object.assign({}, record)

  normalized.date = record.date || ""
  normalized.time = record.time || ""
  normalized.minutes = Number(record.minutes) || 0
  normalized.type = type
  normalized.topic = record.topic || type || ""
  normalized.content = record.content || ""
  normalized.learningRecord = record.learningRecord !== false
  normalized.projectId = record.projectId || ""

  return normalized

}


// ============================================================
// 按 id 查找（兼容数字 id / 字符串 id，找不到返回 null）
// ============================================================

function findLearningRecordById(learningHistory, id) {

  learningHistory = learningHistory || []

  for (var i = 0; i < learningHistory.length; i++) {

    if (String(learningHistory[i].id) === String(id)) {
      return learningHistory[i]
    }

  }

  return null

}


// ============================================================
// 局部更新指定记录（返回新数组，不修改其它记录）
// ============================================================

function updateLearningRecord(learningHistory, id, patch) {

  learningHistory = learningHistory || []

  var result = learningHistory.slice()

  for (var i = 0; i < result.length; i++) {

    if (String(result[i].id) === String(id)) {
      var merged = Object.assign({}, result[i], patch)
      result[i] = normalizeLearningRecord(merged)
      break
    }

  }

  return result

}


// ============================================================
// 删除指定 id（返回新数组，找不到时不误删）
// ============================================================

function deleteLearningRecord(learningHistory, id) {

  learningHistory = learningHistory || []

  var result = []

  for (var i = 0; i < learningHistory.length; i++) {

    if (String(learningHistory[i].id) !== String(id)) {
      result.push(learningHistory[i])
    }

  }

  return result

}


// ============================================================
// 日期展示格式化 "YYYY-MM-DD" → "Sep 18, 2026"
// ============================================================

function formatLearningDate(dateStr) {

  if (!dateStr) {
    return ""
  }

  var parts = String(dateStr).split("-")

  if (parts.length !== 3) {
    return dateStr
  }

  var monthNames =
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  var monthIndex = Number(parts[1]) - 1

  if (monthIndex < 0 || monthIndex > 11) {
    return dateStr
  }

  return monthNames[monthIndex] + " " + Number(parts[2]) + ", " + parts[0]

}


// ============================================================
// 时间展示（原样返回，占位纯函数）
// ============================================================

function formatLearningTime(timeStr) {

  return timeStr || ""

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  normalizeLearningRecord: normalizeLearningRecord,
  findLearningRecordById: findLearningRecordById,
  updateLearningRecord: updateLearningRecord,
  deleteLearningRecord: deleteLearningRecord,
  formatLearningDate: formatLearningDate,
  formatLearningTime: formatLearningTime
}
