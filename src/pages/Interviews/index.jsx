import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography, Card, Row, Col, Tag, Input, Button, Select, Segmented, Pagination, Spin } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faPlay, faComment, faArrowDownWideShort, faSearch } from '@fortawesome/free-solid-svg-icons'
import { videos, formatPlayCount, loading, onVideosUpdate } from '../../services/videos.service'
import styles from './Interviews.module.scss'

const { Title, Paragraph } = Typography

const PAGE_SIZE = 12

export default function Interviews() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlCategory = searchParams.get('category')
  const urlBroad = searchParams.get('broad')
  const urlTopic = searchParams.get('topic')

  const [search, setSearch] = useState('')
  // If URL has broad category, don't set specific category filter
  const [category, setCategory] = useState(urlBroad ? null : (urlCategory || null))
  const [broadFilter] = useState(urlBroad || null)
  const [topicFilter] = useState(urlTopic || null)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [videoList, setVideoList] = useState([...videos])

  // Subscribe to video updates
  useEffect(() => onVideosUpdate(() => setVideoList([...videos])), [])

  const filtered = videoList.filter(v => {
    const matchSearch = !search || v.title.includes(search) || v.profession.includes(search)
    const matchCategory = !category || v.category === category
    const matchBroad = !broadFilter || v.category === broadFilter
    const matchTopic = !topicFilter || v.topic === topicFilter
    return matchSearch && matchCategory && matchBroad && matchTopic
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'newest') return b.created - a.created
    if (sort === 'play') return b.play - a.play
    if (sort === 'title') return a.title.localeCompare(b.title, 'zh')
    return 0
  })

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCategoryChange = (val) => {
    setCategory(val)
    setPage(1)
    // Clear broad filter when user manually selects a category
    if (val) {
      setSearchParams({ category: val })
    } else {
      setSearchParams({})
    }
  }

  const headerTitle = topicFilter
    ? `${topicFilter} · 访谈内容`
    : broadFilter
      ? `${broadFilter} · 访谈内容`
      : category
        ? `${category} · 访谈内容`
        : '访谈内容'

  const headerSub = topicFilter
    ? `共 ${filtered.length} 期「${topicFilter}」相关访谈`
    : broadFilter
      ? `共 ${filtered.length} 期「${broadFilter}」相关访谈`
      : category
        ? `共 ${filtered.length} 期「${category}」相关访谈`
        : `共 ${videoList.length} 期访谈`

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.loading}>
            <Spin size="large" />
            <Paragraph className={styles.loadingText}>加载中...</Paragraph>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Title level={2}>{headerTitle}</Title>
          <Paragraph className={styles.subtitle}>{headerSub}</Paragraph>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchGroup}>
            <Input
              placeholder="搜索访谈标题或职业..."
              allowClear
              className={styles.searchInput}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              onPressEnter={() => setPage(1)}
            />
            <Button
              type="primary"
              icon={<FontAwesomeIcon icon={faSearch} />}
              className={styles.searchBtn}
              onClick={() => setPage(1)}
            />
          </div>
          <Select
            placeholder="筛选职业分类"
            allowClear
            className={styles.select}
            value={category}
            options={[...new Set(videoList.map(v => v.category))].sort().map(c => ({ label: c, value: c }))}
            onChange={handleCategoryChange}
            popupMatchSelectWidth={false}
          />
          <Segmented
            className={styles.sort}
            value={sort}
            onChange={v => { setSort(v); setPage(1) }}
            options={[
              { label: '最新', value: 'newest' },
              { label: '最热', value: 'play' },
              { label: '名称', value: 'title' },
            ]}
          />
        </div>

        <Row gutter={[24, 24]}>
          {paged.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={8}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                <Card hoverable className={styles.card} cover={
                  <div className={styles.cover}>
                    <img
                      src={item.cover}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className={styles.duration}>{item.length}</span>
                    <div className={styles.overlayTags}>
                      <Tag color="green" className={styles.overlayTag}>{item.category}</Tag>
                    </div>
                  </div>
                }>
                  <Title level={5} className={styles.cardTitle} title={item.title}>{item.title}</Title>
                  <div className={styles.cardMeta}>
                    <span><FontAwesomeIcon icon={faPlay} /> {formatPlayCount(item.play)}</span>
                    <span><FontAwesomeIcon icon={faComment} /> {item.comment}</span>
                    <span><FontAwesomeIcon icon={faClock} /> {item.date}</span>
                  </div>
                </Card>
              </a>
            </Col>
          ))}
        </Row>

        {filtered.length === 0 && (
          <div className={styles.empty}>没有找到匹配的访谈</div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className={styles.pagination}>
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              showSizeChanger={false}
              onChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
