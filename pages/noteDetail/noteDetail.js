// pages/noteDetail/noteDetail.js
// 笔记详情 / 编辑页（新建 + 详情 + 编辑）

var common = require("../../utils/common.js")

var noteUtil = require("../../utils/note.js")


Page({

  data: {
    themeClass: "theme-1",

    note: null,
    hasNote: false,
    isNew: false,

    // 编辑面板
    showEditor: false,
    editTitle: "",
    editContent: "",
    editTypeIndex: 0,
    editProjectIndex: 0,
    editTags: "",

    typeOptions: ["Learning", "Lesson Prep", "Work", "Ideas", "Other"],
    typeValues: ["学习", "备课", "工作", "灵感", "其他"],
    projectPickerList: ["No Project"],
    projectIdList: [""]
  },

  onLoad: function () {
    this.syncTheme()
    this.loadProjects()

    var noteId = wx.getStorageSync("selectedNoteId")

    if (noteId) {
      this.loadNote()
    } else {
      // 新建模式：直接打开空编辑面板
      var editProjectIndex = 0

      // 预设项目（仅新建模式处理）
      var presetProjectId = wx.getStorageSync("presetProjectId")

      if (presetProjectId) {
        var idList = this.data.projectIdList
        for (var k = 0; k < idList.length; k++) {
          if (String(idList[k]) === String(presetProjectId)) {
            editProjectIndex = k
            break
          }
        }
        wx.removeStorageSync("presetProjectId")
      }

      this.setData({
        isNew: true,
        hasNote: false,
        note: null,
        showEditor: true,
        editTitle: "",
        editContent: "",
        editTypeIndex: 0,
        editProjectIndex: editProjectIndex,
        editTags: ""
      })
    }
  },

  onShow: function () {
    this.syncTheme()
    this.loadProjects()
  },

  syncTheme: function () {
    common.syncTheme(this)
  },

  // =========================
  // 加载项目列表（供选择）
  // =========================
  loadProjects: function () {
    var projects = wx.getStorageSync("projects") || []

    var pickerList = ["No Project"]
    var idList = [""]

    projects.forEach(function (p) {
      pickerList.push(p.name || "Unnamed Project")
      idList.push(p.id)
    })

    this.setData({
      projectPickerList: pickerList,
      projectIdList: idList
    })
  },

  // =========================
  // 加载笔记详情
  // =========================
  loadNote: function () {
    var noteId = wx.getStorageSync("selectedNoteId")

    if (!noteId) {
      this.setData({ hasNote: false, note: null })
      return
    }

    var notes = wx.getStorageSync("notes") || []

    var note = null
    for (var i = 0; i < notes.length; i++) {
      if (String(notes[i].id) === String(noteId)) {
        note = notes[i]
        break
      }
    }

    if (!note) {
      this.setData({ hasNote: false, note: null })
      return
    }

    note = noteUtil.normalizeNote(note)

    var noteTypeMap = { "学习": "Learning", "备课": "Lesson Prep", "工作": "Work", "灵感": "Ideas", "其他": "Other" }
    note.typeText = noteTypeMap[note.type] || note.type || ""

    // 项目名
    var projects = wx.getStorageSync("projects") || []
    var projectName = ""
    for (var j = 0; j < projects.length; j++) {
      if (String(projects[j].id) === String(note.projectId)) {
        projectName = projects[j].name
        break
      }
    }
    note.projectName = projectName

    note.displayCreatedAt = noteUtil.formatNoteTime(note.createdAt)
    note.displayUpdatedAt = noteUtil.formatNoteTime(note.updatedAt)

    this.setData({
      note: note,
      hasNote: true,
      isNew: false
    })
  },

  // =========================
  // 编辑
  // =========================
  openEdit: function () {
    var note = this.data.note
    if (!note) {
      return
    }

    var typeIndex = this.data.typeValues.indexOf(note.type)
    if (typeIndex < 0) {
      typeIndex = 0
    }

    var projectIndex = 0
    for (var i = 0; i < this.data.projectIdList.length; i++) {
      if (this.data.projectIdList[i] === note.projectId) {
        projectIndex = i
        break
      }
    }

    this.setData({
      showEditor: true,
      editTitle: note.title,
      editContent: note.content,
      editTypeIndex: typeIndex,
      editProjectIndex: projectIndex,
      editTags: (note.tags || []).join(", ")
    })
  },

  // =========================
  // 表单输入
  // =========================
  inputTitle: function (e) {
    this.setData({ editTitle: e.detail.value })
  },

  inputContent: function (e) {
    this.setData({ editContent: e.detail.value })
  },

  selectType: function (e) {
    this.setData({
      editTypeIndex: Number(e.currentTarget.dataset.index)
    })
  },

  changeProject: function (e) {
    this.setData({ editProjectIndex: Number(e.detail.value) })
  },

  inputTags: function (e) {
    this.setData({ editTags: e.detail.value })
  },

  // =========================
  // 保存（新建 / 编辑）
  // =========================
  saveNote: function () {
    var title = (this.data.editTitle || "").trim()

    if (!title) {
      wx.showToast({ title: "Enter a note title", icon: "none" })
      return
    }

    var content = this.data.editContent
    var type = this.data.typeValues[this.data.editTypeIndex]
    var projectId = this.data.projectIdList[this.data.editProjectIndex] || ""

    var tags = (this.data.editTags || "")
      .split(",")
      .map(function (s) { return s.trim() })
      .filter(function (s) { return s !== "" })

    var notes = wx.getStorageSync("notes") || []
    var now = Date.now()

    if (this.data.isNew) {
      var note = {
        id: "note_" + now,
        title: title,
        content: content,
        projectId: projectId,
        type: type,
        tags: tags,
        createdAt: now,
        updatedAt: now
      }

      notes.unshift(note)
      wx.setStorageSync("notes", notes)
      wx.setStorageSync("selectedNoteId", note.id)

      this.setData({ isNew: false })
    } else {
      var noteId = wx.getStorageSync("selectedNoteId")

      for (var i = 0; i < notes.length; i++) {
        if (String(notes[i].id) === String(noteId)) {
          notes[i].title = title
          notes[i].content = content
          notes[i].type = type
          notes[i].projectId = projectId
          notes[i].tags = tags
          notes[i].updatedAt = now
          break
        }
      }

      wx.setStorageSync("notes", notes)
    }

    this.setData({ showEditor: false })
    this.loadNote()

    wx.showToast({ title: "Saved", icon: "success" })
  },

  // =========================
  // 删除
  // =========================
  deleteNote: function () {
    var note = this.data.note
    if (!note) {
      return
    }

    var noteId = note.id

    var that = this

    wx.showModal({
      title: "Delete Note",
      content: "Delete " + note.title + "?",
      confirmText: "Delete",
      cancelText: "Cancel",
      success: function (res) {
        if (!res.confirm) {
          return
        }

        var notes = wx.getStorageSync("notes") || []
        notes = noteUtil.deleteNote(notes, noteId)
        wx.setStorageSync("notes", notes)

        wx.removeStorageSync("selectedNoteId")

        wx.navigateBack({ delta: 1 })
      }
    })
  },

  goBack: function () {
    wx.navigateBack({ delta: 1 })
  }

})
