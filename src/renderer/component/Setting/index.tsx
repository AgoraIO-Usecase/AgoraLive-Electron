import React, { useState, useContext, useEffect, useRef } from "react"
import styles from './setting.scss'
import { Divider, Slider, Input, Button } from 'antd'
import { getResourcePath, checkAppId } from '../../utils/index'
import { useEngine } from "../../utils/hooks"
import { ChannelProfileType, IRtcEngineEventHandler, ClientRoleType } from 'agora-electron-sdk'
import VideoConfigModal from '../VideoConfigModal'
import { message } from 'antd'
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "../../store"
import { setChannel, setAppId } from '../../store/reducers/global'

const voiceIcon = getResourcePath('voice.png')
const voiceDisableIcon = getResourcePath('voiceDisable.png')
const microIcon = getResourcePath('microphone.png')
const microDisableIcon = getResourcePath('microDisable.png')
const settingIcon = getResourcePath('appSetting.png')

const Setting: React.FC = () => {
  const [joined, setJoined] = useState(false)
  const [disableVoice, setDisableVoice] = useState(false)
  const [disableMicro, setDisableMicro] = useState(false)
  const [voiceVolume, setVoiceNum] = useState(50)
  const [microVolume, setMicroVolume] = useState(50)
  const [isOpen, setIsOpen] = useState(false)
  const voiceVolumeRef = useRef(voiceVolume)
  const microVolumeRef = useRef(microVolume)
  const appId = useSelector((state: RootState) => state.global.appId)
  const channel = useSelector((state: RootState) => state.global.channel)
  const { rtcEngine, joinChannel, leaveChannel } = useEngine()
  const dispatch = useDispatch()

  useEffect(() => {
    if (isOpen) {
      checkAppId(appId)
    }
  }, [appId, isOpen])

  const onChannelChange = (e) => {
    dispatch(setChannel(e.target.value))
  }

  const onAppIdChange = (e) => {
    dispatch(setAppId(e.target.value))
  }

  const handleVoiceStatus = (e) => {
    if (!disableVoice) {
      voiceVolumeRef.current = voiceVolume
      setVoiceNum(0)
      setDisableVoice(true)
    } else {
      setDisableVoice(false)
      setVoiceNum(voiceVolumeRef.current)
      rtcEngine?.adjustPlaybackSignalVolume(voiceVolumeRef.current);
    }
  }

  const handleMicroStatus = (e) => {
    if (!disableMicro) {
      microVolumeRef.current = microVolume
      setMicroVolume(0)
      setDisableMicro(true)
    } else {
      setDisableMicro(false)
      setMicroVolume(microVolumeRef.current)
      rtcEngine?.adjustRecordingSignalVolume(microVolumeRef.current);
    }
  }

  const onVoiceAfterChange = (v) => {
    setVoiceNum(v)
    rtcEngine?.adjustPlaybackSignalVolume(v);
    console.log('onVoiceAfterChange: ', v)
  }

  const onMicAfterChange = (v) => {
    setMicroVolume(v)
    rtcEngine?.adjustRecordingSignalVolume(v);
    console.log('onMicAfterChange: ', v)
  }

  const handleJoinChannel = () => {
    if (!joined) {
      rtcEngine?.setChannelProfile(1)
      rtcEngine?.setAudioProfile(0, 3)
      joinChannel({
        // Make myself as the broadcaster to send stream to remote
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: false,
        publishTrancodedVideoTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      })
    } else {
      leaveChannel()
    }
    setJoined(!joined)
  }



  const onSettingClick = () => {
    setIsOpen(true)
  }


  return (
    <div className={styles.setting}>
      <div className={styles.tool}>
        <img onClick={onSettingClick} src={`file://${settingIcon}`} alt="" />
        <div className={styles.voice}>
          <img onClick={handleVoiceStatus} src={disableVoice ? `file://${voiceDisableIcon}` : `file://${voiceIcon}`} alt="" />
          <Slider
            className={styles.customerSlider}
            disabled={disableVoice}
            tooltip={{ open: false }}
            min={0}
            max={100}
            value={voiceVolume}
            onAfterChange={onVoiceAfterChange}
          />
        </div>
        <div className={styles.microphone}>
          <img onClick={handleMicroStatus} src={disableMicro ? `file://${microDisableIcon}` : `file://${microIcon}`} alt="" />
          <Slider
            className={styles.customerSlider}
            disabled={disableMicro}
            tooltip={{ open: false }}
            min={0}
            max={100}
            value={microVolume}
            onAfterChange={onMicAfterChange}
          />
        </div>
      </div>
      <Divider className={styles.divider} />
      <div className={styles.settingInput}>
        <div className={styles.inputArea}>
          <Input disabled={joined} className={styles.customInput} placeholder="App ID" value={appId} onChange={onAppIdChange} />
          <Input disabled={joined} className={styles.customInput} placeholder="频道号" value={channel} onChange={onChannelChange} />
        </div>
        <div>
          <Button onClick={handleJoinChannel} type="primary"> {joined ? '结束直播' : '立即开播'}</Button>
        </div>
      </div>
      {isOpen && (<VideoConfigModal isOpen={isOpen} onCancel={() => setIsOpen(false)} />)}
    </div>
  )
}

export default Setting
