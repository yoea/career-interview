import { useState, useEffect, useRef, useCallback } from 'react'
import { Typography, Spin, Card, Table, Tag, Segmented, Alert, message } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye, faGlobe, faCalendarDay, faMapMarkerAlt,
  faClock, faMobileAlt, faExclamationTriangle, faSync,
} from '@fortawesome/free-solid-svg-icons'
import styles from './Dashboard.module.scss'

const { Title, Text } = Typography
const API = '/api/dashboard/stats'

// ─── ECharts loader ───────────────────────────────────────────
const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js'
const CHINA_CDN = '/china.json'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = () => reject(new Error(`Failed: ${src}`))
    document.head.appendChild(s)
  })
}

function initChart(el, option, deps) {
  const chartRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!el || !window.echarts) return
    const c = window.echarts.init(el, null, { renderer: 'canvas' })
    chartRef.current = c
    c.setOption(option)
    const ro = () => c.resize()
    window.addEventListener('resize', ro)
    return () => { window.removeEventListener('resize', ro); c.dispose(); chartRef.current = null }
  }, deps)

  return chartRef
}

// ─── Main Component ───────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dailyRange, setDailyRange] = useState(7)
  const [echartsReady, setEchartsReady] = useState(false)
  const [chinaRegistered, setChinaRegistered] = useState(false)

  useEffect(() => {
    loadScript(ECHARTS_CDN).then(() => setEchartsReady(true)).catch(() => {})
    fetch(API)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const loadChinaMap = useCallback(async () => {
    if (chinaRegistered || !window.echarts) return
    try {
      const r = await fetch(CHINA_CDN)
      const geo = await r.json()
      window.echarts.registerMap('china', geo)
      setChinaRegistered(true)
    } catch (e) { console.warn('Failed to load China map:', e) }
  }, [chinaRegistered])

  useEffect(() => { if (echartsReady && data) loadChinaMap() }, [echartsReady, data])

  if (loading) return <div className={styles.loading}><Spin size="large" /></div>
  if (error) return <div className={styles.page}><Alert type="error" message="加载失败" description={error} showIcon /></div>
  if (!data) return null

  const cards = [
    { icon: faEye, label: '总访问量', value: data.total.toLocaleString(), color: '#1677ff' },
    { icon: faGlobe, label: '独立 IP', value: data.uniqueIps.toLocaleString(), color: '#52c41a' },
    { icon: faCalendarDay, label: '日均访问', value: data.dailyAvg.toLocaleString(), color: '#722ed1' },
    { icon: faMapMarkerAlt, label: '来源省份', value: `${data.provinces} 个`, color: '#fa541c' },
    { icon: faClock, label: '高峰时段', value: data.peakHour, color: '#faad14' },
    { icon: faMobileAlt, label: '移动端占比', value: `${data.mobilePercent}%`, color: '#eb2f96' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Title level={2}>数据仪表盘</Title>
          <Text className={styles.subtitle}>寻路记 · 新华生涯访谈 运营数据</Text>
        </div>

        {/* ─── Stats Cards ─── */}
        <div className={styles.statsGrid}>
          {cards.map(c => (
            <Card key={c.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: c.color + '18', color: c.color }}>
                <FontAwesomeIcon icon={c.icon} />
              </div>
              <div className={styles.statValue}>{c.value}</div>
              <div className={styles.statLabel}>{c.label}</div>
            </Card>
          ))}
        </div>

        {/* ─── Daily Visits Chart ─── */}
        <Card title="每日访问量" className={styles.chartCard}
          extra={<Segmented options={[{ label: '近7天', value: 7 }, { label: '近30天', value: 30 }]} value={dailyRange} onChange={setDailyRange} />}>
          <div className={styles.chartBox}>
            {echartsReady && <DailyChart data={data.daily} days={dailyRange} />}
          </div>
        </Card>

        {/* ─── Hourly Chart ─── */}
        <Card title="近 24 小时访问量" className={styles.chartCard}>
          <div className={styles.chartBox}>
            {echartsReady && <HourlyChart data={data.hourly24} />}
          </div>
        </Card>

        {/* ─── UA Pie Charts ─── */}
        <div className={styles.pieRow}>
          <Card title="设备类型" className={styles.pieCard}>
            <div className={styles.pieBox}>
              {echartsReady && <PieChart data={data.devices} />}
            </div>
          </Card>
          <Card title="浏览器" className={styles.pieCard}>
            <div className={styles.pieBox}>
              {echartsReady && <PieChart data={data.browsers} />}
            </div>
          </Card>
          <Card title="操作系统" className={styles.pieCard}>
            <div className={styles.pieBox}>
              {echartsReady && <PieChart data={data.os} />}
            </div>
          </Card>
        </div>

        {/* ─── Route Stats Table ─── */}
        <Card title="一级路由访问量 TOP10" className={styles.tableCard}>
          <Table dataSource={data.routeStats} rowKey="route" pagination={false} size="small"
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '排名', render: (_, __, i) => <Tag color={i < 3 ? 'blue' : undefined}>{i + 1}</Tag>, width: 60 },
              { title: '路由', dataIndex: 'route' },
              { title: '访问量', dataIndex: 'hits', sorter: (a, b) => a.hits - b.hits, defaultSortOrder: 'descend' },
              { title: '占比', render: (_, r) => `${(r.hits / data.total * 100).toFixed(1)}%` },
            ]} />
        </Card>

        {/* ─── Top IPs Table ─── */}
        <Card title="访问量 TOP10 IP" className={styles.tableCard}>
          <Table dataSource={data.topIps.slice(0, 10)} rowKey="ip" pagination={false} size="small"
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '排名', render: (_, __, i) => <Tag color={i < 3 ? 'red' : undefined}>{i + 1}</Tag>, width: 60 },
              { title: 'IP', dataIndex: 'ip' },
              { title: '访问量', dataIndex: 'count', sorter: (a, b) => a.count - b.count, defaultSortOrder: 'descend' },
              { title: '省份', dataIndex: 'province', render: v => v || '-' },
              { title: '城市', dataIndex: 'city', render: v => v || '-' },
              { title: '运营商', dataIndex: 'isp', render: v => v || '-' },
            ]} />
        </Card>

        {/* ─── Province Section ─── */}
        <Card title="访问来源省份" className={styles.tableCard}>
          <Table dataSource={data.provinceStats} rowKey="province" pagination={false} size="small"
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '排名', render: (_, __, i) => i + 1, width: 60 },
              { title: '省份', dataIndex: 'province' },
              { title: '访问量', dataIndex: 'count', sorter: (a, b) => a.count - b.count, defaultSortOrder: 'descend' },
              { title: '占比', render: (_, r) => {
                const total = data.provinceStats.reduce((s, p) => s + p.count, 0)
                return `${(r.count / total * 100).toFixed(1)}%`
              }},
            ]} />
        </Card>
        <Card title="访问量地图" className={styles.mapCard}>
          <div className={styles.mapBox}>
            {echartsReady && chinaRegistered && <ProvinceMap data={data.provinceStats} />}
            {echartsReady && !chinaRegistered && <div className={styles.mapLoading}>地图加载中...</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Chart Sub-components ─────────────────────────────────────
function DailyChart({ data, days }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!elRef.current || !window.echarts) return
    if (!chartRef.current) chartRef.current = window.echarts.init(elRef.current)
    const slice = data.slice(-days)
    const isMobile = window.innerWidth <= 576
    chartRef.current.setOption({
      tooltip: { trigger: 'axis', formatter: p => `${p[0].axisValue}<br/>访问量: <b>${p[0].value}</b>` },
      grid: isMobile
        ? { left: 36, right: 10, top: 10, bottom: 30 }
        : { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: slice.map(d => d.date.slice(5)), axisLabel: { fontSize: isMobile ? 9 : 11 } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: isMobile ? 9 : 12 } },
      series: [{ type: 'line', data: slice.map(d => d.count), smooth: true, areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#1677ff' }, lineStyle: { width: isMobile ? 1.5 : 2.5 } }],
    }, true)
  }, [data, days])

  useEffect(() => {
    const ro = () => chartRef.current?.resize()
    window.addEventListener('resize', ro)
    return () => { window.removeEventListener('resize', ro); chartRef.current?.dispose(); chartRef.current = null }
  }, [])

  return <div ref={elRef} className={styles.chartInner} />
}

