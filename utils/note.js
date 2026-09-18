// ============================================================
// 笔记工具函数
//
// 笔记数据模型（notes 数组元素）：
//   { id, title, content, projectId, type, tags, createdAt, updatedAt }
//
// 关联方式：note.projectId 指向项目 id（可选，"" 表示无项目）
// ============================================================


// ============================================================
// 归一化笔记对象（兼容缺字段的旧数据）
// ============================================================

function normalizeNote(note) {

  if (!note) {
    return null
  }

  return {

    id:
      note.id,

    title:
      note.title || "",

    content:
      note.content || "",

    projectId:
      note.projectId || "",

    type:
      note.type || "学习",

    tags:
      Array.isArray(note.tags)
        ? note.tags
        : [],

    createdAt:
      note.createdAt || 0,

    updatedAt:
      note.updatedAt || note.createdAt || 0

  }

}


// ============================================================
// 笔记统计
//
// 返回：{ total, typeMap: { 类型: 数量 } }
// ============================================================

function getNoteStats(notes) {

  var list = notes || []

  var typeMap = {}

  for (var i = 0; i < list.length; i++) {

    var type = list[i].type || "学习"

    typeMap[type] = (typeMap[type] || 0) + 1

  }

  return {
    total: list.length,
    typeMap: typeMap
  }

}


// ============================================================
// 删除指定笔记（纯函数，返回过滤后的新数组）
// ============================================================

function deleteNote(notes, noteId) {

  var list = notes || []

  var result = []

  for (var i = 0; i < list.length; i++) {

    if (String(list[i].id) !== String(noteId)) {
      result.push(list[i])
    }

  }

  return result

}


// ============================================================
// 格式化时间戳 → "YYYY-MM-DD HH:mm"
// ============================================================

function formatNoteTime(timestamp) {

  if (!timestamp) {
    return ""
  }

  var d = new Date(timestamp)

  var year = d.getFullYear()
  var month = d.getMonth() + 1
  var day = d.getDate()
  var hour = d.getHours()
  var minute = d.getMinutes()

  if (month < 10) month = "0" + month
  if (day < 10) day = "0" + day
  if (hour < 10) hour = "0" + hour
  if (minute < 10) minute = "0" + minute

  return (
    year + "-" + month + "-" + day +
    " " + hour + ":" + minute
  )

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  normalizeNote: normalizeNote,
  getNoteStats: getNoteStats,
  deleteNote: deleteNote,
  formatNoteTime: formatNoteTime
}
