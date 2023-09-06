import { useContext, useState, useRef } from "react"
import RtcEngineContext from "../context/rtcEngineContext"
import createAgoraRtcEngine, {
  CameraCapturerConfiguration,
  VideoSourceType,
  VideoMirrorModeType,
  RenderModeType,
  VideoEncoderConfiguration,
  IMediaPlayer,
  IMediaPlayerSourceObserver,
  MediaPlayerState,
  MediaPlayerError,
  ScreenCaptureSourceType,
  ChannelProfileType,
  IRtcEngineEventHandler,
  ScreenCaptureSourceInfo,
  ScreenCaptureConfiguration,
  ChannelMediaOptions,
  IRtcEngineEx
} from 'agora-electron-sdk'
import { IDevice, SourceType, IDeviceCapacity } from "../types"
import { message } from "antd"

export const useEngine = () => {
  const { appId, sdkLogPath } = useContext(RtcEngineContext)
  const [devices, setDevices] = useState<IDevice[]>([])
  const rtcEngine = useRef<IRtcEngineEx>(createAgoraRtcEngine())

  const initEngine = () => {
    rtcEngine.current.initialize({
      appId: appId,
      logConfig: { filePath: sdkLogPath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    })
    rtcEngine.current.enableExtension(
      'agora_video_filters_segmentation',
      'portrait_segmentation',
      true
    )
    rtcEngine.current.registerEventHandler(eventHandles)
    initDevices()
  }

  const destoryEngine = () => {
    rtcEngine.current.unregisterEventHandler(eventHandles);
    rtcEngine.current.release()
  }

  const initDevices = () => {
    const videoDevices = rtcEngine.current.getVideoDeviceManager().enumerateVideoDevices()
    if (videoDevices && videoDevices.length > 0) {
      const list = videoDevices.map((item) => {
        let num = rtcEngine.current.getVideoDeviceManager().numberOfCapabilities(item.deviceId!)
        let capacities: IDeviceCapacity[] = []
        if (num && num > 0) {
          for (let i = 0; i < num; i++) {
            let cap = rtcEngine.current.getVideoDeviceManager().getCapability(item.deviceId!, i)
            if (cap !== undefined) {
              capacities.push({
                width: cap.width!,
                height: cap.height!,
                fps: cap.fps!,
                modifyFps: cap.fps!
              });
            }
          }
        }
        return {
          deviceId: item.deviceId || '',
          deviceName: item.deviceName || '',
          capacity: capacities,
        }
      })
      setDevices(list)
    }
  }


  const eventHandles: IRtcEngineEventHandler = {
    // 监听本地用户加入频道事件
    onJoinChannelSuccess: ({ channelId, localUid }, elapsed) => {
      console.log("join channel success! ", channelId, localUid);
    },

    onLeaveChannel: ({ channelId, localUid }, stats) => {
      console.log('leave channel success! ', channelId);
    },

    // 监听远端用户加入频道事件
    onUserJoined: ({ channelId, localUid }, remoteUid, elapsed) => {
      console.log('user joined! ', remoteUid);
    },

    onUserOffline(uid, reason) {
      // this.handleAddRemote(channelId, remoteUid, false)
    },

    onAudioDeviceStateChanged: (deviceId, deviceType, deviceState) => {
      console.log(`audio device changed:  ${deviceId} ${deviceType} ${deviceState}`)
    },

    onVideoDeviceStateChanged: (deviceId, deviceType, deviceState) => {
      console.log(`video device changed: ${deviceId} ${deviceType} ${deviceState}`)
    },

    onLocalVideoStats: (connection, stats) => {
      //console.log(`onLocalVideoStats: ${stats.sentBitrate},${stats.sentFrameRate}`)
    },

  }

  const updateDevices = (data) => {
    setDevices((preDevices) => {
      const newDevices = [...preDevices]
      const device = newDevices[data.selectedDevice]
      if (device) {
        const capacity = device.capacity[data.selectCap]
        if (capacity) {
          capacity.modifyFps = parseInt(data.fps)
        }
      }
      return newDevices
    })
  }

  const setVideoEncoderConfiguration = (config: VideoEncoderConfiguration) => {
    const res = rtcEngine.current.setVideoEncoderConfiguration(config)
    if (res !== 0) {
      const msg = `setVideoEncoderConfiguration failed, error code: ${res}`
      throw new Error(msg)
    }
  }

  const joinChannel = (token: string, channelId: string, uid: number, options: ChannelMediaOptions) => {
    const res = rtcEngine.current.joinChannel(token, channelId, uid, options)
    if (res !== 0) {
      const msg = `joinChannel failed, error code: ${res}`
      throw new Error(msg)
    } else {
      message.success("joinChannel success")
    }
  }

  const leaveChannel = () => {
    const res = rtcEngine.current.leaveChannel()
    if (res !== 0) {
      const msg = `leaveChannel failed, error code: ${res}`
      throw new Error(msg)
    } else {
      message.success("leaveChannel success")
    }
  }

  return {
    rtcEngine: rtcEngine.current,
    initEngine,
    destoryEngine,
    devices,
    updateDevices,
    setVideoEncoderConfiguration,
    joinChannel,
    leaveChannel
  }
}


export const useMediaPlayer = () => {
  const mediaPlayer = useRef<IMediaPlayer | null>(null)
  const { rtcEngine } = useEngine()

  const mediaPlayerListener: IMediaPlayerSourceObserver = {
    onPlayerSourceStateChanged(state: MediaPlayerState, ec: MediaPlayerError) {
      console.log('onPlayerSourceStateChanged', 'state', state, 'ec', ec);
      switch (state) {
        case MediaPlayerState.PlayerStateIdle:
          break
        case MediaPlayerState.PlayerStateOpening:
          break
        case MediaPlayerState.PlayerStateOpenCompleted:
          console.log('------state is PlayerStateOpenCompleted')
          mediaPlayer.current?.play()
          //this.setState({ open: true });
          // Auto play on this case
          //setOpenPlayer(true)
          //player.current?.play()
          break
      }
    }
  }

  const createMediaPlayer = () => {
    if (mediaPlayer.current) {
      return
    }
    mediaPlayer.current = rtcEngine?.createMediaPlayer()
    mediaPlayer.current.registerPlayerSourceObserver(mediaPlayerListener)
  }

  const destroyMediaPlayer = () => {
    if (!mediaPlayer.current) {
      return;
    }
    rtcEngine?.destroyMediaPlayer(mediaPlayer.current);
    mediaPlayer.current = null
  }


  return {
    createMediaPlayer,
    destroyMediaPlayer,
    getMediaPlayer: () => mediaPlayer.current
  }
}



export const useScreen = () => {
  const { rtcEngine } = useEngine()

  const getCapScreenSources = (): ScreenCaptureSourceInfo[] => {
    let capScreenSources = rtcEngine?.getScreenCaptureSources({ width: 320, height: 160 }, { width: 80, height: 80 }, true)
    const items = capScreenSources!.filter((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeScreen
    })
    return items
  }

  const getCapWinSources = (): ScreenCaptureSourceInfo[] => {
    let capScreenSources = rtcEngine?.getScreenCaptureSources({ width: 320, height: 160 }, { width: 80, height: 80 }, true)
    const items = capScreenSources!.filter((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeWindow
    })
    return items
  }


  const startScreenCaptureBySourceType = (sourceType: VideoSourceType,
    config: ScreenCaptureConfiguration) => {
    let res = rtcEngine?.startScreenCaptureBySourceType(sourceType, config)
    if (res !== 0) {
      const msg = `startScreenCaptureBySourceType failed, error code: ${res}`
      message.error(msg)
      throw new Error(msg)
    }
  }

  return {
    getCapWinSources,
    getCapScreenSources,
    startScreenCaptureBySourceType
  }
}


export const useTransCodeSources = () => {
  const transCodeSources = useRef<SourceType[]>([])

  const getTransCodeSources = () => transCodeSources.current

  const setTransCodeSources = (sources: SourceType[]) => {
    transCodeSources.current = sources
  }

  const pushTransCodeSource = (source: SourceType) => {
    const exist = transCodeSources.current.findIndex((item) => item.id === source.id)
    if (exist == -1) {
      transCodeSources.current.push(source)
    }
  }

  return {
    getTransCodeSources,
    setTransCodeSources,
    pushTransCodeSource
  }

} 