function HourlyChart({ data }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!elRef.current || !window.echarts) return
    if (!chartRef.current) chartRef.current = window.echarts.init(elRef.current)
    const isMobile = window.innerWidth <= 576
    chartRef.current.setOption({
      tooltip: { trigger: 'axis', formatter: p => `${p[0].axisValue}<br/>访问量: <b>${p[0].value}</b>` },
      grid: isMobile
        ? { left: 36, right: 10, top: 10, bottom: 30 }
        : { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: data.map(d => d.hour), axisLabel: { fontSize: isMobile ? 8 : 10, interval: isMobile ? 5 : 2 } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: isMobile ? 9 : 12 } },
      series: [{ type: 'bar', data: data.map(d => d.count), itemStyle: { color: '#722ed1', borderRadius: [3, 3, 0, 0] } }],
    }, true)
  }, [data])

  useEffect(() => {
    const ro = () => chartRef.current?.resize()
    window.addEventListener('resize', ro)
    return () => { window.removeEventListener('resize', ro); chartRef.current?.dispose(); chartRef.current = null }
  }, [])

  return <div ref={elRef} className={styles.chartInner} />
}

const PIE_COLORS = ['#1677ff', '#52c41a', '#fa541c', '#722ed1', '#faad14', '#eb2f96', '#13c2c2', '#2f54eb', '#a0d911', '#f5222d']

