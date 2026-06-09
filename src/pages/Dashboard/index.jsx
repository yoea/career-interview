import { useState, useEffect, useRef, useCallback } from 'react'
import { Typography, Spin, Card, Table, Tag, Segmented, Alert, ConfigProvider, theme } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye, faGlobe, faCalendarDay, faMapMarkerAlt,
  faClock, faMobileAlt,
} from '@fortawesome/free-solid-svg-icons'
import styles from './Dashboard.module.scss'

const { Title, Text } = Typography
const API = '/api/dashboard/stats'

// ─── Color Palette (Dark) ─────────────────────────────────────
const PALETTE = {
  primary: '#6c8cff',
  success: '#34d673',
  purple: '#a78bfa',
  orange: '#fbbf24',
  pink: '#f472b6',
  cyan: '#22d3ee',
}

const CHART_COLORS = ['#6c8cff', '#34d673', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c', '#2dd4bf', '#c084fc', '#f87171']
const MAP_GRADIENT = ['#1e3a5f', '#1e4d8c', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

// ─── Dark tooltip style ───────────────────────────────────────
const TOOLTIP = {
  backgroundColor: 'rgba(26, 29, 39, 0.96)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  textStyle: { color: '#e4e8ee', fontSize: 12 },
}
const GRID_DARK = { color: 'rgba(255,255,255,0.06)' }
const AXIS_LABEL = { color: '#5a6370' }
const AXIS_LINE = { lineStyle: { color: 'rgba(255,255,255,0.08)' } }

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
    { icon: faEye, label: '总访问量', value: data.total.toLocaleString(), color: PALETTE.primary, accent: PALETTE.primary },
    { icon: faGlobe, label: '独立 IP', value: data.uniqueIps.toLocaleString(), color: PALETTE.success, accent: PALETTE.success },
    { icon: faCalendarDay, label: '日均访问', value: data.dailyAvg.toLocaleString(), color: PALETTE.purple, accent: PALETTE.purple },
    { icon: faMapMarkerAlt, label: '来源省份', value: `${data.provinces} 个`, color: PALETTE.orange, accent: PALETTE.orange },
    { icon: faClock, label: '高峰时段', value: data.peakHour, color: '#f59e0b', accent: '#f59e0b' },
    { icon: faMobileAlt, label: '移动端占比', value: `${data.mobilePercent}%`, color: PALETTE.pink, accent: PALETTE.pink },
  ]

  return (
    <ConfigProvider theme={{
      algorithm: theme.darkAlgorithm,
      token: {
        colorBgContainer: '#1a1d27',
        colorBgElevated: '#1e2230',
        colorBorderSecondary: 'rgba(255,255,255,0.06)',
        colorText: '#e4e8ee',
        colorTextSecondary: '#8b95a5',
        colorTextTertiary: '#5a6370',
        borderRadius: 12,
      },
      components: {
        Card: { colorBgContainer: '#1a1d27', colorBorderSecondary: 'rgba(255,255,255,0.06)' },
        Table: { colorBgContainer: '#1a1d27', headerBg: '#151820', rowHoverBg: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' },
        Tag: { borderRadiusSM: 6 },
        Segmented: { colorBgBase: '#151820' },
      },
    }}>
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Title level={2}>数据仪表盘</Title>
          <Text className={styles.subtitle}>寻路记 · 新华生涯访谈 运营数据</Text>
        </div>

        {/* ─── Stats Cards ─── */}
        <div className={styles.statsGrid}>
          {cards.map(c => (
            <Card key={c.label} className={styles.statCard} style={{ '--accent': c.accent }}>
              <div className={styles.statIcon} style={{ background: c.color + '14', color: c.color }}>
                <FontAwesomeIcon icon={c.icon} />
              </div>
              <div className={styles.statValue}>{c.value}</div>
              <div className={styles.statLabel}>{c.label}</div>
            </Card>
          ))}
        </div>

        {/* ─── Daily Visits Chart ─── */}
        <Card title="每日访问量" className={styles.chartCard}
          extra={<Segmented options={[{ label: '近7天', value: 7 }, { label: '近30天', value: 30 }, { label: '全部', value: 0 }]} value={dailyRange} onChange={setDailyRange} />}>
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

        {/* ─── Device Type (horizontal bar) ─── */}
        <Card title="设备类型" className={styles.deviceCard}>
          <div className={styles.deviceBarBox}>
            {echartsReady && <DeviceBarChart data={data.devices} />}
          </div>
        </Card>

        {/* ─── Browser + OS (side by side) ─── */}
        <div className={styles.uaRow}>
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
              { title: '排名', render: (_, __, i) => <Tag color={i < 3 ? 'blue' : undefined} style={{ borderRadius: 6, fontWeight: 600 }}>{i + 1}</Tag>, width: 60 },
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
              { title: '排名', render: (_, __, i) => <Tag color={i < 3 ? 'red' : undefined} style={{ borderRadius: 6, fontWeight: 600 }}>{i + 1}</Tag>, width: 60 },
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
    </ConfigProvider>
  )
}

// ─── Chart Sub-components ─────────────────────────────────────
function DailyChart({ data, days }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!elRef.current || !window.echarts) return
    if (!chartRef.current) chartRef.current = window.echarts.init(elRef.current)
    const slice = days === 0 ? data : data.slice(-days)
    const isMobile = window.innerWidth <= 576
    chartRef.current.setOption({
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        formatter: p => `${p[0].axisValue}<br/>访问量: <b style="color:${PALETTE.primary}">${p[0].value}</b>`,
      },
      grid: isMobile
        ? { left: 36, right: 10, top: 10, bottom: 30 }
        : { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: slice.map(d => d.date.slice(5)),
        axisLabel: { fontSize: isMobile ? 9 : 11, ...AXIS_LABEL },
        axisLine: AXIS_LINE,
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { fontSize: isMobile ? 9 : 12, ...AXIS_LABEL },
        splitLine: { lineStyle: GRID_DARK },
      },
      series: [{
        type: 'line',
        data: slice.map(d => d.count),
        smooth: true,
        symbol: 'circle',
        symbolSize: isMobile ? 4 : 6,
        showSymbol: slice.length <= 14,
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: PALETTE.primary + '28' },
              { offset: 1, color: PALETTE.primary + '03' },
            ],
          },
        },
        itemStyle: { color: PALETTE.primary, borderWidth: 2, borderColor: '#1a1d27' },
        lineStyle: { width: isMobile ? 2 : 2.5, color: PALETTE.primary },
      }],
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
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        formatter: p => `${p[0].axisValue}<br/>访问量: <b style="color:${PALETTE.purple}">${p[0].value}</b>`,
      },
      grid: isMobile
        ? { left: 36, right: 10, top: 10, bottom: 30 }
        : { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.hour),
        axisLabel: { fontSize: isMobile ? 8 : 10, interval: isMobile ? 5 : 2, ...AXIS_LABEL },
        axisLine: AXIS_LINE,
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { fontSize: isMobile ? 9 : 12, ...AXIS_LABEL },
        splitLine: { lineStyle: GRID_DARK },
      },
      series: [{
        type: 'bar',
        data: data.map(d => d.count),
        barWidth: isMobile ? '40%' : '50%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: PALETTE.purple },
              { offset: 1, color: PALETTE.purple + '88' },
            ],
          },
        },
      }],
    }, true)
  }, [data])

  useEffect(() => {
    const ro = () => chartRef.current?.resize()
    window.addEventListener('resize', ro)
    return () => { window.removeEventListener('resize', ro); chartRef.current?.dispose(); chartRef.current = null }
  }, [])

  return <div ref={elRef} className={styles.chartInner} />
}

