Page({

  data: {

    themeClass: "theme-1",

    student: "",

    gradeList: [
      "初一",
      "初二",
      "初三",
      "高一",
      "高二",
      "高三"
    ],

    // 英文显示列表：picker 展示用，保存时仍写回 gradeList 的中文值
    gradeDisplayList: [
      "Grade 7",
      "Grade 8",
      "Grade 9",
      "Grade 10",
      "Grade 11",
      "Grade 12"
    ],

    gradeIndex: 3,

    topic: "",

    startDate: "",
    endDate: "",

    startTime: "14:00",
    endTime: "16:00",

    time: "14:00",

    repeatType: "once",

    weekList: [
      {
        name: "Mon",
        value: 1,
        active: false
      },
      {
        name: "Tue",
        value: 2,
        active: false
      },
      {
        name: "Wed",
        value: 3,
        active: false
      },
      {
        name: "Thu",
        value: 4,
        active: false
      },
      {
        name: "Fri",
        value: 5,
        active: false
      },
      {
        name: "Sat",
        value: 6,
        active: false
      },
      {
        name: "Sun",
        value: 7,
        active: false
      }
    ]

  },


  /* =========================
   同步主题
========================= */

syncTheme: function () {

  var app = getApp()

  var themeMode = 1

  // 从全局主题读取
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

  // 防止主题编号异常
  if (
    !app.globalData.themes ||
    !app.globalData.themes[themeMode]
  ) {

    themeMode = 1

  }

  // 页面主题
  this.setData({

    themeClass:
      themeMode === 2
        ? "theme-2"
        : "theme-1"

  })

  // 系统导航栏、系统背景
  // 统一交给 app.js 管理
  if (
    app &&
    typeof app.applyTheme === "function"
  ) {

    app.applyTheme(themeMode)

  }

},


  /* =========================
     页面加载
  ========================= */

  onLoad: function () {

    this.syncTheme()

    var today =
      this.getToday()

    var createCourseDate =
      wx.getStorageSync(
        "createCourseDate"
      )

    if (createCourseDate) {

      today =
        createCourseDate

      wx.removeStorageSync(
        "createCourseDate"
      )

    }

    var weekList =
      this.data.weekList

    var day =
      this.parseDate(
        today
      ).getDay()

    if (day === 0) {

      day = 7

    }

    for (
      var i = 0;
      i < weekList.length;
      i++
    ) {

      weekList[i].active =
        weekList[i].value === day

    }

    this.setData({

      startDate:
        today,

      endDate:
        this.getMonthEnd(
          today
        ),

      weekList:
        weekList

    })

  },


  onShow: function () {

    this.syncTheme()

  },


  /* =========================
     获取今天
  ========================= */

  getToday: function () {

    return this.formatDate(
      new Date()
    )

  },


  /* =========================
     获取当月最后一天
  ========================= */

  getMonthEnd: function (
    dateString
  ) {

    var parts =
      dateString.split("-")

    var year =
      Number(parts[0])

    var month =
      Number(parts[1])

    var lastDay =
      new Date(
        year,
        month,
        0
      ).getDate()

    var monthText =
      String(month)

    var dayText =
      String(lastDay)

    if (
      monthText.length < 2
    ) {

      monthText =
        "0" + monthText

    }

    if (
      dayText.length < 2
    ) {

      dayText =
        "0" + dayText

    }

    return (
      year +
      "-" +
      monthText +
      "-" +
      dayText
    )

  },


  /* =========================
     日期转换
  ========================= */

  parseDate: function (
    dateString
  ) {

    var parts =
      dateString.split("-")

    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    )

  },


  /* =========================
     格式化日期
  ========================= */

  formatDate: function (
    date
  ) {

    var year =
      date.getFullYear()

    var month =
      date.getMonth() + 1

    var day =
      date.getDate()

    if (
      month < 10
    ) {

      month =
        "0" + month

    }

    if (
      day < 10
    ) {

      day =
        "0" + day

    }

    return (
      year +
      "-" +
      month +
      "-" +
      day
    )

  },


  /* =========================
     学生姓名
  ========================= */

  inputStudent: function (e) {

    this.setData({

      student:
        e.detail.value

    })

  },


  /* =========================
     年级
  ========================= */

  changeGrade: function (e) {

    this.setData({

      gradeIndex:
        Number(
          e.detail.value
        )

    })

  },


  /* =========================
     课程内容
  ========================= */

  inputTopic: function (e) {

    this.setData({

      topic:
        e.detail.value

    })

  },


  /* =========================
     开始日期
  ========================= */

  changeStartDate: function (e) {

    var date =
      e.detail.value

    var endDate =
      this.data.endDate

    if (
      date > endDate
    ) {

      endDate =
        this.getMonthEnd(
          date
        )

    }

    this.setData({

      startDate:
        date,

      endDate:
        endDate

    })

  },


  /* =========================
     开始时间
  ========================= */

  changeTime: function (e) {

    var startTime =
      e.detail.value

    var endTime =
      this.addHours(
        startTime,
        2
      )

    this.setData({

      startTime:
        startTime,

      time:
        startTime,

      endTime:
        endTime

    })

  },


  /* =========================
     结束时间
  ========================= */

  changeEndTime: function (e) {

    this.setData({

      endTime:
        e.detail.value

    })

  },


  /* =========================
     时间增加小时
  ========================= */

  addHours: function (
    time,
    hours
  ) {

    if (!time) {

      return "16:00"

    }

    var parts =
      time.split(":")

    if (
      parts.length !== 2
    ) {

      return "16:00"

    }

    var hour =
      Number(parts[0])

    var minute =
      Number(parts[1])

    if (
      isNaN(hour) ||
      isNaN(minute)
    ) {

      return "16:00"

    }

    var totalMinutes =
      hour * 60 +
      minute +
      hours * 60

    if (
      totalMinutes > 1439
    ) {

      totalMinutes =
        1439

    }

    var endHour =
      Math.floor(
        totalMinutes / 60
      )

    var endMinute =
      totalMinutes % 60

    var hourText =
      String(endHour)

    var minuteText =
      String(endMinute)

    if (
      hourText.length < 2
    ) {

      hourText =
        "0" + hourText

    }

    if (
      minuteText.length < 2
    ) {

      minuteText =
        "0" + minuteText

    }

    return (
      hourText +
      ":" +
      minuteText
    )

  },


  /* =========================
     时间转换成分钟
  ========================= */

  timeToMinutes: function (
    time
  ) {

    if (!time) {

      return -1

    }

    var parts =
      time.split(":")

    if (
      parts.length !== 2
    ) {

      return -1

    }

    var hour =
      Number(parts[0])

    var minute =
      Number(parts[1])

    if (
      isNaN(hour) ||
      isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {

      return -1

    }

    return (
      hour * 60 +
      minute
    )

  },


  /* =========================
     检查时间
  ========================= */

  validateTime: function () {

    var start =
      this.timeToMinutes(
        this.data.startTime
      )

    var end =
      this.timeToMinutes(
        this.data.endTime
      )

    if (
      start < 0 ||
      end < 0
    ) {

      wx.showToast({

        title:
          "Please complete the class time",

        icon:
          "none"

      })

      return false

    }

    if (
      end <= start
    ) {

      wx.showToast({

        title:
          "End time must be later than start time",

        icon:
          "none"

      })

      return false

    }

    return true

  },


  /* =========================
     重复结束日期
  ========================= */

  changeEndDate: function (e) {

    this.setData({

      endDate:
        e.detail.value

    })

  },


  /* =========================
     单次课程
  ========================= */

  selectOnce: function () {

    this.setData({

      repeatType:
        "once"

    })

  },


  /* =========================
     每周重复
  ========================= */

  selectWeekly: function () {

    this.setData({

      repeatType:
        "weekly"

    })

  },


  /* =========================
     选择星期
  ========================= */

  selectWeek: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )

    var weekList =
      this.data.weekList.slice()

    if (!weekList[index]) {

      return

    }

    weekList[index].active =
      !weekList[index].active

    this.setData({

      weekList:
        weekList

    })

  },


  /* =========================
     获取或创建学生
  ========================= */

  getOrCreateStudent: function () {

    var studentName =
      this.data.student.trim()

    var grade =
      this.data.gradeList[
        this.data.gradeIndex
      ]

    // =================================================
    // 学生信息以 courses 为真实来源。
    // 从已有课程中查找同名学生，复用其 studentId。
    // 不再读写独立的 students 数组。
    // =================================================

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
          courses[i].student || ""
        ).trim() ===
        studentName
      ) {

        return {
          id:
            courses[i].studentId ||
            "student_" + Date.now(),

          name:
            studentName,

          grade:
            courses[i].grade ||
            grade,

          subject:
            courses[i].subject ||
            "化学"
        }

      }

    }

    // 新学生：生成新的 studentId，不再写入 students 数组
    return {

      id:
        "student_" +
        Date.now(),

      name:
        studentName,

      grade:
        grade,

      subject:
        "化学"

    }

  },


  /* =========================
     保存课程
  ========================= */

  saveCourse: function () {

    var student =
      this.data.student.trim()

    var topic =
      this.data.topic.trim()

    if (!student) {

      wx.showToast({

        title:
          "Please enter the student name",

        icon:
          "none"

      })

      return

    }

    if (!topic) {

      wx.showToast({

        title:
          "Please enter the lesson content",

        icon:
          "none"

      })

      return

    }

    if (
      !this.data.startDate ||
      !this.data.startTime ||
      !this.data.endTime
    ) {

      wx.showToast({

        title:
          "Please complete the class time",

        icon:
          "none"

      })

      return

    }

    if (
      !this.validateTime()
    ) {

      return

    }

    if (
      this.data.repeatType ===
      "weekly"
    ) {

      this.saveWeeklyCourses()

    } else {

      this.saveSingleCourse()

    }

  },


  /* =========================
     保存单次课程
  ========================= */

  saveSingleCourse: function () {

    var courses =
      wx.getStorageSync(
        "courses"
      ) || []

    var student =
      this.getOrCreateStudent()

    var now =
      Date.now()

    var course = {

      id:
        "course_" +
        now,

      studentId:
        student.id,

      date:
        this.data.startDate,

      startTime:
        this.data.startTime,

      endTime:
        this.data.endTime,

      time:
        this.data.startTime,

      student:
        student.name,

      grade:
        this.data.gradeList[
          this.data.gradeIndex
        ],

      subject:
        "化学",

      topic:
        this.data.topic.trim(),

      status:
        "待开始",

      leaveReason:
        "",

      note:
        "",

      repeat:
        false,

      repeatType:
        "once",

      repeatId:
        "",

      createdAt:
        now

    }

    courses.push(
      course
    )

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

    wx.setStorageSync(
      "selectedStudent",
      student
    )

    wx.showToast({

      title:
        "Course added",

      icon:
        "success"

    })

    setTimeout(
      function () {

        wx.navigateBack({

          delta:
            1

        })

      },
      800
    )

  },


  /* =========================
     保存每周课程
  ========================= */

  saveWeeklyCourses:
    function () {

      var selectedWeeks =
        []

      for (
        var i = 0;
        i <
        this.data.weekList.length;
        i++
      ) {

        if (
          this.data.weekList[i]
            .active
        ) {

          selectedWeeks.push(
            this.data.weekList[i]
              .value
          )

        }

      }

      if (
        selectedWeeks.length ===
        0
      ) {

        wx.showToast({

          title:
            "Please select repeat days",

          icon:
            "none"

        })

        return

      }

      if (
        this.data.endDate <
        this.data.startDate
      ) {

        wx.showToast({

          title:
            "End date cannot be before start date",

          icon:
            "none"

        })

        return

      }

      var courses =
        wx.getStorageSync(
          "courses"
        ) || []

      var student =
        this.getOrCreateStudent()

      var now =
        Date.now()

      var repeatId =
        "repeat_" +
        now

      var start =
        this.parseDate(
          this.data.startDate
        )

      var end =
        this.parseDate(
          this.data.endDate
        )

      var current =
        new Date(start)

      var addCount =
        0

      while (
        current <= end
      ) {

        var weekDay =
          current.getDay()

        if (
          weekDay === 0
        ) {

          weekDay = 7

        }

        if (
          selectedWeeks.indexOf(
            weekDay
          ) !== -1
        ) {

          var dateString =
            this.formatDate(
              current
            )

          var courseTopic =
            ""

          if (
            addCount === 0
          ) {

            courseTopic =
              this.data.topic.trim()

          }

          var course = {

            id:
              "course_" +
              now +
              "_" +
              addCount,

            studentId:
              student.id,

            date:
              dateString,

            startTime:
              this.data.startTime,

            endTime:
              this.data.endTime,

            time:
              this.data.startTime,

            student:
              student.name,

            grade:
              this.data.gradeList[
                this.data.gradeIndex
              ],

            subject:
              "化学",

            topic:
              courseTopic,

            status:
              "待开始",

            leaveReason:
              "",

            note:
              "",

            repeat:
              true,

            repeatType:
              "weekly",

            repeatId:
              repeatId,

            createdAt:
              now

          }

          courses.push(
            course
          )

          addCount++

        }

        current.setDate(
          current.getDate() + 1
        )

      }

      if (
        addCount === 0
      ) {

        wx.showToast({

          title:
            "No courses generated",

          icon:
            "none"

        })

        return

      }

      wx.setStorageSync(
        "courses",
        courses
      )

      var firstCourse =
        null

      for (
        var j = 0;
        j < courses.length;
        j++
      ) {

        if (
          courses[j]
            .repeatId ===
          repeatId
        ) {

          firstCourse =
            courses[j]

          break

        }

      }

      if (firstCourse) {

        wx.setStorageSync(
          "selectedCourse",
          firstCourse
        )

        wx.setStorageSync(
          "selectedCourseId",
          firstCourse.id
        )

      }

      wx.setStorageSync(
        "selectedStudent",
        student
      )

      wx.showModal({

        title:
          "Added",

        content:
          "Generated " +
          addCount +
          " recurring courses",

        showCancel:
          false,

        success:
          function () {

            wx.navigateBack({

              delta:
                1

            })

          }

      })

    }

})