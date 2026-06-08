import { Card, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faVideo,
  faIndustry,
  faMessage,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { videos } from '../services/videos.service'
import categoriesJson from '../config/categories.json'
import topicsJson from '../config/topics.json'
import { useState, useEffect } from 'react'
import { onVideosUpdate } from '../services/videos.service'
import styles from './Features.module.scss'

const { Title, Paragraph } = Typography

function getFeatures(navigate) {
  return [
    {
      icon: faVideo,
      title: `${videos.length} 期访谈`,
      desc: '由中西部县域高中生采访各行各业职场人士，录制真实的职业访谈视频。',
      onClick: () => navigate('/interviews'),
    },
    {
      icon: faIndustry,
      title: `${categoriesJson.length} 个职业分类`,
      desc: '覆盖教育、科技、法律、医疗、金融等16大类，呈现多元职业路径。',
      onClick: () => navigate('/categories'),
    },
    {
      icon: faMessage,
      title: `${topicsJson.length} 个热门话题`,
      desc: '围绕职业选择、人生规划、成长经历等话题，深入探讨不同人生路径。',
      onClick: () => navigate('/topics'),
    },
    {
      icon: faUsers,
      title: '学生主导采访',
      desc: '在爱心捐方支持下，由学校老师带领学生主动探索外部世界，规划未来。',
    },
  ]
}

export default function Features() {
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  useEffect(() => onVideosUpdate(() => setTick(t => t + 1)), [])

  const features = getFeatures(navigate)
  return (
    <section className={styles.features}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <Title level={2} className={styles.title}>生涯访谈概况</Title>
          <Paragraph className={styles.subtitle}>
            新华生涯教育 CCCA 体系之「咨询」支柱项目
          </Paragraph>
        </div>
        <div className={styles.grid}>
          {features.map((item) => (
            <Card
              key={item.title}
              className={styles.card}
              hoverable={!!item.onClick}
              onClick={item.onClick}
              style={item.onClick ? { cursor: 'pointer' } : undefined}
            >
              <div className={styles.iconWrap}>
                <FontAwesomeIcon icon={item.icon} className={styles.icon} />
              </div>
              <Title level={4} className={styles.cardTitle}>{item.title}</Title>
              <Paragraph className={styles.cardDesc}>{item.desc}</Paragraph>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
