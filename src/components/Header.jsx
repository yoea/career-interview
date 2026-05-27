import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import styles from './Header.module.scss'

const { Header: AntHeader } = Layout

const navItems = [
  { key: '/', label: '首页' },
  { key: '/interviews', label: '访谈内容' },
  { key: '/categories', label: '职业分类' },
  { key: '/topics', label: '热门话题' },
  { key: '/about', label: '关于我们' },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AntHeader className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          <img src="/acca.png" alt="Logo" className={styles.logoImg} />
          <span className={styles.logoText}>寻路记·新华生涯访谈</span>
        </div>
        <Menu
          mode="horizontal"
          items={navItems}
          selectedKeys={[location.pathname]}
          className={styles.nav}
          onClick={({ key }) => navigate(key)}
        />
      </div>
    </AntHeader>
  )
}
