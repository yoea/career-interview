import { Typography, Card, Anchor } from 'antd'
import styles from './Terms.module.scss'

const { Title, Paragraph, Text } = Typography

export default function Terms() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Title level={2}>用户协议</Title>
        <Paragraph className={styles.update}>最后更新：2026 年 5 月</Paragraph>

        <Card className={styles.card}>
          <Title level={4}>一、协议的范围</Title>
          <Paragraph>
            欢迎您使用「寻路记·新华生涯访谈」平台（以下简称"本平台"）。
            本平台由浙江省新华爱心教育基金会发起，青少年发展研究中心运营。
            请您在使用本平台前仔细阅读本协议的全部内容。
            您访问或使用本平台即表示您同意受本协议的约束。
          </Paragraph>

          <Title level={4}>二、平台服务内容</Title>
          <Paragraph>
            本平台为公益性生涯教育内容平台，主要提供以下服务：
          </Paragraph>
          <ul>
            <li>生涯人物访谈视频的展示与播放</li>
            <li>职业分类与话题浏览</li>
            <li>生涯教育相关内容的传播</li>
          </ul>
          <Paragraph>
            本平台展示的视频内容来源于新华爱心教育基金会在哔哩哔哩平台发布的「新华生涯教育 | 生涯人物访谈系列」合集。
          </Paragraph>

          <Title level={4}>三、用户行为规范</Title>
          <Paragraph>您在使用本平台时应遵守以下规范：</Paragraph>
          <ul>
            <li>不得利用本平台从事任何违法违规活动</li>
            <li>不得对本平台内容进行未经授权的复制、修改、传播</li>
            <li>不得干扰本平台的正常运行</li>
            <li>不得侵犯其他用户或第三方的合法权益</li>
          </ul>

          <Title level={4}>四、知识产权</Title>
          <Paragraph>
            本平台展示的视频、文字、图片等内容的知识产权归浙江省新华爱心教育基金会或其合法权利人所有。
            未经权利人书面许可，您不得以任何方式复制、传播、修改上述内容。
            视频内容的版权归原作者所有，观看和分享请遵守哔哩哔哩平台的相关规定。
          </Paragraph>

          <Title level={4}>五、免责声明</Title>
          <Paragraph>
            本平台提供的内容仅供参考和学习之用，不构成任何职业建议。
            平台上展示的受访者观点仅代表其个人意见，不代表本平台立场。
            本平台不对因使用平台内容而产生的任何直接或间接损失承担责任。
          </Paragraph>

          <Title level={4}>六、协议的修改</Title>
          <Paragraph>
            本平台有权根据需要修改本协议，修改后的协议将在平台上公布。
            继续使用本平台即表示您同意修改后的协议。
          </Paragraph>

          <Title level={4}>七、适用法律与争议解决</Title>
          <Paragraph>
            本协议的订立、执行和解释均适用中华人民共和国法律。
            如发生争议，双方应友好协商解决；协商不成的，任何一方均可向本平台所在地人民法院提起诉讼。
          </Paragraph>

          <Title level={4}>八、联系方式</Title>
          <Paragraph>
            如您对本协议有任何疑问，请通过以下方式联系我们：
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
