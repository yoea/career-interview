import { useState, useEffect } from 'react'
import { Layout, Typography, Space, Divider, Tooltip, Popover, message } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { faWeixin, faWeibo } from '@fortawesome/free-brands-svg-icons'
import styles from './Footer.module.scss'

const { Footer: AntFooter } = Layout
const { Title, Text, Link } = Typography

const EMAIL = 'info@xhef.org'

const columns = [
  {
    title: '内容',
    links: [
      { label: '全部访谈', href: '/interviews' },
      { label: '职业分类', href: '/categories' },
      { label: '热门话题', href: '/topics' },
    ],
  },
  {
    title: '关于',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '联络我们', href: 'https://www.xhef.org/owe/join', external: true },
    ],
  },
  {
    title: '支持',
    links: [
      { label: '用户协议', href: '/terms' },
      { label: '隐私政策', href: '/privacy' },
      { label: '意见反馈', href: 'https://www.xhef.org/owe/join', external: true },
    ],
  },
]

export default function Footer() {
  const [copied, setCopied] = useState(false)
  const [visitCount, setVisitCount] = useState(null)

  const copyEmail = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      message.success('邮箱已复制')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    fetch('/api/visit/count')
      .then(r => r.json())
      .then(d => setVisitCount(d.count))
      .catch(() => {})
  }, [])

  return (
    <AntFooter className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <img src="/acca.png" alt="Logo" className={styles.logoImg} />
              <span className={styles.logoText}>寻路记·新华生涯访谈</span>
            </div>
            <Text className={styles.brandDesc}>
              对话生涯人物，指引自我人生。
            </Text>
            <Space size="middle" className={styles.socials}>
              <Popover
                content={<img src="/wechat-qr.png" alt="微信公众号二维码" style={{ width: 160, display: 'block' }} />}
                trigger="hover"
                placement="top"
              >
                <FontAwesomeIcon icon={faWeixin} className={styles.socialIcon} />
              </Popover>
              <Tooltip title="@新华爱心教育基金会">
                <a href="https://weibo.com/xhcef" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faWeibo} className={styles.socialIcon} />
                </a>
              </Tooltip>
              <Tooltip title={EMAIL}>
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className={styles.socialIcon}
                  onClick={copyEmail}
                  style={{ cursor: 'pointer' }}
                />
              </Tooltip>
            </Space>
          </div>
          {columns.map((col) => (
            <div key={col.title} className={styles.col}>
              <Title level={5} className={styles.colTitle}>{col.title}</Title>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  className={styles.colLink}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <Divider className={styles.divider} />
        <div className={styles.bottom}>
          <Text className={styles.copyright}>
            © 2026 寻路记·新华生涯访谈 All rights reserved.
          </Text>
          {visitCount !== null && (
            <Text className={styles.visitCount}>
              本站访问量：{visitCount.toLocaleString()} 次
            </Text>
          )}
        </div>
      </div>
    </AntFooter>
  )
}
