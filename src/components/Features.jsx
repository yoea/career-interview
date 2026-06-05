import { Card, Typography } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faVideo,
  faIndustry,
  faUsers,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons'
import { videos, categories, totalPlays, onVideosUpdate } from '../services/videos.service'
import { useState, useEffect } from 'react'
import styles from './Features.module.scss'

const { Title, Paragraph } = Typography

function getFeatures() {
  return [
    {
      icon: faVideo,
      title: `${videos.length} 期访谈`,
      desc: '由中西部县域高中生采访各行各业职场人士，录制真实的职业访谈视频。',
    },
    {
      icon: faIndustry,
      title: `${categories.length} 个职业领域`,
      desc: '覆盖科技、医疗、教育、法律、金融等众多行业，呈现多元职业路径。',
    },
    {
      icon: faUsers,
      title: '学生主导采访',
      desc: '在爱心捐方支持下，由学校老师带领学生主动探索外部世界，规划未来。',
    },
    {
      icon: faChartLine,
      title: `${(totalPlays / 10000).toFixed(1)} 万次播放`,
      desc: '视频总播放数，帮助更多青少年获取真实的职业信息和人生经验。',
    },
  ]
}

export default function Features() {
  const [, setTick] = useState(0)
  useEffect(() => onVideosUpdate(() => setTick(t => t + 1)), [])

  const features = getFeatures()
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
            <Card key={item.title} className={styles.card} hoverable>
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