function PieChart({ data }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!elRef.current || !window.echarts || !data?.length) return
    if (!chartRef.current) chartRef.current = window.echarts.init(elRef.current)
    const isMobile = window.innerWidth <= 576
    chartRef.current.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: isMobile
        ? { orient: 'horizontal', bottom: 0, left: 'center', textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 10 }
        : { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11 } },
      color: PIE_COLORS,
      series: [{
        type: 'pie', radius: ['35%', '65%'],
        center: isMobile ? ['50%', '42%'] : ['40%', '50%'],
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
        data: data.map(d => ({ name: d.name, value: d.value })),
      }],
    }, true)
  }, [data])

  useEffect(() => {
    const ro = () => chartRef.current?.resize()
    window.addEventListener('resize', ro)
    return () => { window.removeEventListener('resize', ro); chartRef.current?.dispose(); chartRef.current = null }
  }, [])

  return <div ref={elRef} className={styles.pieInner} />
}

function ProvinceMap({ data }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!elRef.current || !window.echarts || !data?.length) return
    if (!chartRef.current) chartRef.current = window.echarts.init(elRef.current)

    const maxVal = Math.max(...data.map(d => d.count), 1)
    chartRef.current.setOption({
      tooltip: { trigger: 'item', formatter: p => `${p.name}<br/>访问量: <b>${p.value || 0}</b>` },
      visualMap: {
        min: 0, max: maxVal, left: 10, bottom: 20,
        text: ['高', '低'], calculable: true,
        inRange: { color: ['#50e3c2', '#4fc3f7', '#42a5f5', '#5c6bc0', '#ab47bc', '#ef5350', '#d32f2f'] },
        textStyle: { fontSize: 12 },
      },
      series: [{
        type: 'map', map: 'china', roam: true,
        label: { show: true, fontSize: 9, color: '#333' },
        emphasis: { label: { fontSize: 12, color: '#000' }, itemStyle: { areaColor: '#ffd666' } },
        data: data.map(d => ({ name: d.province, value: d.count })),
      }],
    }, true)
  }, [data])

  useEffect(() => {
    const ro = () => chartRef.current?.resize()
    window.addEventListener('resize', ro)
    return () => { window.removeEventListener('resize', ro); chartRef.current?.dispose(); chartRef.current = null }
  }, [])

  return <div ref={elRef} className={styles.mapInner} />
}
