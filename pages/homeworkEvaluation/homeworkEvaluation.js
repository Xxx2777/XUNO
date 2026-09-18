var common = require("../../utils/common.js")


Page({

  data: {
    themeClass: "theme-1",

    course: null,
    gradeText: "",
    homework: "",
    score: "",
    evaluation: "",
    selectedEvaluation: "",

    evaluationList: [
      "Completed carefully with neat work",
      "Homework completed well",
      "Good grasp of fundamentals",
      "Good understanding of the lesson",
      "Some topics need review",
      "Calculations need more care",
      "More practice on fundamentals needed",
      "Review incorrect answers"
    ],

    hasSaved: false
  },

  onLoad: function () {
    this.syncTheme()
    this.loadData()
  },

  onShow: function () {
    this.syncTheme()
    this.loadData()
  },

  // =========================
  // 同步首页主题
  // =========================

  syncTheme: function () {

    var app = getApp()

    var themeMode = 1

    // 优先读取全局主题
    if (
      app &&
      app.globalData &&
      app.globalData.themeMode
    ) {

      themeMode =
        Number(app.globalData.themeMode)

    } else {

      // 全局主题不存在时读取本地缓存
      themeMode =
        Number(
          wx.getStorageSync("themeMode") || 1
        )
    }

    // 检查主题是否存在
    if (
      !app ||
      !app.globalData ||
      !app.globalData.themes ||
      !app.globalData.themes[themeMode]
    ) {
      themeMode = 1
    }

    // 设置页面主题
    this.setData({

      themeClass:
        themeMode === 2
          ? "theme-2"
          : "theme-1"

    })

    // 交给 app.js 统一处理系统导航栏和背景色
    if (
      app &&
      typeof app.applyTheme === "function"
    ) {
      app.applyTheme(themeMode)
    }

  },

  // =========================
  // 加载课程
  // =========================

  loadData: function () {

    var courseId =
      wx.getStorageSync("evaluationCourseId")

    var selectedCourse =
      wx.getStorageSync("selectedCourse") || null

    var courses =
      wx.getStorageSync("courses") || []

    var course = null

    if (courseId) {

      for (
        var i = 0;
        i < courses.length;
        i++
      ) {

        if (
          String(courses[i].id) ===
          String(courseId)
        ) {

          course = courses[i]

          break
        }
      }
    }

    if (!course && selectedCourse) {
      course = selectedCourse
    }

    if (!course) {

      wx.showToast({
        title: "Course information not found",
        icon: "none"
      })

      return
    }

    // =========================
    // 兼容旧课程
    // =========================

    course =
      this.ensureStudentId(
        course,
        courses
      )

    var homeworkKey =
      "homework_" + course.id

    var homework =
      wx.getStorageSync(homeworkKey) || ""

    var evaluationKey =
      "homeworkEvaluation_" + course.id

    var saved =
      wx.getStorageSync(evaluationKey) || {}

    this.setData({

      course: course,

      gradeText:
        common.getGradeText(
          course.grade
        ),

      homework:
        homework ||
        saved.homework ||
        "",

      score:
        saved.score || "",

      evaluation:
        saved.evaluation || "",

      selectedEvaluation:
        saved.selectedEvaluation || "",

      hasSaved:
        !!saved.evaluation
    })

    wx.setStorageSync(
      "selectedCourse",
      course
    )

    wx.setStorageSync(
      "selectedCourseId",
      course.id
    )

    wx.setStorageSync(
      "evaluationCourseId",
      course.id
    )

    wx.setStorageSync(
      "selectedStudent",
      {
        id:
          course.studentId || "",

        name:
          course.student || "",

        grade:
          course.grade || "",

        subject:
          course.subject || "化学"
      }
    )
  },

  // =========================
  // 确保课程存在 studentId
  // =========================

  ensureStudentId: function (
    course,
    courses
  ) {

    if (!course) {
      return course
    }

    if (course.studentId) {
      return course
    }

    var studentName =
      String(
        course.student || ""
      ).trim()

    if (!studentName) {
      return course
    }

    // 直接为课程生成 studentId，不再维护 students 数组
    var studentId =
      "student_" +
      Date.now() +
      "_" +
      Math.floor(
        Math.random() * 1000
      )

    course.studentId =
      studentId

    for (
      var j = 0;
      j < courses.length;
      j++
    ) {

      if (
        String(courses[j].id) ===
        String(course.id)
      ) {

        courses[j].studentId =
          studentId

        break
      }
    }

    wx.setStorageSync(
      "courses",
      courses
    )

    return course
  },

  // =========================
  // 成绩
  // =========================

  inputScore: function (e) {

    var value =
      e.detail.value

    if (value.length > 3) {

      value =
        value.substring(0, 3)
    }

    this.setData({
      score: value
    })
  },

  // =========================
  // 评价
  // =========================

  inputEvaluation: function (e) {

    this.setData({

      evaluation:
        e.detail.value,

      selectedEvaluation:
        ""
    })
  },

  selectEvaluation: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )

    var value =
      this.data.evaluationList[index]

    if (!value) {
      return
    }

    this.setData({

      selectedEvaluation:
        value,

      evaluation:
        value
    })
  },

  // =========================
  // 保存评价
  // =========================

  saveEvaluation: function () {

    var evaluation =
      this.data.evaluation.trim()

    if (!evaluation) {

      wx.showToast({
        title: "Please enter a homework review",
        icon: "none"
      })

      return
    }

    var course =
      this.data.course

    if (!course) {

      wx.showToast({
        title: "Course information not found",
        icon: "none"
      })

      return
    }

    var key =
      "homeworkEvaluation_" +
      course.id

    var now =
      Date.now()

    var record = {

      id:
        "homework_record_" +
        now,

      // 核心关联
      studentId:
        course.studentId || "",

      courseId:
        course.id || "",

      student:
        course.student || "",

      grade:
        course.grade || "",

      subject:
        course.subject || "化学",

      date:
        course.date || "",

      time:
        course.time || "",

      topic:
        course.topic || "",

      homework:
        this.data.homework || "",

      score:
        this.data.score || "",

      evaluation:
        evaluation,

      selectedEvaluation:
        this.data.selectedEvaluation || "",

      savedAt:
        now
    }

    wx.setStorageSync(
      key,
      record
    )

    this.setData({

      hasSaved: true,

      evaluation:
        evaluation
    })

    wx.showToast({

      title: "Review saved",

      icon: "success",

      duration: 1200,

      success: function () {

        setTimeout(
          function () {

            wx.navigateBack({
              delta: 1
            })

          },
          1200
        )
      }
    })
  },

  // =========================
  // 返回
  // =========================

  goBack: function () {

    wx.navigateBack({
      delta: 1
    })

  }

})