import { useContext, useState, useRef } from "react"
import RtcEngineContext from "../context/rtcEngineContext"
import {
  CameraCapturerConfiguration,
  VideoSourceType,
  VideoMirrorModeType,
  RenderModeType,
  IMediaPlayer,
  IMediaPlayerSourceObserver,
  MediaPlayerState,
  MediaPlayerError,
  ScreenCaptureSourceType,
  ChannelProfileType,
  IRtcEngineEventHandler,
  ScreenCaptureSourceInfo
} from 'agora-electron-sdk'
import { IDevice, SourceType, IDeviceCapacity } from "../types"
import { message } from "antd"

export const useEngine = () => {
  const { rtcEngine, appId, sdkLogPath } = useContext(RtcEngineContext)
  const [devices, setDevices] = useState<IDevice[]>([])

  const initEngine = () => {
    rtcEngine?.initialize({
      appId: appId,
      logConfig: { filePath: sdkLogPath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    })
    rtcEngine?.enableExtension(
      'agora_video_filters_segmentation',
      'portrait_segmentation',
      true
    )
    rtcEngine?.registerEventHandler(eventHandles)
    initDevices()
  }

  const destoryEngine = () => {
    rtcEngine?.unregisterEventHandler(eventHandles);
    rtcEngine?.release()
  }

  const initDevices = () => {
    const videoDevices = rtcEngine?.getVideoDeviceManager().enumerateVideoDevices()
    if (videoDevices && videoDevices.length > 0) {
      const list = videoDevices.map((item) => {
        let num = rtcEngine?.getVideoDeviceManager().numberOfCapabilities(item.deviceId!)
        let capacities: IDeviceCapacity[] = []
        if (num && num > 0) {
          for (let i = 0; i < num; i++) {
            let cap = rtcEngine?.getVideoDeviceManager().getCapability(item.deviceId!, i)
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

  return {
    rtcEngine,
    initEngine,
    destoryEngine,
    devices,
    updateDevices
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
    mediaPlayer.current = rtcEngine?.createMediaPlayer()!
    mediaPlayer.current.registerPlayerSourceObserver(mediaPlayerListener)
  }

  const destroyMediaPlayer = () => {
    if (!mediaPlayer.current) {
      return;
    }
    rtcEngine?.destroyMediaPlayer(mediaPlayer.current);
  }


  return {
    createMediaPlayer,
    destroyMediaPlayer,
    mediaPlayer: mediaPlayer.current
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



  return {
    getCapWinSources,
    getCapScreenSources
  }
}
