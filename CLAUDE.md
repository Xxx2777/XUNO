# CLAUDE.md

「炫记」微信小程序项目说明，供 Claude Code 开发时快速理解项目。

---

## 1. 项目定位

「炫记」是面向**家教老师 + 个人学习者**的一体化工作学习管理小程序，把三件事整合到一起：

- **工作** = 家教教学（课程排课、课堂反馈、作业评价）
- **学习** = 个人成长（学习记录、学习目标）
- **任务** = 日常待办（Todo）

通过「今日 / 日历 / 数据 / 我的」四个一级页面形成使用闭环。数据全部保存在本地 Storage。

> 不要把它描述成「单纯化学学习工具」「单纯 Todo」「单纯课程管理」或「家长端工具」。

---

## 2. 技术栈与约束

- 原生微信小程序：WXML / WXSS / JS / JSON（无框架、无 TypeScript、无 npm）
- 本地 Storage：`wx.setStorageSync` / `wx.getStorageSync` / `wx.removeStorageSync`
- 无云开发、无后端、无登录、无账号系统
- 主题：2 套（紫色 `theme-1` / 蓝紫 `theme-2`），CSS 变量 + 页面 `themeClass` 切换
- 不引入新框架 / npm / 云 / 后端，除非用户明确要求

---

## 3. 一级导航

`app.json` **未配置原生 tabBar**。使用自定义底部导航组件 `components/tab-bar/`。

| 一级页面 | 路径 | tab active |
|---|---|---|
| 今日 | `pages/index/index` | today |
| 日历 | `pages/calendar/calendar` | calendar |
| 数据 | `pages/statistics/statistics` | statistics |
| 我的 | `pages/mine/mine` | mine |

一级页面切换由 tab-bar 组件内部用 `wx.reLaunch` 实现。**不要用 `wx.switchTab`**（未配置 tabBar，会失败）。

---

## 4. 目录结构

```
化学反馈助手/
├── app.js / app.json / app.wxss / sitemap.json
├── components/
│   └── tab-bar/            # 自定义底部导航（4 个一级页面复用）
├── utils/                  # 11 个工具模块（见 §7）
└── pages/                  # 23 个页面（见 §5）
```

---

## 5. 页面清单（app.json 注册 23 个）

**一级页面**

| 页面 | 路径 | 功能 |
|---|---|---|
| 今日 | `pages/index/index` | 工作台：问候、顶部双卡片、下一事项、今日课程/任务/学习/笔记、待反馈、快捷操作 |
| 日历 | `pages/calendar/calendar` | 月历视图，聚合课程/任务/项目/学习 |
| 数据 | `pages/statistics/statistics` | 综合数据中心，周期统计 |
| 我的 | `pages/mine/mine` | 数据概览 + 各模块入口 |

**工作 · 学习**

| 页面 | 功能 |
|---|---|
| `projects` | 项目列表 |
| `projectDetail` | 项目详情（关联任务/学习/笔记） |
| `todo` | 任务中心（今日 / 全部 双视图） |
| `taskDetail` | 任务详情 / 编辑 |
| `study` | 学习记录（目标 + 计时） |
| `history` | 学习记录历史 |
| `learningDetail` | 学习记录详情 / 编辑 |
| `notes` | 笔记列表（搜索 / 类型筛选） |
| `noteDetail` | 笔记详情 / 编辑（新建 + 详情） |
| `timeline` | 时间线（实时计算的活动流） |

**教学**

| 页面 | 功能 |
|---|---|
| `create` | 新建课程（单次 / 每周重复） |
| `courseDetail` | 课程详情（时间/状态/作业/备注/内容，跳反馈与作业评价） |
| `teachingRecords` | 课程记录列表（按统计周期） |
| `teachingHistory` | 教学记录（课堂反馈 + 作业评价双 tab） |
| `feedbackCreate` | 生成课堂反馈（教材→章节→小节 + 关键词推荐） |
| `feedbackList` | 待填写反馈列表 |
| `feedbackHistory` | 课堂反馈历史（仍有真实入口，见 §12） |
| `homeworkEvaluation` | 作业评价 |

**其他**

| 页面 | 功能 |
|---|---|
| `settings` | 设置（主题切换 / 关于，见 §13） |

---

## 6. 核心数据模型（storage key）

### 持久化数据

