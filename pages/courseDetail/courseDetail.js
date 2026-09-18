var common = require("../../utils/common.js")

Page({

  data: {

    course: null,

    homework: "",
    homeworkSaved: false,
    showHomework: false,

    courseDateText: "",

    courseStatus: "Upcoming",

    showStatusPanel: false,

    showLeaveReason: false,
    leaveReason: "",

    courseNote: "",
    showNoteEditor: false,

    courseTopic: "",
    showTopicEditor: false,

    // =========================
    // 上课时间
    // =========================

    courseStartTime: "",
    courseEndTime: "",

    // =========================
    // 时间编辑
    // 默认 2 小时
    // =========================

    showTimeEditor: false,
    editStartTime: "14:00",
    editEndTime: "16:00",

    // =========================
    // 主题
    // =========================

    themeClass: "theme-1"

  },


  // =====================================================
  // 页面加载
  // =====================================================

  onLoad: function () {

    this.syncTheme()

    this.loadCourse()

    // 每分钟检查一次课程状态
    this.statusTimer =
      setInterval(function () {

        this.refreshCourseStatus()

      }.bind(this), 60000)

  },


  // =====================================================
  // 页面显示
  // =====================================================

  onShow: function () {

    this.syncTheme()

    this.loadCourse()

  },


  // =====================================================
  // 同步主题
  // =====================================================

  syncTheme: function () {

    var app = getApp()

    var themeMode = 1

    if (
      app &&
      app.globalData &&
      app.globalData.themeMode
    ) {

      themeMode =
        Number(app.globalData.themeMode)

    } else {

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

    // 同步页面主题
    this.setData({

      themeClass:
        themeMode === 2
          ? "theme-2"
          : "theme-1"

    })

    // 使用 app.js 统一控制系统导航栏
    if (
      app &&
      typeof app.applyTheme === "function"
    ) {

      app.applyTheme(themeMode)

    }

  },


  // =====================================================
  // 页面卸载
  // =====================================================

  onUnload: function () {

    if (this.statusTimer) {

      clearInterval(
        this.statusTimer
      )

      this.statusTimer = null

    }

  },


  // =====================================================
  // 加载课程
  // =====================================================

  loadCourse: function () {

    var courseId =
      wx.getStorageSync(
        "selectedCourseId"
      )


    var selectedCourse =
      wx.getStorageSync(
        "selectedCourse"
      ) || null


    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    var course = null


    // =========================
    // 优先从 courses 中读取
    // courses 是唯一真实数据源
    // =========================

    if (
      courseId !== undefined &&
      courseId !== null &&
      courseId !== ""
    ) {

      for (
        var i = 0;
        i < courses.length;
        i++
      ) {

        if (
          String(courses[i].id) ===
          String(courseId)
        ) {

          course =
            courses[i]

          break

        }

      }

    }


    // =========================
    // 找不到时才使用缓存
    // =========================

    if (!course && selectedCourse) {

      course =
        selectedCourse

    }


    if (!course) {

      wx.showToast({

        title:
          "Lesson not found",

        icon:
          "none"

      })

      return

    }


    // =========================
    // 自动补齐 studentId
    // =========================

    course =
      this.ensureStudentId(
        course,
        courses
      )


    // =========================
    // 兼容旧课程时间
    // =========================

    var startTime =
      course.startTime ||
      course.time ||
      ""


    var endTime =
      course.endTime ||
      ""


    course.startTime =
      startTime


    course.endTime =
      endTime


    // =========================
    // 自动课程状态
    // =========================

    var autoStatus =
      common.getCourseStatusText(
        common.getCourseStatus(
          course
        )
      )


    // =========================
    // 作业
    // =========================

    var homeworkKey =
      "homework_" +
      course.id


    var homework =
      wx.getStorageSync(
        homeworkKey
      ) || ""


    // =========================
    // 如果旧课程没有结束时间
    // 页面显示时也自动计算 +2 小时
    // =========================

    var defaultEndTime =
      endTime


    if (
      !defaultEndTime &&
      startTime
    ) {

      defaultEndTime =
        this.addHours(
          startTime,
          2
        )

    }


    // =========================
    // 更新页面
    // =========================

    this.setData({

      course:
        course,

      gradeText:
        common.getGradeText(
          course.grade
        ),

      subjectText:
        common.getSubjectText(
          course.subject
        ),

      homework:
        homework,

      homeworkSaved:
        homework !== "",

      showHomework:
        false,

      courseDateText:
        this.formatDateText(
          course.date
        ),

      courseStatus:
        autoStatus,

      leaveReason:
        course.leaveReason ||
        "",

      courseNote:
        course.note ||
        "",

      courseTopic:
        course.topic ||
        "",

      courseStartTime:
        startTime,

      courseEndTime:
        endTime,

      editStartTime:
        startTime ||
        "14:00",

      editEndTime:
        defaultEndTime ||
        "16:00",

      showTimeEditor:
        false,

      showTopicEditor:
        false,

      showStatusPanel:
        false,

      showLeaveReason:
        false,

      showNoteEditor:
        false

    })


    // =========================
    // 同步当前课程缓存
    // =========================

    wx.setStorageSync(
      "selectedCourse",
      course
    )


    wx.setStorageSync(
      "selectedCourseId",
      course.id
    )

  },


  // =====================================================
  // 开始时间 + 小时
  // =====================================================

  addHours: function (
    time,
    hours
  ) {

    if (!time) {

      return ""

    }


    var parts =
      String(time).split(":")


    if (parts.length !== 2) {

      return time

    }


    var hour =
      Number(parts[0])


    var minute =
      Number(parts[1])


    if (
      isNaN(hour) ||
      isNaN(minute)
    ) {

      return time

    }


    var totalMinutes =
      hour * 60 +
      minute +
      hours * 60


    if (totalMinutes > 1439) {

      totalMinutes = 1439

    }


    if (totalMinutes < 0) {

      totalMinutes = 0

    }


    var newHour =
      Math.floor(
        totalMinutes / 60
      )


    var newMinute =
      totalMinutes % 60


    var hourText =
      newHour < 10
        ? "0" + newHour
        : String(newHour)


    var minuteText =
      newMinute < 10
        ? "0" + newMinute
        : String(newMinute)


    return (
      hourText +
      ":" +
      minuteText
    )

  },


  // =====================================================
  // 确保课程有 studentId
  //
  // 不再读取或新增 students 列表。
  // 学生信息直接以 courses 中的数据为准。
  // =====================================================

  ensureStudentId: function (
    course,
    courses
  ) {

    if (!course) {

      return course

    }


    // 已经存在 studentId
    if (course.studentId) {

      wx.setStorageSync(
        "selectedStudent",
        {
          id:
            course.studentId,

          name:
            course.student ||
            "",

          grade:
            course.grade ||
            "高一",

          subject:
            course.subject ||
            "化学"
        }
      )

      return course

    }


    // =========================
    // 获取学生姓名
    // =========================

    var studentName =
      String(
        course.student || ""
      ).trim()


    // 没有学生姓名
    if (!studentName) {

      return course

    }


    // =========================
    // 直接为当前课程生成 studentId
    //
    // 不再维护 students 数组
    // =========================

    var studentId =
      "student_" +
      Date.now() +
      "_" +
      Math.floor(
        Math.random() * 1000
      )


    course.studentId =
      studentId


    // =========================
    // 写回 courses
    // =========================

    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      if (
        String(
          courses[i].id
        ) ===
        String(course.id)
      ) {

        courses[i].studentId =
          studentId

        break

      }

    }


    // 保存课程
    wx.setStorageSync(
      "courses",
      courses
    )


    // =========================
    // 保存当前学生信息
    // =========================

    wx.setStorageSync(
      "selectedStudent",
      {

        id:
          studentId,

        name:
          studentName,

        grade:
          course.grade ||
          "高一",

        subject:
          course.subject ||
          "化学"

      }
    )


    return course

  },


  // =====================================================
  // 日期
  // =====================================================

  formatDateText: function (
    dateString
  ) {

    if (!dateString) {

      return ""

    }


    var parts =
      dateString.split("-")


    if (parts.length !== 3) {

      return dateString

    }


    var monthNames =
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    var monthIndex =
      Number(parts[1]) - 1

    if (monthIndex < 0 || monthIndex > 11) {
      return dateString
    }

    return (
      monthNames[monthIndex] +
      " " +
      Number(parts[2]) +
      ", " +
      parts[0]
    )

  },


  // =====================================================
  // 时间转分钟
  // =====================================================

  timeToMinutes: function (
    time
  ) {

    if (!time) {

      return null

    }


    var text =
      String(time).trim()


    var parts =
      text.split(":")


    if (parts.length !== 2) {

      return null

    }


    var hour =
      Number(parts[0])


    var minute =
      Number(parts[1])


    if (
      isNaN(hour) ||
      isNaN(minute)
    ) {

      return null

    }


    if (
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {

      return null

    }


    return (
      hour * 60 +
      minute
    )

  },


  // =====================================================
  // 刷新课程状态
  // =====================================================

  refreshCourseStatus: function () {

    var course =
      this.data.course


    if (!course) {

      return

    }


    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    var latestCourse = null


    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      if (
        String(
          courses[i].id
        ) ===
        String(course.id)
      ) {

        latestCourse =
          courses[i]

        break

      }

    }


    if (!latestCourse) {

      return

    }


    var newStatus =
      common.getCourseStatusText(
        common.getCourseStatus(
          latestCourse
        )
      )


    // 每次刷新都同步最新课程状态
    this.setData({

      course:
        latestCourse,

      courseStatus:
        newStatus,

      courseStartTime:
        latestCourse.startTime ||
        latestCourse.time ||
        "",

      courseEndTime:
        latestCourse.endTime ||
        ""

    })

    // 同步缓存
    wx.setStorageSync(
      "selectedCourse",
      latestCourse
    )

    wx.setStorageSync(
      "selectedCourseId",
      latestCourse.id
    )

  },


  // =====================================================
  // 打开时间编辑
  // =====================================================

  openTimeEditor: function () {

    var startTime =
      this.data.courseStartTime ||
      (
        this.data.course
          ? this.data.course.time
          : ""
      ) ||
      "14:00"


    var endTime =
      this.data.courseEndTime ||
      ""


    if (!endTime) {

      endTime =
        this.addHours(
          startTime,
          2
        )

    }


    this.setData({

      editStartTime:
        startTime,

      editEndTime:
        endTime,

      showTimeEditor:
        true

    })

  },


  // =====================================================
  // 关闭时间编辑
  // =====================================================

  closeTimeEditor: function () {

    var startTime =
      this.data.courseStartTime ||
      (
        this.data.course
          ? this.data.course.time
          : ""
      ) ||
      "14:00"


    var endTime =
      this.data.courseEndTime ||
      ""


    if (!endTime) {

      endTime =
        this.addHours(
          startTime,
          2
        )

    }


    this.setData({

      showTimeEditor:
        false,

      editStartTime:
        startTime,

      editEndTime:
        endTime

    })

  },


  // =====================================================
  // 修改开始时间
  // =====================================================

  changeStartTime: function (e) {

    var startTime =
      e.detail.value


    var endTime =
      this.addHours(
        startTime,
        2
      )


    this.setData({

      editStartTime:
        startTime,

      editEndTime:
        endTime

    })

  },


  // =====================================================
  // 修改结束时间
  // =====================================================

  changeEndTime: function (e) {

    this.setData({

      editEndTime:
        e.detail.value

    })

  },


  // =====================================================
  // 保存上下课时间
  // =====================================================

  saveCourseTime: function () {

    var startTime =
      this.data.editStartTime


    var endTime =
      this.data.editEndTime


    if (!startTime) {

      wx.showToast({

        title:
          "Please select a start time",

        icon:
          "none"

      })

      return

    }


    if (!endTime) {

      endTime =
        this.addHours(
          startTime,
          2
        )

    }


    var startMinutes =
      this.timeToMinutes(
        startTime
      )


    var endMinutes =
      this.timeToMinutes(
        endTime
      )


    if (
      startMinutes === null ||
      endMinutes === null
    ) {

      wx.showToast({

        title:
          "Invalid time format",

        icon:
          "none"

      })

      return

    }


    if (
      endMinutes <=
      startMinutes
    ) {

      wx.showToast({

        title:
          "End time must be later than start time",

        icon:
          "none"

      })

      return

    }


    var course =
      this.data.course


    if (!course) {

      return

    }


    // =========================
    // 二次确认
    // =========================

    wx.showModal({

      title:
        "Adjust the class time?",

      content:
        "Change the class time to " +
        startTime +
        " - " +
        endTime +
        "?",

      confirmText:
        "Adjust",

      cancelText:
        "Cancel",

      success:
        function (res) {

          if (res.confirm) {

            this.doSaveCourseTime(
              startTime,
              endTime
            )

          }

        }.bind(this)

    })

  },


  // =====================================================
  // 真正保存上课时间
  // =====================================================

  doSaveCourseTime: function (
    startTime,
    endTime
  ) {

    var course =
      this.data.course


    if (!course) {

      return

    }


    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    var found = false


    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      if (
        String(
          courses[i].id
        ) ===
        String(course.id)
      ) {

        courses[i].startTime =
          startTime

        courses[i].endTime =
          endTime

        courses[i].time =
          startTime


        found = true

        break

      }

    }


    if (!found) {

      wx.showToast({

        title:
          "Course not found",

        icon:
          "none"

      })

      return

    }


    var latestCourse = null


    for (
      var c = 0;
      c < courses.length;
      c++
    ) {

      if (
        String(
          courses[c].id
        ) ===
        String(course.id)
      ) {

        latestCourse =
          courses[c]

        break

      }

    }


    if (!latestCourse) {

      return

    }


    var newStatus =
      common.getCourseStatusText(
        common.getCourseStatus(
          latestCourse
        )
      )


    var history =
      wx.getStorageSync(
        "history"
      ) || []


    for (
      var h = 0;
      h < history.length;
      h++
    ) {

      if (
        history[h].courseId &&
        String(
          history[h].courseId
        ) ===
        String(latestCourse.id)
      ) {

        history[h].startTime =
          startTime

        history[h].endTime =
          endTime

        history[h].time =
          startTime

      }

    }


    wx.setStorageSync(
      "courses",
      courses
    )


    wx.setStorageSync(
      "history",
      history
    )


    wx.setStorageSync(
      "selectedCourse",
      latestCourse
    )


    wx.setStorageSync(
      "selectedCourseId",
      latestCourse.id
    )


    this.setData({

      course:
        latestCourse,

      courseStartTime:
        startTime,

      courseEndTime:
        endTime,

      editStartTime:
        startTime,

      editEndTime:
        endTime,

      courseStatus:
        newStatus,

      showTimeEditor:
        false

    })


    wx.showToast({

      title:
        "Class time updated",

      icon:
        "success"

    })

  },


  // =====================================================
  // 本节课程内容
  // =====================================================

  openTopicEditor: function () {

    var course =
      this.data.course


    if (!course) {

      return

    }


    this.setData({

      courseTopic:
        course.topic ||
        "",

      showTopicEditor:
        true

    })

  },


  closeTopicEditor: function () {

    this.setData({

      showTopicEditor:
        false,

      courseTopic:
        this.data.course
          ? this.data.course.topic || ""
          : ""

    })

  },


  inputCourseTopic: function (e) {

    this.setData({

      courseTopic:
        e.detail.value

    })

  },


  saveCourseTopic: function () {

    var topic =
      this.data.courseTopic.trim()


    if (!topic) {

      wx.showToast({

        title:
          "Please enter lesson content",

        icon:
          "none"

      })

      return

    }


    var course =
      this.data.course


    if (!course) {

      return

    }


    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    var found = false


    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      if (
        String(
          courses[i].id
        ) ===
        String(course.id)
      ) {

        courses[i].topic =
          topic

        found = true

        break

      }

    }


    if (!found) {

      wx.showToast({

        title:
          "Course not found",

        icon:
          "none"

      })

      return

    }


    course.topic =
      topic


    wx.setStorageSync(
      "courses",
      courses
    )


    wx.setStorageSync(
      "selectedCourse",
      course
    )


    wx.setStorageSync(
      "selectedCourseId",
      course.id
    )


    this.setData({

      course:
        course,

      courseTopic:
        topic,

      showTopicEditor:
        false

    })


    wx.showToast({

      title:
        "Lesson content saved",

      icon:
        "success"

    })

  },


  // =====================================================
  // 状态
  // =====================================================

  openStatusPanel: function () {

    this.setData({

      showStatusPanel:
        true

    })

  },


  closeStatusPanel: function () {

    this.setData({

      showStatusPanel:
        false

    })

  },


  selectStatus: function (e) {

    var status =
      e.currentTarget.dataset.status


    if (!status) {

      return

    }


    // =========================
    // 学生请假
    // =========================

    if (
      status ===
      "学生请假"
    ) {

      this.setData({

        showStatusPanel:
          false,

        showLeaveReason:
          true,

        leaveReason:
          this.data.leaveReason ||
          ""

      })


      return

    }


    // =========================
    // 普通状态二次确认
    // =========================

    wx.showModal({

      title:
        "Change the class status?",

      content:
        "Change the status to " +
        common.getCourseStatusText(
          status
        ) +
        "?",

      confirmText:
        "Change",

      cancelText:
        "Cancel",

      success:
        function (res) {

          if (res.confirm) {

            this.updateCourseStatus(
              status,
              ""
            )

          }

        }.bind(this)

    })

  },


  // =====================================================
  // 真正更新课程状态
  // =====================================================

  updateCourseStatus: function (
    status,
    leaveReason
  ) {

    var course =
      this.data.course


    if (!course) {

      return

    }


    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      if (
        String(
          courses[i].id
        ) ===
        String(course.id)
      ) {

        courses[i].status =
          status

        courses[i].leaveReason =
          leaveReason || ""

        course.status =
          status

        course.leaveReason =
          leaveReason || ""

        break

      }

    }


    wx.setStorageSync(
      "courses",
      courses
    )


    wx.setStorageSync(
      "selectedCourse",
      course
    )


    wx.setStorageSync(
      "selectedCourseId",
      course.id
    )


    this.setData({

      course:
        course,

      courseStatus:
        common.getCourseStatusText(
          status
        ),

      leaveReason:
        leaveReason || "",

      showStatusPanel:
        false,

      showLeaveReason:
        false

    })


    wx.showToast({

      title:
        "Class status updated",

      icon:
        "success"

    })

  },


  inputLeaveReason: function (e) {

    this.setData({

      leaveReason:
        e.detail.value

    })

  },


  // =====================================================
  // 保存请假
  // =====================================================

  saveLeaveReason: function () {

    var reason =
      this.data.leaveReason.trim()


    if (!reason) {

      reason =
        "Student on leave"

    }


    // =========================
    // 二次确认
    // =========================

    wx.showModal({

      title:
        "Mark student as on leave?",

      content:
        "Mark this lesson as on leave? Reason: " +
        reason,

      confirmText:
        "Mark Leave",

      cancelText:
        "Cancel",

      success:
        function (res) {

          if (res.confirm) {

            this.updateCourseStatus(
              "学生请假",
              reason
            )

          }

        }.bind(this)

    })

  },


  cancelLeaveReason: function () {

    this.setData({

      showLeaveReason:
        false

    })

  },


  // =====================================================
  // 作业
  // =====================================================

  startHomework: function () {

    this.setData({

      showHomework:
        true

    })

  },


  editHomework: function () {

    this.setData({

      showHomework:
        true

    })

  },


  inputHomework: function (e) {

    this.setData({

      homework:
        e.detail.value

    })

  },


  saveHomework: function () {

    var homework =
      this.data.homework.trim()


    if (!homework) {

      wx.showToast({

        title:
          "Please enter homework content first",

        icon:
          "none"

      })

      return

    }


    var course =
      this.data.course


    if (!course) {

      return

    }


    var homeworkKey =
      "homework_" +
      course.id


    wx.setStorageSync(
      homeworkKey,
      homework
    )


    this.setData({

      homework:
        homework,

      homeworkSaved:
        true,

      showHomework:
        false

    })


    wx.showToast({

      title:
        "Homework saved",

      icon:
        "success"

    })

  },


  // =====================================================
  // 课程备注
  // =====================================================

  openNoteEditor: function () {

    this.setData({

      showNoteEditor:
        true

    })

  },


  closeNoteEditor: function () {

    this.setData({

      showNoteEditor:
        false

    })

  },


  inputCourseNote: function (e) {

    this.setData({

      courseNote:
        e.detail.value

    })

  },


  saveCourseNote: function () {

    var course =
      this.data.course


    if (!course) {

      return

    }


    var note =
      this.data.courseNote.trim()


    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      if (
        String(
          courses[i].id
        ) ===
        String(course.id)
      ) {

        courses[i].note =
          note

        break

      }

    }


    course.note =
      note


    wx.setStorageSync(
      "courses",
      courses
    )


    wx.setStorageSync(
      "selectedCourse",
      course
    )


    wx.setStorageSync(
      "selectedCourseId",
      course.id
    )


    this.setData({

      course:
        course,

      courseNote:
        note,

      showNoteEditor:
        false

    })


    wx.showToast({

      title:
        "Notes saved",

      icon:
        "success"

    })

  },


  // =====================================================
  // 课堂反馈
  // =====================================================

  goFeedback: function () {

    var course =
      this.data.course


    if (!course) {

      wx.showToast({

        title:
          "Course information not found",

        icon:
          "none"

      })

      return

    }


    wx.setStorageSync(
      "selectedCourse",
      course
    )


    wx.setStorageSync(
      "selectedCourseId",
      course.id
    )


    wx.setStorageSync(
      "selectedStudent",
      {

        id:
          course.studentId ||
          "",

        name:
          course.student ||
          "",

        grade:
          course.grade ||
          "",

        subject:
          course.subject ||
          "化学"

      }
    )


    wx.navigateTo({

      url:
        "/pages/feedbackCreate/feedbackCreate",

      fail:
        function (err) {

          wx.showToast({

            title:
              "Class feedback page not found",

            icon:
              "none"

          })

        }

    })

  },


  // =====================================================
  // 作业评价
  // =====================================================

  goHomeworkEvaluation:
    function () {

      var course =
        this.data.course


      if (!course) {

        wx.showToast({

          title:
            "Course information not found",

          icon:
            "none"

        })

        return

      }


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
            course.studentId ||
            "",

          name:
            course.student ||
            "",

          grade:
            course.grade ||
            "",

          subject:
            course.subject ||
            "化学"

        }
      )


      wx.navigateTo({

        url:
          "/pages/homeworkEvaluation/homeworkEvaluation",

        fail:
          function (err) {

            wx.showToast({

              title:
                "Homework review page not found",

              icon:
                "none"

            })

          }

      })

  },


  // =====================================================
  // 返回
  // =====================================================

  goBack: function () {

    wx.navigateBack({

      delta:
        1

    })

  }

})