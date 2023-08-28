import React, { useEffect, useRef, useState } from 'react'
import styles from './home.scss'
import { Layout } from 'antd'
import Template from '../../component/Template'
import LiveTool from '../../component/LiveTool'
import Microphone from '../../component/Microphone'
import InteractiveMsg from '../../component/InteractiveMsg'
import LivePreview from '../../component/LivePreview'
import Setting from '../../component/Setting'
import RtcEngineContext from '../../context/rtcEngineContext'
import createAgoraRtcEngine from 'agora-electron-sdk'
import { getRandomInt } from "../../utils"


const { Sider, Content } = Layout

const Home: React.FC = () => {
  // TODO: mock app id 
  const mockAppId = "d9d6367af4a04f2bb602561a30669946"
  const [appId, setAppId] = useState(mockAppId)
  const [channel, setChannel] = useState('')

  const value = {
    appId,
    setAppId,
    channel,
    setChannel,
    uid: getRandomInt(),
    rtcEngine: createAgoraRtcEngine(),
    sdkLogPath: './logs/agorasdk.log'
  }

  return (
    <RtcEngineContext.Provider value={value}>
      <Layout className={styles.home}>
        <Sider width={240} className={styles.siderLeft}>
          <Template />
          <LiveTool />
        </Sider>
        <Content className={styles.main}>
          <LivePreview />
          <Setting />
        </Content>
        <Sider width={240} className={styles.siderRight}>
          <Microphone />
          <InteractiveMsg />
        </Sider>
      </Layout>
    </RtcEngineContext.Provider>
  )
}

export default Home
