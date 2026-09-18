// ============================================================
// 课程工具函数
//
// 统一「删除课程」时的级联清理逻辑，
// 供首页、日历等页面复用，避免各自重复维护。
// ============================================================


// ============================================================
// 删除课程并级联清理关联数据
//
// 清理范围：
//   1. courses 数组中的该课程
//   2. homework_{courseId}
//   3. homeworkEvaluation_{courseId}
//   4. history 中 courseId 匹配的反馈记录
//   5. selectedCourseId（若当前选中该课程）
//
// 不改变课程数据结构，不迁移旧数据。
// ============================================================

function deleteCourseCascade(courseId) {

  if (!courseId) {
    return
  }


  // =====================================================
  // 1. 从 courses 移除
  // =====================================================

  var courses =
    wx.getStorageSync("courses") || []

  var newCourses = []

  for (var i = 0; i < courses.length; i++) {

    if (
      String(courses[i].id) !==
      String(courseId)
    ) {

      newCourses.push(courses[i])

    }

  }

  wx.setStorageSync("courses", newCourses)


  // =====================================================
  // 2. 删除作业、作业评价
  // =====================================================

  wx.removeStorageSync(
    "homework_" + courseId
  )

  wx.removeStorageSync(
    "homeworkEvaluation_" + courseId
  )


  // =====================================================
  // 3. 从 history 移除该课程的反馈
  // =====================================================

  var history =
    wx.getStorageSync("history") || []

  var newHistory = []

  for (var h = 0; h < history.length; h++) {

    if (
      String(history[h].courseId) !==
      String(courseId)
    ) {

      newHistory.push(history[h])

    }

  }

  wx.setStorageSync("history", newHistory)


  // =====================================================
  // 4. 清除选中的课程 id（若当前选中）
  // =====================================================

  var selectedCourseId =
    wx.getStorageSync("selectedCourseId")

  if (
    String(selectedCourseId) ===
    String(courseId)
  ) {

    wx.removeStorageSync("selectedCourseId")

  }

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  deleteCourseCascade: deleteCourseCascade
}
