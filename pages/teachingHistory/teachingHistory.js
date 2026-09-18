var common = require("../../utils/common.js")


Page({

  data: {

    // =========================================================
    // 主题
    // =========================================================

    themeClass: "theme-1",


    // =========================================================
    // 当前栏目
    // feedback = 课堂反馈
    // homework = 作业评价
    // =========================================================

    currentTab: "feedback",


    // =========================================================
    // 搜索
    // =========================================================

    keyword: "",


    // =========================================================
    // 课堂反馈
    // =========================================================

    allHistoryList: [],

    historyList: [],


    // =========================================================
    // 作业评价
    // =========================================================

    allHomeworkList: [],

    homeworkList: []

  },


  // =========================================================
  // 页面加载
  // =========================================================

  onLoad: function () {

    this.syncTheme()

    this.loadFeedbackHistory()

    this.loadHomeworkHistory()

  },


  // =========================================================
  // 页面显示
  // =========================================================

  onShow: function () {

    this.syncTheme()

    this.loadFeedbackHistory()

    this.loadHomeworkHistory()

  },


  // =========================================================
  // 同步主题
  // =========================================================

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


  // =========================================================
  // 切换栏目
  // =========================================================

  switchTab: function (e) {

    var tab =
      e.currentTarget.dataset.tab


    if (
      tab !== "feedback" &&
      tab !== "homework"
    ) {

      return

    }


    this.setData({

      currentTab:
        tab,

      keyword:
        ""

    })


    if (
      tab === "feedback"
    ) {

      this.filterHistory(
        "",
        this.data.allHistoryList
      )

    } else {

      this.filterHomework(
        "",
        this.data.allHomeworkList
      )

    }

  },


  // =========================================================
  // 获取记录的真正填写/保存时间
  //
  // 优先级：
  //
  // 1. savedAt
  // 2. time（数字时间戳）
  // 3. time（日期字符串）
  //
  // 这样可以兼容旧数据
  // =========================================================

  getRecordTimestamp: function (item) {

    if (!item) {

      return 0

    }


    // =======================================================
    // 第一优先：savedAt
    // =======================================================

    var savedAt =
      item.savedAt


    if (
      savedAt !== undefined &&
      savedAt !== null &&
      savedAt !== ""
    ) {

      // 数字时间戳

      var savedNumber =
        Number(savedAt)


      if (
        !isNaN(savedNumber) &&
        savedNumber > 0
      ) {

        return savedNumber

      }


      // 如果 savedAt 是日期字符串

      if (
        typeof savedAt === "string"
      ) {

        var savedDate =
          this.parseDateString(
            savedAt
          )


        if (
          savedDate > 0
        ) {

          return savedDate

        }

      }

    }


    // =======================================================
    // 第二优先：time
    // =======================================================

    var time =
      item.time


    if (
      time !== undefined &&
      time !== null &&
      time !== ""
    ) {

      // 数字时间戳

      if (
        typeof time === "number"
      ) {

        return time

      }


      // 字符串

      if (
        typeof time === "string"
      ) {

        var timeString =
          time.trim()


        // 先尝试直接转数字

        var timeNumber =
          Number(timeString)


        if (
          !isNaN(timeNumber) &&
          timeNumber > 0
        ) {

          return timeNumber

        }


        // 再尝试日期字符串

        var timeDate =
          this.parseDateString(
            timeString
          )


        if (
          timeDate > 0
        ) {

          return timeDate

        }

      }

    }


    return 0

  },


  // =========================================================
  // 将日期字符串转换成时间戳
  //
  // 支持：
  //
  // 2026-09-06 12:30
  // 2026-09-06 12:30:00
  // 2026/09/06 12:30
  //
  // =========================================================

  parseDateString: function (value) {

    if (!value) {

      return 0

    }


    var text =
      String(value).trim()


    if (!text) {

      return 0

    }


    // =======================================================
    // YYYY-MM-DD HH:mm
    // 微信开发者工具中使用 / 会更稳定
    // =======================================================

    var normalized =
      text.replace(
        /-/g,
        "/"
      )


    var date =
      new Date(
        normalized
      )


    if (
      !isNaN(
        date.getTime()
      )
    ) {

      return date.getTime()

    }


    return 0

  },


  // =========================================================
  // 加载课堂反馈
  //
  // 只读取真正的 feedback 类型
  // 防止其他 history 数据混进来
  // =========================================================

  loadFeedbackHistory: function () {

    var history =
      wx.getStorageSync(
        "history"
      ) || []


    var feedbackHistory =
      history.filter(
        function (item) {

          return (
            item &&
            item.type === "feedback"
          )

        }
      )


    var list = []


    for (
      var i = 0;
      i < feedbackHistory.length;
      i++
    ) {

      var item =
        feedbackHistory[i]


      var newItem =
        Object.assign(
          {},
          item
        )


      // =====================================================
      // 真正的填写/保存时间
      //
      // 后面排序统一使用 savedAt
      // =====================================================

      newItem.savedAt =
        this.getRecordTimestamp(
          item
        )


      // =====================================================
      // 显示时间
      //
      // 优先使用 timeText
      // =====================================================

      if (
        item.timeText
      ) {

        newItem.displayTime =
          item.timeText

      } else if (
        newItem.savedAt
      ) {

        newItem.displayTime =
          this.formatHistoryTime(
            new Date(
              newItem.savedAt
            )
          )

      } else if (
        item.time
      ) {

        newItem.displayTime =
          item.time

      } else {

        newItem.displayTime =
          ""

      }


      // =====================================================
      // 日期
      //
      // 这里是课程日期
      // 不是排序依据
      // =====================================================

      newItem.displayDate =
        this.formatDateText(
          item.date
        )


      // =====================================================
      // 学生
      // =====================================================

      newItem.student =
        item.student ||
        "Student"


      // =====================================================
      // 年级
      // =====================================================

      newItem.grade =
        common.getGradeText(
          item.grade
        )


      // =====================================================
      // 科目
      // =====================================================

      newItem.subject =
        common.getSubjectText(
          item.subject
        )


      // =====================================================
      // 课程
      //
      // 数据继续保留
      // 页面不显示
      // =====================================================

      newItem.lesson =
        item.lesson ||
        "Class Feedback"


      // =====================================================
      // 知识点
      // =====================================================

      newItem.topic =
        item.topic ||
        ""


      // =====================================================
      // 内容
      // =====================================================

      newItem.content =
        item.content ||
        ""


      list.push(
        newItem
      )

    }


    // =========================================================
    // ★ 核心修改
    //
    // 按填写/保存时间倒序
    //
    // 最新填写的记录排最上面
    //
    // 与课程日期完全无关
    // =========================================================

    list.sort(
      function (a, b) {

        var timeA =
          Number(
            a.savedAt || 0
          )


        var timeB =
          Number(
            b.savedAt || 0
          )


        return (
          timeB -
          timeA
        )

      }
    )


    this.setData({

      allHistoryList:
        list

    })


    this.filterHistory(

      this.data.keyword,

      list

    )

  },


  // =========================================================
  // 加载作业评价
  // =========================================================

  loadHomeworkHistory: function () {

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


      if (
        !course ||
        !course.id
      ) {

        continue

      }


      var key =
        "homeworkEvaluation_" +
        course.id


      var record =
        wx.getStorageSync(
          key
        )


      if (
        !record ||
        !record.evaluation
      ) {

        continue

      }


      var item =
        Object.assign(
          {},
          record
        )


      // =====================================================
      // 学生
      // =====================================================

      item.student =
        record.student ||
        course.student ||
        "Student"


      // =====================================================
      // 年级
      // =====================================================

      item.grade =
        common.getGradeText(
          record.grade ||
          course.grade
        )


      // =====================================================
      // 学科
      // =====================================================

      item.subject =
        common.getSubjectText(
          record.subject ||
          course.subject
        )


      // =====================================================
      // 日期
      // =====================================================

      item.date =
        record.date ||
        course.date ||
        ""


      // =====================================================
      // 开始时间
      // =====================================================

      item.startTime =
        record.startTime ||
        course.startTime ||
        record.time ||
        course.time ||
        ""


      // =====================================================
      // 结束时间
      // =====================================================

      item.endTime =
        record.endTime ||
        course.endTime ||
        ""


      // =====================================================
      // 兼容旧代码
      // =====================================================

      item.time =
        item.startTime ||
        ""


      // =====================================================
      // 知识点
      // =====================================================

      item.topic =
        record.topic ||
        course.topic ||
        ""


      // =====================================================
      // 作业
      // =====================================================

      item.homework =
        record.homework ||
        ""


      // =====================================================
      // 成绩
      // =====================================================

      item.score =
        record.score ||
        ""


      // =====================================================
      // 评价
      // =====================================================

      item.evaluation =
        record.evaluation ||
        ""


      // =====================================================
      // 课程 ID
      // =====================================================

      item.courseId =
        record.courseId ||
        course.id


      // =====================================================
      // 显示日期
      //
      // 这里显示的是课程日期
      // =====================================================

      item.displayDate =
        this.formatDateText(
          item.date
        )


      // =====================================================
      // ★ 真正的填写/保存时间
      // =====================================================

      item.savedAt =
        this.getRecordTimestamp(
          record
        )


      // =====================================================
      // 显示填写时间
      // =====================================================

      item.displayTime =
        this.formatSavedTime(
          item.savedAt
        )


      list.push(
        item
      )

    }


    // =========================================================
    // ★ 核心修改
    //
    // 作业评价也按照保存时间倒序
    //
    // 最新填写的排最上面
    // =========================================================

    list.sort(
      function (a, b) {

        var timeA =
          Number(
            a.savedAt || 0
          )


        var timeB =
          Number(
            b.savedAt || 0
          )


        return (
          timeB -
          timeA
        )

      }
    )


    this.setData({

      allHomeworkList:
        list

    })


    this.filterHomework(

      this.data.keyword,

      list

    )

  },


  // =========================================================
  // 日期格式
  // =========================================================

  formatDateText: function (
    dateString
  ) {

    if (
      !dateString
    ) {

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
      Number(
        parts[1]
      ) +
      " " +
      Number(
        parts[2]
      ) +
      ""

    )

  },


  // =========================================================
  // 课堂反馈时间
  // =========================================================

  formatHistoryTime: function (
    date
  ) {

    if (
      !date
    ) {

      return ""

    }


    var year =
      date.getFullYear()

    var month =
      date.getMonth() + 1

    var day =
      date.getDate()

    var hour =
      date.getHours()

    var minute =
      date.getMinutes()


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


    if (
      hour < 10
    ) {

      hour =
        "0" + hour

    }


    if (
      minute < 10
    ) {

      minute =
        "0" + minute

    }


    return (

      year +
      "-" +
      month +
      "-" +
      day +
      " " +
      hour +
      ":" +
      minute

    )

  },


  // =========================================================
  // 作业保存时间
  // =========================================================

  formatSavedTime: function (
    timestamp
  ) {

    if (
      !timestamp
    ) {

      return ""

    }


    var date =
      new Date(
        Number(
          timestamp
        )
      )


    if (
      isNaN(
        date.getTime()
      )
    ) {

      return ""

    }


    return this.formatHistoryTime(
      date
    )

  },


  // =========================================================
  // 搜索
  // =========================================================

  inputKeyword: function (
    e
  ) {

    var keyword =
      e.detail.value


    this.setData({

      keyword:
        keyword

    })


    if (
      this.data.currentTab ===
      "feedback"
    ) {

      this.filterHistory(

        keyword,

        this.data.allHistoryList

      )

    } else {

      this.filterHomework(

        keyword,

        this.data.allHomeworkList

      )

    }

  },


  // =========================================================
  // 清除搜索
  // =========================================================

  clearKeyword: function () {

    this.setData({

      keyword:
        ""

    })


    if (
      this.data.currentTab ===
      "feedback"
    ) {

      this.filterHistory(

        "",

        this.data.allHistoryList

      )

    } else {

      this.filterHomework(

        "",

        this.data.allHomeworkList

      )

    }

  },


  // =========================================================
  // 搜索课堂反馈
  // =========================================================

  filterHistory: function (
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


    if (
      !keyword
    ) {

      this.setData({

        historyList:
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
          (item.lesson || "") +
          " " +
          (item.content || "")
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

      historyList:
        result

    })

  },


  // =========================================================
  // 搜索作业评价
  // =========================================================

  filterHomework: function (
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


    if (
      !keyword
    ) {

      this.setData({

        homeworkList:
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
          (item.homework || "") +
          " " +
          (item.evaluation || "") +
          " " +
          (item.score || "")
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

      homeworkList:
        result

    })

  },


  // =========================================================
  // 复制课堂反馈
  // =========================================================

  copyHistory: function (
    e
  ) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var item =
      this.data.historyList[
        index
      ]


    if (
      !item ||
      !item.content
    ) {

      wx.showToast({

        title:
          "Nothing to copy",

        icon:
          "none"

      })

      return

    }


    wx.setClipboardData({

      data:
        item.content,

      success:
        function () {

          wx.showToast({

            title:
              "Copied",

            icon:
              "success"

          })

        }

    })

  },


  // =========================================================
  // 删除课堂反馈
  // =========================================================

  deleteHistory: function (
    e
  ) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var item =
      this.data.historyList[
        index
      ]


    if (
      !item
    ) {

      return

    }


    var that =
      this


    wx.showModal({

      title:
        "Delete Class Feedback",

      content:
        "Delete this class feedback?",

      confirmText:
        "Delete",

      cancelText:
        "Cancel",

      success:
        function (res) {

          if (
            !res.confirm
          ) {

            return

          }


          var history =
            wx.getStorageSync(
              "history"
            ) || []


          history =
            history.filter(
              function (
                historyItem
              ) {

                return (
                  historyItem.id !==
                  item.id
                )

              }
            )


          wx.setStorageSync(

            "history",

            history

          )


          that.loadFeedbackHistory()


          wx.showToast({

            title:
              "Deleted",

            icon:
              "success"

          })

        }

    })

  },


  // =========================================================
  // 复制作业评价
  // =========================================================

  copyHomework: function (
    e
  ) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var item =
      this.data.homeworkList[
        index
      ]


    if (
      !item
    ) {

      wx.showToast({

        title:
          "Record not found",

        icon:
          "none"

      })

      return

    }


    var text = ""


    text +=
      "[Homework Review]\n"


    text +=
      "Student: " +
      (
        item.student ||
        "Student"
      ) +
      "\n"


    if (
      item.grade
    ) {

      text +=
        "Grade: " +
        item.grade +
        "\n"

    }


    if (
      item.date
    ) {

      text +=
        "Date: " +
        item.date +
        "\n"

    }


    if (
      item.startTime ||
      item.time
    ) {

      text +=
        "Class Time: " +
        (
          item.startTime ||
          item.time
        )


      if (
        item.endTime
      ) {

        text +=
          " - " +
          item.endTime

      }


      text +=
        "\n"

    }


    if (
      item.topic
    ) {

      text +=
        "Topic: " +
        item.topic +
        "\n"

    }


    if (
      item.homework
    ) {

      text +=
        "Homework: " +
        item.homework +
        "\n"

    }


    if (
      item.score
    ) {

      text +=
        "Score: " +
        item.score +
        " points\n"

    }


    text +=
      "Review: " +
      item.evaluation


    wx.setClipboardData({

      data:
        text,

      success:
        function () {

          wx.showToast({

            title:
              "Copied",

            icon:
              "success"

          })

        }

    })

  },


  // =========================================================
  // 删除作业评价
  // =========================================================

  deleteHomework: function (
    e
  ) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var item =
      this.data.homeworkList[
        index
      ]


    if (
      !item ||
      !item.courseId
    ) {

      return

    }


    var that =
      this


    wx.showModal({

      title:
        "Delete Homework Review",

      content:
        "Delete this homework review?",

      confirmText:
        "Delete",

      cancelText:
        "Cancel",

      success:
        function (res) {

          if (
            !res.confirm
          ) {

            return

          }


          var key =
            "homeworkEvaluation_" +
            item.courseId


          wx.removeStorageSync(
            key
          )


          that.loadHomeworkHistory()


          wx.showToast({

            title:
              "Deleted",

            icon:
              "success"

          })

        }

    })

  },


  // =========================================================
  // 返回
  // =========================================================

  goBack: function () {

    wx.navigateBack({

      delta:
        1

    })

  }

})

