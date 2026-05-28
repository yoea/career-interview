import rawVideos from './videos.json'

const CACHE_KEY = 'xwzw_videos_cache'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

// ─── Cache helpers ───────────────────────────────────────────────
function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // localStorage full or unavailable, silently ignore
  }
}

// ─── Profession extraction ───────────────────────────────────────
function extractProfession(title) {
  const match = title.match(/生涯人物访谈[\s|丨|｜]+(.+?)(?:访谈录|访谈)?$/)
  return match ? match[1].trim() : title.replace(/生涯人物访谈[\s|丨|｜]*/, '').trim()
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
  const found = CATEGORY_RULES.find(r => r.name === name)
  return found || { name, icon: 'ellipsis' }
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
      date: formatDate(v.created),
    }))
    .sort((a, b) => b.play - a.play)
}

// ─── Initialize: try cache, fallback to JSON ─────────────────────
const cached = getCached()
let videoData

if (cached) {
  videoData = cached
} else {
  videoData = processVideos(rawVideos)
  setCache(videoData)
}

export const videos = videoData

// Season stats
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

// ─── Broad category groups ───────────────────────────────────────
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

// ─── Raw profession groups ───────────────────────────────────────
export function getVideosByCategory() {
  const map = {}
  for (const v of videos) {
    if (!map[v.profession]) map[v.profession] = []
    map[v.profession].push(v)
  }
  return Object.entries(map)
    .map(([name, items]) => ({ name, count: items.length, videos: items }))
    .sort((a, b) => b.count - a.count)
}