function PieChart({ data }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!elRef.current || !window.echarts || !data?.length) return
    if (!chartRef.current) chartRef.current = window.echarts.init(elRef.current)
    const isMobile = window.innerWidth <= 576
    chartRef.current.setOption({
      tooltip: {
        ...TOOLTIP,
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: isMobile
        ? { orient: 'horizontal', bottom: 0, left: 'center', textStyle: { fontSize: 10, color: '#8b95a5' }, itemWidth: 10, itemHeight: 10, itemGap: 8 }
        : { orient: 'vertical', right: 12, top: 'center', textStyle: { fontSize: 11, color: '#8b95a5' }, itemWidth: 10, itemHeight: 10 },
      color: CHART_COLORS,
      series: [{
        type: 'pie',
        radius: ['40%', '68%'],
        center: isMobile ? ['50%', '42%'] : ['38%', '50%'],
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#e4e8ee' },
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.4)' },
        },
        itemStyle: { borderColor: '#1a1d27', borderWidth: 2 },
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
      tooltip: {
        ...TOOLTIP,
        trigger: 'item',
        formatter: p => `${p.name}<br/>访问量: <b style="color:${PALETTE.primary}">${p.value || 0}</b>`,
      },
      visualMap: {
        min: 0, max: maxVal, left: 10, bottom: 20,
        text: ['高', '低'], calculable: true,
        inRange: { color: MAP_GRADIENT },
        textStyle: { fontSize: 12, color: '#8b95a5' },
      },
      series: [{
        type: 'map', map: 'china', roam: true,
        label: { show: true, fontSize: 9, color: '#5a6370' },
        emphasis: {
          label: { fontSize: 12, color: '#e4e8ee', fontWeight: 'bold' },
          itemStyle: { areaColor: '#2563eb' },
        },
        itemStyle: { borderColor: '#2a2d3a', borderWidth: 1 },
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

function DeviceBarChart({ data }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!elRef.current || !window.echarts || !data?.length) return
    if (!chartRef.current) chartRef.current = window.echarts.init(elRef.current)
    const isMobile = window.innerWidth <= 576
    const sorted = [...data].sort((a, b) => a.value - b.value)

    chartRef.current.setOption({
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: p => {
          const d = p[0]
          const pct = ((d.value / data.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1)
          return `${d.name}<br/>访问量: <b style="color:${PALETTE.cyan}">${d.value}</b>（${pct}%）`
        },
      },
      grid: {
        left: isMobile ? 60 : 80,
        right: isMobile ? 40 : 60,
        top: 8,
        bottom: 8,
        containLabel: false,
      },
      xAxis: {
        type: 'value',
        axisLabel: { show: false },
        axisLine: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: sorted.map(d => d.name),
        axisLabel: {
          fontSize: isMobile ? 11 : 13,
          color: '#8b95a5',
          fontWeight: 500,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        data: sorted.map(d => d.value),
        barWidth: isMobile ? 16 : 22,
        barCategoryGap: '30%',
        label: {
          show: true,
          position: 'right',
          formatter: p => {
            const pct = ((p.value / data.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1)
            return `${p.value}  ${pct}%`
          },
          fontSize: isMobile ? 10 : 12,
          color: '#8b95a5',
          fontWeight: 500,
        },
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: PALETTE.cyan + '66' },
              { offset: 1, color: PALETTE.cyan },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: PALETTE.cyan + 'aa' },
                { offset: 1, color: '#06b6d4' },
              ],
            },
          },
        },
        backgroundStyle: {
          color: 'rgba(255,255,255,0.04)',
          borderRadius: [0, 6, 6, 0],
        },
        showBackground: true,
      }],
    }, true)
  }, [data])

  useEffect(() => {
    const ro = () => chartRef.current?.resize()
    window.addEventListener('resize', ro)
    return () => { window.removeEventListener('resize', ro); chartRef.current?.dispose(); chartRef.current = null }
  }, [])

  return <div ref={elRef} className={styles.deviceBarInner} />
}
