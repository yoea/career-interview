/**
 * Visit tracking module - PostgreSQL
 */
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'career_interview',
  user: 'root',
  password: 'Password123@postgres',
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
