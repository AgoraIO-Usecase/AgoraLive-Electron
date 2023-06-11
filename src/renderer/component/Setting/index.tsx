import React, { useState, useContext, useEffect } from "react"
import styles from './setting.scss'
import { Divider, Slider, Input, Button } from 'antd'
import { getResourcePath } from '../../utils/index'
import { ChannelProfileType } from 'agora-electron-sdk'
import RtcEngineContext from "../../context/rtcEngineContext"
import Config from '../../config/agora.config'
import { IAppContext } from '../../context/rtcEngineContext'

const voiceIcon = getResourcePath('voice.png')
const voiceDisableIcon = getResourcePath('voiceDisable.png')
const microIcon = getResourcePath('microphone.png')
const microDisableIcon = getResourcePath('microDisable.png')
const settingIcon = getResourcePath('appSetting.png')

const Setting: React.FC = () => {
  console.log('----render setting')
  //const [appId, setAppId] = useState('')
  const [channel, setChannel] = useState('')
  const { rtcEngine,appId,updateAppStatus, updateAppId} = useContext(RtcEngineContext) as IAppContext

  const rtcEngineInit = () => {
    console.log('---rtcEngineInit appId: ',appId)
    if (appId.length > 0) {
      let ret = rtcEngine?.initialize({
        appId: appId,
        logConfig: { filePath: Config.SDKLogPath },
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      })
      if (ret === 0) {
        updateAppStatus(true)
      } else {
        updateAppStatus(false)
      } 
      console.log('----ret: ',ret)
    } else {
      updateAppStatus(false)
    }
  }

  const rtcEngineRelease = () => {
    console.log('----rtcEngineRelease ')
    rtcEngine?.release()
  }

  const onChannelChange = (e) => {
    console.log('channel: ',e.target.value)
    setChannel(e.target.value)
  }
  const onAppIdChange = (e) => {
    console.log('appId: ',e.target.value)
    updateAppId(e.target.value)
  }

  useEffect(() => {
    rtcEngineInit()
    return () => {
      rtcEngineRelease()
    }
  }, [appId])

  return (
    <div className={styles.setting}>
      <div className={styles.tool}>
        <img src={`file://${settingIcon}`} alt="" />
        <div className={styles.voice}>
          <img src={`file://${voiceIcon}`} alt="" />
          <Slider
            className={styles.customerSlider} 
            tooltip={{open: false}}
            min={0}
            max={100}
          />
        </div>
        <div className={styles.microphone}>
          <img src={`file://${microIcon}`} alt="" />
          <Slider 
            className={styles.customerSlider}
            tooltip={{open: false}}
            min={0}
            max={100}
          />
        </div>
      </div>
      <Divider className={styles.divider} />
      <div className={styles.settingInput}>
        <div className={styles.inputArea}>
         <Input className={styles.customInput} placeholder="App ID" value={appId} onChange={onAppIdChange}/>
         <Input className={styles.customInput} placeholder="频道号" value={channel} onChange={onChannelChange}/>
        </div>
        <div>
          <Button type="primary">立即开播</Button>
        </div>
      </div>
    </div>
  )
}

export default Setting