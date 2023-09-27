import { useDispatch, useSelector } from 'react-redux';
import React, { useContext, useState, useRef, useEffect, RefObject } from "react"
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
  IRtcEngineEx,
  MediaDeviceStateType
} from 'agora-electron-sdk'
import { IDevice, SourceType, IDeviceCapacity } from "../types"
import { message } from "antd"
import { RootState } from "../store"
import { calcTranscoderOptions } from "./index"
import { setDevices } from "../store/reducers/global"

const defaultThumbSize = { width: 320, height: 160 }
const defaultIconSize = { width: 80, height: 80 }
const SDK_LOG_PATH = "'./logs/agorasdk.log'"

interface IPreViewOption {
  videoRef: RefObject<HTMLDivElement>
}

export const useEngine = () => {
  const appId = useSelector((state: RootState) => state.global.appId)
  const channel = useSelector((state: RootState) => state.global.channel)
  const token = useSelector((state: RootState) => state.global.token)
  const uid = useSelector((state: RootState) => state.global.uid)
  const rtcEngine = useRef<IRtcEngineEx>()
  const dispatch = useDispatch()

  const initEngine = () => {
    if (!appId) {
      message.error("appId is empty")
      return
    }
    rtcEngine.current = createAgoraRtcEngine()
    rtcEngine.current.initialize({
      appId: appId,
      logConfig: { filePath: SDK_LOG_PATH },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    })
    rtcEngine.current.enableExtension(
      'agora_video_filters_segmentation',
      'portrait_segmentation',
      true
    )
    rtcEngine.current.registerEventHandler(eventHandles)
    _initDevices()
  }

  const destoryEngine = () => {
    rtcEngine.current?.unregisterEventHandler(eventHandles);
    rtcEngine.current?.release()
  }

  const _initDevices = () => {
    const videoDevices = rtcEngine.current?.getVideoDeviceManager().enumerateVideoDevices()
    if (videoDevices && videoDevices.length > 0) {
      const list = videoDevices.map((item) => {
        let num = rtcEngine.current?.getVideoDeviceManager().numberOfCapabilities(item.deviceId!)
        let capacities: IDeviceCapacity[] = []
        if (num && num > 0) {
          for (let i = 0; i < num; i++) {
            let cap = rtcEngine.current?.getVideoDeviceManager().getCapability(item.deviceId!, i)
            if (cap) {
              capacities.push({
                width: cap.width!,
                height: cap.height!,
                fps: cap.fps!,
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
      dispatch(setDevices(list))
    } else {
      message.warning('没有可用的摄像头')
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
      if (deviceState == MediaDeviceStateType.MediaDeviceStateIdle || deviceState == MediaDeviceStateType.MediaDeviceStateUnplugged) {
        _initDevices()
      }
    },

    onVideoDeviceStateChanged: (deviceId, deviceType, deviceState) => {
      console.log(`video device changed: ${deviceId} ${deviceType} ${deviceState}`)
      if (deviceState == MediaDeviceStateType.MediaDeviceStateIdle || deviceState == MediaDeviceStateType.MediaDeviceStateUnplugged) {
        _initDevices()
      }
    },

    onLocalVideoStats: (connection, stats) => {
      //console.log(`onLocalVideoStats: ${stats.sentBitrate},${stats.sentFrameRate}`)
    },

  }


  const setVideoEncoderConfiguration = (config: VideoEncoderConfiguration) => {
    const res = rtcEngine.current?.setVideoEncoderConfiguration(config)
    if (res !== 0) {
      const msg = `setVideoEncoderConfiguration failed, error code: ${res}`
      throw new Error(msg)
    }
  }

  const joinChannel = (options: ChannelMediaOptions) => {
    if (!channel) {
      return message.info('频道号不为空，请输入频道号')
    }
    const res = rtcEngine.current?.joinChannel(token, channel, uid, options)
    if (res !== 0) {
      const msg = `joinChannel failed, error code: ${res}`
      throw new Error(msg)
    } else {
      message.success("joinChannel success")
    }
  }

  const leaveChannel = () => {
    const res = rtcEngine.current?.leaveChannel()
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
    setVideoEncoderConfiguration,
    joinChannel,
    leaveChannel
  }
}


export const useMediaPlayer = () => {
  const mediaPlayer = useRef<IMediaPlayer>()
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
    mediaPlayer.current?.registerPlayerSourceObserver(mediaPlayerListener)
  }

  const destroyMediaPlayer = () => {
    if (!mediaPlayer.current) {
      return;
    }
    rtcEngine?.destroyMediaPlayer(mediaPlayer.current);
    mediaPlayer.current = undefined
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
    let capScreenSources = rtcEngine?.getScreenCaptureSources(defaultThumbSize, defaultIconSize, true)
    const items = capScreenSources!.filter((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeScreen
    })
    return items
  }

  const getCapWinSources = (): ScreenCaptureSourceInfo[] => {
    let capScreenSources = rtcEngine?.getScreenCaptureSources(defaultThumbSize, defaultIconSize, true)
    const items = capScreenSources!.filter((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeWindow
    })
    return items
  }


  const startScreenCaptureBySourceType = (
    sourceType: VideoSourceType,
    config: ScreenCaptureConfiguration
  ) => {
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

export const usePreview = ({ videoRef }: IPreViewOption) => {
  const { rtcEngine } = useEngine()
  const firstPreview = useRef<boolean>(true)
  const transCodeSources = useSelector((state: RootState) => state.global.transCodeSources)
  const isPreview = useSelector((state: RootState) => state.global.isPreview)
  const isHorizontal = useSelector((state: RootState) => state.global.isHorizontal)
  const uid = useSelector((state: RootState) => state.global.uid)

  const startPreview = () => {
    firstPreview.current = false
    rtcEngine?.startLocalVideoTranscoder(calcTranscoderOptions(transCodeSources, isHorizontal));
  }

  const updatePreview = () => {
    rtcEngine?.updateLocalTranscoderConfiguration(calcTranscoderOptions(transCodeSources, isHorizontal))
  }

  const stopPreview = () => {
    firstPreview.current = true
    let ret = rtcEngine?.stopLocalVideoTranscoder()
    ret = rtcEngine?.setupLocalVideo({
      sourceType: VideoSourceType.VideoSourceTranscoded,
      view: null,
      uid: uid,
      mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
      renderMode: RenderModeType.RenderModeFit,
    });
    while (videoRef.current?.firstChild) {
      videoRef.current?.removeChild(videoRef.current?.firstChild);
    }
    rtcEngine?.stopPreview()
  }

  useEffect(() => {
    if (isPreview) {
      if (firstPreview.current) {
        startPreview()
      } else {
        updatePreview()
      }
    } else {
      stopPreview()
    }

    return () => {
      if (isPreview) {
        stopPreview()
      }
    }

  }, [isPreview, isHorizontal, transCodeSources])
}
