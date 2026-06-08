import { useState, useEffect } from 'react'
import { Typography, Card, Row, Col, Badge, Spin } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGraduationCap, faStethoscope, faLaptopCode, faScaleBalanced,
  faChartLine, faShieldHalved, faBullhorn, faBuilding,
  faHeartPulse, faFlask, faPenNib, faWrench,
  faSeedling, faHelmetSafety, faDatabase, faEllipsis,
} from '@fortawesome/free-solid-svg-icons'
import { getBroadCategories, loading, onVideosUpdate } from '../../services/videos.service'
import categoriesJson from '../../config/categories.json'
import styles from './Categories.module.scss'

const { Title, Paragraph } = Typography

const iconMap = {
  'graduation-cap': faGraduationCap, 'stethoscope': faStethoscope,
  'laptop-code': faLaptopCode, 'scale-balanced': faScaleBalanced,
  'chart-line': faChartLine, 'shield-halved': faShieldHalved,
  'bullhorn': faBullhorn, 'building': faBuilding,
  'heart-pulse': faHeartPulse, 'flask': faFlask,
  'pen-nib': faPenNib, 'wrench': faWrench,
  'seedling': faSeedling, 'helmet-safety': faHelmetSafety,
  'database': faDatabase, 'ellipsis': faEllipsis,
}

const colors = categoriesJson.reduce((map, c) => { map[c.name] = c.color; return map }, {})

export default function Categories() {
  const [groups, setGroups] = useState([])

  useEffect(() => {
    const update = () => setGroups(getBroadCategories())
    update()
    return onVideosUpdate(update)
  }, [])

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
          <Title level={2}>职业分类</Title>
          <Paragraph className={styles.subtitle}>
            {groups.length} 个分类，系统化呈现不同职业领域
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {groups.map((cat, i) => (
            <Col key={cat.name} xs={12} sm={12} md={8} lg={6}>
              <a
                href={`/interviews?broad=${encodeURIComponent(cat.name)}`}
                className={styles.cardLink}
              >
                <Card hoverable className={styles.card}>
                  <Badge count={cat.count} className={styles.badge} overflowCount={999} />
                  <div
                    className={styles.iconWrap}
                    style={{ background: `${colors[cat.name]}12` }}
                  >
                    <FontAwesomeIcon
                      icon={iconMap[cat.icon] || faEllipsis}
                      className={styles.icon}
                      style={{ color: colors[cat.name] }}
                    />
                  </div>
                  <Title level={5} className={styles.catName}>{cat.name}</Title>
                  <Paragraph className={styles.catDesc}>
                    {cat.videos.slice(0, 3).map(v => v.profession).join('、')}
                    {cat.count > 3 ? ' 等' : ''}
                  </Paragraph>
                </Card>
              </a>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
