App({

  globalData: {

    // =====================================================
    // 当前主题
    // 1 = 紫色
    // 2 = 蓝紫色
    // =====================================================

    themeMode: 1,


    // =====================================================
    // 全部主题配置
    //
    // 以后增加主题，只需要在这里增加新的主题
    // =====================================================

    themes: {

      // ---------------------------------------------------
      // 模式1 · 紫色
      // ---------------------------------------------------

      1: {
        name: "Theme 1",

        main: "#765B91",

        mainLight: "#EEE9F4",

        background: "#F7F5FA",

        navigationBar: "#765B91"
      },


      // ---------------------------------------------------
      // 模式2 · 蓝紫色
      // ---------------------------------------------------

      2: {
        name: "Theme 2",

        main: "#7D86C9",

        mainLight: "#EEF0FA",

        background: "#F6F7FB",

        navigationBar: "#7D86C9"
      }

    }

  },


  // =========================================================
  // 小程序启动
  // =========================================================

  onLaunch: function () {

    var themeMode = Number(
      wx.getStorageSync("themeMode") || 1
    )

    this.applyTheme(themeMode)

  },


  // =========================================================
  // 获取主题配置
  //
  // 页面以后如果需要获取主题颜色，
  // 可以通过：
  //
  // var app = getApp()
  // var theme = app.getTheme()
  //
  // =========================================================

  getTheme: function (themeMode) {

    if (themeMode === undefined) {
      themeMode = this.globalData.themeMode
    }

    themeMode = Number(themeMode)

    if (!this.globalData.themes[themeMode]) {
      themeMode = 1
    }

    return this.globalData.themes[themeMode]

  },


  // =========================================================
  // 获取当前主题编号
  // =========================================================

  getThemeMode: function () {

    return this.globalData.themeMode || 1

  },


  // =========================================================
  // 全局应用主题
  //
  // 所有系统主题相关设置统一从这里处理
  // =========================================================

  applyTheme: function (themeMode) {

    themeMode = Number(themeMode)

    // -------------------------------------------------------
    // 防止出现不存在的主题
    // -------------------------------------------------------

    if (!this.globalData.themes[themeMode]) {
      themeMode = 1
    }

    var theme = this.globalData.themes[themeMode]


    // -------------------------------------------------------
    // 保存当前主题
    // -------------------------------------------------------

    this.globalData.themeMode = themeMode

    wx.setStorageSync(
      "themeMode",
      themeMode
    )


    // =======================================================
    // 系统导航栏
    // =======================================================

    wx.setNavigationBarColor({

      // 白色文字
      frontColor: "#ffffff",

      // 当前主题导航栏颜色
      backgroundColor: theme.navigationBar

    })


    // =======================================================
    // 系统背景
    // =======================================================

    wx.setBackgroundColor({

      backgroundColor: theme.background,

      backgroundColorTop: theme.background,

      backgroundColorBottom: theme.background

    })

  }

})