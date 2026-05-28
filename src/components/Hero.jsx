import { useNavigate } from 'react-router-dom'
import { Button, Typography, Space } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faThLarge } from '@fortawesome/free-solid-svg-icons'
import { videos, totalPlays } from '../data/videos'
import styles from './Hero.module.scss'

const { Title, Paragraph, Text } = Typography

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <Text className={styles.tag}>🎙️ 寻路记·新华生涯访谈</Text>
          <Title className={styles.title}>
            探索职业的
            <span className={styles.highlight}>无限可能</span>
          </Title>
          <Paragraph className={styles.desc}>
            一群西北、西南地区的高中生，在爱心捐方的支持下，由学校老师带领，采访各行各业的职场人士，主动规划自己的未来！
          </Paragraph>
          <Space size="middle">
            <Button type="primary" size="large" icon={<FontAwesomeIcon icon={faPlay} />} onClick={() => navigate('/interviews')}>
              开始探索
            </Button>
            <Button size="large" icon={<FontAwesomeIcon icon={faThLarge} />} onClick={() => navigate('/categories')}>
              职业分类
            </Button>
          </Space>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{videos.length}+</span>
              <span className={styles.statLabel}>访谈视频</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>{(totalPlays / 10000).toFixed(1)}万+</span>
              <span className={styles.statLabel}>累计播放</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
