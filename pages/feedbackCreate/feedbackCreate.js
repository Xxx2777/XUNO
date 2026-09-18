// =====================================================
// 课堂反馈
// =====================================================

// chemistry.js 是教材数据与关键词详情的唯一来源。
// 教材选择器使用 chemistry.textbookList，
// 关键词推荐使用 chemistry.chemistryAllKnowledge / chemistryKnowledge。
const chemistry = require("../../utils/chemistry.js")

const common = require("../../utils/common.js")


Page({

  // =====================================================
  // 页面数据
  // =====================================================

  data: {

    // ===================================================
    // 主题
    // ===================================================

    themeClass: "theme-1",


    // ===================================================
    // 学生
    // ===================================================

    studentList: [],
    studentIndex: 0,
    student: null,
    studentPickerOpen: false,


    // ===================================================
    // 课程
    // ===================================================

    courseList: [],
    courseIndex: 0,
    course: null,
    coursePickerOpen: false,

    courseTopic: "",
    courseDateText: "",
    courseTimeText: "",


    // ===================================================
    // 化学知识点
    //
    // 教材 → 章节 → 小节
    // ===================================================

    textbookList: [],

    textbookIndex: -1,

    selectedTextbook: null,

    selectedTextbookText: "",


    chapterList: [],

    chapterIndex: -1,

    selectedChapter: null,

    selectedChapterText: "",


    knowledgeList: [],

    knowledgeDetailList: {},

    currentGrade: "",


    // 已选择的小节
    selectedKnowledge: [],

    selectedKnowledgeText: "",

    // 小节复选状态
    knowledgeSelected: [],


    // 展开状态
    textbookOpen: false,

    chapterOpen: false,

    knowledgeOpen: false,


    // ===================================================
    // 智能推荐
    // ===================================================

    recommendedKeywords: [],

    selectedKeywords: [],

    selectedKeywordsText: "",

    keywordSelected: [],

    keywordOpen: false,


    // ===================================================
    // 课堂表现
    // ===================================================

    performanceList: [

      "认真听讲",
      "课堂专注",
      "积极回答问题",
      "主动思考",
      "课堂互动较好",
      "能够独立完成任务",
      "解题思路清晰",
      "需要提高专注度"

    ],

    selectedPerformance: [],

    selectedPerformanceText: "",

    performanceSelected: [],

    performanceOpen: false,


    // ===================================================
    // 知识掌握
    // ===================================================

    masteryList: [

      "掌握较好",
      "基本掌握",
      "部分掌握",
      "需要进一步巩固"

    ],

    selectedMastery: "",

    masteryOpen: false,


    // ===================================================
    // 解题表现
    // ===================================================

    problemList: [

      "审题较为准确",
      "解题思路清晰",
      "计算较为准确",
      "能够独立完成",
      "解题步骤需要更加规范",
      "计算过程需要更加细致",
      "审题需要更加仔细",
      "需要加强解题训练"

    ],

    selectedProblems: [],

    selectedProblemsText: "",

    problemSelected: [],

    problemOpen: false,


    // ===================================================
    // 学习状态
    // ===================================================

    statusList: [

      "状态良好",
      "状态一般",
      "需要提高专注度",
      "学习积极性较高",
      "学习积极性一般"

    ],

    selectedStatus: "",

    statusOpen: false,


    // ===================================================
    // 教师补充
    // ===================================================

    teacherNote: "",


    // ===================================================
    // 反馈结果
    // ===================================================

    feedback: "",

    feedbackStudentText: "",

    feedbackTopicText: "",

    feedbackDateText: "",

    feedbackBody: "",

    hasFeedback: false,

    hasSaved: false

  },


  // =====================================================
  // 页面加载
  // =====================================================

  onLoad: function () {

    this.syncTheme()

    this.loadStudentList()

  },


  // =====================================================
  // 页面显示
  // =====================================================

  onShow: function () {

    this.syncTheme()

    this.loadStudentList()

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

    } else {

      this.updateNavigationBar(
        themeMode
      )

    }

  },


  // =====================================================
  // 更新导航栏
  // =====================================================

  updateNavigationBar: function (
    themeMode
  ) {

    if (
      themeMode === 2
    ) {

      wx.setNavigationBarColor({

        frontColor:
          "#ffffff",

        backgroundColor:
          "#7D86C9"

      })


      wx.setBackgroundColor({

        backgroundColor:
          "#F6F7FB",

        backgroundColorTop:
          "#F6F7FB",

        backgroundColorBottom:
          "#F6F7FB"

      })

    } else {

      wx.setNavigationBarColor({

        frontColor:
          "#ffffff",

        backgroundColor:
          "#765B91"

      })


      wx.setBackgroundColor({

        backgroundColor:
          "#F7F5FA",

        backgroundColorTop:
          "#F7F5FA",

        backgroundColorBottom:
          "#F7F5FA"

      })

    }

  },


  // =====================================================
  // 获取今天日期
  // =====================================================

  getToday: function () {

    var now =
      new Date()

    var year =
      now.getFullYear()

    var month =
      now.getMonth() + 1

    var day =
      now.getDate()


    month =
      month < 10
        ? "0" + month
        : String(month)


    day =
      day < 10
        ? "0" + day
        : String(day)


    return (
      year +
      "-" +
      month +
      "-" +
      day
    )

  },


  // =====================================================
  // 判断课程是否已经反馈
  // =====================================================

  hasCourseFeedback: function (
    courseId,
    history
  ) {

    if (!courseId) {

      return false

    }


    history =
      history || []


    for (
      var i = 0;
      i < history.length;
      i++
    ) {

      var record =
        history[i]


      if (
        record &&
        record.type === "feedback" &&
        String(
          record.courseId || ""
        ) ===
        String(
          courseId || ""
        )
      ) {

        return true

      }

    }


    return false

  },


  // =====================================================
  // 从课程获取学生
  // =====================================================

  getStudentFromCourse: function (
    course
  ) {

    if (!course) {

      return null

    }


    var studentId =
      course.studentId || ""


    var studentName =
      course.studentName ||
      course.student ||
      ""


    studentName =
      String(
        studentName || ""
      ).trim()


    if (
      !studentName &&
      !studentId
    ) {

      return null

    }


    return {

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

  },


  // =====================================================
  // 确保课程存在 studentId
  // =====================================================

  ensureCourseStudentId: function (
    course
  ) {

    if (!course) {

      return course

    }


    if (
      course.studentId
    ) {

      return course

    }


    var studentName =
      String(
        course.studentName ||
        course.student ||
        ""
      ).trim()


    if (!studentName) {

      return course

    }


    var studentId =
      "student_" +
      Date.now() +
      "_" +
      Math.floor(
        Math.random() * 10000
      )


    course.studentId =
      studentId


    if (
      !course.studentName
    ) {

      course.studentName =
        studentName

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
        String(
          course.id
        )
      ) {

        courses[i].studentId =
          studentId


        if (
          !courses[i].studentName
        ) {

          courses[i].studentName =
            studentName

        }


        break

      }

    }


    wx.setStorageSync(
      "courses",
      courses
    )


    return course

  },


  // =====================================================
  // 加载学生列表
  // =====================================================

  loadStudentList: function () {

    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    var history =
      wx.getStorageSync(
        "history"
      ) || []


    var selectedStudent =
      wx.getStorageSync(
        "selectedStudent"
      ) || null


    var selectedCourse =
      wx.getStorageSync(
        "selectedCourse"
      ) || null


    var today =
      this.getToday()


    var pendingCourses =
      []


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


      if (
        course.status ===
        "学生请假"
      ) {

        continue

      }


      var status =
        common.getCourseStatus(
          course,
          today
        )


      if (
        status !== "已完成"
      ) {

        continue

      }


      if (
        this.hasCourseFeedback(
          course.id,
          history
        )
      ) {

        continue

      }


      var student =
        this.getStudentFromCourse(
          course
        )


      if (
        !student ||
        !student.name
      ) {

        continue

      }


      if (
        !course.studentId
      ) {

        course =
          this.ensureCourseStudentId(
            course
          )

        student =
          this.getStudentFromCourse(
            course
          )

      }


      pendingCourses.push({

        course:
          course,

        student:
          student

      })

    }


    var studentList =
      []

    var addedStudent =
      {}


    for (
      var p = 0;
      p < pendingCourses.length;
      p++
    ) {

      var student =
        pendingCourses[p].student


      var key =
        student.id
          ? "id_" + String(student.id)
          : "name_" + String(student.name)


      if (
        addedStudent[key]
      ) {

        continue

      }


      addedStudent[key] =
        true


      studentList.push(
        student
      )

    }


    if (
      studentList.length === 0
    ) {

      this.setData({

        studentList: [],
        studentIndex: 0,
        student: null,

        courseList: [],
        courseIndex: 0,
        course: null,

        courseTopic: "",
        courseDateText: "",
        courseTimeText: "",

        textbookList: [],
        textbookIndex: -1,
        selectedTextbook: null,
        selectedTextbookText: "",

        chapterList: [],
        chapterIndex: -1,
        selectedChapter: null,
        selectedChapterText: "",

        knowledgeList: [],
        knowledgeDetailList: {},

        currentGrade: "",

        selectedKnowledge: [],
        selectedKnowledgeText: "",
        knowledgeSelected: [],

        textbookOpen: false,
        chapterOpen: false,

        recommendedKeywords: [],
        selectedKeywords: [],
        selectedKeywordsText: "",
        keywordSelected: [],

        hasFeedback: false,
        hasSaved: false,

        feedback: "",
        feedbackStudentText: "",
        feedbackTopicText: "",
        feedbackDateText: "",
        feedbackBody: ""

      })

      return

    }


    var studentIndex =
      0


    if (
      selectedStudent
    ) {

      for (
        var s = 0;
        s < studentList.length;
        s++
      ) {

        if (
          selectedStudent.id &&
          studentList[s].id &&
          String(
            selectedStudent.id
          ) ===
          String(
            studentList[s].id
          )
        ) {

          studentIndex =
            s

          break

        }


        if (
          selectedStudent.name &&
          studentList[s].name &&
          String(
            selectedStudent.name
          ) ===
          String(
            studentList[s].name
          )
        ) {

          studentIndex =
            s

          break

        }

      }

    }


    var currentStudent =
      studentList[
        studentIndex
      ]


    this.setData({

      studentList:
        studentList,

      studentIndex:
        studentIndex,

      student:
        currentStudent

    })


    wx.setStorageSync(
      "selectedStudent",
      currentStudent
    )


    this.loadChemistryKnowledge(
      currentStudent
    )


    this.loadCourses(
      currentStudent,
      selectedCourse
    )

  },


  // =====================================================
  // 加载课程
  // =====================================================

  loadCourses: function (
    student,
    preferredCourse
  ) {

    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    var history =
      wx.getStorageSync(
        "history"
      ) || []


    var today =
      this.getToday()


    var list =
      []


    if (!student) {

      this.setData({

        courseList: [],
        courseIndex: 0,
        course: null,
        courseTopic: "",
        courseDateText: "",
        courseTimeText: ""

      })

      return

    }


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


      if (
        course.status ===
        "学生请假"
      ) {

        continue

      }


      var sameStudent =
        false


      if (
        student.id &&
        course.studentId
      ) {

        sameStudent =
          String(
            student.id
          ) ===
          String(
            course.studentId
          )

      }


      if (
        !sameStudent
      ) {

        var courseStudentName =
          course.studentName ||
          course.student ||
          ""


        if (
          courseStudentName &&
          student.name &&
          String(
            courseStudentName
          ) ===
          String(
            student.name
          )
        ) {

          sameStudent =
            true

        }

      }


      if (
        !sameStudent
      ) {

        continue

      }


      var status =
        common.getCourseStatus(
          course,
          today
        )


      if (
        status !== "已完成"
      ) {

        continue

      }


      if (
        this.hasCourseFeedback(
          course.id,
          history
        )
      ) {

        continue

      }


      list.push(
        course
      )

    }


    list.sort(
      function (a, b) {

        var aText =
          String(
            a.date || ""
          ) +
          " " +
          String(
            a.startTime ||
            a.time ||
            ""
          )


        var bText =
          String(
            b.date || ""
          ) +
          " " +
          String(
            b.startTime ||
            b.time ||
            ""
          )


        return bText.localeCompare(
          aText
        )

      }
    )


    var courseIndex =
      0


    if (
      preferredCourse &&
      preferredCourse.id
    ) {

      for (
        var p = 0;
        p < list.length;
        p++
      ) {

        if (
          String(
            list[p].id
          ) ===
          String(
            preferredCourse.id
          )
        ) {

          courseIndex =
            p

          break

        }

      }

    }


    if (
      list.length > 0
    ) {

      this.setData({

        courseList:
          list,

        courseIndex:
          courseIndex

      })


      this.selectCourseData(
        list[courseIndex]
      )

      return

    }


    this.setData({

      courseList: [],

      courseIndex: 0,

      course: null,

      courseTopic: "",

      courseDateText: "",

      courseTimeText: "",

      hasFeedback: false,

      hasSaved: false,

      feedback: "",

      feedbackStudentText: "",

      feedbackTopicText: "",

      feedbackDateText: "",

      feedbackBody: ""

    })

  },


  // =====================================================
  // 学生选择器
  // =====================================================

  openStudentPicker: function () {

    var courses =
      wx.getStorageSync(
        "courses"
      ) || []


    var history =
      wx.getStorageSync(
        "history"
      ) || []


    var today =
      this.getToday()


    var studentList =
      []

    var addedStudent =
      {}


    for (
      var i = 0;
      i < courses.length;
      i++
    ) {

      var course =
        courses[i]


      if (
        !course ||
        !course.id ||
        course.status === "学生请假"
      ) {

        continue

      }


      if (
        common.getCourseStatus(
          course,
          today
        ) !== "已完成"
      ) {

        continue

      }


      if (
        this.hasCourseFeedback(
          course.id,
          history
        )
      ) {

        continue

      }


      var student =
        this.getStudentFromCourse(
          course
        )


      if (
        !student ||
        !student.name
      ) {

        continue

      }


      var key =
        student.id
          ? "id_" + String(student.id)
          : "name_" + String(student.name)


      if (
        addedStudent[key]
      ) {

        continue

      }


      addedStudent[key] =
        true


      studentList.push(
        student
      )

    }


    var currentStudent =
      this.data.student ||
      wx.getStorageSync(
        "selectedStudent"
      ) ||
      null


    var studentIndex =
      0


    if (
      currentStudent
    ) {

      for (
        var j = 0;
        j < studentList.length;
        j++
      ) {

        if (
          currentStudent.id &&
          studentList[j].id &&
          String(
            currentStudent.id
          ) ===
          String(
            studentList[j].id
          )
        ) {

          studentIndex =
            j

          break

        }


        if (
          currentStudent.name &&
          studentList[j].name &&
          String(
            currentStudent.name
          ) ===
          String(
            studentList[j].name
          )
        ) {

          studentIndex =
            j

          break

        }

      }

    }


    this.setData({

      studentList:
        studentList,

      studentIndex:
        studentIndex,

      student:
        studentList.length
          ? studentList[studentIndex]
          : null,

      studentPickerOpen:
        true

    })

  },


  toggleStudentPicker: function () {

    if (
      this.data.studentPickerOpen
    ) {

      this.closeStudentPicker()

    } else {

      this.openStudentPicker()

    }

  },


  closeStudentPicker: function () {

    this.setData({

      studentPickerOpen:
        false

    })

  },


  // =====================================================
  // 选择学生
  // =====================================================

  selectStudent: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var student =
      this.data.studentList[index]


    if (!student) {

      return

    }


    this.setData({

      studentIndex:
        index,

      student:
        student,

      studentPickerOpen:
        false,

      hasFeedback:
        false,

      hasSaved:
        false,

      feedback:
        "",

      feedbackStudentText:
        "",

      feedbackTopicText:
        "",

      feedbackDateText:
        "",

      feedbackBody:
        "",

      selectedKnowledge:
        [],

      selectedKnowledgeText:
        "",

      knowledgeSelected:
        [],

      selectedKeywords:
        [],

      selectedKeywordsText:
        "",

      recommendedKeywords:
        [],

      keywordSelected:
        [],

      selectedPerformance:
        [],

      selectedPerformanceText:
        "",

      performanceSelected:
        [],

      selectedMastery:
        "",

      selectedProblems:
        [],

      selectedProblemsText:
        "",

      problemSelected:
        [],

      selectedStatus:
        "",

      teacherNote:
        ""

    })


    wx.setStorageSync(
      "selectedStudent",
      student
    )


    this.loadChemistryKnowledge(
      student
    )


    this.loadCourses(
      student,
      null
    )

  },


  // =====================================================
  // 课程选择器
  // =====================================================

  openCoursePicker: function () {

    if (
      !this.data.courseList.length
    ) {

      wx.showToast({

        title:
          "No courses available",

        icon:
          "none"

      })

      return

    }


    this.setData({

      coursePickerOpen:
        true

    })

  },


  closeCoursePicker: function () {

    this.setData({

      coursePickerOpen:
        false

    })

  },


  closeCourseModal: function () {

    this.setData({

      coursePickerOpen:
        false

    })

  },


  stopCourseModal: function () {},


  // =====================================================
  // 选择课程
  // =====================================================

  selectCourse: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var course =
      this.data.courseList[index]


    if (!course) {

      return

    }


    this.setData({

      courseIndex:
        index,

      coursePickerOpen:
        false,

      hasFeedback:
        false,

      hasSaved:
        false,

      feedback:
        "",

      feedbackStudentText:
        "",

      feedbackTopicText:
        "",

      feedbackDateText:
        "",

      feedbackBody:
        "",

      selectedKnowledge:
        [],

      selectedKnowledgeText:
        "",

      knowledgeSelected:
        [],

      selectedKeywords:
        [],

      selectedKeywordsText:
        "",

      recommendedKeywords:
        [],

      keywordSelected:
        [],

      selectedPerformance:
        [],

      selectedPerformanceText:
        "",

      performanceSelected:
        [],

      selectedMastery:
        "",

      selectedProblems:
        [],

      selectedProblemsText:
        "",

      problemSelected:
        [],

      selectedStatus:
        "",

      teacherNote:
        ""

    })


    this.selectCourseData(
      course
    )

  },


  // =====================================================
  // 设置当前课程
  // =====================================================

  selectCourseData: function (
    course
  ) {

    if (!course) {

      return

    }


    var student =
      this.data.student || {}


    course =
      this.ensureCourseStudentId(
        course
      )


    var courseTimeText =
      this.getCourseTimeText(
        course
      )


    if (
      !course.studentName &&
      student.name
    ) {

      course.studentName =
        student.name

    }


    this.setData({

      course:
        course,

      courseTopic:
        course.topic ||
        "No topic set",

      courseDateText:
        course.date ||
        "",

      courseTimeText:
        courseTimeText,

      hasFeedback:
        false,

      hasSaved:
        false,

      feedback:
        "",

      feedbackStudentText:
        "",

      feedbackTopicText:
        "",

      feedbackDateText:
        "",

      feedbackBody:
        ""

    })


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
          student.id ||
          "",

        name:
          course.studentName ||
          course.student ||
          student.name ||
          "",

        grade:
          course.grade ||
          student.grade ||
          "高一",

        subject:
          course.subject ||
          student.subject ||
          "化学"

      }
    )


    this.generateRecommendations()

  },


  // =====================================================
  // 年级标准化
  // =====================================================

  normalizeGrade: function (
    grade
  ) {

    var value =
      String(
        grade || ""
      ).replace(
        /\s+/g,
        ""
      )


    if (
      value.indexOf("初一") >= 0
    ) {

      return "初一"

    }


    if (
      value.indexOf("初二") >= 0
    ) {

      return "初二"

    }


    if (
      value.indexOf("初三") >= 0
    ) {

      return "初三"

    }


    if (
      value.indexOf("高一") >= 0
    ) {

      return "高一"

    }


    if (
      value.indexOf("高二") >= 0
    ) {

      return "高二"

    }


    if (
      value.indexOf("高三") >= 0
    ) {

      return "高三"

    }


    return value

  },


  // =====================================================
  // 加载化学教材
  //
  // 这是本次修改的核心
  // =====================================================

  loadChemistryKnowledge: function (
    student
  ) {

    if (!student) {

      this.setData({

        textbookList: [],

        textbookIndex: -1,

        selectedTextbook: null,

        selectedTextbookText: "",

        chapterList: [],

        chapterIndex: -1,

        selectedChapter: null,

        selectedChapterText: "",

        knowledgeList: [],

        knowledgeDetailList: {},

        currentGrade: "",

        selectedKnowledge: [],
        selectedKnowledgeText: "",
        knowledgeSelected: [],

        textbookOpen: false,
        chapterOpen: false

      })

      return

    }


    // ===================================================
    // 当前年级
    // ===================================================

    var grade =
      this.normalizeGrade(
        student.grade || "Grade 10"
      )


    // ===================================================
    // 直接获取本页面教材数据
    // ===================================================

    var textbookList =
      chemistry.textbookList


    // ===================================================
    // 根据年级设置默认教材
    //
    // 注意：
    // 这里只是默认，不限制其它教材
    // ===================================================

    var defaultIndex = 0


    if (
      grade === "高一"
    ) {

      defaultIndex = 0

    } else if (
      grade === "高二"
    ) {

      defaultIndex = 1

    } else if (
      grade === "高三"
    ) {

      defaultIndex = 3

    }


    if (
      defaultIndex < 0 ||
      defaultIndex >= textbookList.length
    ) {

      defaultIndex = 0

    }


    var defaultTextbook =
      textbookList[
        defaultIndex
      ]


    var chapterList =
      defaultTextbook.chapters || []


    var defaultChapter =
      chapterList.length > 0
        ? chapterList[0]
        : null


    var knowledgeList =
      defaultChapter
        ? (
          defaultChapter.sections || []
        )
        : []


    // ===================================================
    // 建立关键词详情映射
    // ===================================================

    var detail = {}


    // chemistry.js 中可能存在的数组
    var allKnowledge =
      []


    if (
      chemistry &&
      Array.isArray(
        chemistry.chemistryAllKnowledge
      )
    ) {

      allKnowledge =
        chemistry.chemistryAllKnowledge

    }


    for (
      var i = 0;
      i < allKnowledge.length;
      i++
    ) {

      var item =
        allKnowledge[i]


      if (!item) {

        continue

      }


      var key =
        item.section ||
        item.label ||
        item.id


      if (key) {

        detail[key] =
          item

      }

    }


    // ===================================================
    // 如果 chemistry.js 中有知识点
    // 尝试建立教材 + 章节 + 小节映射
    // ===================================================

    for (
      var t = 0;
      t < textbookList.length;
      t++
    ) {

      var textbook =
        textbookList[t]


      for (
        var c = 0;
        c < textbook.chapters.length;
        c++
      ) {

        var chapter =
          textbook.chapters[c]


        for (
          var s = 0;
          s < chapter.sections.length;
          s++
        ) {

          var section =
            chapter.sections[s]


          for (
            var k = 0;
            k < allKnowledge.length;
            k++
          ) {

            var knowledge =
              allKnowledge[k]


            if (!knowledge) {

              continue

            }


            if (
              knowledge.section === section
            ) {

              detail[section] =
                knowledge

              break

            }

          }

        }

      }

    }


    // ===================================================
    // 页面设置
    // ===================================================

    this.setData({

      textbookList:
        textbookList,

      textbookIndex:
        defaultIndex,

      selectedTextbook:
        defaultTextbook,

      selectedTextbookText:
        defaultTextbook.name,

      chapterList:
        chapterList,

      chapterIndex:
        defaultChapter
          ? 0
          : -1,

      selectedChapter:
        defaultChapter,

      selectedChapterText:
        defaultChapter
          ? defaultChapter.chapter
          : "",

      knowledgeList:
        knowledgeList,

      knowledgeSelected:
        knowledgeList.map(
          function () {
            return false
          }
        ),

      knowledgeDetailList:
        detail,

      currentGrade:
        grade,

      selectedKnowledge:
        [],

      selectedKnowledgeText:
        "",

      textbookOpen:
        false,

      chapterOpen:
        false,

      knowledgeOpen:
        false,

      recommendedKeywords:
        [],

      selectedKeywords:
        [],

      selectedKeywordsText:
        "",

      keywordSelected:
        []

    })


  },


  // =====================================================
  // 教材展开 / 收起
  // =====================================================

  toggleTextbook: function () {

    var open =
      !this.data.textbookOpen


    this.setData({

      textbookOpen:
        open,

      chapterOpen:
        false

    })

  },


  // =====================================================
  // 选择教材
  // =====================================================

  selectTextbook: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var list =
      this.data.textbookList || []


    var item =
      list[index]


    if (!item) {

      return

    }


    var chapters =
      item.chapters || []


    this.setData({

      textbookIndex:
        index,

      selectedTextbook:
        item,

      selectedTextbookText:
        item.name,

      chapterList:
        chapters,

      chapterIndex:
        -1,

      selectedChapter:
        null,

      selectedChapterText:
        "",

      knowledgeList:
        [],

      knowledgeSelected:
        [],

      selectedKnowledge:
        [],

      selectedKnowledgeText:
        "",

      textbookOpen:
        false,

      chapterOpen:
        false,

      recommendedKeywords:
        [],

      selectedKeywords:
        [],

      selectedKeywordsText:
        "",

      keywordSelected:
        []

    })


  },


  // =====================================================
  // 章节展开 / 收起
  // =====================================================

  toggleChapter: function () {

    if (
      !this.data.selectedTextbook
    ) {

      wx.showToast({

        title:
          "Select a textbook first",

        icon:
          "none"

      })

      return

    }


    this.setData({

      chapterOpen:
        !this.data.chapterOpen,

      textbookOpen:
        false

    })

  },


  // =====================================================
  // 选择章节
  // =====================================================

  selectChapter: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var list =
      this.data.chapterList || []


    var item =
      list[index]


    if (!item) {

      return

    }


    var sections =
      item.sections || []


    this.setData({

      chapterIndex:
        index,

      selectedChapter:
        item,

      selectedChapterText:
        item.chapter,

      knowledgeList:
        sections,

      knowledgeSelected:
        sections.map(
          function () {
            return false
          }
        ),

      selectedKnowledge:
        [],

      selectedKnowledgeText:
        "",

      chapterOpen:
        false,

      recommendedKeywords:
        [],

      selectedKeywords:
        [],

      selectedKeywordsText:
        "",

      keywordSelected:
        []

    })


  },


  // =====================================================
  // 小节多选
  // =====================================================

  selectKnowledge: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var list =
      this.data.knowledgeList || []


    if (
      !list[index]
    ) {

      return

    }


    var selected =
      (
        this.data.knowledgeSelected ||
        []
      ).slice()


    while (
      selected.length <
      list.length
    ) {

      selected.push(
        false
      )

    }


    selected[index] =
      !selected[index]


    var selectedKnowledge =
      []


    for (
      var i = 0;
      i < list.length;
      i++
    ) {

      if (
        selected[i]
      ) {

        selectedKnowledge.push(
          list[i]
        )

      }

    }


    this.setData({

      knowledgeSelected:
        selected,

      selectedKnowledge:
        selectedKnowledge,

      selectedKnowledgeText:
        selectedKnowledge.join("、")

    })


    if (
      selectedKnowledge.length > 0
    ) {

      this.generateRecommendations()

    } else {

      this.setData({

        recommendedKeywords:
          [],

        selectedKeywords:
          [],

        selectedKeywordsText:
          "",

        keywordSelected:
          []

      })

    }

  },


  // =====================================================
  // 知识点区域展开
  // =====================================================

  toggleKnowledge: function () {

    this.setData({

      knowledgeOpen:
        !this.data.knowledgeOpen

    })

  },


  // =====================================================
  // 智能推荐展开
  // =====================================================

  toggleKeyword: function () {

    this.setData({

      keywordOpen:
        !this.data.keywordOpen

    })

  },


  // =====================================================
  // 生成智能推荐
  // =====================================================

  generateRecommendations: function () {

    var selected =
      this.data.selectedKnowledge || []


    var detail =
      this.data.knowledgeDetailList || {}


    var result =
      []


    for (
      var i = 0;
      i < selected.length;
      i++
    ) {

      var section =
        selected[i]


      var item =
        detail[section]


      // =================================================
      // 如果当前映射中没有
      // 从 chemistry.js 中继续查找
      // =================================================

      if (
        !item &&
        chemistry
      ) {

        var source =
          chemistry.chemistryKnowledge ||
          {}


        var keys =
          Object.keys(
            source
          )


        for (
          var j = 0;
          j < keys.length;
          j++
        ) {

          var key =
            keys[j]


          var knowledge =
            source[key]


          if (
            knowledge &&
            (
              knowledge.label === section ||
              knowledge.id === section ||
              knowledge.section === section
            )
          ) {

            item =
              knowledge

            break

          }

        }

      }


      if (
        item &&
        Array.isArray(
          item.keywords
        )
      ) {

        result =
          result.concat(
            item.keywords
          )

      }

    }


    // ===================================================
    // 如果没有从 chemistry.js 找到关键词
    // 根据当前知识点自动给出通用推荐
    // ===================================================

    if (
      result.length === 0 &&
      selected.length > 0
    ) {

      for (
        var r = 0;
        r < selected.length;
        r++
      ) {

        var name =
          selected[r]


        if (
          name.indexOf("氧化还原") >= 0
        ) {

          result.push(
            "氧化数",
            "电子转移",
            "氧化剂与还原剂",
            "氧化还原反应方程式"
          )

        } else if (
          name.indexOf("离子反应") >= 0
        ) {

          result.push(
            "离子方程式",
            "离子共存",
            "反应实质"
          )

        } else if (
          name.indexOf("化学平衡") >= 0
        ) {

          result.push(
            "平衡状态",
            "平衡移动",
            "勒夏特列原理"
          )

        } else if (
          name.indexOf("化学反应速率") >= 0
        ) {

          result.push(
            "反应速率",
            "影响反应速率的因素"
          )

        } else if (
          name.indexOf("原子结构") >= 0
        ) {

          result.push(
            "电子排布",
            "原子结构",
            "元素周期律"
          )

        } else if (
          name.indexOf("元素周期") >= 0
        ) {

          result.push(
            "元素周期律",
            "周期表",
            "元素性质变化规律"
          )

        } else if (
          name.indexOf("化学键") >= 0 ||
          name.indexOf("共价键") >= 0
        ) {

          result.push(
            "化学键",
            "共价键",
            "电子式",
            "空间结构"
          )

        } else if (
          name.indexOf("酸碱") >= 0
        ) {

          result.push(
            "酸碱性",
            "pH",
            "水的电离"
          )

        } else if (
          name.indexOf("电解") >= 0 ||
          name.indexOf("原电池") >= 0
        ) {

          result.push(
            "电极反应",
            "电子转移",
            "电化学"
          )

        }

      }

    }


    // ===================================================
    // 去重
    // ===================================================

    var unique =
      []


    for (
      var u = 0;
      u < result.length;
      u++
    ) {

      var keyword =
        result[u]


      if (!keyword) {

        continue

      }


      if (
        unique.indexOf(keyword) < 0
      ) {

        unique.push(
          keyword
        )

      }

    }


    this.setData({

      recommendedKeywords:
        unique,

      selectedKeywords:
        [],

      selectedKeywordsText:
        "",

      keywordSelected:
        unique.map(
          function () {
            return false
          }
        )

    })

  },


  // =====================================================
  // 选择智能推荐
  // =====================================================

  selectKeyword: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var value =
      this.data.recommendedKeywords[index]


    if (!value) {

      return

    }


    var list =
      (
        this.data.selectedKeywords ||
        []
      ).slice()


    var selected =
      (
        this.data.keywordSelected ||
        []
      ).slice()


    while (
      selected.length <
      this.data.recommendedKeywords.length
    ) {

      selected.push(
        false
      )

    }


    if (
      selected[index]
    ) {

      selected[index] =
        false

      var position =
        list.indexOf(value)


      if (
        position >= 0
      ) {

        list.splice(
          position,
          1
        )

      }

    } else {

      selected[index] =
        true

      if (
        list.indexOf(value) < 0
      ) {

        list.push(
          value
        )

      }

    }


    this.setData({

      selectedKeywords:
        list,

      selectedKeywordsText:
        list.join("、"),

      keywordSelected:
        selected

    })

  },


  // =====================================================
  // 课堂表现
  // =====================================================

  togglePerformance: function () {

    this.setData({

      performanceOpen:
        !this.data.performanceOpen

    })

  },


  selectPerformance: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var value =
      this.data.performanceList[index]


    if (!value) {

      return

    }


    var list =
      this.data.selectedPerformance.slice()


    var selected =
      this.data.performanceSelected.slice()


    while (
      selected.length <
      this.data.performanceList.length
    ) {

      selected.push(
        false
      )

    }


    if (
      selected[index]
    ) {

      selected[index] =
        false

      var position =
        list.indexOf(value)


      if (
        position >= 0
      ) {

        list.splice(
          position,
          1
        )

      }

    } else {

      selected[index] =
        true

      list.push(
        value
      )

    }


    this.setData({

      selectedPerformance:
        list,

      selectedPerformanceText:
        list.join("、"),

      performanceSelected:
        selected

    })

  },


  // =====================================================
  // 知识掌握
  // =====================================================

  toggleMastery: function () {

    this.setData({

      masteryOpen:
        !this.data.masteryOpen

    })

  },


  selectMastery: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var value =
      this.data.masteryList[index]


    if (!value) {

      return

    }


    this.setData({

      selectedMastery:
        value,

      masteryOpen:
        false

    })

  },


  // =====================================================
  // 解题表现
  // =====================================================

  toggleProblem: function () {

    this.setData({

      problemOpen:
        !this.data.problemOpen

    })

  },


  selectProblem: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var value =
      this.data.problemList[index]


    if (!value) {

      return

    }


    var list =
      this.data.selectedProblems.slice()


    var selected =
      this.data.problemSelected.slice()


    while (
      selected.length <
      this.data.problemList.length
    ) {

      selected.push(
        false
      )

    }


    if (
      selected[index]
    ) {

      selected[index] =
        false

      var position =
        list.indexOf(value)


      if (
        position >= 0
      ) {

        list.splice(
          position,
          1
        )

      }

    } else {

      selected[index] =
        true

      list.push(
        value
      )

    }


    this.setData({

      selectedProblems:
        list,

      selectedProblemsText:
        list.join("、"),

      problemSelected:
        selected

    })

  },


  // =====================================================
  // 学习状态
  // =====================================================

  toggleStatus: function () {

    this.setData({

      statusOpen:
        !this.data.statusOpen

    })

  },


  selectStatus: function (e) {

    var index =
      Number(
        e.currentTarget.dataset.index
      )


    var value =
      this.data.statusList[index]


    if (!value) {

      return

    }


    this.setData({

      selectedStatus:
        value,

      statusOpen:
        false

    })

  },


  // =====================================================
  // 教师补充
  // =====================================================

  inputTeacherNote: function (e) {

    this.setData({

      teacherNote:
        e.detail.value,

      hasSaved:
        false

    })

  },


  // =====================================================
  // 格式化日期
  // =====================================================

  formatCourseDate: function (
    dateString
  ) {

    if (!dateString) {

      return "Date TBD"

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


    var monthNames =
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    var monthIndex =
      Number(parts[1]) - 1

    if (
      monthIndex < 0 ||
      monthIndex > 11
    ) {
      return dateString
    }

    return (
      monthNames[monthIndex] +
      " " +
      Number(parts[2]) +
      ", " +
      Number(parts[0])
    )

  },


  // =====================================================
  // 获取课程时间
  // =====================================================

  getCourseTimeText: function (
    course
  ) {

    if (!course) {

      return "Time TBD"

    }


    var start =
      course.startTime ||
      course.time ||
      ""


    var end =
      course.endTime ||
      ""


    if (
      start &&
      end
    ) {

      return (
        start +
        "—" +
        end
      )

    }


    return (
      start ||
      end ||
      "Time TBD"
    )

  },


  // =====================================================
  // 生成课堂反馈
  // =====================================================

  generateFeedback: function () {

    var student =
      this.data.student


    if (
      !student ||
      !student.name
    ) {

      wx.showToast({

        title:
          "Select a student",

        icon:
          "none"

      })

      return

    }


    var course =
      this.data.course


    if (!course) {

      wx.showToast({

        title:
          "Select a course",

        icon:
          "none"

      })

      return

    }


    var topic =
      this.data.courseTopic ||
      course.topic ||
      "本节课内容"


    var dateText =
      course.date
        ? this.formatCourseDate(
          course.date
        )
        : "Date TBD"


    var bodyParts =
      []


    var knowledge =
      this.data.selectedKnowledge || []


    if (
      knowledge.length
    ) {

      bodyParts.push(

        "本节课重点围绕" +
        knowledge.join("、") +
        "进行了学习和练习。"

      )

    } else {

      bodyParts.push(

        "本节课围绕《" +
        topic +
        "》进行了学习和练习。"

      )

    }


    var keywords =
      this.data.selectedKeywords || []


    if (
      keywords.length
    ) {

      bodyParts.push(

        "具体学习过程中重点涉及" +
        keywords.join("、") +
        "等内容。"

      )

    }


    var performance =
      this.data.selectedPerformance || []


    if (
      performance.length
    ) {

      bodyParts.push(

        "课堂过程中" +
        performance.join("、") +
        "。"

      )

    }


    var mastery =
      this.data.selectedMastery ||
      ""


    if (
      mastery
    ) {

      bodyParts.push(

        "目前对本节课知识点" +
        mastery +
        "。"

      )

    }


    var problems =
      this.data.selectedProblems || []


    if (
      problems.length
    ) {

      bodyParts.push(

        "在解题过程中" +
        problems.join("、") +
        "。"

      )

    }


    var status =
      this.data.selectedStatus ||
      ""


    if (
      status
    ) {

      bodyParts.push(

        "本次学习" +
        status +
        "。"

      )

    }


    var teacherNote =
      String(
        this.data.teacherNote ||
        ""
      ).trim()


    if (
      teacherNote
    ) {

      bodyParts.push(
        teacherNote
      )

    }


    bodyParts.push(

      "后续建议继续巩固本节课重点知识，并通过综合题和迁移题进一步加强知识应用能力。"

    )


    var body =
      bodyParts.join("")


    var fullFeedback =
      "【课堂反馈】\n\n" +

      "学生：" +
      student.name +

      "\n" +

      "学习内容：" +
      topic +

      "\n" +

      "课程日期：" +
      dateText +

      "\n\n" +

      body


    this.setData({

      feedback:
        fullFeedback,

      feedbackStudentText:
        student.name,

      feedbackTopicText:
        topic,

      feedbackDateText:
        dateText,

      feedbackBody:
        body,

      hasFeedback:
        true,

      hasSaved:
        false

    })


    wx.showToast({

      title:
        "Feedback generated",

      icon:
        "success"

    })

  },


  // =====================================================
  // 复制反馈
  // =====================================================

  copyFeedback: function () {

    if (
      !this.data.feedback
    ) {

      wx.showToast({

        title:
          "No feedback yet",

        icon:
          "none"

      })

      return

    }


    wx.setClipboardData({

      data:
        this.data.feedback,

      success: function () {

        wx.showToast({

          title:
            "Copied",

          icon:
            "success"

        })

      }

    })

  },


  // =====================================================
  // 保存反馈
  // =====================================================

  saveFeedback: function () {

    var student =
      this.data.student


    var course =
      this.data.course


    var feedback =
      String(
        this.data.feedback || ""
      ).trim()


    if (!student) {

      wx.showToast({

        title:
          "Select a student",

        icon:
          "none"

      })

      return

    }


    if (!course) {

      wx.showToast({

        title:
          "Select a course",

        icon:
          "none"

      })

      return

    }


    if (!feedback) {

      wx.showToast({

        title:
          "Generate feedback first",

        icon:
          "none"

      })

      return

    }


    course =
      this.ensureCourseStudentId(
        course
      )


    var studentId =
      course.studentId ||
      student.id ||
      ""


    if (!studentId) {

      studentId =
        "student_" +
        Date.now() +
        "_" +
        Math.floor(
          Math.random() * 10000
        )


      course.studentId =
        studentId

    }


    var history =
      wx.getStorageSync(
        "history"
      ) || []


    var now =
      Date.now()


    var existingIndex =
      -1


    for (
      var i = 0;
      i < history.length;
      i++
    ) {

      if (
        history[i] &&
        history[i].type === "feedback" &&
        String(
          history[i].courseId || ""
        ) ===
        String(
          course.id || ""
        )
      ) {

        existingIndex =
          i

        break

      }

    }


    var historyItem = {

      id:
        existingIndex >= 0
          ? history[existingIndex].id
          : now,

      type:
        "feedback",

      studentId:
        studentId,

      courseId:
        course.id || "",

      student:
        student.name ||
        course.studentName ||
        "",

      grade:
        course.grade ||
        student.grade ||
        "",

      subject:
        "化学",

      date:
        course.date ||
        "",

      startTime:
        course.startTime ||
        course.time ||
        "",

      endTime:
        course.endTime ||
        "",

      courseTime:
        this.getCourseTimeText(
          course
        ),

      topic:
        course.topic ||
        "",

      knowledge:
        (
          this.data.selectedKnowledge ||
          []
        ).slice(),

      knowledgeText:
        this.data.selectedKnowledgeText ||
        "",

      keywords:
        (
          this.data.selectedKeywords ||
          []
        ).slice(),

      keywordsText:
        this.data.selectedKeywordsText ||
        "",

      performance:
        (
          this.data.selectedPerformance ||
          []
        ).slice(),

      performanceText:
        this.data.selectedPerformanceText ||
        "",

      mastery:
        this.data.selectedMastery ||
        "",

      problems:
        (
          this.data.selectedProblems ||
          []
        ).slice(),

      problemsText:
        this.data.selectedProblemsText ||
        "",

      status:
        this.data.selectedStatus ||
        "",

      teacherNote:
        String(
          this.data.teacherNote ||
          ""
        ).trim(),

      content:
        feedback,

      time:
        now,

      timeText:
        this.formatHistoryTime(
          now
        )

    }


    if (
      existingIndex >= 0
    ) {

      history[
        existingIndex
      ] =
        historyItem

    } else {

      history.unshift(
        historyItem
      )

    }


    wx.setStorageSync(
      "history",
      history
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

      hasSaved:
        true,

      course:
        course

    })


    wx.showToast({

      title:
        existingIndex >= 0
          ? "Feedback updated"
          : "Feedback saved",

      icon:
        "success"

    })

  },


  // =====================================================
  // 历史时间
  // =====================================================

  formatHistoryTime: function (
    timestamp
  ) {

    var date =
      new Date(
        timestamp
      )


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


    month =
      month < 10
        ? "0" + month
        : String(month)


    day =
      day < 10
        ? "0" + day
        : String(day)


    hour =
      hour < 10
        ? "0" + hour
        : String(hour)


    minute =
      minute < 10
        ? "0" + minute
        : String(minute)


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


  // =====================================================
  // 历史记录
  // =====================================================

  goHistory: function () {

    wx.navigateTo({

      url:
        "/pages/feedbackHistory/feedbackHistory"

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