| key | 结构 | 说明 |
|---|---|---|
| `courses` | 课程对象数组 | 核心教学数据源 |
| `history` | 反馈记录数组 | `type: "feedback"`，课堂反馈历史 |
| `learningHistory` | 学习记录数组 | 个人学习，与 `history` 分离 |
| `todoList` | `{ "YYYY-MM-DD": [task, ...] }` | 按日期组织的任务 Map（见 §8） |
| `projects` | 项目对象数组 | 项目 |
| `notes` | 笔记对象数组 | 笔记 |
| `userProfile` | 对象 | `nickname` / `dailyStudyTarget` / `dailyTaskTarget` |
| `studyTargetMap` | `{类型名: 分钟数}` | 学习目标 |
| `customStudyTypes` | 字符串数组 | 自定义学习类型 |
| `themeMode` | 数字（1 / 2） | 当前主题 |
| `homework_{courseId}` | 字符串 | 每节课的作业内容 |
| `homeworkEvaluation_{courseId}` | 对象 | 每节课的作业评价（score / evaluation / savedAt） |

### course 对象字段

```
id, studentId, date(YYYY-MM-DD), startTime(HH:mm), endTime(HH:mm),
time(=startTime), student(姓名), grade, subject(="化学"), topic(课程内容),
status, leaveReason, note, repeat(布尔), repeatType("once"|"weekly"),
repeatId, createdAt
```

课程状态由 `common.getCourseStatus()` 动态判断（待开始 / 进行中 / 已完成 / 学生请假 / 已取消），不依赖 storage 里的 `status` 字段。

### learningHistory 记录字段

```
id, date, time, minutes, type, topic, content, learningRecord, projectId
```

### task 对象字段（todoList 内层元素）

```
id, text, completed, priority, deadline, projectId, description, tags, createdAt, completedAt
```

### project 对象字段

```
id, name, description, type, status, progress, startDate, deadline, createdAt, updatedAt
```

> 项目有两个**不同**的进度概念：① 手动进度 `project.progress`；② 根据关联任务完成情况计算的 `taskCompletionRate`。二者不要混为一谈。

### note 对象字段

```
id, title, content, projectId, type, tags, createdAt, updatedAt
```

---

## 7. 核心关联关系

```
Project.id
  ↓ projectId
Task.projectId / Learning.projectId / Note.projectId

Course.id
  ↓ courseId
Feedback.courseId
Homework: homework_{courseId}
Evaluation: homeworkEvaluation_{courseId}
```

---

## 8. Todo 任务中心（重要）

todoList 是**按日期组织的任务 Map**，任务「所属日期」由外层 key 表达，任务对象内不冗余存 date。

**两个关键原则：**

1. 任务「所属日期」和「deadline」是**两个不同概念**——修改 deadline 不会改变任务所在的日期 key。
2. 跨日期操作任务时，必须写回**原始归属日期**的数组。

### 双视图

| 视图 | 入口 | 内容 |
|---|---|---|
| 今日 | `/pages/todo/todo` | 只显示当天任务，提供新建任务表单 |
| 全部 | `/pages/todo/todo?view=all` | 展示所有日期任务，保留原始 date，隐藏新建表单 |

- `todo.js` 的 `onLoad(options)` 读 `options.view`，`"all"` → 全部，否则今日。
- 全部视图用 `stats.flattenTodoList(todoList)` 展开，每条任务带 `date`（原始归属日期）。
- 完成 / 删除任务时，用 `item.date`（WXML `data-date`）定位写回 `todoList[item.date]`，**不能错误写入今天**。
- `taskDetail` 用 `taskUtil.findTaskById()` 跨所有日期查找任务，编辑/完成/删除都写回任务真实所属日期。

---

## 9. 项目正向创建链

`projectDetail` 支持从项目内新建任务 / 学习记录 / 笔记，通过临时 key `presetProjectId` 将新建内容自动关联到当前项目。修改时不要破坏这个机制。

---

## 10. 核心工具函数（utils）

| 文件 | 职责 |
|---|---|
| `common.js` | 日期格式化、`getToday`、`timeToMinutes`、主题、`getCourseStatus`、`checkUnwrittenFeedback` |
| `task.js` | 任务规范化、搜索、筛选、排序、`findTaskById`、标签解析 |
| `course.js` | `deleteCourseCascade`（课程删除级联清理） |
| `project.js` | 项目规范化、项目统计、项目删除级联 |
| `learning.js` | 学习记录规范化、查找、修改、删除、格式化 |
| `note.js` | 笔记规范化、统计、删除、时间格式化 |
| `calendar.js` | 日历事件聚合（`buildCalendarEvents`） |
| `stats.js` | 学习/教学/任务/项目/笔记/综合统计（`flattenTodoList`、`getDashboardStats` 等） |
| `timeline.js` | 时间线事件计算（`buildTimelineData`） |
| `chemistry.js` | 高中化学知识库（教材→章节→小节），供 feedbackCreate 选择 |
| `profile.js` | 用户个性化配置（`userProfile`） |

