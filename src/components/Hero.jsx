import { useNavigate } from 'react-router-dom'
import { Button, Typography, Space } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faThLarge } from '@fortawesome/free-solid-svg-icons'
// videos import removed — stats moved to Features section
import styles from './Hero.module.scss'

const { Title, Paragraph, Text } = Typography

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <Title className={styles.title}>
            对话生涯人物，
            <span className={styles.highlight}>指引自我人生</span>
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

        </div>
      </div>
    </section>
  )
}
