// ============================================================
// 用户个性化配置
//
// storage key: userProfile（可选，无 key 时用默认值）
//
// 字段：
//   nickname          用户称呼
//   dailyStudyTarget  每日学习目标（分钟）
//   dailyTaskTarget   每日任务目标（条数）
// ============================================================


var DEFAULT_PROFILE = {

  nickname: "Student",

  dailyStudyTarget: 60,

  dailyTaskTarget: 5

}


// ============================================================
// 读取配置（合并默认值，兼容无 key / 缺字段）
// ============================================================

function getProfile() {

  var profile =
    wx.getStorageSync("userProfile") || {}

  return {

    nickname:
      profile.nickname || DEFAULT_PROFILE.nickname,

    dailyStudyTarget:
      Number(profile.dailyStudyTarget) ||
      DEFAULT_PROFILE.dailyStudyTarget,

    dailyTaskTarget:
      Number(profile.dailyTaskTarget) ||
      DEFAULT_PROFILE.dailyTaskTarget

  }

}


// ============================================================
// 保存配置（合并到现有，不覆盖未传字段）
// ============================================================

function saveProfile(patch) {

  var existing =
    wx.getStorageSync("userProfile") || {}

  var merged =
    Object.assign({}, existing, patch)

  wx.setStorageSync(
    "userProfile",
    merged
  )

  return merged

}


// ============================================================
// 导出
// ============================================================

module.exports = {
  getProfile: getProfile,
  saveProfile: saveProfile
}
