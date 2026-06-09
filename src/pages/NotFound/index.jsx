import { Button, Typography, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Paragraph } = Typography

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="404"
        title="404"
        subTitle="页面不存在"
        extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
      />
    </div>
  )
}
