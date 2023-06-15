import React, { useState, useContext, useEffect } from "react"
import styles from './setting.scss'
import { Divider, Slider, Input, Button } from 'antd'
import { getResourcePath } from '../../utils/index'
import { ChannelProfileType,IRtcEngineEventHandler,ClientRoleType } from 'agora-electron-sdk'
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
  const [isJoinChannel, setJoinState] = useState(false)
  const { rtcEngine,appId,updateAppStatus, updateAppId} = useContext(RtcEngineContext) as IAppContext

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

  const onVoiceAfterChange =(v)=>{
    rtcEngine?.adjustPlaybackSignalVolume(v);
    console.log('onVoiceAfterChange: ',v)
  }

  const onMicAfterChange =(v)=>{
    rtcEngine?.adjustRecordingSignalVolume(v);
    console.log('onMicAfterChange: ',v)
    }

   const handleJoinChannel = ()=>{
    console.log('handleJoinChannel: ')
    if(!isJoinChannel)
    {
      rtcEngine?.setChannelProfile(1)
    //  rtcEngine?.setClientRole(ClientRoleType.ClientRoleBroadcaster)
    //  rtcEngine?.registerMediaMetadataObserver();
      rtcEngine?.setAudioProfile(0, 3)
      let ret = rtcEngine?.joinChannel("", channel, 0, {
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

};

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
            value={50}
            onAfterChange={onVoiceAfterChange}
          />
        </div>
        <div className={styles.microphone}>
          <img src={`file://${microIcon}`} alt="" />
          <Slider 
            className={styles.customerSlider}
            tooltip={{open: false}}
            min={0}
            max={100}
            value={50}
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
    </div>
  )
}

export default Setting