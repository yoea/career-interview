import { Typography, Row, Col, Card, Descriptions, Tag, Button } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBullseye, faLocationDot,  faEnvelope,
  faBookOpen, faCampground, faComments, faChartBar,
  faUsers, faMapMarkerAlt, faGraduationCap, faCode, faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons'
import styles from './About.module.scss'

const { Title, Paragraph, Text } = Typography

const ccca = [
  { key: 'C1', label: 'Curriculum 课程', student: '生涯发展手册', teacher: '生涯师资培训', icon: faBookOpen },
  { key: 'C2', label: 'Camp 营会', student: '生涯研学营', teacher: '生涯研讨会', icon: faCampground },
  { key: 'C3', label: 'Counseling 咨询', student: '一对一咨询 & 生涯人物访谈', teacher: '读书会 & 督导', icon: faComments },
  { key: 'A', label: 'Assessment 评估', student: '学生生涯发展水平调研', teacher: '教师需求 & 发展水平评估', icon: faChartBar },
]

export default function About() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Title level={2}>关于我们</Title>
          <Paragraph className={styles.subtitle}>
            让生命因爱与教育而改变
          </Paragraph>
        </div>

        {/* 项目信息 */}
        <Card className={styles.orgCard}>
          <div className={styles.orgHeader}>
            <FontAwesomeIcon icon={faBullseye} className={styles.orgIcon} />
            <Title level={4} className={styles.orgTitle}>项目信息</Title>
          </div>
          <Descriptions column={1} labelStyle={{ width: 160, fontWeight: 500 }}>
            <Descriptions.Item label="访谈项目">寻路记·新华生涯访谈</Descriptions.Item>
            <Descriptions.Item label="所属项目">织吾涯·新华生涯教育</Descriptions.Item>
            <Descriptions.Item label="发起机构">浙江省新华爱心教育基金会</Descriptions.Item>
            <Descriptions.Item label="运营机构">青少年发展研究中心</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 基金会介绍 */}
        <div className={styles.section}>
          <Title level={3} className={styles.sectionTitle}>发起机构</Title>
          <Card className={styles.introCard}>
            <div className={styles.foundationHeader}>
              <img src="/xhef-logo.png" alt="新华爱心教育基金会" className={styles.foundationLogo} />
              <div>
                <Paragraph className={styles.introText}>
                  <Text strong>浙江省新华爱心教育基金会</Text> 坚持「让生命因爱与教育而改变」的使命，
                  长期关注中国中西部地区青少年教育发展。基金会扎根县域高中，
                  致力于通过品格教育、生涯教育、心理教育等多元项目，
                  帮助 13-18 岁青少年拓展视野、认识自我、规划未来。
                </Paragraph>
                <a
                  href="https://www.xhef.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.foundationLink}
                >
                  <Button type="primary" icon={<FontAwesomeIcon icon={faExternalLinkAlt} />}>
                    访问基金会官网
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </div>

        {/* 生涯教育项目 */}
        <div className={styles.section}>
          <Title level={3} className={styles.sectionTitle}>织吾涯·新华生涯教育</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card className={styles.statCard}>
                <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.statIcon} />
                <Text className={styles.statLabel}>服务地区</Text>
                <Title level={4} className={styles.statValue}>中西部县域</Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className={styles.statCard}>
                <FontAwesomeIcon icon={faUsers} className={styles.statIcon} />
                <Text className={styles.statLabel}>目标群体</Text>
                <Title level={4} className={styles.statValue}>13-18 岁青少年</Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className={styles.statCard}>
                <FontAwesomeIcon icon={faGraduationCap} className={styles.statIcon} />
                <Text className={styles.statLabel}>核心载体</Text>
                <Title level={4} className={styles.statValue}>县域高中</Title>
              </Card>
            </Col>
          </Row>
          <Card className={styles.introCard} style={{ marginTop: 24 }}>
            <Paragraph className={styles.introText}>
              自 2018 年起，经五年实践构建 <Text strong>「新华生涯教育 CCCA 体系」</Text>，
              旨在培养学生探索自我、规划人生的能力。
              核心问题：中国中西部地区青少年因视野受限、家庭支持不足、缺少生涯指导，
              普遍对未来感到迷茫，阻碍其学校适应与高效学习。
              项目通过课程、营会、咨询、评估四大支柱，
              助力青少年在认识自我、成为自我、超越自我的过程中实现个人与社会价值。
            </Paragraph>
          </Card>
        </div>

        {/* CCCA 体系 */}
        <div className={styles.section}>
          <Title level={3} className={styles.sectionTitle}>CCCA 体系</Title>
          <Row gutter={[16, 16]}>
            {ccca.map((item) => (
              <Col key={item.key} xs={24} sm={12}>
                <Card className={styles.cccaCard}>
                  <div className={styles.cccaHeader}>
                    <FontAwesomeIcon icon={item.icon} className={styles.cccaIcon} />
                    <Tag color="blue">{item.key}</Tag>
                    <Text strong>{item.label}</Text>
                  </div>
                  <div className={styles.cccaBody}>
                    <div className={styles.cccaRow}>
                      <Text type="secondary" className={styles.cccaRole}>学生</Text>
                      <Text>{item.student}</Text>
                    </div>
                    <div className={styles.cccaRow}>
                      <Text type="secondary" className={styles.cccaRole}>教师</Text>
                      <Text>{item.teacher}</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 联系方式 */}
        <div className={styles.section}>
          <Title level={3} className={styles.sectionTitle}>联系我们</Title>
          <Card className={styles.contactCard}>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={8}>
                <div className={styles.contactItem}>
                  <FontAwesomeIcon icon={faEnvelope} className={styles.contactIcon} />
                  <div>
                    <Text type="secondary">邮箱</Text>
                    <Paragraph className={styles.contactValue}>info@xhef.org</Paragraph>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className={styles.contactItem}>
                  <FontAwesomeIcon icon={faLocationDot} className={styles.contactIcon} />
                  <div>
                    <Text type="secondary">地址</Text>
                    <Paragraph className={styles.contactValue}>浙江省嘉兴市南湖区新昌路1617号</Paragraph>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        {/* 开发者 */}
        <div className={styles.section}>
          <Card className={styles.devCard}>
            <div className={styles.devHeader}>
              <FontAwesomeIcon icon={faCode} className={styles.devIcon} />
              <Title level={4} className={styles.devTitle}>开发者</Title>
            </div>
            <Paragraph className={styles.devText}>
              浙江省新华爱心教育基金会 · 公益数字化团队 · Ethan
            </Paragraph>
            <div className={styles.buildInfo}>
              <Text type="secondary" className={styles.buildText}>
                构建时间: {__BUILD_TIME__} · 构建主机: {__BUILD_HOST__} · Commit: <a href={`https://github.com/yoea/career-interview/commit/${__COMMIT_HASH__}`} target="_blank" rel="noopener noreferrer" title="点击访问项目源码">{__COMMIT_HASH__}</a>
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
