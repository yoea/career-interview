import { useState } from 'react'
import { Typography, Card, Row, Col, Tag, Input, Select, Pagination } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faPlay, faComment } from '@fortawesome/free-solid-svg-icons'
import { videos, formatPlayCount, categories } from '../../data/videos'
import styles from './Interviews.module.scss'

const { Title, Paragraph } = Typography
const { Search } = Input

const PAGE_SIZE = 12

export default function Interviews() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(null)
  const [page, setPage] = useState(1)

  const filtered = videos.filter(v => {
    const matchSearch = !search || v.title.includes(search) || v.profession.includes(search)
    const matchCategory = !category || v.profession === category
    return matchSearch && matchCategory
  })

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Title level={2}>访谈内容</Title>
          <Paragraph className={styles.subtitle}>
            共 {videos.length} 期访谈，覆盖 {categories.length} 个职业领域
          </Paragraph>
        </div>

        <div className={styles.toolbar}>
          <Search
            placeholder="搜索访谈标题或职业..."
            allowClear
            className={styles.search}
            onSearch={v => { setSearch(v); setPage(1) }}
            onChange={e => { if (!e.target.value) { setSearch(''); setPage(1) } }}
          />
          <Select
            placeholder="筛选职业"
            allowClear
            className={styles.select}
            options={categories.map(c => ({ label: c, value: c }))}
            onChange={v => { setCategory(v); setPage(1) }}
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
                  </div>
                }>
                  <Tag color="blue" className={styles.tag}>{item.profession}</Tag>
                  <Title level={5} className={styles.cardTitle}>{item.title}</Title>
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
