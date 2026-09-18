var common = require("../../utils/common.js")

Page({

  data: {

    // =====================================================
    // 主题
    // =====================================================

    themeClass: "theme-1",

    // =====================================================
    // 当前统计周期
    // =====================================================

    period: "month",

    periodText: "This Month",

    // =====================================================
    // 课程列表
    // =====================================================

    allCourses: [],

    courseList: [],

    // =====================================================
    // 搜索
    // =====================================================

    keyword: ""

  },


  // =====================================================
  // 页面加载
  // =====================================================

  onLoad: function () {

    this.syncTheme()

    this.loadPeriod()

    this.loadCourses()

  },


  // =====================================================
  // 页面显示
  // =====================================================

  onShow: function () {

    this.syncTheme()

    this.loadPeriod()

    this.loadCourses()

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
        Number(
          app.globalData.themeMode
        )

    } else {

      themeMode =
        Number(
          wx.getStorageSync(
            "themeMode"
          ) || 1
        )

    }


    if (
      !app ||
      !app.globalData ||
      !app.globalData.themes ||
      !app.globalData.themes[themeMode]
    ) {

      themeMode = 1

    }


    this.setData({

      themeClass:
        themeMode === 2
          ? "theme-2"
          : "theme-1"

    })


    if (
      app &&
      typeof app.applyTheme === "function"
    ) {

      app.applyTheme(
        themeMode
      )

    }

  },


  // =====================================================
  // 获取统计周期
  // =====================================================

  loadPeriod: function () {

    var period =
      wx.getStorageSync(
        "statisticsPeriod"
      )


    var periodText =
      wx.getStorageSync(
        "statisticsPeriodText"
      )


    if (
      period !== "week" &&
      period !== "month" &&
      period !== "all"
    ) {

      period = "month"

    }


    if (!periodText) {

      if (
        period === "week"
      ) {

        periodText = "This Week"

      }

      else if (
        period === "all"
      ) {

        periodText = "All"

      }

      else {

        periodText = "This Month"

      }

    }


    this.setData({

      period:
        period,

      periodText:
        periodText

    })

  },


  // =====================================================
  // 日期格式
  // =====================================================

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


  // =====================================================
  // 日期显示
  // =====================================================

  formatDateText: function (
    dateString
  ) {

    if (!dateString) {

      return ""

    }


    var parts =
      String(
        dateString
      ).split("-")


    if (
      parts.length !== 3
    ) {

      return dateString

    }


    return (

      parts[0] +
      " " +
      Number(parts[1]) +
      " " +
      Number(parts[2]) +
      ""

    )

  },


  // =====================================================
  // 判断日期是否在统计周期
  // =====================================================

  isInPeriod: function (
    dateString
  ) {

    if (!dateString) {

      return false

    }


    if (
      this.data.period ===
      "all"
    ) {

      return true

    }


    var date =
      new Date(
        String(
          dateString
        ).replace(
          /-/g,
          "/"
        )
      )


    if (
      isNaN(
        date.getTime()
      )
    ) {

      return false

    }


    var now =
      new Date()


    // =====================================================
    // 本月
    // =====================================================

    if (
      this.data.period ===
      "month"
    ) {

      return (

        date.getFullYear() ===
        now.getFullYear()

        &&

        date.getMonth() ===
        now.getMonth()

      )

    }


    // =====================================================
    // 本周
    // =====================================================

    if (
      this.data.period ===
      "week"
    ) {

      var today =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        )


      var day =
        today.getDay()


      if (
        day === 0
      ) {

        day = 7

      }


      var monday =
        new Date(
          today
        )


      monday.setDate(
        today.getDate() -
        day +
        1
      )


      var sunday =
        new Date(
          monday
        )


      sunday.setDate(
        monday.getDate() +
        6
      )


      var current =
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )


      return (

        current >=
        monday

        &&

        current <=
        sunday

      )

    }


    return true

  },


  // =====================================================
  // 加载课程
  // =====================================================

  loadCourses: function () {

    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    var list = []


    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      var course =
        courses[i]


      if (!course) {

        continue

      }


      // 没有课程ID的异常数据跳过
      if (
        !course.id
      ) {

        continue

      }


      // =================================================
      // 根据统计周期筛选
      // =================================================

      if (
        !this.isInPeriod(
          course.date
        )
      ) {

        continue

      }


      var item =
        Object.assign(
          {},
          course
        )


      // =================================================
      // 学生
      // =================================================

      item.student =
        course.student ||
        "Student"


      // =================================================
      // 年级
      // =================================================

      item.grade =
        common.getGradeText(
          course.grade
        )


      // =================================================
      // 科目
      // =================================================

      item.subject =
        common.getSubjectText(
          course.subject
        )


      // =================================================
      // 日期
      // =================================================

      item.displayDate =
        this.formatDateText(
          course.date
        )


      // =================================================
      // 时间
      // =================================================

      item.startTime =
        course.startTime ||
        course.time ||
        ""


      item.endTime =
        course.endTime ||
        ""


      if (
        item.startTime &&
        item.endTime
      ) {

        item.displayTime =
          item.startTime +
          " - " +
          item.endTime

      }

      else if (
        item.startTime
      ) {

        item.displayTime =
          item.startTime

      }

      else {

        item.displayTime =
          "Time not set"

      }


      // =================================================
      // 课程内容
      // =================================================

      item.topic =
        course.topic ||
        ""


      // =================================================
      // 课程状态
      // =================================================

      item.displayStatus =
        common.getCourseStatusText(
          common.getCourseStatus(
            course
          )
        )


      // =================================================
      // 状态样式
      // =================================================

      if (
        item.displayStatus ===
        "Completed"
      ) {

        item.statusClass =
          "status-finished"

      }

      else if (
        item.displayStatus ===
        "In Progress"
      ) {

        item.statusClass =
          "status-running"

      }

      else if (
        item.displayStatus ===
        "On Leave"
      ) {

        item.statusClass =
          "status-leave"

      }

      else if (
        item.displayStatus ===
        "Cancelled"
      ) {

        item.statusClass =
          "status-cancelled"

      }

      else {

        item.statusClass =
          "status-pending"

      }


      list.push(
        item
      )

    }


    // =====================================================
    // 最新课程在最上面
    // 日期 + 开始时间
    // =====================================================

    list.sort(
      function (
        a,
        b
      ) {

        var dateA =
          String(
            a.date ||
            ""
          )

        var dateB =
          String(
            b.date ||
            ""
          )


        if (
          dateA !==
          dateB
        ) {

          return dateB.localeCompare(
            dateA
          )

        }


        var timeA =
          String(
            a.startTime ||
            a.time ||
            ""
          )


        var timeB =
          String(
            b.startTime ||
            b.time ||
            ""
          )


        return timeB.localeCompare(
          timeA
        )

      }
    )


    this.setData({

      allCourses:
        list

    })


    this.filterCourses(
      this.data.keyword,
      list
    )

  },


  // =====================================================
  // 搜索
  // =====================================================

  inputKeyword: function (
    e
  ) {

    var keyword =
      e.detail.value


    this.setData({

      keyword:
        keyword

    })


    this.filterCourses(
      keyword,
      this.data.allCourses
    )

  },


  // =====================================================
  // 清除搜索
  // =====================================================

  clearKeyword: function () {

    this.setData({

      keyword:
        ""

    })


    this.filterCourses(
      "",
      this.data.allCourses
    )

  },


  // =====================================================
  // 筛选课程
  // =====================================================

  filterCourses: function (
    keyword,
    sourceList
  ) {

    var list =
      sourceList || []


    keyword =
      String(
        keyword || ""
      )
      .trim()
      .toLowerCase()


    if (!keyword) {

      this.setData({

        courseList:
          list

      })

      return

    }


    var result = []


    for (
      var i = 0;
      i < list.length;
      i++
    ) {

      var item =
        list[i]


      var text =
        (
          (item.student || "") +
          " " +
          (item.grade || "") +
          " " +
          (item.subject || "") +
          " " +
          (item.topic || "") +
          " " +
          (item.displayStatus || "")
        )
        .toLowerCase()


      if (
        text.indexOf(
          keyword
        ) !== -1
      ) {

        result.push(
          item
        )

      }

    }


    this.setData({

      courseList:
        result

    })

  },


  // =====================================================
  // 打开课程详情
  // =====================================================

  openCourse: function (
    e
  ) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var course =
      this.data.courseList[
        index
      ]


    if (!course) {

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


    wx.navigateTo({

      url:
        "/pages/courseDetail/courseDetail",

      fail:
        function () {

          wx.showToast({

            title:
              "Course details page not found",

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