---

## 11. 日历与时间线

### 日历

聚合：课程 + 任务（deadline）+ 项目（deadline）+ 学习记录。

点击关系：

| 事件 | 跳转 |
|---|---|
| 课程 | `courseDetail` |
| 任务 | `taskDetail` |
| 学习 | `learningDetail` |
| 项目 | `projectDetail` |

### 时间线

`timeline` 是**实时计算**的综合回顾，**不单独保存 timeline storage**，由 `timeline.buildTimelineData()` 从 courses / todoList / learningHistory / notes / history / projects 计算得到。

点击关系：

| 事件类型 | 跳转 |
|---|---|
| `learning` | `learningDetail` |
| `note` | `noteDetail` |
| `task_done` | `taskDetail` |
| `course_done` | `courseDetail` |

---

## 12. 已废弃内容（不要误用）

以下内容已从运行代码中删除，**不要**再当作当前架构：

- 页面：`studentDetail`、`homeworkHistory`、`result`（已删除，未注册）
- 文件：`utils/recommend.js`（旧版关键词推荐表，已删除）
- 组件：`components/navigation-bar/`（已删除，当前只用 `tab-bar`）

旧 storage key `feedback`、`students` 当前代码已无读写，只是历史设备 storage 残留。**不要在代码中主动 `removeStorageSync` 它们**。

> 注意：`feedbackHistory` 页面**仍然有效**——`feedbackCreate` 页面右上角有「历史反馈」入口跳转到它，后续重构不要误删。

---

## 13. Settings 当前状态

`settings` 页面当前真实功能：

- ✅ 主题设置（`goTheme`）
- ✅ 关于（`goAbout`）
- ⚠️ 占位/未完善：个人资料（`goProfile`）、数据管理（`goData`）、清理缓存（`clearCache`，弹窗后未实际清理）

不要把这些占位功能描述成已完成的真实功能。

---

## 14. 视觉规范

- App Store 风格：卡片圆角、大留白、浅紫背景
- 主色：紫色（`#765B91`）→ 蓝紫（`#7D86C9`）两套主题，用 CSS 变量
- **不要**使用旧的 `#1677ff` 蓝色作为默认主色
- 自定义底部 TabBar（`components/tab-bar/`）
- WXML 避免 `style="width: {{xxx}}%;"` 这类动态 inline style，优先用 class / 状态 class
- 每个页面有 `syncTheme()` 设置 `themeClass`，新增页面要照做

---

## 15. 页面间数据传递

本项目习惯用 `wx.setStorageSync` 传参（而非 URL query），新页面读取参数时保持这个习惯。

主要临时 key：`selectedCourse` / `selectedCourseId` / `selectedStudent` / `evaluationCourseId` / `createCourseDate` / `createCourseReturnPage` / `selectedProjectId` / `selectedTaskId` / `selectedLearningId` / `selectedNoteId` / `presetProjectId` / `statisticsPeriod` / `statisticsPeriodText`。

> 例外：`todo` 的视图模式用 URL query（`?view=all`），不用 storage key。

---

## 16. 开发原则

1. 修改前先分析需求和项目结构，读相关文件的现有实现。
2. 优先局部修改，不要无必要重写整个项目。
3. 修改前先检查引用关系，不要删除没有确认无引用的页面 / 文件 / storage key。
4. 修改后进行静态检查，再进入微信开发者工具测试。
5. 不使用 `console.log` 做无意义调试。
6. 不引入新框架 / npm / 云 / 后端，除非用户明确要求。
7. 不擅自改变现有 storage 数据结构与字段含义（它们是与旧数据兼容的契约）。
8. 不擅自修改已经测试通过的核心流程（如顶部双卡片、Todo 双视图、项目创建链）。
9. 修改一个模块时，检查它与日历、时间线、数据中心、项目的关联。
10. 日期格式统一 `YYYY-MM-DD`（补零），时间 `HH:mm`，字符串可直接比较先后。
11. 保持与旧数据兼容：处理缺字段时补默认值，不要因缺字段报错。
