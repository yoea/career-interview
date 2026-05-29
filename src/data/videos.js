import rawVideos from './videos.json'

const CACHE_KEY = 'xwzw_videos_cache_v2'
const FETCH_INTERVAL = 1 * 60 * 60 * 1000 // 1 hour
const API_BASE = '/api/bili'
const SEASON_ID = 131230
const MID = 395341214

// ─── Cache helpers ───────────────────────────────────────────────
function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    // Validate: must be array with expected fields
    if (!Array.isArray(data) || !data[0]?.profession) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return { data, timestamp }
  } catch {
    return null
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

function isStale(timestamp) {
  return !timestamp || Date.now() - timestamp > FETCH_INTERVAL
}

// ─── Background fetch from Bilibili API ──────────────────────────
async function fetchSeasonAids() {
  const aids = []
  let page = 1
  while (true) {
    const res = await fetch(
      `${API_BASE}/x/polymer/web-space/seasons_archives_list?mid=${MID}&season_id=${SEASON_ID}&sort_reverse=false&page_num=${page}&page_size=100`
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (json.code !== 0 || !json.data?.aids?.length) break
    aids.push(...json.data.aids)
    if (json.data.aids.length < 100) break
    page++
  }
  return aids
}

async function fetchVideoDetail(aid) {
  const res = await fetch(`${API_BASE}/x/web-interface/view?aid=${aid}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.code !== 0) throw new Error(`API ${json.code}`)
  const v = json.data
  return {
    bvid: v.bvid,
    aid: v.aid,
    title: v.title,
    description: v.desc,
    url: `https://www.bilibili.com/video/${v.bvid}`,
    pic: v.pic,
    author: v.owner.name,
    mid: v.owner.mid,
    created: v.pubdate,
    length: formatDuration(v.duration),
    play: v.stat.view,
    comment: v.stat.reply,
    typeid: v.tid,
    is_union_video: v.is_union_video ? 1 : 0,
    season_id: SEASON_ID,
  }
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

let fetching = false

async function backgroundFetch(existingRaw) {
  if (fetching) return
  fetching = true
  try {
    console.log('[data] Refreshing from Bilibili...')
    const aids = await fetchSeasonAids()
    const existingMap = new Map((existingRaw || []).map(v => [v.aid, v]))
    const rawResults = []

    for (const aid of aids) {
      try {
        const detail = await fetchVideoDetail(aid)
        const old = existingMap.get(aid)
        rawResults.push(old ? { ...old, play: detail.play, comment: detail.comment, pic: detail.pic, url: detail.url } : detail)
      } catch {
        if (existingMap.has(aid)) rawResults.push(existingMap.get(aid))
      }
      await sleep(1500)
    }

    if (rawResults.length > 0) {
      // Process before caching — cache stores PROCESSED data
      const processed = processVideos(rawResults)
      setCache(processed)
      videos.length = 0
      videos.push(...processed)
      console.log(`[data] Updated ${processed.length} videos`)
    }
  } catch (e) {
    console.warn('[data] Background fetch failed:', e.message)
  } finally {
    fetching = false
  }
}

// ─── Profession extraction & normalization ───────────────────────
const PROFESSION_OVERRIDES = {
  '珍珠生访王亚丽（第40届南丁格尔奖章中国得主之一）': '护士',
  '珍珠生访陈笠先生': '教育公益',
  '珍珠学长': '教育公益',
  '高考志愿填报指导暨高中教师': '高中教师',
  '心理咨询师&教师': '心理咨询师',
  '甘肃省民勤县第四中学副校长': '校长',
  '高中心理老师': '心理教师',
  '走近文秘工作者': '文秘',
  '走近博士研究生': '博士研究生',
  '高中思政教师': '思政教师',
  '县域房地产销售人员': '房地产销售',
  '民营农业科技企业家': '农业科技企业家',
  '驻村干部': '公务员',
  '一起走进高中校长': '校长',
  '走近文秘工作者': '文秘',
}

function cleanProfession(raw) {
  // Manual override
  if (PROFESSION_OVERRIDES[raw]) return PROFESSION_OVERRIDES[raw]

  let p = raw
  // Remove prefixes
  p = p.replace(/^一起走进/, '')
  p = p.replace(/^走近/, '')
  // Remove parenthetical notes
  p = p.replace(/（.*?）/g, '')
  p = p.replace(/\(.*?\)/g, '')
  // Remove person-name suffixes (先生/女士/访谈 after a name)
  p = p.replace(/访[^\u4e00-\u9fa5]*$/, '')
  // Trim
  return p.trim() || raw
}

function extractProfession(title) {
  const match = title.match(/生涯人物访谈[\s|丨|｜]+(.+?)(?:访谈录|访谈)?$/)
  const raw = match ? match[1].trim() : title.replace(/生涯人物访谈[\s|丨|｜]*/, '').trim()
  return cleanProfession(raw)
}

export function formatPlayCount(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatDate(ts) {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── 15 broad category mapping (+ 其他) ─────────────────────────
const CATEGORY_RULES = [
  { name: '教育', icon: 'graduation-cap', keywords: ['教师', '校长', '教授', '辅导员', '老师', '教育', '志愿填报', '生涯规划', '职业规划', '生涯发展'] },
  { name: '科技·互联网', icon: 'laptop-code', keywords: ['程序员', '软件', '计算机', '人工智能', '大数据', '芯片', '物联网', '自动驾驶', '自动化', '互联网', '架构师'] },
  { name: '法律', icon: 'scale-balanced', keywords: ['律师', '检察官', '法官', '法律'] },
  { name: '科研·学术', icon: 'flask', keywords: ['科研', '航空科学', '学者', '博士', '科普', '数学教授'] },
  { name: '企业·创业', icon: 'building', keywords: ['企业家', '创业', '民营', '房地产'] },
  { name: '金融·财务', icon: 'chart-line', keywords: ['银行', '金融', '保险', '财富', '税务', '审计', '财务'] },
  { name: '媒体·传媒', icon: 'bullhorn', keywords: ['记者', '传媒', '主持', '媒体', '新闻', '宣传'] },
  { name: '公务·公共安全', icon: 'shield-halved', keywords: ['公务员', '警察', '消防', '驻村'] },
  { name: '医疗健康', icon: 'stethoscope', keywords: ['医生', '外科', '医学', '中医', '医院', '医药', '医疗', '护士', '南丁格尔'] },
  { name: '心理咨询', icon: 'heart-pulse', keywords: ['心理咨询', '心理教师', '心理学家', '心理老师'] },
  { name: '文化·艺术', icon: 'pen-nib', keywords: ['诗人', '作家', '书法', '文秘', '写作'] },
  { name: '环保·公益', icon: 'seedling', keywords: ['环保', '再生', '公益', '珍珠'] },
  { name: '军旅', icon: 'helmet-safety', keywords: ['军人', '维和', '老兵', '军旅', '部队'] },
  { name: '工程·制造', icon: 'wrench', keywords: ['设备', '化工', '工程', '交通', '建筑', '质量安全', '物流', '地产', '销售'] },
  { name: '数据·分析', icon: 'database', keywords: ['数据分析', '数据管理'] },
]

function categorize(profession) {
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => profession.includes(kw))) return rule.name
  }
  return '其他'
}

function getCategoryMeta(name) {
  return CATEGORY_RULES.find(r => r.name === name) || { name, icon: 'ellipsis' }
}

// ─── Process videos ──────────────────────────────────────────────
function processVideos(source) {
  const interviewVideos = source.filter(v =>
    v.title.includes('生涯人物访谈') || v.title.includes('生涯人物访谈丨') || v.title.includes('生涯人物访谈|')
  )
  return interviewVideos
    .map(v => ({
      id: v.bvid,
      title: v.title,
      profession: extractProfession(v.title),
      category: categorize(extractProfession(v.title)),
      url: v.url,
      cover: v.pic,
      length: v.length,
      play: v.play,
      comment: v.comment,
      created: v.created,
      date: formatDate(v.created),
    }))
    .sort((a, b) => b.play - a.play)
}

// ─── Initialize ──────────────────────────────────────────────────
const cached = getCached()
let initialData

if (cached && !isStale(cached.timestamp)) {
  // Fresh cache — use processed data directly
  initialData = cached.data
} else {
  // No cache or stale — process bundled JSON, then refresh in background
  initialData = processVideos(rawVideos)
  setCache(initialData)

  if (typeof window !== 'undefined') {
    // Pass rawVideos so backgroundFetch can merge with existing raw data
    setTimeout(() => backgroundFetch(rawVideos), 2000)
  }
}

export const videos = [...initialData]

// Season stats (from bundled JSON, stable)
const meta = rawVideos[0]?.meta
export const seasonStats = {
  totalViews: meta?.stat?.view ?? 0,
  totalFavorites: meta?.stat?.favorite ?? 0,
  totalShares: meta?.stat?.share ?? 0,
  totalLikes: meta?.stat?.like ?? 0,
  totalEpisodes: meta?.ep_count ?? 0,
  intro: meta?.intro ?? '',
}

export const totalPlays = rawVideos.reduce((sum, v) => sum + (v.play || 0), 0)
export const totalVideos = rawVideos.length

export const categories = [...new Set(videos.map(v => v.profession))].sort()

export function getBroadCategories() {
  const map = {}
  for (const v of videos) {
    if (!map[v.category]) map[v.category] = { name: v.category, count: 0, videos: [] }
    map[v.category].count++
    map[v.category].videos.push(v)
  }
  return Object.values(map)
    .map(c => ({ ...c, ...getCategoryMeta(c.name) }))
    .sort((a, b) => b.count - a.count)
}

export function getVideosByCategory() {
  // Topic normalization: group similar professions under broader topics
  const TOPIC_KEYWORDS = [
    { topic: '教师', keywords: ['教师', '校长', '辅导员', '教授', '老师', '生涯规划', '职业规划'] },
    { topic: '律师', keywords: ['律师'] },
    { topic: '医生', keywords: ['医生', '外科', '中医', '医学', '医疗', '医药', '医院', '护士', '南丁格尔'] },
    { topic: '心理咨询', keywords: ['心理咨询', '心理学', '心理教师'] },
    { topic: '程序员', keywords: ['程序员', '软件', '计算机', '大数据', '芯片', '人工智能', '自动驾驶', '物联网', '自动化', '互联网运营'] },
    { topic: '企业家', keywords: ['企业家', '创业', '创业者', '房地产'] },
    { topic: '金融', keywords: ['银行', '金融', '保险', '财富', '税务', '审计'] },
    { topic: '科研', keywords: ['科研', '航空科学', '学者', '博士', '科普'] },
    { topic: '记者', keywords: ['记者', '新闻', '主持', '传媒', '媒体', '宣传'] },
    { topic: '警察', keywords: ['警察'] },
    { topic: '军人', keywords: ['军人', '维和', '老兵', '军旅', '部队'] },
    { topic: '公务员', keywords: ['公务员', '驻村'] },
    { topic: '消防员', keywords: ['消防'] },
    { topic: '环保', keywords: ['环保', '再生'] },
    { topic: '诗人·作家', keywords: ['诗人', '作家', '写作'] },
    { topic: '文秘', keywords: ['文秘'] },
    { topic: '数据分析师', keywords: ['数据分析', '数据管理'] },
    { topic: '物流', keywords: ['物流'] },
    { topic: '教育公益', keywords: ['教育公益', '珍珠'] },
  ]

  function normalizeTopic(profession) {
    for (const rule of TOPIC_KEYWORDS) {
      if (rule.keywords.some(kw => profession.includes(kw))) return rule.topic
    }
    return profession
  }

  const map = {}
  for (const v of videos) {
    const topic = normalizeTopic(v.profession)
    if (!map[topic]) map[topic] = []
    map[topic].push(v)
  }
  return Object.entries(map)
    .map(([name, items]) => ({ name, count: items.length, videos: items }))
    .sort((a, b) => b.count - a.count)
}
