import React, { useState, useRef, useEffect } from 'react'
import Config from '../../config/agora.config'
import styles from './combination.scss'
import {
  createAgoraRtcEngine,
  RenderModeType,
  VideoMirrorModeType,
  VideoSourceType,
  MediaSourceType,
  MediaPlayerState,
  MediaPlayerError,
  ChannelProfileType,
  TranscodingVideoStream,
  IMediaPlayer,
  IMediaPlayerSourceObserver,
  ScreenCaptureSourceType,
  VideoDeviceInfo,
  ClientRoleType,
  RtcConnection,
  RtcStats
} from 'agora-electron-sdk'
import {
  AgoraButton,
  AgoraDivider,
  AgoraDropdown,
  AgoraImage,
  AgoraText,
  AgoraTextInput,
} from '../../components/ui';
import { getResourcePath } from '../../utils/index'
import SelectBox from '../../components/SelectBox'
import { rgbImageBufferToBase64 } from '../../utils/base64';

const test1Url = getResourcePath('test1.jpg')
const test2Url = getResourcePath('test2.jpg')
const testGif = getResourcePath('gif.gif')
const max_width = 1280
const max_height = 720

const Combination: React.FC = () => {
  const video1Ref = useRef<HTMLDivElement>(null)
  const video2Ref = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const [openPlayer, setOpenPlayer] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [checkIndex, setCheckIndex] = useState(-1)
  const sources = useRef<TranscodingVideoStream[]>([])
  const engine = useRef(createAgoraRtcEngine());
  const player = useRef<IMediaPlayer | null>(null)
  const [captureSrc, setCaptureSrc] = useState<any>([])
  const [targetSrc, setTargetSrc] = useState<any>(undefined)
  const [isScreenCapture, setIsScreenCapture] = useState(false)
  const [videoDevices, setVideoDevices] = useState<VideoDeviceInfo[]>([])
  const [videoDeviceId, setVideoDeviceId] = useState<string[]>([])
  const [channelId, setChannelId] = useState(Config.channelId)
  const [joinChannelSuccess, setJoinChannelSuccess] = useState(false)
  const uid = Config.uid
  const token = Config.token
  const zoom = useRef(1)
  const [boxRect, setBoxRect] = useState({
    containerId: 'canvas-mask',
    top: 0,
    left: 0,
    width: 150,
    height: 150
  })

  const MediaPlayerListener: IMediaPlayerSourceObserver = {
    onPlayerSourceStateChanged(state: MediaPlayerState, ec: MediaPlayerError) {
      console.log('onPlayerSourceStateChanged', 'state', state, 'ec', ec);
      switch (state) {
        case MediaPlayerState.PlayerStateIdle:
          break
        case MediaPlayerState.PlayerStateOpening:
          break
        case MediaPlayerState.PlayerStateOpenCompleted:
          console.log('------state is PlayerStateOpenCompleted')
          //this.setState({ open: true });
          // Auto play on this case
          setOpenPlayer(true)
          player.current?.play()
          break
      }
    }
  }

  const registerChannelEvent = () => {
    engine.current.addListener(
      'onJoinChannelSuccess',
      (connection: RtcConnection, elapsed: number) => {
        console.log(
          'onJoinChannelSuccess',
          'connection',
          connection,
          'elapsed',
          elapsed
        );
        setJoinChannelSuccess(true);
      }
    );

    engine.current.addListener(
      'onLeaveChannel',
      (connection: RtcConnection, stats: RtcStats) => {
        console.log(
          'onLeaveChannel',
          'connection',
          connection,
          'stats',
          stats
        );
        setJoinChannelSuccess(false);
      }
    );
  }

  const initEngine = () => {
    engine.current.initialize({
      appId: Config.appId,
      logConfig: { filePath: Config.SDKLogPath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });
    engine.current.enableVideo();
    engine.current.startPreview();
    getScreenCaptureSources()
    enumerateDevices()
    registerChannelEvent()
  }

  const enumerateDevices = () => {
    const videoDevices = engine.current
      ?.getVideoDeviceManager()
      .enumerateVideoDevices();
    console.log('----enumerateDevices videoDevices: ',videoDevices)
    setVideoDevices(videoDevices)
    setVideoDeviceId(videoDevices?.length ? [videoDevices!.at(0)!.deviceId!] : [])
  }

  const _getVideoSourceTypeCamera = (value: string) => {
    return [
      VideoSourceType.VideoSourceCameraPrimary,
      VideoSourceType.VideoSourceCameraSecondary,
    ][videoDevices?.findIndex(({ deviceId }) => deviceId === value) ?? -1];
  }

  const joinChannel = () => {
    if (!channelId) {
      console.error('channelId is invalid');
      return
    }
    if (uid < 0) {
      console.error('uid is invalid');
      return
    }

    // start joining channel
    // 1. Users can only see each other after they join the
    // same channel successfully using the same app id.
    // 2. If app certificate is turned on at dashboard, token is needed
    // when joining channel. The channel name and uid used to calculate
    // the token has to match the ones used for channel join
    engine.current.joinChannel(token, channelId, uid, {
      // Make myself as the broadcaster to send stream to remote
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      publishMicrophoneTrack: false,
      publishCameraTrack: false,
      publishTrancodedVideoTrack: true,
    })
  }

  const leaveChannel = () => {
    engine.current.leaveChannel()
  }

  const startCameraCapture = (deviceId: string) => {
    if (VideoSourceType.VideoSourceCameraPrimary === _getVideoSourceTypeCamera(deviceId)) {
      engine.current?.startPrimaryCameraCapture({
        deviceId,
      })
    }
    if (VideoSourceType.VideoSourceCameraSecondary === _getVideoSourceTypeCamera(deviceId)) {
      engine.current?.startSecondaryCameraCapture({
        deviceId,
      })
    }
  }

  const stopCameraCapture = (deviceId: string) => {
    if (VideoSourceType.VideoSourceCameraPrimary === _getVideoSourceTypeCamera(deviceId)) {
      engine.current?.stopPrimaryCameraCapture()
    }
    if (VideoSourceType.VideoSourceCameraSecondary === _getVideoSourceTypeCamera(deviceId)) {
      engine.current?.stopSecondaryCameraCapture()
    }
  }

  const getScreenCaptureSources = () => {
    const sources = engine.current?.getScreenCaptureSources(
      { width: 1920, height: 1080 },
      { width: 64, height: 64 },
      true
    );
    console.log('---getScreenCaptureSources: ', sources)
    setCaptureSrc(sources)
    setTargetSrc(sources?.at(0))
  }

  const startScreenCapture = () => {
    if (!targetSrc) {
      console.error(`targetSource is invalid`);
    }
    if (targetSrc.type === ScreenCaptureSourceType.ScreencapturesourcetypeScreen) {
      console.log('------11111 targetSrc: ',targetSrc)
      engine.current?.startScreenCaptureByDisplayId(
        targetSrc.sourceId,
        { width: 0, height: 0, x: 0, y: 0 },
        {
          dimensions: { width: 1920, height: 1080 },
          bitrate: 1000,
          frameRate: 15,
          captureMouseCursor: false,
          windowFocus: false,
          excludeWindowList: [],
          excludeWindowCount: 0,
        }
      );
    } else {
      engine.current?.startScreenCaptureByWindowId(
        targetSrc.sourceId,
        { width: 0, height: 0, x: 0, y: 0 },
        {
          dimensions: { width: 1920, height: 1080 },
          bitrate: 1000,
          frameRate: 15,
          captureMouseCursor: false,
          windowFocus: false,
          excludeWindowList: [],
          excludeWindowCount: 0,
        }
      );
    }
    setIsScreenCapture(true)
  }

  const stopScreenCapture = () => {
    engine.current?.stopScreenCapture()
    setIsScreenCapture(false)
  }

  const updateCanvasConfig = () => {
    const canvas:any = video1Ref.current?.querySelector('canvas')
    zoom.current = Number.parseFloat(canvas?.style.zoom || '1');
    console.log('------zoom: ',zoom)
    const parentDom = video1Ref.current?.querySelector('div')
    const width = Math.floor(max_width*zoom.current)
    const height = Math.floor(max_height*zoom.current)
    if (parentDom) {
      createCanvasMask(parentDom, width, height)
    }
  }

  const createCanvasMask = (parentDom: HTMLDivElement,width: number,height: number) => {
    const mask = document.getElementById('canvas-mask')
    if (mask) {
      mask.removeEventListener('mousedown', handleMouseDown)
      parentDom.removeChild(mask)
    }
    console.log('----createCanvasMask width, height, parent: ',width,height,parentDom)
    const dom = document.createElement('div')
    dom.id = 'canvas-mask'
    dom.style.position = 'absolute'
    dom.style.width = width.toString()+'px'
    dom.style.height = height.toString() + 'px'
    //dom.style.pointerEvents = 'none'

    //添加mousedown事件
    dom.addEventListener('mousedown', handleMouseDown)
    parentDom.insertBefore(dom, parentDom.firstChild)
    console.log('mask rect: ',dom.getBoundingClientRect())
  }

  const updateSelectBoxRect = (selectIndex, dx=0, dy=0,dw=0,dh=0) => {
    if (selectIndex >= 0) {
      console.log('updateSelectBoxRect dx: ',Math.floor(sources.current[selectIndex].x! * zoom.current)+dx)
      console.log('updateSelectBoxRect dy: ',Math.floor(sources.current[selectIndex].y! * zoom.current)+dy)
      console.log('updateSelectBoxRect dw, dh: ',dw,dh)
      setBoxRect({
        ...boxRect,
        left:  Math.floor((sources.current[selectIndex].x! + dx) * zoom.current),
        top: Math.floor((sources.current[selectIndex].y!+dy) * zoom.current),
        width: Math.floor((sources.current[selectIndex].width!) * zoom.current + dw),
        height: Math.floor((sources.current[selectIndex].height!) * zoom.current + dh)
      })
    }
  }

  const getLocalTransConfig = ()=> {
    const  width = 200,
           height = 200
    const streams: TranscodingVideoStream[] = []
    if (videoDeviceId?.length) {
      streams.push({
        sourceType: MediaSourceType.PrimaryCameraSource
      })
    }
    if (openPlayer) {
      streams.push({
        sourceType: MediaSourceType.MediaPlayerSource,
        imageUrl: player.current?.getMediaPlayerId().toString(),
      });
    }
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test1Url,
    })
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test2Url,
    })
    streams.push({
      sourceType: MediaSourceType.RtcImageGifSource,
      imageUrl: testGif,
    })
    if (isScreenCapture) {
      streams.push({
        sourceType: MediaSourceType.PrimaryScreenSource,
      });
    }

    streams.map((value, index) => {
      const maxNumPerRow = Math.floor(max_width / width)
      const numOfRow = Math.floor(index / maxNumPerRow)
      const numOfColumn = Math.floor(index % maxNumPerRow)
      value.x = numOfColumn * width
      value.y = numOfRow * height
      value.width = width
      value.height = height
      value.zOrder = index+1
      value.alpha = 1
      value.mirror = true
    })

    sources.current = [...streams]
    console.log('-----getLocalTransConfig sources: ', sources.current)

    return {
      streamCount: streams.length,
      VideoInputStreams: streams,
      videoOutputConfiguration: {
        dimensions: { width: max_width, height: max_height },
      },
    }
  }

  const updateResize = (x, y, dw, dh, isResizing) => {
    console.log('----updateResize x, y, dw, dh, isResizing: ',x, y, dw,dh,isResizing)
    
    if (isResizing) {
      updateSources(checkIndex,x,y,dw,dh)
    } else {
      let lastSources = getNewSources(checkIndex, x, y, dw,dh)
      let config = {
        streamCount: lastSources.length,
        VideoInputStreams: lastSources,
        videoOutputConfiguration: {
          dimensions: { width: max_width, height: max_height },
        },
      }
      engine.current.updateLocalTranscoderConfiguration(config)
      console.log('------updateResize lastSources: ', lastSources)
      sources.current = lastSources
    }
    
  }

  const handleMouseDown = (e) => {
    console.log('----handleMouseDown e: ',e.target.id)
    if (e.target.id === 'canvas-mask') {
      let index = getSelectNode(e.offsetX, e.offsetY)
      setCheckIndex(index)
      updateSelectBoxRect(index,0,0,0,0)
      console.log('----index: ',index)
      console.log(sources)
    }
  }

  const handleOnClick = (e) => {
    if(isOpen) {
      setCheckIndex(-1)
    }
    setIsOpen(!isOpen)
  }

  const setOnTop = () => {
    if (checkIndex >= 0) {
      sources.current[checkIndex].zOrder = 99
      let config ={
        streamCount: sources.current.length,
        VideoInputStreams: sources.current,
        videoOutputConfiguration: {
          dimensions: { width: max_width, height: max_height },
        },
      }
      console.log('setOnTop sources: ', sources.current)
      engine.current.updateLocalTranscoderConfiguration(config)
    }
  }

  const setOnBottom = () => {
    if (checkIndex >= 0) {
      sources.current[checkIndex].zOrder = 0
      let config ={
        streamCount: sources.current.length,
        VideoInputStreams: sources.current,
        videoOutputConfiguration: {
          dimensions: { width: max_width, height: max_height },
        },
      }
      console.log('setOnBottom sources: ', sources.current)
      engine.current.updateLocalTranscoderConfiguration(config)
    }
  }

  const onReset = () => {
    if (checkIndex >= 0) {
      sources.current[checkIndex].zOrder = checkIndex+1
      let config ={
        streamCount: sources.current.length,
        VideoInputStreams: sources.current,
        videoOutputConfiguration: {
          dimensions: { width: max_width, height: max_height },
        },
      }
      console.log('onReset sources: ', sources.current)
      engine.current.updateLocalTranscoderConfiguration(config)
    }
  }

  const updateSources = (index: number, x: number, y: number,dw: number,dh: number) => {
    if (index >= 0) {
      let newSources = getNewSources(index,x,y,dw,dh)
      console.log('----updateSources newSources: ',  newSources)
      let config ={
        streamCount: newSources.length,
        VideoInputStreams: newSources,
        videoOutputConfiguration: {
          dimensions: { width: max_width, height: max_height },
        },
      }
      console.log('updateSource sources: ', newSources)
      engine.current.updateLocalTranscoderConfiguration(config)
    }
  }

  const getNewSources = (selectIndex: number, x: number, y: number, dw: number, dh:number):TranscodingVideoStream[] => {
    let newSources = sources.current.map((item, index) => {
      if (index === selectIndex) {
        let dx = Math.floor(x/zoom.current) - item.x!
        let dy = Math.floor(y/zoom.current) - item.y!
        console.log('----getNewSource dx, dy: ',dx,dy)
        console.log('----getNewSource dw, dh: ',dw,dh)
        return {
          ...item,
          x: item.x! + dx,
          y: item.y! + dy,
          width: item.width! + Math.floor(dw/zoom.current),
          height: item.height! + Math.floor(dh/zoom.current)
        }
      }
      return item
    })
    return newSources
  }

  const getSelectNode = (posX, posY) => {
    let selectIndex = -1, zOrder = 0
    sources.current.forEach((item, index) => {
      let zoomX = Math.floor(item.x!*zoom.current)
      let zoomY = Math.floor(item.y!*zoom.current)
      let zoomW = Math.floor(item.width!*zoom.current)
      let zoomH = Math.floor(item.height!*zoom.current)
      if (posX >= zoomX && posY >= zoomY && posX <= (zoomX + zoomW) && posY <= (zoomY + zoomH)) {
        if (item.zOrder! >= zOrder) {
          selectIndex = index
          zOrder = item.zOrder!
        }
      }
    })
    return selectIndex
  }

  const createMediaPlayer = () => {
    let url = 'https://agora-adc-artifacts.oss-cn-beijing.aliyuncs.com/video/meta_live_mpk.mov'
    player.current = engine.current.createMediaPlayer()
    console.log('----createMediaPlayer player: ',player.current)
    player.current.registerPlayerSourceObserver(MediaPlayerListener)
    player.current.open(url, 0)
  }

  const destroyMediaPlayer = () => {
    console.log('------destroyMediaPlayer')
    if (!player.current) {
      return
    }
    engine.current?.destroyMediaPlayer(player.current)
    setOpenPlayer(false)
  }

  useEffect(() => {
    const updateDisplayRender = () => {
      console.log('---updateDisplayRender: ', isOpen)
      try {
        engine.current.destroyRendererByView(video1Ref.current);
      } catch (e) {
        console.error(e);
      }
      if (isOpen) {
        let config = getLocalTransConfig()
        engine.current.startLocalVideoTranscoder(config)
        console.log('----config: ',config)
        engine.current.setupLocalVideo({
          sourceType: VideoSourceType.VideoSourceTranscoded,
          view: video1Ref.current,
          uid: Config.uid,
          mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
          renderMode: RenderModeType.RenderModeFit,
        });
      } else {
        engine.current.setupLocalVideo({
          sourceType: VideoSourceType.VideoSourceCameraPrimary,
          view: video1Ref.current,
          uid: Config.uid,
          mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
          renderMode: RenderModeType.RenderModeFit,
        });
      }
      engine.current.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceCameraPrimary,
        view: video2Ref.current,
        uid: Config.uid,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      })
    }
    console.log('-----isOpen: ',isOpen)
    updateDisplayRender()
    if (isOpen) {
      setTimeout(() => {
        updateCanvasConfig()
      },500)
    }
  },[isOpen])

  useEffect(() => {
    if (openPlayer) {
      let mediaId = player.current?.getMediaPlayerId()
      console.log('----createMediaPlayer mediaId: ',mediaId)
      engine.current.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceMediaPlayer,
        view: mediaRef.current,
        uid: mediaId,
        renderMode: RenderModeType.RenderModeFit,
      })
    }
    if (isOpen) {
      let config = getLocalTransConfig()
      engine.current.updateLocalTranscoderConfiguration(config)
    }
  }, [openPlayer, isScreenCapture, videoDeviceId, joinChannelSuccess])

  useEffect(() => {
    initEngine()
    return () => {
      console.log('unmonut component')
      setIsOpen(false)
      destroyMediaPlayer()
      engine.current.release()
    }
  }, [])

  function renderChannel() {
    return (
      <div style={{display: 'flex', marginLeft: '8px'}}>
        <input
          onChange={(event) => {
            setChannelId(event.target.value);
          }}
          placeholder={`channelId`}
          value={channelId}
        />
        <button onClick={joinChannelSuccess ? leaveChannel : joinChannel}>{`${joinChannelSuccess ? 'leave' : 'join'} Channel`}</button>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{textAlign:'center'}}>Function Show</h3>
      <div className={styles.display}>
        <div className='video1' ref={video1Ref} style={{height:'100%'}}></div>
        {
          (checkIndex>=0)&&(<SelectBox {...boxRect} resizingCallBack={updateResize}/>)
        }
      </div>
      {(checkIndex>=0)&&(
          <div style={{display: 'flex', justifyContent: 'center',margin: '0 5px'}}>
            <button onClick={setOnTop}>Set Top</button>
            <button onClick={setOnBottom}>Set Bottom</button>
            <button onClick={onReset}>Reset</button>
          </div>
        )}
      <h3 style={{textAlign:'center', margin: '0 3px'}}>Materal Show</h3>
      <div className={styles.material}>
        <div className={styles.videoWapper}>
          <AgoraDropdown
            title={'videoDeviceId'}
            className={styles.videoDropdown}
            items={videoDevices?.map((value) => {
              return {
                value: value.deviceId!,
                label: value.deviceName!,
              };
            })}
            value={videoDeviceId}
            onValueChange={(value, index) => {
              if (videoDeviceId?.indexOf(value) === -1) {
                startCameraCapture(value);
                setVideoDeviceId([...videoDeviceId, value])
              } else {
                stopCameraCapture(value);
                let newDeviceId = videoDeviceId?.filter((v) => v !== value)
                setVideoDeviceId(newDeviceId)
              }
            }}
          />
          <div ref={video2Ref} style={{ width:'200px', height:'200px'}}></div>
        </div>
        {
          openPlayer&&(<div ref={mediaRef} style={{ width:'100px', height:'100px',margin:'0 5px'}}></div>)
        }
        <img src={`file://${test1Url}`} style={{width: '100px',height:'100px',margin:'0 5px'}}></img>
        <img src={`file://${test2Url}`} style={{width: '100px',height:'100px',margin:'0 5px'}}></img>
        <img src={`file://${testGif}`} style={{width: '100px',height:'100px',margin:'0 5px'}}></img>
        <div className={styles.captureWapper}>
          <AgoraDropdown
            title={'targetSource'}
            items={captureSrc?.map((value) => {
              return {
                value: value.sourceId!,
                label: value.sourceName!,
              };
            })}
            value={targetSrc?.sourceId}
            onValueChange={(value, index) => {
              setTargetSrc(captureSrc?.at(index))
            }}
          />
          {targetSrc ? (
            <AgoraImage
              source={rgbImageBufferToBase64(targetSrc.thumbImage)}
            />
          ) : undefined}
        </div>
      </div>
      <div style={{ marginTop:'10px', display:'flex', justifyContent:'center' }}>
        <button onClick={handleOnClick}>{isOpen ? 'Stop Composite Picture': 'Start Composite Picture'}</button>
        <button onClick={openPlayer ? destroyMediaPlayer : createMediaPlayer}>{`${openPlayer ? 'destroy' : 'create'} Media Player`}</button>
        <button onClick={isScreenCapture ? stopScreenCapture : startScreenCapture}>{`${isScreenCapture ? 'stop' : 'start'} Screen Capture`}</button>
        {renderChannel()}
      </div>
    </div>
  )
}

export default Combination