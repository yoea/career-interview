import { Typography, Card } from 'antd'
import styles from '../Terms/Terms.module.scss'

const { Title, Paragraph } = Typography

export default function Privacy() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Title level={2}>隐私政策</Title>
        <Paragraph className={styles.update}>最后更新：2026 年 5 月</Paragraph>

        <Card className={styles.card}>
          <Title level={4}>一、引言</Title>
          <Paragraph>
            「寻路记·新华生涯访谈」平台（以下简称"本平台"）非常重视您的隐私保护。
            本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。
            请在使用本平台前仔细阅读本政策。
          </Paragraph>

          <Title level={4}>二、信息收集</Title>
          <Paragraph>
            本平台作为公益性内容展示平台，目前不收集用户的个人身份信息。
            我们可能自动收集以下非个人信息：
          </Paragraph>
          <ul>
            <li>设备类型、操作系统、浏览器类型等技术信息</li>
            <li>访问时间、页面浏览记录等使用信息</li>
            <li>IP 地址、网络类型等网络信息</li>
          </ul>

          <Title level={4}>三、信息使用</Title>
          <Paragraph>我们收集的非个人信息仅用于以下目的：</Paragraph>
          <ul>
            <li>维护平台的正常运行和安全性</li>
            <li>分析平台使用情况，优化用户体验</li>
            <li>统计访问量，评估项目影响力</li>
          </ul>

          <Title level={4}>四、信息存储与安全</Title>
          <Paragraph>
            我们采取合理的技术和管理措施来保护您的信息安全。
            收集的非个人信息存储在安全的服务器中，并受到适当的访问控制。
          </Paragraph>

          <Title level={4}>五、第三方服务</Title>
          <Paragraph>
            本平台的视频内容托管在哔哩哔哩平台。
            当您点击视频播放时，将跳转至哔哩哔哩网站，届时哔哩哔哩的隐私政策将适用。
            我们建议您查阅哔哩哔哩的隐私政策以了解其数据处理方式。
          </Paragraph>

          <Title level={4}>六、Cookie 使用</Title>
          <Paragraph>
            本平台可能使用 Cookie 或类似技术来改善用户体验。
            您可以通过浏览器设置管理或禁用 Cookie，但这可能影响平台的部分功能。
          </Paragraph>

          <Title level={4}>七、未成年人保护</Title>
          <Paragraph>
            本平台的服务对象包括 13-18 岁青少年。
            我们高度重视未成年人的隐私保护，不会主动收集未成年人的个人信息。
            如您是未成年人的监护人，对未成年人的个人信息有任何疑问，请与我们联系。
          </Paragraph>

          <Title level={4}>八、政策更新</Title>
          <Paragraph>
            我们可能会不时更新本隐私政策。更新后的政策将在平台上公布，
            并注明生效日期。继续使用本平台即表示您同意更新后的隐私政策。
          </Paragraph>

          <Title level={4}>九、联系我们</Title>
          <Paragraph>
            如您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：
          </Paragraph>
          <ul>
            <li>邮箱：info@xhef.org</li>
            <li>地址：浙江省嘉兴市南湖区新昌路1617号</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
