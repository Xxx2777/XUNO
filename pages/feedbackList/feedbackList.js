var common = require("../../utils/common.js")


Page({
  data: {
    themeClass: "theme-1",
    themeMode: 1,
    courseList: []
  },

  onLoad: function () {
    this.syncTheme()
  },

  onShow: function () {
    this.syncTheme()
    this.loadCourses()
  },

  // =========================================================
  // 主题
  // =========================================================

  syncTheme: function () {

    common.syncTheme(this)

  },


  // =========================================================
  // 加载课程
  // =========================================================

  loadCourses: function () {

    var courses =
      wx.getStorageSync("courses") || []

    var history =
      wx.getStorageSync("history") || []

    var today = this.getToday()

    var result = []

    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      var course = courses[i]

      if (
        !course ||
        !course.id
      ) {
        continue
      }


      // -------------------------------------------------------
      // 学生请假
      // -------------------------------------------------------

      if (
        course.status === "学生请假"
      ) {
        continue
      }


      // -------------------------------------------------------
      // 判断课程状态
      // -------------------------------------------------------

      var status =
        this.getCourseStatus(
          course,
          today
        )

      if (status !== "已完成") {
        continue
      }


      // -------------------------------------------------------
      // 判断是否已经填写反馈
      // -------------------------------------------------------

      var hasFeedback = false

      for (
        var h = 0;
        h < history.length;
        h++
      ) {

        var record = history[h]

        if (
          record &&
          record.type === "feedback" &&
          String(
            record.courseId || ""
          ) ===
          String(
            course.id || ""
          )
        ) {
          hasFeedback = true
          break
        }
      }

      if (hasFeedback) {
        continue
      }


      // -------------------------------------------------------
      // 日期
      // -------------------------------------------------------

      var dateText =
        course.date || ""

      var month = ""
      var day = ""

      if (dateText) {

        var dateParts =
          dateText.split("-")

        if (
          dateParts.length >= 3
        ) {

          month =
            dateParts[1]

          day =
            dateParts[2]
        }
      }


      // -------------------------------------------------------
      // 时间
      // -------------------------------------------------------

      var startTime =
        course.startTime ||
        course.time ||
        ""

      var endTime =
        course.endTime ||
        ""

      var courseTime = ""

      if (
        startTime &&
        endTime
      ) {

        courseTime =
          startTime +
          " - " +
          endTime

      } else if (startTime) {

        courseTime =
          startTime

      } else {

        courseTime =
          "Time not set"
      }


      // -------------------------------------------------------
      // 加入列表
      // -------------------------------------------------------

      result.push({

        id: course.id,

        studentId:
          course.studentId ||
          "",

        studentName:
          course.studentName ||
          course.student ||
          "Student not set",

        grade:
          course.grade ||
          "",

        gradeText:
          common.getGradeText(
            course.grade
          ),

        subject:
          course.subject ||
          "化学",

        topic:
          course.topic ||
          course.lesson ||
          "Chemistry lesson",

        date:
          dateText,

        month:
          month,

        day:
          day,

        startTime:
          startTime,

        endTime:
          endTime,

        courseTime:
          courseTime,

        course:
          course
      })
    }


    // -------------------------------------------------------
    // 排序
    // -------------------------------------------------------

    result.sort(
      function (a, b) {

        var dateA =
          (a.date || "") +
          " " +
          (a.startTime || "")

        var dateB =
          (b.date || "") +
          " " +
          (b.startTime || "")

        if (dateA < dateB) {
          return 1
        }

        if (dateA > dateB) {
          return -1
        }

        return 0
      }
    )


    this.setData({
      courseList:
        result
    })
  },


  // =========================================================
  // 获取课程状态
  // =========================================================

  getCourseStatus: function (
    course,
    today
  ) {

    return common.getCourseStatus(
      course,
      today
    )

  },


  // =========================================================
  // 时间转换
  // =========================================================

  timeToMinutes: function (
    time
  ) {

    return common.timeToMinutes(
      time
    )

  },


  // =========================================================
  // 获取今天日期
  // =========================================================

  getToday: function () {

    return common.getToday()

  },


  // =========================================================
  // 选择课程
  // =========================================================

  selectCourse: function (
    e
  ) {

    var index =
      e.currentTarget.dataset.index

    var item =
      this.data.courseList[index]

    if (!item) {
      return
    }

    var course =
      item.course || {}


    // 保存当前课程
    wx.setStorageSync(
      "selectedCourse",
      course
    )

    wx.setStorageSync(
      "selectedCourseId",
      course.id
    )


    // 保存当前学生
    wx.setStorageSync(
      "selectedStudent",
      {
        id:
          item.studentId || "",

        name:
          item.studentName || "",

        grade:
          item.grade || "",

        subject:
          item.subject || "化学"
      }
    )


    // 进入原来的反馈页面
    wx.navigateTo({
      url:
        "/pages/feedbackCreate/feedbackCreate"
    })
  },


  // =========================================================
  // 返回
  // =========================================================

  goBack: function () {

    var pages =
      getCurrentPages()

    if (
      pages.length > 1
    ) {

      wx.navigateBack({
        delta: 1
      })

    } else {

      wx.reLaunch({
        url:
          "/pages/index/index"
      })
    }
  }
})