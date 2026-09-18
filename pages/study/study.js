Page({

  data: {

    // =========================
    // 主题
    // =========================

    themeClass: "theme-1",

    today: "",

    selectedDate: "",

    studyList: [],

    inputList: [],

    contentList: [],

    // 今日学习概览
    todayMinutes: 0,
    todayTarget: 60,
    todayPercent: 0,

    // 所属项目
    projectPickerList: ["No Project"],
    projectIdList: [""],
    selectedProjectIndex: 0,

    // 学习计划
    studyPlans: [],
    planList: [],
    showPlanEditor: false,
    planEditName: "",
    planEditStartDate: "",
    planEditEndDate: "",
    planEditDailyTarget: "",
    planEditProjectIndex: 0,
    planEditDescription: ""

  },


  // =========================
  // 同步主题
  // =========================

  syncTheme: function () {

    var app = getApp();

    var themeMode = 1;

    if (
      app &&
      app.globalData &&
      app.globalData.themeMode
    ) {

      themeMode =
        Number(app.globalData.themeMode);

    } else {

      themeMode =
        Number(
          wx.getStorageSync("themeMode") || 1
        );

    }

    if (
      !app ||
      !app.globalData ||
      !app.globalData.themes ||
      !app.globalData.themes[themeMode]
    ) {

      themeMode = 1;

    }

    this.setData({

      themeClass:
        themeMode === 2
          ? "theme-2"
          : "theme-1"

    });

    if (
      app &&
      typeof app.applyTheme === "function"
    ) {

      app.applyTheme(themeMode);

    }

  },


  onLoad: function () {

    this.syncTheme();

    // 从日历指定日期进入时，使用选中日期
    var presetDate =
      wx.getStorageSync("createStudyDate");

    if (presetDate) {

      wx.removeStorageSync("createStudyDate");

      this.setData({
        selectedDate: presetDate
      });

    }

    this.loadProjects();

    this.loadData();

    this.loadPlans();

  },


  onShow: function () {

    this.syncTheme();

    this.loadProjects();

    this.loadData();

    this.loadPlans();

  },


  // =========================
  // 加载项目列表（供选择）
  // =========================

  loadProjects: function () {

    var projects =
      wx.getStorageSync("projects") || [];

    var pickerList = ["No Project"];

    var idList = [""];

    for (var i = 0; i < projects.length; i++) {

      var label =
        projects[i].name || "Unnamed Project";

      if (projects[i].status === "已完成") {
        label = label + " (Completed)";
      } else if (projects[i].status === "已暂停") {
        label = label + " (Paused)";
      }

      pickerList.push(label);
      idList.push(projects[i].id);

    }

    // 预设项目（从项目详情进入时自动选中，仅设置不重置）
    var presetProjectId =
      wx.getStorageSync("presetProjectId");

    var dataObj = {
      projectPickerList: pickerList,
      projectIdList: idList
    };

    if (presetProjectId) {

      for (var k = 0; k < idList.length; k++) {
        if (String(idList[k]) === String(presetProjectId)) {
          dataObj.selectedProjectIndex = k;
          break;
        }
      }

      wx.removeStorageSync("presetProjectId");

    }

    this.setData(dataObj);

  },


  // =========================
  // 选择所属项目
  // =========================

  changeProject: function (e) {

    this.setData({

      selectedProjectIndex:
        Number(e.detail.value)

    });

  },


  // =========================
  // 获取今天日期
  // =========================

  getToday: function () {

    var date = new Date();

    var year = date.getFullYear();

    var month = date.getMonth() + 1;

    var day = date.getDate();

    if (month < 10) {
      month = "0" + month;
    }

    if (day < 10) {
      day = "0" + day;
    }

    return year + "-" + month + "-" + day;

  },


  // =========================
  // 获取目标
  // =========================

  getTarget: function (type) {

    var targetMap =
      wx.getStorageSync("studyTargetMap") || {};

    var target =
      Number(targetMap[type]);

    if (!target || target <= 0) {
      target = 60;
    }

    return target;

  },


  // =========================
  // 获取学习项目
  // =========================

  getStudyTypes: function () {

    var customTypes =
      wx.getStorageSync("customStudyTypes") || [];

    var defaultTypes = [
      "化学",
      "雅思"
    ];

    return defaultTypes.concat(customTypes);

  },


  // =========================
  // 保存学习项目
  // =========================

  saveStudyTypes: function (list) {

    var customTypes = [];

    for (var i = 0; i < list.length; i++) {

      if (
        list[i] !== "化学" &&
        list[i] !== "雅思"
      ) {

        customTypes.push(list[i]);

      }

    }

    wx.setStorageSync(
      "customStudyTypes",
      customTypes
    );

  },


  // =========================
  // 计算百分比
  // =========================

  getPercent: function (minutes, target) {

    minutes =
      Number(minutes) || 0;

    target =
      Number(target) || 60;

    if (target <= 0) {
      return 0;
    }

    var percent =
      Math.round(
        minutes / target * 100
      );

    if (percent < 0) {
      percent = 0;
    }

    if (percent > 100) {
      percent = 100;
    }

    return percent;

  },


  // =========================
  // 加载数据
  // =========================

  loadData: function () {

    var today =
      this.data.selectedDate ||
      this.getToday();

    // 个人学习记录使用 learningHistory
    // 不再读取课堂反馈 history

    var learningHistory =
      wx.getStorageSync("learningHistory") || [];

    var types =
      this.getStudyTypes();

    var studyList = [];

    for (
      var i = 0;
      i < types.length;
      i++
    ) {

      var type =
        types[i];

      var minutes = 0;

      for (
        var j = 0;
        j < learningHistory.length;
        j++
      ) {

        var item =
          learningHistory[j];

        if (!item) {
          continue;
        }

        if (
          item.date !== today
        ) {
          continue;
        }

        if (
          item.type !== type
        ) {
          continue;
        }

        minutes +=
          Number(item.minutes) || 0;

      }

      var target =
        this.getTarget(type);

      var percent =
        this.getPercent(
          minutes,
          target
        );

      var learningTypeMap =
        { "化学": "Chemistry", "雅思": "IELTS" };

      studyList.push({

        name:
          type,

        typeText:
          learningTypeMap[type] || type,

        minutes:
          minutes,

        target:
          target,

        percent:
          percent,

        progressLevel:
          Math.round(percent / 10)

      });

    }

    var inputList = [];

    var contentList = [];

    for (
      var k = 0;
      k < studyList.length;
      k++
    ) {

      inputList.push("");

      contentList.push("");

    }

    // =========================
    // 今日学习概览（真实今天 + 全局目标）
    // =========================

    var realToday = this.getToday();

    var todayMinutes = 0;

    for (
      var m = 0;
      m < learningHistory.length;
      m++
    ) {

      var rec = learningHistory[m];

      if (!rec) {
        continue;
      }

      if (rec.date !== realToday) {
        continue;
      }

      todayMinutes += Number(rec.minutes) || 0;

    }

    var profile =
      wx.getStorageSync("userProfile") || {};

    var todayTarget =
      Number(profile.dailyStudyTarget) || 60;

    if (todayTarget <= 0) {
      todayTarget = 60;
    }

    var todayPercent = 0;

    if (todayTarget > 0) {

      todayPercent =
        Math.round(todayMinutes / todayTarget * 100);

      if (todayPercent > 100) {
        todayPercent = 100;
      }

    }


    this.setData({

      today:
        today,

      studyList:
        studyList,

      inputList:
        inputList,

      contentList:
        contentList,

      todayMinutes:
        todayMinutes,

      todayTarget:
        todayTarget,

      todayPercent:
        todayPercent

    });

  },


  // =========================
  // 加载学习计划
  // =========================

  loadPlans: function () {

    var plans =
      wx.getStorageSync("studyPlans") || [];

    var list = [];

    for (var i = 0; i < plans.length; i++) {

      list.push(
        this.calcPlanProgress(plans[i])
      );

    }

    // 新建的在前
    list.sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    this.setData({
      planList: list
    });

  },


  // =========================
  // 计算计划进度
  // =========================

  calcPlanProgress: function (plan) {

    var learningHistory =
      wx.getStorageSync("learningHistory") || [];

    var totalMinutes = 0;

    for (var i = 0; i < learningHistory.length; i++) {

      var item = learningHistory[i];

      if (!item) {
        continue;
      }

      // 日期范围过滤
      if (
        item.date < plan.startDate ||
        item.date > plan.endDate
      ) {
        continue;
      }

      // 关联项目时，只统计该项目
      if (
        plan.projectId &&
        String(item.projectId || "") !== String(plan.projectId)
      ) {
        continue;
      }

      totalMinutes += Number(item.minutes) || 0;

    }

    var dailyTarget = Number(plan.dailyTarget) || 0;

    var targetMinutes = 0;
    var percent = 0;

    if (dailyTarget > 0) {

      var days =
        this.countDays(plan.startDate, plan.endDate);

      targetMinutes = days * dailyTarget;

      if (targetMinutes > 0) {
        percent = Math.round(totalMinutes / targetMinutes * 100);
        if (percent > 100) percent = 100;
      }

    }

    var hasTarget = dailyTarget > 0;


    // 项目名
    var projectName = "";

    if (plan.projectId) {

      var projects =
        wx.getStorageSync("projects") || [];

      for (var p = 0; p < projects.length; p++) {

        if (String(projects[p].id) === String(plan.projectId)) {
          projectName = projects[p].name || "";
          break;
        }

      }

    }


    // 日期显示 "9/17 — 9/30"
    var dateText = "";

    if (plan.startDate && plan.endDate) {

      var s = String(plan.startDate).split("-");
      var e = String(plan.endDate).split("-");

      dateText =
        Number(s[1]) + "/" + Number(s[2]) +
        " — " +
        Number(e[1]) + "/" + Number(e[2]);

    }

    return {
      id: plan.id,
      name: plan.name,
      projectId: plan.projectId || "",
      projectName: projectName,
      startDate: plan.startDate,
      endDate: plan.endDate,
      dailyTarget: dailyTarget,
      description: plan.description || "",
      createdAt: plan.createdAt || 0,
      dateText: dateText,
      totalMinutes: totalMinutes,
      targetMinutes: targetMinutes,
      percent: percent,
      percentLevel: Math.round(percent / 10),
      hasTarget: hasTarget
    };

  },


  // =========================
  // 计算两个日期之间的天数（含起止）
  // =========================

  countDays: function (startDate, endDate) {

    if (!startDate || !endDate) {
      return 0;
    }

    var start =
      new Date(String(startDate).replace(/-/g, "/"));

    var end =
      new Date(String(endDate).replace(/-/g, "/"));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    var days =
      Math.round((end - start) / 86400000) + 1;

    return days > 0 ? days : 0;

  },


  // =========================
  // 打开 / 关闭计划编辑
  // =========================

  openPlanEditor: function () {

    this.setData({
      showPlanEditor: true,
      planEditName: "",
      planEditStartDate: "",
      planEditEndDate: "",
      planEditDailyTarget: "",
      planEditProjectIndex: 0,
      planEditDescription: ""
    });

  },

  closePlanEditor: function () {

    this.setData({
      showPlanEditor: false
    });

  },


  // =========================
  // 计划表单输入
  // =========================

  inputPlanName: function (e) {
    this.setData({ planEditName: e.detail.value });
  },

  changePlanStart: function (e) {
    this.setData({ planEditStartDate: e.detail.value });
  },

  changePlanEnd: function (e) {
    this.setData({ planEditEndDate: e.detail.value });
  },

  inputPlanDailyTarget: function (e) {
    this.setData({ planEditDailyTarget: e.detail.value });
  },

  changePlanProject: function (e) {
    this.setData({ planEditProjectIndex: Number(e.detail.value) });
  },

  inputPlanDescription: function (e) {
    this.setData({ planEditDescription: e.detail.value });
  },


  // =========================
  // 保存学习计划
  // =========================

  savePlan: function () {

    var name =
      (this.data.planEditName || "").trim();

    if (!name) {

      wx.showToast({
        title: "Enter a plan name",
        icon: "none"
      });

      return;

    }

    if (!this.data.planEditStartDate) {

      wx.showToast({
        title: "Select a start date",
        icon: "none"
      });

      return;

    }

    if (!this.data.planEditEndDate) {

      wx.showToast({
        title: "Select an end date",
        icon: "none"
      });

      return;

    }

    if (this.data.planEditEndDate < this.data.planEditStartDate) {

      wx.showToast({
        title: "End date cannot be before start date",
        icon: "none"
      });

      return;

    }

    var dailyTarget =
      Number(this.data.planEditDailyTarget) || 0;

    if (dailyTarget < 0) {
      dailyTarget = 0;
    }

    if (dailyTarget > 1440) {

      wx.showToast({
        title: "Daily goal cannot exceed 1440 min",
        icon: "none"
      });

      return;

    }

    var projectId =
      this.data.projectIdList[this.data.planEditProjectIndex] || "";

    var plans =
      wx.getStorageSync("studyPlans") || [];

    plans.push({
      id: "plan_" + Date.now(),
      name: name,
      projectId: projectId,
      startDate: this.data.planEditStartDate,
      endDate: this.data.planEditEndDate,
      dailyTarget: dailyTarget,
      description: (this.data.planEditDescription || "").trim(),
      createdAt: Date.now()
    });

    wx.setStorageSync("studyPlans", plans);

    this.setData({
      showPlanEditor: false
    });

    this.loadPlans();

    wx.showToast({
      title: "Plan created",
      icon: "success"
    });

  },


  // =========================
  // 删除学习计划（不删除学习记录）
  // =========================

  deletePlan: function (e) {

    var id = e.currentTarget.dataset.id;

    var that = this;

    wx.showModal({

      title: "Delete Study Plan",

      content: "Delete this study plan? Learning records will be kept.",

      confirmText: "Delete",

      cancelText: "Cancel",

      success: function (res) {

        if (!res.confirm) {
          return;
        }

        var plans =
          wx.getStorageSync("studyPlans") || [];

        var newPlans = [];

        for (var i = 0; i < plans.length; i++) {
          if (String(plans[i].id) !== String(id)) {
            newPlans.push(plans[i]);
          }
        }

        wx.setStorageSync("studyPlans", newPlans);

        that.loadPlans();

        wx.showToast({
          title: "Deleted",
          icon: "success"
        });

      }

    });

  },


  // =========================
  // 阻止冒泡（计划编辑弹层）
  // =========================

  noop: function () {},


  // =========================
  // 输入学习时间
  // =========================

  inputStudy: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      );

    var list =
      this.data.inputList.slice();

    list[index] =
      e.detail.value;

    this.setData({

      inputList:
        list

    });

  },


  // =========================
  // 输入学习内容
  // =========================

  inputContent: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      );

    var list =
      this.data.contentList.slice();

    list[index] =
      e.detail.value;

    this.setData({

      contentList:
        list

    });

  },


  // =========================
  // 添加个人学习记录
  // =========================

  addStudy: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      );

    var type =
      this.data.studyList[index].name;

    var minutes =
      Number(
        this.data.inputList[index]
      );

    if (
      !minutes ||
      minutes <= 0
    ) {

      wx.showToast({

        title:
          "Enter study minutes",

        icon:
          "none"

      });

      return;

    }

    if (minutes > 1440) {

      wx.showToast({

        title:
          "Cannot exceed 1440 min at once",

        icon:
          "none"

      });

      return;

    }

    // =========================
    // 获取个人学习记录
    // =========================

    var learningHistory =
      wx.getStorageSync(
        "learningHistory"
      ) || [];

    // =========================
    // 获取当前时间
    // =========================

    var now =
      new Date();

    var hour =
      now.getHours();

    var minute =
      now.getMinutes();

    if (hour < 10) {
      hour = "0" + hour;
    }

    if (minute < 10) {
      minute = "0" + minute;
    }

    // =========================
    // 创建新的学习记录
    // =========================

    learningHistory.push({

      id:
        Date.now(),

      date:
        this.data.selectedDate ||
        this.getToday(),

      time:
        hour + ":" + minute,

      minutes:
        minutes,

      type:
        type,

      topic:
        type,

      content:
        this.data.contentList[index] || "",

      learningRecord:
        true,

      projectId:
        this.data.projectIdList[
          this.data.selectedProjectIndex
        ] || ""

    });

    // =========================
    // 保存到 learningHistory
    // =========================

    wx.setStorageSync(
      "learningHistory",
      learningHistory
    );

    // =========================
    // 清空输入框
    // =========================

    var inputList =
      this.data.inputList.slice();

    var contentList =
      this.data.contentList.slice();

    inputList[index] = "";

    contentList[index] = "";

    this.setData({

      inputList:
        inputList,

      contentList:
        contentList

    });

    // 重新计算今日学习进度 + 学习计划进度
    this.loadData();

    this.loadPlans();

    wx.showToast({

      title:
        type + " logged",

      icon:
        "success",

      duration:
        1200

    });

  },


  // =========================
  // 修改学习目标
  // =========================

  editTarget: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      );

    var item =
      this.data.studyList[index];

    var type =
      item.name;

    var oldTarget =
      item.target;

    wx.showModal({

      title:
        "Set " + type + " goal",

      editable:
        true,

      content:
        String(oldTarget),

      placeholderText:
        "Enter daily study minutes",

      success:
        function (res) {

          if (!res.confirm) {
            return;
          }

          var target =
            Number(
              res.content
            );

          if (
            !target ||
            target <= 0
          ) {

            wx.showToast({

              title:
                "Enter valid minutes",

              icon:
                "none"

            });

            return;

          }

          if (target > 1440) {

            wx.showToast({

              title:
                "Up to 1440 min per day",

              icon:
                "none"

            });

            return;

          }

          var targetMap =
            wx.getStorageSync(
              "studyTargetMap"
            ) || {};

          targetMap[type] =
            target;

          wx.setStorageSync(
            "studyTargetMap",
            targetMap
          );

          this.loadData();

          wx.showToast({

            title:
              "Goal updated",

            icon:
              "success",

            duration:
              1200

          });

        }.bind(this)

    });

  },


  // =========================
  // 添加学习目标
  // =========================

  addStudyType: function () {

    wx.showModal({

      title:
        "Add Learning Goal",

      editable:
        true,

      placeholderText:
        "e.g. English, Math, Coding",

      success:
        function (res) {

          if (!res.confirm) {
            return;
          }

          var name =
            (res.content || "").trim();

          if (!name) {

            wx.showToast({

              title:
                "Enter a goal name",

              icon:
                "none"

            });

            return;

          }

          if (name.length > 12) {

            wx.showToast({

              title:
                "Name cannot exceed 12 characters",

              icon:
                "none"

            });

            return;

          }

          var types =
            this.getStudyTypes();

          if (
            types.indexOf(name) !== -1
          ) {

            wx.showToast({

              title:
                "This goal already exists",

              icon:
                "none"

            });

            return;

          }

          types.push(name);

          this.saveStudyTypes(
            types
          );

          var targetMap =
            wx.getStorageSync(
              "studyTargetMap"
            ) || {};

          targetMap[name] = 60;

          wx.setStorageSync(
            "studyTargetMap",
            targetMap
          );

          this.loadData();

          wx.showToast({

            title:
              "Added",

            icon:
              "success",

            duration:
              1200

          });

        }.bind(this)

    });

  },


  // =========================
  // 删除自定义学习目标
  // =========================

  deleteStudyType: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      );

    var item =
      this.data.studyList[index];

    var name =
      item.name;

    if (
      name === "化学" ||
      name === "雅思"
    ) {

      wx.showToast({

        title:
          "Default goals cannot be deleted",

        icon:
          "none"

      });

      return;

    }

    wx.showModal({

      title:
        "Delete Learning Goal",

      content:
        "Delete " +
        name +
        "?",

      success:
        function (res) {

          if (!res.confirm) {
            return;
          }

          var customTypes =
            wx.getStorageSync(
              "customStudyTypes"
            ) || [];

          var newTypes = [];

          for (
            var i = 0;
            i < customTypes.length;
            i++
          ) {

            if (
              customTypes[i] !== name
            ) {

              newTypes.push(
                customTypes[i]
              );

            }

          }

          wx.setStorageSync(
            "customStudyTypes",
            newTypes
          );

          this.loadData();

          wx.showToast({

            title:
              "Deleted",

            icon:
              "success",

            duration:
              1000

          });

        }.bind(this)

    });

  },


  // =========================
  // 学习历史
  // =========================

  goHistory: function () {

    wx.navigateTo({
      url: "/pages/history/history"
    });

  },


  // =========================
  // 返回
  // =========================

  goBack: function () {

    wx.navigateBack();

  }

});