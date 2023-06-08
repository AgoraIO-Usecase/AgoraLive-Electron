import React, { useState } from 'react'
import styles from './home.scss'
import { Layout } from 'antd'
import Template from './component/Template'
import LiveTool from './component/LiveTool'
import Microphone from './component/Microphone'
import InteractiveMsg from './component/InteractiveMsg'
import LivePreview from './component/LivePreview'
import Setting from './component/Setting'

const { Sider, Content } = Layout

const Home: React.FC = () => {
  return (
    <Layout className={ styles.home }>
      <Sider width={280} className={ styles.siderLeft }>
        <Template />
        <LiveTool />
      </Sider>
      <Content className={styles.main}>
        <LivePreview />
        <Setting />
      </Content>
      <Sider width={280} className={ styles.siderRight }>
        <Microphone />
        <InteractiveMsg />
      </Sider>
    </Layout>
  )
}

export default Home