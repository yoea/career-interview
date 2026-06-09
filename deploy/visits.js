/**
 * Visit tracking module - PostgreSQL
 */
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'career_interview',
  user: 'career_interview',
  password: 'FsH2rkcfv8jFtRHNs',
  max: 5,
  idleTimeoutMillis: 30000,
})

// Init table (idempotent)
pool.query(`
  CREATE TABLE IF NOT EXISTS visits (
    id BIGSERIAL PRIMARY KEY,
    ip VARCHAR(45),
    ua TEXT,
    route VARCHAR(500),
    referer TEXT,
    method VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at);
  CREATE INDEX IF NOT EXISTS idx_visits_route ON visits(route);
`).catch(err => console.error('Visit table init error:', err.message))

/**
 * Record a visit
 */
export async function recordVisit({ ip, ua, route, referer, method }) {
  try {
    await pool.query(
      'INSERT INTO visits (ip, ua, route, referer, method) VALUES ($1, $2, $3, $4, $5)',
      [ip, ua, route, referer, method]
    )
  } catch (err) {
    console.error('recordVisit error:', err.message)
  }
}

/**
 * Get total visit count
 */
export async function getVisitCount() {
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM visits')
    return result.rows[0].count
  } catch (err) {
    console.error('getVisitCount error:', err.message)
    return 0
  }
}

/**
 * Get all visits (for dashboard aggregation)
 */
export async function getAllVisits() {
  try {
    const result = await pool.query(
      'SELECT ip, ua, route, created_at FROM visits ORDER BY created_at ASC'
    )
    return result.rows
  } catch (err) {
    console.error('getAllVisits error:', err.message)
    return []
  }
}

/**
 * IP geolocation cache (persistent in DB)
 */
await pool.query(`
  CREATE TABLE IF NOT EXISTS ip_geo (
    ip VARCHAR(45) PRIMARY KEY,
    province VARCHAR(50),
    city VARCHAR(50),
    isp TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(err => console.error('ip_geo table init error:', err.message))

const PROVINCE_MAP = {
  '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
  '河北': '河北省', '山西': '山西省', '辽宁': '辽宁省', '吉林': '吉林省',
  '黑龙江': '黑龙江省', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
  '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
  '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '海南': '海南省',
  '四川': '四川省', '贵州': '贵州省', '云南': '云南省', '陕西': '陕西省',
  '甘肃': '甘肃省', '青海': '青海省', '台湾': '台湾省',
  '内蒙古': '内蒙古自治区', '广西': '广西壮族自治区', '西藏': '西藏自治区',
  '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区',
  '香港': '香港特别行政区', '澳门': '澳门特别行政区',
}

function normalizeProvince(name) {
  return PROVINCE_MAP[name] || name
}

export async function getIpGeo(ip) {
  try {
    const r = await pool.query('SELECT * FROM ip_geo WHERE ip = $1', [ip])
    return r.rows[0] || null
  } catch { return null }
}

export async function getBulkIpGeo(ips) {
  if (!ips.length) return {}
  try {
    const r = await pool.query('SELECT * FROM ip_geo WHERE ip = ANY($1)', [ips])
    const map = {}
    for (const row of r.rows) map[row.ip] = row
    return map
  } catch { return {} }
}

export async function saveIpGeo(entries) {
  if (!entries.length) return
  try {
    for (const e of entries) {
      await pool.query(
        `INSERT INTO ip_geo (ip, province, city, isp, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (ip) DO UPDATE SET province=$2, city=$3, isp=$4, updated_at=NOW()`,
        [e.ip, e.province, e.city, e.isp]
      )
    }
  } catch (err) {
    console.error('saveIpGeo error:', err.message)
  }
}
