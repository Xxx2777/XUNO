var common = require("../../utils/common.js")

var learningUtil = require("../../utils/learning.js")


Page({

  data: {
    themeClass: "theme-1",

    hasRecord: false,
    record: null,

    isEditing: false,
    editMinutes: "",
    editTypeIndex: 0,
    editContent: "",
    editProjectIndex: 0,

    typeOptions: ["化学", "雅思"],
    typeDisplayOptions: ["Chemistry", "IELTS"],
    projectPickerList: ["No Project"],
    projectIdList: [""]
  },

  onLoad: function () {
    this.syncTheme()
    this.loadTypes()
    this.loadProjects()
    this.loadRecord()
  },

  onShow: function () {
    this.syncTheme()
  },

  syncTheme: function () {
    common.syncTheme(this)
  },

  // =========================
  // 学习类型列表（复用 study 的类型来源）
  // =========================
  loadTypes: function () {
    var customTypes = wx.getStorageSync("customStudyTypes") || []
    this.setData({
      typeOptions: ["化学", "雅思"].concat(customTypes),
      typeDisplayOptions: ["Chemistry", "IELTS"].concat(customTypes)
    })
  },

  // =========================
  // 项目列表（供编辑选择）
  // =========================
  loadProjects: function () {
    var projects = wx.getStorageSync("projects") || []

    var pickerList = ["No Project"]
    var idList = [""]

    for (var i = 0; i < projects.length; i++) {
      pickerList.push(projects[i].name || "Unnamed Project")
      idList.push(projects[i].id)
    }

    this.setData({
      projectPickerList: pickerList,
      projectIdList: idList
    })
  },

  // =========================
  // 根据 selectedLearningId 定位记录
  // =========================
  loadRecord: function () {
    var recordId = wx.getStorageSync("selectedLearningId")

    if (!recordId) {
      this.setData({ hasRecord: false, record: null })
      return
    }

    var learningHistory = wx.getStorageSync("learningHistory") || []

    var record = learningUtil.findLearningRecordById(learningHistory, recordId)

    if (!record) {
      this.setData({ hasRecord: false, record: null })
      return
    }

    record = learningUtil.normalizeLearningRecord(record)

    var learningTypeMap = { "化学": "Chemistry", "雅思": "IELTS" }
    record.typeText = learningTypeMap[record.type] || record.type || ""

    record.displayDate = learningUtil.formatLearningDate(record.date)
    record.projectName = this.getProjectName(record.projectId)

    this.setData({
      hasRecord: true,
      record: record
    })
  },

  getProjectName: function (projectId) {
    if (!projectId) {
      return ""
    }

    var projects = wx.getStorageSync("projects") || []

    for (var i = 0; i < projects.length; i++) {
      if (String(projects[i].id) === String(projectId)) {
        return projects[i].name || ""
      }
    }

    return ""
  },

  // =========================
  // 编辑
  // =========================
  openEdit: function () {
    var record = this.data.record
    if (!record) {
      return
    }

    var typeIndex = this.data.typeOptions.indexOf(record.type)
    if (typeIndex < 0) {
      typeIndex = 0
    }

    var projectIndex = 0
    var idList = this.data.projectIdList
    for (var i = 0; i < idList.length; i++) {
      if (String(idList[i]) === String(record.projectId)) {
        projectIndex = i
        break
      }
    }

    this.setData({
      isEditing: true,
      editMinutes: String(record.minutes || ""),
      editTypeIndex: typeIndex,
      editContent: record.content || "",
      editProjectIndex: projectIndex
    })
  },

  closeEdit: function () {
    this.setData({ isEditing: false })
  },

  inputMinutes: function (e) {
    this.setData({ editMinutes: e.detail.value })
  },

  inputContent: function (e) {
    this.setData({ editContent: e.detail.value })
  },

  changeType: function (e) {
    this.setData({ editTypeIndex: Number(e.detail.value) })
  },

  changeProject: function (e) {
    this.setData({ editProjectIndex: Number(e.detail.value) })
  },

  // =========================
  // 保存编辑（局部更新，保留其它记录）
  // =========================
  saveRecord: function () {
    var minutes = Number(this.data.editMinutes)

    if (!minutes || minutes <= 0) {
      wx.showToast({ title: "Enter study duration", icon: "none" })
      return
    }

    if (minutes > 1440) {
      wx.showToast({ title: "Cannot exceed 1440 min at once", icon: "none" })
      return
    }

    var recordId = wx.getStorageSync("selectedLearningId")
    var learningHistory = wx.getStorageSync("learningHistory") || []

    var type = this.data.typeOptions[this.data.editTypeIndex]

    var newHistory = learningUtil.updateLearningRecord(learningHistory, recordId, {
      minutes: minutes,
      type: type,
      topic: type,
      content: (this.data.editContent || "").trim(),
      projectId: this.data.projectIdList[this.data.editProjectIndex] || ""
    })

    wx.setStorageSync("learningHistory", newHistory)

    this.setData({ isEditing: false })
    this.loadRecord()

    wx.showToast({ title: "Saved", icon: "success" })
  },

  // =========================
  // 删除（仅删除当前这一条）
  // =========================
  deleteRecord: function () {
    var that = this

    wx.showModal({
      title: "Delete Learning Record",
      content: "Delete this learning record?",
      confirmText: "Delete",
      cancelText: "Cancel",
      success: function (res) {
        if (!res.confirm) {
          return
        }

        var recordId = wx.getStorageSync("selectedLearningId")
        var learningHistory = wx.getStorageSync("learningHistory") || []

        var newHistory = learningUtil.deleteLearningRecord(learningHistory, recordId)

        wx.setStorageSync("learningHistory", newHistory)
        wx.removeStorageSync("selectedLearningId")

        wx.navigateBack({ delta: 1 })
      }
    })
  }

})
