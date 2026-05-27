import { Typography, Card, Row, Col, Badge } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGraduationCap, faStethoscope, faLaptopCode, faScaleBalanced,
  faChartLine, faShieldHalved, faBullhorn, faBuilding,
  faHeartPulse, faFlask, faPenNib, faWrench,
  faSeedling, faHelmetSafety, faDatabase, faEllipsis,
} from '@fortawesome/free-solid-svg-icons'
import { getBroadCategories } from '../../data/videos'
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

const colors = [
  '#1677ff', '#52c41a', '#eb2f96', '#faad14', '#722ed1',
  '#13c2c2', '#f5222d', '#2f54eb', '#fa8c16', '#1890ff',
  '#a0d911', '#08979c', '#9254de', '#cf1322', '#d4380d', '#595959',
]

export default function Categories() {
  const groups = getBroadCategories()

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
            <Col key={cat.name} xs={24} sm={12} md={8} lg={6}>
              <a href="/interviews" className={styles.cardLink}>
                <Card hoverable className={styles.card}>
                  <Badge count={cat.count} className={styles.badge} overflowCount={999} />
                  <div
                    className={styles.iconWrap}
                    style={{ background: `${colors[i % colors.length]}12` }}
                  >
                    <FontAwesomeIcon
                      icon={iconMap[cat.icon] || faEllipsis}
                      className={styles.icon}
                      style={{ color: colors[i % colors.length] }}
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
