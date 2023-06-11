import React, { useEffect, useRef, useState } from 'react'
import createAgoraRtcEngine, { IRtcEngineEx } from 'agora-electron-sdk'
import styles from './home.scss'
import { Layout } from 'antd'
import Template from '../../component/Template'
import LiveTool from '../../component/LiveTool'
import Microphone from '../../component/Microphone'
import InteractiveMsg from '../../component/InteractiveMsg'
import LivePreview from '../../component/LivePreview'
import Setting from '../../component/Setting'
import RtcEngineContext from '../../context/rtcEngineContext'
import { app } from 'electron'
const { Sider, Content } = Layout

const Home: React.FC = () => {
  const [isAppIdExist, setIsAppIdExist] = useState(false)
  const [appId, setAppId] = useState('')
  const rtcEngine = createAgoraRtcEngine()

  const updateAppStatus = (isExist) => {
    console.log('----updateAppStatus ',isExist)
    setIsAppIdExist(isExist)
  }
  const updateAppId = (appId) => {
    console.log('----updateAppId ',appId)
    setAppId(appId)
  }
  const appContext  = {
    isAppIdExist,
    appId,
    rtcEngine,
    updateAppStatus,
    updateAppId
  }
  return (
    <RtcEngineContext.Provider value={appContext}>
      <Layout className={ styles.home }>
        <Sider width={240} className={ styles.siderLeft }>
          <Template />
          <LiveTool />
        </Sider>
        <Content className={styles.main}>
          <LivePreview />
          <Setting />
        </Content>
        <Sider width={240} className={ styles.siderRight }>
          <Microphone />
          <InteractiveMsg />
        </Sider>
      </Layout>
    </RtcEngineContext.Provider>
  )
}

export default Home