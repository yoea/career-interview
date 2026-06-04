import TOPIC_KEYWORDS from '../config/topics.json'
import CATEGORY_RULES from '../config/categories.json'

const CACHE_KEY = 'xwzw_videos_cache_v3'
const FETCH_INTERVAL = 10 * 60 * 1000 // 10 minutes
const API_BASE = '/api/bili'
const SEASON_ID = 131230
const MID = 395341214

// ─── Cache helpers ───────────────────────────────────────────────
function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    // Validate: must be array with expected fields (including topic)
    if (!Array.isArray(data) || !data[0]?.profession || !data[0]?.topic) {
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

// ─── Fetch videos.json from public ───────────────────────────────
async function fetchLocalVideos() {
  const res = await fetch('/data/videos.json')
  if (!res.ok) throw new Error(`Failed to fetch videos.json: ${res.status}`)
  return res.json()
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
    pic: v.pic.replace(/^http:\/\//, 'https://'),
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
// TOPIC_KEYWORDS loaded from src/config/topics.json

function normalizeTopic(profession) {
  for (const rule of TOPIC_KEYWORDS) {
    if (rule.keywords.some(kw => profession.includes(kw))) return rule.topic
  }
  return profession
}

function processVideos(source) {
  const interviewVideos = source.filter(v =>
    v.title.includes('生涯人物访谈') || v.title.includes('生涯人物访谈丨') || v.title.includes('生涯人物访谈|')
  )
  return interviewVideos
    .map(v => ({
      id: v.bvid,
      title: v.title,
      profession: extractProfession(v.title),
      topic: normalizeTopic(extractProfession(v.title)),
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
let rawVideos = []
export const videos = []
export let loading = true

// Simple pub/sub for video updates
const listeners = new Set()
function notifyListeners() {
  listeners.forEach(fn => fn())
}
export function onVideosUpdate(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Always fetch from public JSON
;(async () => {
  try {
    rawVideos = await fetchLocalVideos()
    const processed = processVideos(rawVideos)
    videos.length = 0
    videos.push(...processed)
    updateDerived()
    notifyListeners()
  } catch (e) {
    console.warn('[data] Failed to fetch videos.json:', e.message)
  } finally {
    loading = false
    notifyListeners()
  }

  // Background refresh from Bilibili API
  if (typeof window !== 'undefined') {
    setTimeout(() => backgroundFetch(rawVideos), 2000)
  }
})()

// Season stats (from rawVideos, updated after fetch)
export const seasonStats = {
  totalViews: 0,
  totalFavorites: 0,
  totalShares: 0,
  totalLikes: 0,
  totalEpisodes: 0,
  intro: '',
}

// Will be updated after rawVideos loads
function updateStats() {
  const meta = rawVideos[0]?.meta
  if (meta) {
    seasonStats.totalViews = meta.stat?.view ?? 0
    seasonStats.totalFavorites = meta.stat?.favorite ?? 0
    seasonStats.totalShares = meta.stat?.share ?? 0
    seasonStats.totalLikes = meta.stat?.like ?? 0
    seasonStats.totalEpisodes = meta.ep_count ?? 0
    seasonStats.intro = meta.intro ?? ''
  }
}

export let totalPlays = 0
export let totalVideos = 0
export let categories = []

// Update after videos load
function updateDerived() {
  totalPlays = rawVideos.reduce((sum, v) => sum + (v.play || 0), 0)
  totalVideos = rawVideos.length
  categories = [...new Set(videos.map(v => v.profession))].sort()
}

export function getBroadCategories() {
  const map = {}
  for (const v of videos) {
    if (!map[v.category]) map[v.category] = { name: v.category, count: 0, videos: [] }
    map[v.category].count++
    map[v.category].videos.push(v)
  }
  return Object.values(map)
    .map(c => ({ ...c, ...getCategoryMeta(c.name) }))
    .sort((a, b) => {
      if (a.name === '其他') return 1
      if (b.name === '其他') return -1
      return b.count - a.count
    })
}

export function getVideosByCategory() {
  const map = {}
  for (const v of videos) {
    if (!map[v.topic]) map[v.topic] = []
    map[v.topic].push(v)
  }
  return Object.entries(map)
    .map(([name, items]) => ({ name, count: items.length, videos: items }))
    .sort((a, b) => b.count - a.count)
}
