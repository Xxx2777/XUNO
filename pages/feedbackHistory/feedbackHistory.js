var common = require("../../utils/common.js")


Page({

  data: {

    // =========================================================
    // 主题
    // =========================================================

    themeClass: "theme-1",


    // =========================================================
    // 历史记录
    // =========================================================

    allHistoryList: [],

    historyList: [],

    keyword: ""

  },


  // =========================================================
  // 页面加载
  // =========================================================

  onLoad: function () {

    this.syncTheme()

    this.loadHistory()

  },


  // =========================================================
  // 页面显示
  // =========================================================

  onShow: function () {

    this.syncTheme()

    this.loadHistory()

  },


  // =========================================================
  // 同步主题
  //
  // 主题统一由 app.js 管理
  //
  // 本页面只负责：
  // 1. 获取当前主题
  // 2. 设置 themeClass
  // 3. 调用 app.applyTheme()
  //
  // 不再在这里写死导航栏颜色
  // =========================================================

  syncTheme: function () {

    var app = getApp()

    var themeMode = 1


    // =======================================================
    // 优先从全局主题获取
    // =======================================================

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

      // =====================================================
      // 全局不存在时，从本地缓存读取
      // =====================================================

      themeMode =
        Number(
          wx.getStorageSync(
            "themeMode"
          ) || 1
        )

    }


    // =======================================================
    // 判断主题是否存在
    // =======================================================

    if (
      !app ||
      !app.globalData ||
      !app.globalData.themes ||
      !app.globalData.themes[themeMode]
    ) {

      themeMode = 1

    }


    // =======================================================
    // 设置页面主题 class
    //
    // 后续如果增加模式3、模式4，
    // 这里仍然可以继续扩展。
    // =======================================================

    this.setData({

      themeClass:
        themeMode === 2
          ? "theme-2"
          : "theme-1"

    })


    // =======================================================
    // 统一交给 app.js
    //
    // app.js 会负责：
    // 1. 保存当前主题
    // 2. 修改系统导航栏颜色
    // 3. 修改系统背景颜色
    // =======================================================

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
  // 加载历史记录
  // =========================================================

  loadHistory: function () {

    var history =
      wx.getStorageSync(
        "history"
      ) || []


    var feedbackHistory =
      history.filter(
        function (item) {

          return (
            item &&
            (
              item.type === "feedback" ||
              item.content
            )
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
      // 时间
      // =====================================================

      if (
        item.timeText
      ) {

        newItem.displayTime =
          item.timeText

      } else if (
        typeof item.time === "number"
      ) {

        newItem.displayTime =
          this.formatHistoryTime(
            new Date(
              item.time
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


    // =====================================================
    // 保存全部历史
    // =====================================================

    this.setData({

      allHistoryList:
        list

    })


    // =====================================================
    // 根据当前搜索关键词筛选
    // =====================================================

    this.filterHistory(

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
      dateString.split("-")


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
  // 时间格式
  // =========================================================

  formatHistoryTime: function (
    date
  ) {

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


    this.filterHistory(

      keyword,

      this.data.allHistoryList

    )

  },


  // =========================================================
  // 清除搜索
  // =========================================================

  clearKeyword: function () {

    this.setData({

      keyword:
        ""

    })


    this.filterHistory(

      "",

      this.data.allHistoryList

    )

  },


  // =========================================================
  // 筛选历史
  // =========================================================

  filterHistory: function (
    keyword,
    sourceList
  ) {

    var list =
      sourceList || []


    keyword =
      (keyword || "")
        .trim()
        .toLowerCase()


    // =====================================================
    // 没有搜索关键词
    // =====================================================

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


    // =====================================================
    // 搜索
    // =====================================================

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

        ).toLowerCase()


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
  // 返回
  // =========================================================

  goBack: function () {

    wx.navigateBack({

      delta:
        1

    })

  },


  // =========================================================
  // 复制反馈
  // =========================================================

  copyHistory: function (
    e
  ) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var item =
      this.data.historyList[index]


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
  // 删除记录
  // =========================================================

  deleteHistory: function (
    e
  ) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var item =
      this.data.historyList[index]


    if (
      !item
    ) {

      return

    }


    var that =
      this


    wx.showModal({

      title:
        "Delete Record",

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


          // ===============================================
          // 重新读取全部历史记录
          // ===============================================

          var history =
            wx.getStorageSync(
              "history"
            ) || []


          // ===============================================
          // 根据 id 删除
          // ===============================================

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


          // ===============================================
          // 保存
          // ===============================================

          wx.setStorageSync(

            "history",

            history

          )


          // ===============================================
          // 刷新页面
          // ===============================================

          that.loadHistory()


          wx.showToast({

            title:
              "Deleted",

            icon:
              "success"

          })

        }

    })

  }

})