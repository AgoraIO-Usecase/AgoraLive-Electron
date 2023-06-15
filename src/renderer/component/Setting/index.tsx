import React, { useState, useContext, useEffect, useRef } from "react"
import styles from './setting.scss'
import { Divider, Slider, Input, Button } from 'antd'
import { getResourcePath } from '../../utils/index'
import { ChannelProfileType,IRtcEngineEventHandler,ClientRoleType } from 'agora-electron-sdk'
import RtcEngineContext from "../../context/rtcEngineContext"
import Config from '../../config/agora.config'
import { IAppContext } from '../../context/rtcEngineContext'
import VideoConfigModal from '../VideoConfigModal'
import { message } from 'antd'

const voiceIcon = getResourcePath('voice.png')
const voiceDisableIcon = getResourcePath('voiceDisable.png')
const microIcon = getResourcePath('microphone.png')
const microDisableIcon = getResourcePath('microDisable.png')
const settingIcon = getResourcePath('appSetting.png')
const localUid = 0

const Setting: React.FC = () => {
  console.log('----render setting')
  //const [appId, setAppId] = useState('')
  const [channel, setChannel] = useState('')
  const [isJoinChannel, setJoinState] = useState(false)
  const [disableVoice,setDisableVoice] = useState(false)
  const [disableMicro,setDisableMicro] = useState(false)
  const [voiceVolume, setVoiceNum] = useState(50)
  const [microVolume, setMicroVolume] = useState(50)
  const [isOpen, setIsOpen] = useState(false)
  const voiceVolumeRef = useRef(voiceVolume)
  const microVolumeRef = useRef(microVolume)
  const { rtcEngine,appId,isAppIdExist, updateAppStatus, updateAppId} = useContext(RtcEngineContext) as IAppContext

  const rtcEngineInit = () => {
    console.log('---rtcEngineInit appId: ',appId)
    if (appId.length > 0) {
      let ret = rtcEngine?.initialize({
        appId: appId,
        logConfig: { filePath: Config.SDKLogPath },
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      })
      rtcEngine?.registerEventHandler(EventHandles)
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

  const handleVoiceStatus = (e) => {
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
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
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
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

  const onVoiceAfterChange =(v)=>{
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
    setVoiceNum(v)
    rtcEngine?.adjustPlaybackSignalVolume(v);
    console.log('onVoiceAfterChange: ',v)
  }

  const onMicAfterChange =(v)=>{
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
    setMicroVolume(v)
    rtcEngine?.adjustRecordingSignalVolume(v);
    console.log('onMicAfterChange: ',v)
    }

  const handleJoinChannel = ()=>{
    console.log('handleJoinChannel: ')
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
    if (channel.trim() === '') {
      message.info('频道号不为空，请输入频道号')
      return
    }
    if(!isJoinChannel)
    {
      rtcEngine?.setChannelProfile(1)
    //  rtcEngine?.setClientRole(ClientRoleType.ClientRoleBroadcaster)
    //  rtcEngine?.registerMediaMetadataObserver();
      rtcEngine?.setAudioProfile(0, 3)
      let ret = rtcEngine?.joinChannel('', channel, localUid, {
        // Make myself as the broadcaster to send stream to remote
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: false,
        publishTrancodedVideoTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
  
      console.log(`--------join channel: ${ret},${channel}`)
    }
    else{
      rtcEngine?.leaveChannel()
    }
  } 

  const EventHandles:IRtcEngineEventHandler = {
    // 监听本地用户加入频道事件
    onJoinChannelSuccess: ({ channelId, localUid }, elapsed) => {
        console.log('成功加入频道：' + channelId + '_' + localUid);
        //isJoined = true;
        // 本地用户加入频道后，设置本地视频窗口
        // this.setState({
        //   local: localUid,
        //   isJoined: true
        // });
        setJoinState(true)
    },

    onLeaveChannel: ({ channelId, localUid }, stats) => {
        console.log('成功退出频道：' + channelId);

        setJoinState(false)
    },

    // 监听远端用户加入频道事件
    onUserJoined: ({ channelId, localUid }, remoteUid, elapsed) => {
        console.log('远端用户 ' + remoteUid + ' 已加入');

    },

    onUserOffline( uid,  reason) {
     // this.handleAddRemote(channelId, remoteUid, false)
      },

    onAudioDeviceStateChanged: (deviceId, deviceType, deviceState) => {
      console.log(`audio device changed:  ${deviceId} ${deviceType} ${deviceState}`)
    },

    onVideoDeviceStateChanged:(deviceId, deviceType, deviceState) => {
      console.log(`video device changed: ${deviceId} ${deviceType} ${deviceState}`)
    },

    onLocalVideoStats:(connection, stats)=>{
      //console.log(`onLocalVideoStats: ${stats.sentBitrate},${stats.sentFrameRate}`)
    },

  }

  const onVideoConfigChangeCb = () => {
    setIsOpen(false)
  }

  const onSettingClick = () => {
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
    setIsOpen(true)
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
        <img onClick={onSettingClick} src={`file://${settingIcon}`} alt="" />
        <div className={styles.voice}>
          <img onClick={handleVoiceStatus} src={ disableVoice? `file://${voiceDisableIcon}`:`file://${voiceIcon}`} alt="" />
          <Slider
            className={styles.customerSlider} 
            disabled={disableVoice}
            tooltip={{open: false}}
            min={0}
            max={100}
            value={voiceVolume}
            onAfterChange={onVoiceAfterChange}
          />
        </div>
        <div className={styles.microphone}>
          <img onClick={handleMicroStatus} src={disableMicro ? `file://${microDisableIcon}`:`file://${microIcon}`} alt="" />
          <Slider 
            className={styles.customerSlider}
            disabled ={disableMicro}
            tooltip={{open: false}}
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
         <Input className={styles.customInput} placeholder="App ID" value={appId} onChange={onAppIdChange}/>
         <Input className={styles.customInput} placeholder="频道号" value={channel} onChange={onChannelChange}/>
        </div>
        <div>
          <Button onClick={handleJoinChannel} type="primary"> {isJoinChannel ? '结束直播' : '立即开播'}</Button>
        </div>
      </div>
      {isOpen&&(<VideoConfigModal isOpen={isOpen} onChange={onVideoConfigChangeCb}/>)}
    </div>
  )
}

export default Setting