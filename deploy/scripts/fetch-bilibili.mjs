/**
 * Bilibili video data fetcher
 * Fetches video details from Bilibili API and saves to local JSON
 *
 * Usage: node deploy/scripts/fetch-bilibili.mjs
 * Run periodically (e.g., weekly cron) to update video data
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_DATA = path.join(__dirname, '../../public/data/videos.json')

const MID = 395341214       // 新华教育基金会 UID
const SEASON_ID = 131230    // 合集 ID
const DELAY_MS = 1500        // 1.5s between requests to avoid rate limiting

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'referer': 'https://www.bilibili.com',
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  const data = await res.json()
  if (data.code !== 0) throw new Error(`API error ${data.code}: ${data.message}`)
  return data.data
}

// Step 1: Get all AIDs in the season
async function getSeasonAids() {
  const aids = []
  let page = 1
  while (true) {
    const url = `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=${MID}&season_id=${SEASON_ID}&sort_reverse=false&page_num=${page}&page_size=100`
    const data = await fetchJSON(url)
    if (!data.aids || data.aids.length === 0) break
    aids.push(...data.aids)
    if (data.aids.length < 100) break
    page++
    await sleep(DELAY_MS)
  }
  return aids
}

// Step 2: Fetch detail for each video
async function fetchVideoDetail(aid) {
  const url = `https://api.bilibili.com/x/web-interface/view?aid=${aid}`
  const v = await fetchJSON(url)
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

// Step 3: Fetch season meta
async function fetchSeasonMeta() {
  // Use the first video's detail to get season info
  const url = `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=${MID}&season_id=${SEASON_ID}&sort_reverse=false&page_num=1&page_size=1`
  const data = await fetchJSON(url)
  return {
    id: SEASON_ID,
    title: '新华生涯教育 | 生涯人物访谈系列',
    mid: MID,
    intro: '一群西北、西南地区的高中生，在爱心捐方的支持下，由学校老师带领，采访各行各业的职场人士，主动规划自己的未来！',
    ep_count: data.meta?.ep_count || data.aids?.length || 0,
    ep_num: data.meta?.ep_num || data.aids?.length || 0,
  }
}

async function main() {
  console.log('Fetching season AIDs...')
  const aids = await getSeasonAids()
  console.log(`Found ${aids.length} videos in season ${SEASON_ID}`)

  // Load existing data to avoid re-fetching unchanged videos
  let existing = []
  if (fs.existsSync(FRONTEND_DATA)) {
    existing = JSON.parse(fs.readFileSync(FRONTEND_DATA, 'utf-8'))
  }
  const existingMap = new Map(existing.map(v => [v.aid, v]))

  const results = []
  let fetched = 0
  let cached = 0

  for (const aid of aids) {
    if (existingMap.has(aid)) {
      // Re-fetch to update play/comment counts
      try {
        const detail = await fetchVideoDetail(aid)
        // Merge: keep existing meta, update dynamic fields
        const old = existingMap.get(aid)
        results.push({
          ...old,
          play: detail.play,
          comment: detail.comment,
          // Update pic/url in case they changed
          pic: detail.pic,
          url: detail.url,
        })
        fetched++
        process.stdout.write(`\r  [${fetched + cached}/${aids.length}] Updated: ${detail.title.substring(0, 30)}...`)
      } catch (e) {
        // If rate limited, keep existing data
        results.push(existingMap.get(aid))
        cached++
        process.stdout.write(`\r  [${fetched + cached}/${aids.length}] Cached (error: ${e.message.substring(0, 40)})`)
      }
      await sleep(DELAY_MS)
    } else {
      // New video, fetch full detail
      try {
        const detail = await fetchVideoDetail(aid)
        results.push(detail)
        fetched++
        process.stdout.write(`\r  [${fetched + cached}/${aids.length}] New: ${detail.title.substring(0, 30)}...`)
      } catch (e) {
        console.error(`\n  Failed to fetch aid=${aid}: ${e.message}`)
      }
      await sleep(DELAY_MS)
    }
  }

  // Fetch season meta from first page
  let seasonMeta
  try {
    seasonMeta = await fetchSeasonMeta()
  } catch {
    seasonMeta = existing[0]?.meta || {}
  }

  // Attach meta to each video
  const output = results.map(v => ({ ...v, meta: seasonMeta }))

  fs.writeFileSync(FRONTEND_DATA, JSON.stringify(output, null, 2))

  console.log(`\n\nDone! ${output.length} videos saved.`)
  console.log(`  Data: ${FRONTEND_DATA}`)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
