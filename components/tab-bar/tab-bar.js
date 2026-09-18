// ============================================================
// 公共底部导航组件
//
// 四个一级页面（今日 / 日历 / 数据 / 我的）复用，
// 通过 active 属性标记当前页面，内部用 wx.reLaunch 切换。
// ============================================================

var common = require("../../utils/common.js")


Component({

  options: {
    styleIsolation: "apply-shared"
  },

  properties: {
    // 当前激活的 tab：today / calendar / statistics / mine
    active: {
      type: String,
      value: "today"
    }
  },

  data: {
    themeClass: "theme-1"
  },

  lifetimes: {
    attached: function () {
      var themeMode = common.getThemeMode()

      this.setData({
        themeClass:
          themeMode === 2
            ? "theme-2"
            : "theme-1"
      })
    }
  },

  methods: {

    goToday: function () {
      wx.reLaunch({
        url: "/pages/index/index"
      })
    },

    goCalendar: function () {
      wx.reLaunch({
        url: "/pages/calendar/calendar"
      })
    },

    goStatistics: function () {
      wx.reLaunch({
        url: "/pages/statistics/statistics"
      })
    },

    goMine: function () {
      wx.reLaunch({
        url: "/pages/mine/mine"
      })
    }

  }

})
