import { useState, useMemo } from 'react'
import { Typography, Input, Segmented } from 'antd'
import { getVideosByCategory } from '../../data/videos'
import styles from './Topics.module.scss'

const { Title, Paragraph } = Typography
const { Search } = Input

const tagColors = [
  '#1677ff', '#52c41a', '#eb2f96', '#faad14', '#722ed1',
  '#13c2c2', '#f5222d', '#2f54eb', '#fa8c16', '#1890ff',
  '#a0d911', '#08979c', '#9254de', '#cf1322', '#d4380d',
]

export default function Topics() {
  const allTopics = useMemo(() => getVideosByCategory(), [])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('count') // 'count' | 'name'

  const maxCount = allTopics[0]?.count || 1
  const minCount = 1

  const filtered = useMemo(() => {
    let list = allTopics
    if (search) {
      list = list.filter(t => t.name.includes(search))
    }
    if (sort === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    }
    // default is already sorted by count desc
    return list
  }, [allTopics, search, sort])

  // Map count → font size (14px ~ 42px)
  function getFontSize(count) {
    if (maxCount === minCount) return 24
    const ratio = (count - minCount) / (maxCount - minCount)
    return 14 + ratio * 28
  }

  function getColor(i) {
    return tagColors[i % tagColors.length]
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Title level={2}>热门话题</Title>
          <Paragraph className={styles.subtitle}>
            {allTopics.length} 个职业话题，气泡越大代表访谈越多
          </Paragraph>
        </div>

        <div className={styles.toolbar}>
          <Search
            placeholder="搜索话题..."
            allowClear
            className={styles.search}
            onSearch={setSearch}
            onChange={e => { if (!e.target.value) setSearch('') }}
          />
          <Segmented
            options={[
              { label: '按热度', value: 'count' },
              { label: '按名称', value: 'name' },
            ]}
            value={sort}
            onChange={setSort}
          />
        </div>

        <div className={styles.cloud}>
          {filtered.map((topic, i) => (
            <a
              key={topic.name}
              href="/interviews"
              className={styles.tag}
              style={{
                fontSize: `${getFontSize(topic.count)}px`,
                color: getColor(i),
                opacity: 0.65 + (topic.count / maxCount) * 0.35,
              }}
            >
              {topic.name}
              <span className={styles.tagCount}>{topic.count}</span>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>没有匹配的话题</div>
        )}
      </div>
    </div>
  )
}
