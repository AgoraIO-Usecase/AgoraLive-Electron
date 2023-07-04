import React, { useState, useRef, useEffect, useContext } from "react"
import { ipcRenderer } from 'electron'
import RtcEngineContext, { IAppContext } from "../../context/rtcEngineContext"
import styles from './livePreview.scss'
import { getResourcePath } from '../../utils/index'
import { DownOutlined,UpOutlined } from '@ant-design/icons'
import { message, Dropdown, Menu } from 'antd'
import CameraModal from '../CameraModal'
import VirtualBackgroundModal from '../VirtualBackgroundModal'
import CaptureWinModal from '../CaptureWinModal'
import SelectBox from '../SelectBox/index'
import Config from '../../config/agora.config'
import { 
  CameraCapturerConfiguration,
  VideoSourceType,
  VideoMirrorModeType, 
  RenderModeType,
  TranscodingVideoStream,
  IMediaPlayer,
  IMediaPlayerSourceObserver,
  MediaPlayerState,
  MediaPlayerError,
  ScreenCaptureSourceType
} from 'agora-electron-sdk'


const optConfig = [
  {
    id: 'camera',
    title: '摄像头',
    imgUrl: getResourcePath('camera.png')
  },
  {
    id: 'capture',
    title: '窗口捕捉',
    imgUrl: getResourcePath('capture.png')
  },
  {
    id: 'media',
    title: '多媒体',
    imgUrl: getResourcePath('media.png')
  },
  {
    id: 'virtual',
    title: '虚拟背景',
    imgUrl: getResourcePath('virtual.png')
  }
]
interface IDeviceCapacity {
  width: number,
  height: number,
  fps: number,
  modifyFps: number
}

interface IDevice {
  deviceId: string,
  deviceName: string
  capacity: IDeviceCapacity[]
}

interface IScreenInfo {
  isDisplay: boolean,
  windowId: number,
  width: number,
  heigth: number,
  title: string
}

interface sourceType {
  id: string,
  source: TranscodingVideoStream
}

const LivePreview: React.FC = () => {
  console.log('----render LivePreview')
  const [isHorizontal, setIsHorizontal] = useState(true)
  const isHorizontalRef = useRef(true)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [isVirtualBgModalOpen, setVirtualBgModalOpen] = useState(false)
  const [isCapWinModalOpen,setCapWinModalOpen] = useState(false)
  const [isCapScreenModalOpen,setCapScreenModalOpen] = useState(false)
  const [capWindowSources, setCapWindowSources] = useState<any>([])
  const [capScreenSources, setCapScreenSources] = useState<any>([])
  const [enableGreenScreen, setEnableGreenScreen] = useState(false)
  const [devices, setDevices] = useState<IDevice[]>([])
  const [deviceIndex, setDeviceIndex] = useState(0)
  const [capacityIndex, setCapacityIndex] = useState(0)
  const [isCaptureMenuOpen, setCaptureMenuOpen] = useState(false)
  const [isMediaMenuOpen, setMediaMenuOpen] = useState(false)
  const [isPreview, setPreview] = useState(false)
  const [checkIndex, setCheckIndex] = useState(-1)
  const videoRef = useRef<HTMLDivElement>(null)
  const mediaPlayer = useRef<IMediaPlayer | null>(null)
  const zoom = useRef(1)
  const transCodeSources = useRef<sourceType[]>([])
  const cameraType = useRef({})
  const screenShareObj = useRef({})
  const {rtcEngine, isAppIdExist, appId} = useContext(RtcEngineContext) as IAppContext
  const init_width = 300, init_height = 300
  const max_width = 1280, max_height = 720
  const [boxRect, setBoxRect] = useState({
    containerId: 'canvas-mask',
    top: 0,
    left: 0,
    width: init_width,
    height: init_height
  })
  useEffect(() => {
    if (isAppIdExist && appId.length > 0) {
      console.log('------Agora Engine init success')
      setDeviceIndex(0)
      setCapacityIndex(0)
      enumerateDevices()
      createMediaPlayer()
      screenShareObj.current = {firstScreen:false, secondScreen:false, thirdScreen:false}
      cameraType.current = {firstCamera:false, secondCamera:false, thirdCamera:false}
    }
  },[isAppIdExist, appId])

  useEffect(() => {
    registerIpcRenderEvent()
    window.addEventListener('mousedown', handleMouseDown)
    return () => {
      transCodeSources.current = []
      window.removeEventListener('mousedown', handleMouseDown)
      screenShareObj.current = {firstScreen:false, secondScreen:false, thirdScreen:false}
      cameraType.current = {firstCamera:false, secondCamera:false, thirdCamera:false}
    }
  },[])

  useEffect(() => {
    if (isPreview) {
      console.log('-------updateCanvasConfig preview is true')
      setTimeout(() => {
        updateCanvasConfig()
      }, 2000);
    }
  },[isPreview])

  useEffect(() => {
    isHorizontalRef.current = isHorizontal
    console.log('layout is change isHorizontal: ',isHorizontalRef.current)
    handleStopPreview()
  }, [isHorizontal])

  const updateCanvasConfig = () => {
    console.log('----videoRef: ',videoRef.current)
    const canvas:any = videoRef.current?.querySelector('canvas')
    console.log('---canvas: ',canvas)
    zoom.current = Number.parseFloat(canvas?.style.zoom || '1');
    console.log('------zoom: ',zoom)
    const parentDom = videoRef.current?.querySelector('div')
    let width,height
    if (isHorizontalRef.current) {
      width = Math.floor(max_width*zoom.current)
      height = Math.floor(max_height*zoom.current)
    } else {
      width = Math.floor(max_height*zoom.current)
      height = Math.floor(max_width*zoom.current)
    }
    if (parentDom) {
      createCanvasMask(parentDom, width, height)
    }
  }

  const createCanvasMask = (parentDom: HTMLDivElement,width: number,height: number) => {
    const mask = document.getElementById('canvas-mask')
    if (mask) {
      //mask.removeEventListener('mousedown', handleMouseDown)
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
    //dom.addEventListener('mousedown', handleMouseDown)
    parentDom.insertBefore(dom, parentDom.firstChild)
    console.log('mask rect: ',dom.getBoundingClientRect())
  }

  const handleMouseDown = (e) => {
    console.log('----handleMouseDown offsetX: ','e.offsetY:', e.offsetY)
    console.log('-------handleMouseDown id: ',e.target.id)
    if (e.target.id === 'canvas-mask') {
      let index = getSelectNode(e.offsetX, e.offsetY)
      console.log('----select index: ',index)
      setCheckIndex(index)
      updateSelectBoxRect(index,0,0,0,0)
      console.log('----index: ',index)
    } else {
      if (e.target.id === 'delete') {
        handleDelete()
      } else if (e.target.id === 'moveUp') {
        handleMoveUp()
      } else if (e.target.id === 'moveDown') {
        handleMoveDown()
      } else if (e.target.id !=='select-react') {
        setCheckIndex(-1)
      }
    }
  }

  const getSelectNode = (posX, posY) => {
    let selectIndex = -1, zOrder = 0
    transCodeSources.current.forEach((item, index) => {
      let zoomX = Math.floor(item.source.x!*zoom.current)
      let zoomY = Math.floor(item.source.y!*zoom.current)
      let zoomW = Math.floor(item.source.width!*zoom.current)
      let zoomH = Math.floor(item.source.height!*zoom.current)
      if (posX >= zoomX && posY >= zoomY && posX <= (zoomX + zoomW) && posY <= (zoomY + zoomH)) {
        if (item.source.zOrder! >= zOrder) {
          selectIndex = index
          zOrder = item.source.zOrder!
        }
      }
    })
    return selectIndex
  }

  const updateSelectBoxRect = (selectIndex, dx=0, dy=0,dw=0,dh=0) => {
    if (selectIndex >= 0) {
      console.log('updateSelectBoxRect dx: ',Math.floor(transCodeSources.current[selectIndex].source.x! * zoom.current)+dx)
      console.log('updateSelectBoxRect dy: ',Math.floor(transCodeSources.current[selectIndex].source.y! * zoom.current)+dy)
      console.log('updateSelectBoxRect dw, dh: ',dw,dh)
      setBoxRect({
        ...boxRect,
        left:  Math.floor((transCodeSources.current[selectIndex].source.x! + dx) * zoom.current),
        top: Math.floor((transCodeSources.current[selectIndex].source.y!+dy) * zoom.current),
        width: Math.floor((transCodeSources.current[selectIndex].source.width!) * zoom.current + dw),
        height: Math.floor((transCodeSources.current[selectIndex].source.height!) * zoom.current + dh)
      })
    }
  }

  const getNewSources = (selectIndex: number, x: number, y: number, dw: number, dh:number):sourceType[] => {
    let newSources: sourceType[] = transCodeSources.current.map((item, index) => {
      if (index === selectIndex) {
        let dx = Math.floor(x/zoom.current) - item.source.x!
        let dy = Math.floor(y/zoom.current) - item.source.y!
        console.log('----getNewSource dx, dy: ',dx,dy)
        console.log('----getNewSource dw, dh: ',dw,dh)
        return {
          id: item.id,
          source: {
            ...item.source,
            x: item.source.x! + dx,
            y: item.source.y! + dy,
            //width: item.width! + dw1,
            //height: item.height! + dh1
            width: item.source.width! + Math.floor(dw/zoom.current),
            height: item.source.height! + Math.floor(dh/zoom.current)
          }
        }
      }
      return item
    })
    console.log('-----getNewSources: ', newSources)
    return newSources
  }

  const updateSources = (index: number, x: number, y: number,dw: number,dh: number) => {
    if (index >= 0) {
      let newSources = getNewSources(index,x,y,dw,dh)
      console.log('----updateSources newSources: ',  newSources)
      handlePreview(newSources)
    }
  }

  const updateResize = (x, y, dw, dh, isResizing) => {
    console.log('----updateResize x, y, dw, dh, isResizing: ',x, y, dw,dh,isResizing)
    if (isResizing) {
      updateSources(checkIndex,x,y,dw,dh)
    } else {
      let lastSources = getNewSources(checkIndex, x, y, dw,dh)
      transCodeSources.current = lastSources
      handlePreview()
    }
  }

  const handleMoveUp = () => {
    if (checkIndex >= 0) {
      transCodeSources.current[checkIndex].source.zOrder! += 1
      handlePreview()
      setCheckIndex(-1)
    }
  }

  const handleMoveDown = () => {
    console.log('------checkIndex: ',checkIndex)
    if (checkIndex>=0 && transCodeSources.current[checkIndex].source.zOrder! >= 2) {
      transCodeSources.current[checkIndex].source.zOrder! =1
      handlePreview()
      setCheckIndex(-1)
    }
  }

  const handleDelete = () => {
    console.log('-----handleDelete checkIndex: ',checkIndex)
    if (checkIndex >= 0) {
      if (transCodeSources.current[checkIndex].source.sourceType === VideoSourceType.VideoSourceMediaPlayer) {
        //destroyMediaPlayer()
        mediaPlayer.current?.stop()
      }
      if (transCodeSources.current[checkIndex].source.sourceType === VideoSourceType.VideoSourceCamera || 
        transCodeSources.current[checkIndex].source.sourceType === VideoSourceType.VideoSourceCameraSecondary) {
        //destroyMediaPlayer()
        //mediaPlayer.current?.stop()
        //rtcEngine?.stopPreview()
        rtcEngine?.stopCameraCapture(transCodeSources.current[checkIndex].source.sourceType!)
        setCameraTypeStatus(transCodeSources.current[checkIndex].source.sourceType, false)
      }
      if(transCodeSources.current[checkIndex].source.sourceType === VideoSourceType.VideoSourceScreenPrimary || 
        transCodeSources.current[checkIndex].source.sourceType === VideoSourceType.VideoSourceScreenSecondary ||
        transCodeSources.current[checkIndex].source.sourceType === VideoSourceType.VideoSourceScreenThird )
        {
          rtcEngine?.stopScreenCaptureBySourceType(transCodeSources.current[checkIndex].source.sourceType!)
          setScreenShareObjStatus(transCodeSources.current[checkIndex].source.sourceType, false)
        }
      let newSource = transCodeSources.current.filter((item,index) => {
        return index !==checkIndex
      })
      transCodeSources.current = newSource
      handlePreview()
      setCheckIndex(-1)
    }
  }

  const registerIpcRenderEvent = () => {
    ipcRenderer.on('get-file-path', (event, args) => {
      console.log('---------getFilePath path: ',args.filePaths[0])
      if (args.filePaths && args.filePaths.length > 0) {
        handleAddMediaSource(args.filePaths[0], args.type)
      }
    })
    ipcRenderer.on('capture-complete', (event, rect) => {
      console.log('----registerIpcRenderEvent capture-complete rect: ',rect)
      addScreenAreaSource(rect)
    })
  }

  const enumerateDevices = () => {
    const videoDevices = rtcEngine?.getVideoDeviceManager().enumerateVideoDevices()
    if (videoDevices&&videoDevices.length > 0) {
      let newDevices: IDevice[] = videoDevices.map((item) => {
        let nums = rtcEngine?.getVideoDeviceManager().numberOfCapabilities(item.deviceId!)
        let capacities: IDeviceCapacity[] = []
        if (nums&&nums>0) {
          for (let i = 0; i < nums; i++) {
            let cap = rtcEngine?.getVideoDeviceManager().getCapability(item.deviceId!, i)
            console.log('---------cap: ',cap)
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
      console.log('----newDevices: ',newDevices)
      setDevices(newDevices)
    }
  }

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
    mediaPlayer.current = rtcEngine?.createMediaPlayer()!
    mediaPlayer.current.registerPlayerSourceObserver(MediaPlayerListener)
  }

  const destroyMediaPlayer = () => {
    if (!mediaPlayer.current) {
      return;
    }
    rtcEngine?.destroyMediaPlayer(mediaPlayer.current);
  }

  const getCameraType = () => {
    let index = -1;
    let type = -1
    if(cameraType.current["firstCamera"])
    {
      if(cameraType.current["secondCamera"])
      {
         index = cameraType.current["thirdCamera"] ? -1 : 3;
      }
      else{
        index = 2;
      }
    }
    else{
      index = 1;
    }
    if(index == -1)
    {
      message.info('最多开启3个摄像头');
      return type;
    }
    
    if(index == 1)
    {
      type = VideoSourceType.VideoSourceCameraPrimary
    }
    else if(index == 2)
    {
      type = VideoSourceType.VideoSourceCameraSecondary
    }
    else{
      type = VideoSourceType.VideoSourceCameraThird
    }

    return type;
  }

  const setCameraTypeStatus = (type,status) =>{
    //let obj = screenShareObj;
    if(type == VideoSourceType.VideoSourceCameraPrimary)
    {
      cameraType.current={firstCamera:status, secondCamera: cameraType.current["secondCamera"], thirdCamera:cameraType.current["thirdCamera"]}
    }
    else if(type == VideoSourceType.VideoSourceCameraSecondary)
    {
      cameraType.current={firstCamera:cameraType.current["firstCamera"], secondCamera: status, thirdCamera:cameraType.current["thirdCamera"]}
    }
    else{
      cameraType.current={firstCamera:cameraType.current["firstCamera"], secondCamera: cameraType.current["secondCamera"], thirdCamera:status}
    }
  }

  const handleAddCamera = (selectIndex, selectCapIndex) => {
    console.log('---handleAddCamera','selectIndex: ',selectIndex,'selectCapIndex: ',selectCapIndex)
    if (devices.length < 1) {
      console.log('----There is no camera!')
      return 
    }
    let configuration: CameraCapturerConfiguration = {
      deviceId: devices[selectIndex].deviceId,
      format: {
        width: devices[selectIndex].capacity[selectCapIndex].width,
        height: devices[selectIndex].capacity[selectCapIndex].height,
        fps: devices[selectIndex].capacity[selectCapIndex].modifyFps
      }
    }
    console.log('---configuration: ',configuration)
    let type =  getCameraType()
    let ret = rtcEngine?.startCameraCapture(type, configuration)
    console.log('-----ret: ',ret)
    console.log('-----videoRef: ',videoRef.current)
    let existIndex = transCodeSources.current.findIndex((item) => {
      //return item.source.sourceType === type
      return item.id === configuration.deviceId
    })
    if (existIndex < 0) {
      transCodeSources.current.push({
        id: configuration.deviceId!,
        source: {
          sourceType: type,
          x: 0,
          y: 0,
          //width: devices[selectIndex].capacity[selectCapIndex].width,
          //height: devices[selectIndex].capacity[selectCapIndex].height,
          width: init_width,
          height: init_height,
          zOrder: transCodeSources.current.length+2,
          alpha: 1
        }
      })

      setCameraTypeStatus(type, true)
    }
    handlePreview()
  }

  const getShareScreenType = () =>{
    let index = -1;
    let type = -1
    if(screenShareObj.current["firstScreen"])
    {
      if(screenShareObj.current["secondScreen"])
      {
         index = screenShareObj.current["thirdScreen"] ? -1 : 3;
      }
      else{
        index = 2;
      }
    }
    else{
      index = 1;
    }
    if(index == -1)
    {
      message.info('最多开启3个窗口分享');
      return type;
    }
    
    if(index == 1)
    {
      type = VideoSourceType.VideoSourceScreenPrimary
    }
    else if(index == 2)
    {
      type = VideoSourceType.VideoSourceScreenSecondary
    }
    else{
      type = VideoSourceType.VideoSourceScreenThird
    }

    return type;
  }

  const setScreenShareObjStatus = (type,status) =>{
    //let obj = screenShareObj;
    if(type == VideoSourceType.VideoSourceScreenPrimary)
    {
      screenShareObj.current={firstScreen:status, secondScreen: screenShareObj.current["secondScreen"], thirdScreen:screenShareObj.current["thirdScreen"]}
    }
    else if(type == VideoSourceType.VideoSourceScreenSecondary)
    {
      screenShareObj.current={firstScreen:screenShareObj.current["firstScreen"], secondScreen: status, thirdScreen:screenShareObj.current["thirdScreen"]}
    }
    else{
      screenShareObj.current={firstScreen:screenShareObj.current["firstScreen"], secondScreen: screenShareObj.current["secondScreen"], thirdScreen:status}
    }
  }

  const handleAddFullScreenSource = () => {
    let capScreenSources = rtcEngine?.getScreenCaptureSources({ width: 1920, height: 1080 }, { width: 64, height: 64 }, true)
    const fullScreenSource = capScreenSources?.find((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeScreen
    })
    console.log('-----handleAddFullScreenSource capScreenSources: ', fullScreenSource)
    if (fullScreenSource) {
      let type = getShareScreenType();
      if(type == -1)
      {
        return
      }
      let ret = rtcEngine?.startScreenCaptureBySourceType(type,{
        isCaptureWindow: false,
        displayId: fullScreenSource.sourceId,
        params: {
          dimensions: { width: 1920, height: 1080 },
          bitrate: 1000,
          frameRate: 15,
          captureMouseCursor: false,
          windowFocus: false,
          excludeWindowList: [],
          excludeWindowCount: 0,
        }
      })
      /*
      let ret = rtcEngine?.startScreenCaptureByDisplayId(
        fullScreenSource.sourceId,
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
      )*/
      console.log('---startScreenCaptureByDisplayId ret: ',ret)
      if (ret === 0) {
        let existIndex = transCodeSources.current.findIndex((item) => {
          //return item.source.sourceType === type
          return item.id === fullScreenSource.sourceId
        })
        if (existIndex < 0) {
          transCodeSources.current.push({
            id: fullScreenSource.sourceId,
            source: {
              sourceType: type,
              x: 0,
              y: 0,
              width: init_width,
              height: init_height,
              zOrder: transCodeSources.current.length+2,
              alpha: 1
            }
          })

          setScreenShareObjStatus(type, true)
        }
        handlePreview()
      } else {
        console.error('Capture Screen is failed')
      }
    }
  }

  const handleAddScreenArea = () => {
    let capScreenSources = rtcEngine?.getScreenCaptureSources({ width: 1920, height: 1080 }, { width: 64, height: 64 }, true)
    const areaScreenSource = capScreenSources?.find((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeScreen
    })
    console.log('----handleAddScreenArea source: ',areaScreenSource)
    ipcRenderer.send('area-capture',areaScreenSource?.position)
  }

  const addScreenAreaSource = (rect) => {
    console.log('----addScreenAreaSource rect: ',rect)
    let capScreenSources = rtcEngine?.getScreenCaptureSources({ width: 1920, height: 1080 }, { width: 64, height: 64 }, true)
    const areaScreenSource = capScreenSources?.find((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeScreen
    })
   // let ret1 = rtcEngine?.stopScreenCaptureBySourceType(VideoSourceType.VideoSourceScreenPrimary)
   // console.log('---stop screen capture ret1: ',ret1)

    let type = getShareScreenType();
    if(type == -1)
    {
      return
    }

    let ret = rtcEngine?.startScreenCaptureBySourceType(type,{
      isCaptureWindow: false,
      displayId: areaScreenSource!.sourceId,
      regionRect: { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
      params: {
        dimensions: { width: 1920, height: 1080 },
        bitrate: 1000,
        frameRate: 15,
        captureMouseCursor: false,
        windowFocus: false,
        excludeWindowList: [],
        excludeWindowCount: 0,
      }
    })
    // let ret = rtcEngine?.startScreenCaptureByDisplayId(
    //   areaScreenSource!.sourceId,
    //   { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
    //   {
    //     dimensions: { width: 1920, height: 1080 },
    //     bitrate: 1000,
    //     frameRate: 15,
    //     captureMouseCursor: false,
    //     windowFocus: false,
    //     excludeWindowList: [],
    //     excludeWindowCount: 0,
    //   }
    // )
    console.log('---addScreenAreaSource ret: ',ret)
    if (ret === 0) {
      let existIndex = transCodeSources.current.findIndex((item) => {
        //区域捕捉的窗口是全屏分享的窗口会Id一致
        return item.source.sourceType === type
        //return item.id === areaScreenSource!.sourceId
      })
      if (existIndex < 0) {
        transCodeSources.current.push({
          id: areaScreenSource!.sourceId,
          source: {
            sourceType: type,
            x: 0,
            y: 0,
            width: init_width,
            height: init_height,
            zOrder: transCodeSources.current.length+2,
            alpha: 1
          }
        })

        setScreenShareObjStatus(type, true)
      }
      handlePreview()
    } else {
      console.error('Capture Screen is failed')
    }

  } 

  const handleAddWindowSource = () => {
    let capScreenSources = rtcEngine?.getScreenCaptureSources({ width: 320, height: 160 }, { width: 80, height: 80 }, true)
    console.log('------capScreenSources: ',capScreenSources,'rtcEngine: ',rtcEngine)
    const capWinSources = capScreenSources!.filter((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeWindow
    }).map(item => {
      return {
        id: item.sourceId,
        sourceName: item.sourceName,
        thumbImage: item.thumbImage,
      }
    })
    if (capWinSources) {
      setCapWindowSources(capWinSources)
      setCapWinModalOpen(true)
    }
    console.log('----handleAddWindowSource capWinSources: ',capWinSources)
  }

  const handleAddScreenSource = () => {
    let capScreenSources = rtcEngine?.getScreenCaptureSources({ width: 320, height: 160 }, { width: 80, height: 80 }, true)
    console.log('------capScreenSources: ',capScreenSources,'rtcEngine: ',rtcEngine)
    const capWinSources = capScreenSources!.filter((item) => {
      return item.type === ScreenCaptureSourceType.ScreencapturesourcetypeScreen
    }).map(item => {
      return {
        id: item.sourceId,
        sourceName: item.sourceName,
        thumbImage: item.thumbImage,
      }
    })
    if (capWinSources.length > 1) {
      setCapScreenSources(capWinSources)
      setCapScreenModalOpen(true)
    }
    
    console.log('----handleAddWindowSource capWinSources: ',capWinSources)
    return capWinSources.length;
  }


  const handleAddMediaSource = (srcUrl: string, type: string) => {
    console.log('-----handleAddMediaSource srcUrl: ',srcUrl, 'type: ', type)
    let sourceType
    if (type === 'image') {
      if(srcUrl.endsWith('.png')) {
        sourceType = VideoSourceType.VideoSourceRtcImagePng
      } else {
        sourceType = VideoSourceType.VideoSourceRtcImageJpeg
      }
    } else if (type === 'gif') {
      sourceType = VideoSourceType.VideoSourceRtcImageGif
    } else if (type === 'video') {
      sourceType = VideoSourceType.VideoSourceMediaPlayer
    }
    if (type === 'image' || type === 'gif') {
      let existIndex = transCodeSources.current.findIndex((item) => {
        //return item.source.sourceType === type
        return item.id === srcUrl
      })
      if (existIndex < 0) {
        transCodeSources.current.push({
          id: srcUrl,
          source: {
            sourceType,
            x: 0,
            y: 0,
            width: init_width,
            height: init_height,
            zOrder: transCodeSources.current.length+2,
            alpha: 1,
            imageUrl: srcUrl
          }
        })
      }
    } else if (type === 'video') {
      if (!mediaPlayer.current) {
        createMediaPlayer()
      }
      let ret = mediaPlayer.current?.open(srcUrl,0)
      console.log('----mediaPlaye ret: ',ret)
      let sourceId = mediaPlayer.current!.getMediaPlayerId();
      console.log('-----sourceId: ', sourceId)
      let existIndex = transCodeSources.current.findIndex((item) => {
        //return item.source.sourceType === type
        return item.id === sourceId.toString()
      })
      if (existIndex < 0) {
        transCodeSources.current.push({
          id: sourceId.toString(),
          source: {
            sourceType,
            x: 0,
            y: 0,
            width: init_width,
            height: init_height,
            zOrder: transCodeSources.current.length+2,
            alpha: 1,
            mediaPlayerId: sourceId
          }
        })
      }
    }
    handlePreview()
  }

  const handleStopPreview = () => {
    console.log('--------handleStopPreview isPreview: ',isPreview)
    if (isPreview) {
      let ret = rtcEngine?.stopLocalVideoTranscoder()
      ret = rtcEngine?.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceTranscoded,
        view: null,
        uid: Config.uid,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      });
      transCodeSources.current = []
      setPreview(false)
      while (videoRef.current?.firstChild) {
        videoRef.current?.removeChild(videoRef.current?.firstChild);
      }
      rtcEngine?.stopPreview()
      console.log('--------stop localTranscoder ret: ',ret)
    }
  }

  const handlePreview = (newSources?: any) =>{
    console.log('------handlePreview source: ', transCodeSources.current)
    console.log('----isPreview: ',isPreview)
    if(!isPreview)
    {
      let ret = rtcEngine?.startLocalVideoTranscoder(calcTranscoderOptions(transCodeSources.current));
      console.log('-------startLocalVideoTranscoder ret: ',ret)
      ret = rtcEngine?.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceTranscoded,
        view: videoRef.current,
        uid: Config.uid,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      });
      console.log('--------setupLocalVideo ret: ',ret)
      setPreview(true)
    }
    else{
      let ret
      if (newSources) {
        ret = rtcEngine?.updateLocalTranscoderConfiguration(calcTranscoderOptions(newSources))
      } else {
        ret = rtcEngine?.updateLocalTranscoderConfiguration(calcTranscoderOptions(transCodeSources.current))
      }
      console.log('---updateLocalTranscoderConfiguration ret: ',ret)

    }
  }

  const calcTranscoderOptions = (sources: sourceType[]) => {
    let videoInputStreams = sources.map(s => {
      Object.assign({connectionId: 0}, s.source)
      return s.source
    }) 
    console.log('---videoInputStreams: ',videoInputStreams)
    //dimensions 参数设置输出的画面横竖屏
    console.log('-------calcTranscoderOptions isHorizontalRef: ',isHorizontalRef)
    let videoOutputConfigurationobj = {
      dimensions: isHorizontalRef.current ? { width: 1280, height: 720 } : { width: 720, height: 1280 },
      frameRate: 25,
      bitrate: 0,
      minBitrate: -1,
      orientationMode: 0,
      degradationPreference: 0,
      mirrorMode: 0
    }

    return {
      streamCount: sources.length,
      videoInputStreams: videoInputStreams,
      videoOutputConfiguration: videoOutputConfigurationobj
    }
  }

  const updateSelectedDeviceInfo = (data) => {
    setDeviceIndex(data.selectdDevice)
    setCapacityIndex(data.selectCap)
    setDevices((preDevices) => {
      const newDevices = [...preDevices]
      const device = newDevices[data.selectdDevice]
      if (device) {
        const capacity = device.capacity[data.selectCap]
        if (capacity) {
          capacity.modifyFps = parseInt(data.fps)
        }
      }
      console.log(newDevices)
      return newDevices
    })
  }
 
  const onLayoutClick = (e) => {
    console.log('-------id: ',e.target.id)
    if (e.target.id === 'horizontal' && !isHorizontal) {
      console.log('setIsHorizontal true')
      setIsHorizontal(true)
    }
    if (e.target.id === 'vertical') {
      console.log('setIsHorizontal false')
      setIsHorizontal(false)
    }
  }

  const handleOptClick = (e) => {
    console.log(e.target.id)
    console.log(`handleOptClick`)
    console.log(isAppIdExist)
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
    if (e.target.id === 'camera') {
      setIsCameraModalOpen(true)
    }
    if (e.target.id === 'virtual') {
      setVirtualBgModalOpen(true)
    }
  }

  const handleCameraModalOk = (data) => {
    console.log('-----handleCameraModalOk: ',data)
    updateSelectedDeviceInfo(data)
    handleAddCamera(data.selectdDevice, data.selectCap)
    setIsCameraModalOpen(false)
  }

  const handleCameraModalCancal = () => {
    setIsCameraModalOpen(false)
  }

  const handleVirtualBgModalCancal = () => {
    setVirtualBgModalOpen(false)
  }

  const handleCapWinModalCancel = () => {
    setCapWinModalOpen(false)
  }

  const handleCapScreenModalCancel = () => {
    setCapScreenModalOpen(false)
  }

  const handleSelectCaptureWinSource = (selectCapWin) => {
    console.log('-----handleSelectCaptureWInSource selectCapWin: ', selectCapWin)
    
    let type = getShareScreenType();
    if(type == -1)
    {
      return
    }

    let ret = rtcEngine?.startScreenCaptureBySourceType(type, {
      isCaptureWindow: true,
      windowId: selectCapWin.id,
      params: {
        dimensions: { width: 1920, height: 1080 },
        bitrate: 1000,
        frameRate: 15,
        captureMouseCursor: false,
        windowFocus: false,
        excludeWindowList: [],
        excludeWindowCount: 0,
      }
    })
    // let ret = rtcEngine?.startScreenCaptureByWindowId(
    //   selectCapWin.id,
    //   { width: 0, height: 0, x: 0, y: 0 },
    //   {
    //     dimensions: { width: 1920, height: 1080 },
    //     bitrate: 1000,
    //     frameRate: 15,
    //     captureMouseCursor: false,
    //     windowFocus: false,
    //     excludeWindowList: [],
    //     excludeWindowCount: 0,
    //   }
    // )
    console.log('------handleSelectCaptureWinSource ret: ',ret)
    if (ret == 0) {
      let newSource = {
        sourceType: type,
        x: 0,
        y: 0,
        width: init_width,
        height: init_width,
        zOrder: transCodeSources.current.length+2,
        alpha: 1
      }
      let existIndex = transCodeSources.current.findIndex((item) => {
        return item.id === selectCapWin.id
      })
      if (existIndex >= 0) {
        transCodeSources.current[existIndex].source = newSource
      } else {
        transCodeSources.current.push({
          id: selectCapWin.id,
          source: newSource
        })

        setScreenShareObjStatus(type, true)
      }
      handlePreview()
    } else {
      console.error('Transcode window failed!')
    }
    setCapWinModalOpen(false)
  }

  const handleSelectCaptureScreenSource = (selectCapWin) => {
    console.log('-----handleSelectCaptureWInSource selectCapWin: ', selectCapWin)
    
    let type = getShareScreenType();
    if(type == -1)
    {
      return
    }

    let ret = rtcEngine?.startScreenCaptureBySourceType(type, {
      isCaptureWindow: false,
      displayId: selectCapWin.id,
      params: {
        dimensions: { width: 1920, height: 1080 },
        bitrate: 1000,
        frameRate: 15,
        captureMouseCursor: false,
        windowFocus: false,
        excludeWindowList: [],
        excludeWindowCount: 0,
      }
    })

    console.log('------handleSelectCaptureWinSource ret: ',ret)
    if (ret == 0) {
      let newSource = {
        sourceType: type,
        x: 0,
        y: 0,
        width: init_width,
        height: init_width,
        zOrder: transCodeSources.current.length+2,
        alpha: 1
      }
      let existIndex = transCodeSources.current.findIndex((item) => {
        return item.id === selectCapWin.id
      })
      if (existIndex >= 0) {
        transCodeSources.current[existIndex].source = newSource
      } else {
        transCodeSources.current.push({
          id: selectCapWin.id,
          source: newSource
        })

        setScreenShareObjStatus(type, true)
      }
      handlePreview()
    } else {
      console.error('Transcode window failed!')
    }
    setCapScreenModalOpen(false)
  }

  const handleEnableGreenScreen = (isEnable) => {
    setEnableGreenScreen(isEnable)
  }

  const captureMenuOpenChange = (value) => {
    console.log('----handleOnOpenChange value: ',value)
    setCaptureMenuOpen(value)
  }

  const mediaMenuOpenChange = (value) => {
    console.log('----mediaMenuOpenChange value: ',value)
    setMediaMenuOpen(value)
  }

  const handleCaptureMenuClick = (e) => {
    console.log('-----handleCaptureMenuClick key: ',e.key)
    setCaptureMenuOpen(false)
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
    if (e.key === 'fullscreen') {
      //handleAddFullScreenSource()
      if(handleAddScreenSource() == 1)
          handleAddFullScreenSource()
    } else if (e.key === 'winCapture') {
      handleAddWindowSource()
    } else if (e.key === 'areaCapture') {
      //ipcRenderer.send('area-capture')
      handleAddScreenArea()
    }
  }

  const handleMediaMenuClick = (e) => {
    console.log('-----handleMediaMenuClick key: ',e.key)
    setMediaMenuOpen(false)
    if (!isAppIdExist) {
      message.info('请输入正确App ID')
      return
    }
    ipcRenderer.send('open-select-file-dialog', e.key)
  }

  const captureMenu = (
    <Menu onClick={handleCaptureMenuClick} items={[
      {key: 'winCapture', label: '窗口捕获'},
      {key: 'fullscreen', label: '全屏捕获'},
      {key: 'areaCapture', label: '区域捕获'},
    ]}/>
  )

  const mediaMenu = (
    <Menu onClick={handleMediaMenuClick} items={
      [
        {key: 'image', label: '静态图片(jpg/png)'},
        {key: 'gif', label: '动态图片(gif)'},
        {key: 'video', label: '视频(推荐使用声网mpk播放)'}
      ]
    }/>
  )

  const renderOptListItem = (item) => {
    if (item.id === 'camera' || item.id === 'virtual') {
      return (
        <div key={item.id} id={item.id} className={styles.item} onClick={handleOptClick}>
          <img src={`file://${item.imgUrl}`} alt="" style={{pointerEvents: 'none'}}/>
          <span style={{pointerEvents: 'none'}}>{item.title}</span>
        </div>
      )
    } else if (item.id === 'capture') {
      return (
        <div key={item.id} id={item.id} className={styles.item}>
          <img src={`file://${item.imgUrl}`} alt="" style={{pointerEvents: 'none'}}/>
          <div className={styles.desc}>
            <Dropdown
              trigger={['click']}
              onOpenChange={captureMenuOpenChange}
              overlay={captureMenu}>
              <div>
                <span className={styles.title}>{item.title}</span>
                {isCaptureMenuOpen ? <UpOutlined className={styles.arrow}/> : <DownOutlined className={styles.arrow}/>}
              </div>
            </Dropdown>
          </div>
        </div>
      ) 
    } else if (item.id === 'media') {
      return (
        <div key={item.id} id={item.id} className={styles.item}>
          <img src={`file://${item.imgUrl}`} alt="" style={{pointerEvents: 'none'}}/>
          <div className={styles.desc}>
            <Dropdown
              trigger={['click']}
              onOpenChange={mediaMenuOpenChange}
              overlay={mediaMenu}>
              <div>
                <span className={styles.title}>{item.title}</span>
                {isMediaMenuOpen ? <UpOutlined className={styles.arrow}/> : <DownOutlined className={styles.arrow}/>}
              </div>
            </Dropdown>
          </div>
        </div>
      ) 
    }
  }
  
  return (
    <div className={styles.livePreview}>
      <div className={styles.header}>
        <div className={styles.title}>直播预览</div>
        <div className={styles.layoutSetting} onClick={onLayoutClick}>
          <div id="horizontal" className={`${isHorizontal ? styles.active : ''} ${styles.button}`}>
            <span>横屏</span>
          </div>
          <div id="vertical" className={`${isHorizontal ? '' : styles.active} ${styles.button}`}>
            <span>竖屏</span>
          </div>
        </div>
      </div>
      <div className={isHorizontal ? styles.previewRow : styles.previewColum}>
        <div className={styles.area} id="video-wapper" ref={videoRef}></div>
        {
          (checkIndex>=0)&&(<SelectBox {...boxRect} resizingCallBack={updateResize} handleDelete={handleDelete} handleMoveDown={handleMoveDown} handleMoveUp={handleMoveUp}/>)
        }
        <div className={styles.options}>
          {
            optConfig.map(item => {
              return renderOptListItem(item)
            })
          }
        </div>
      </div>
      {isCameraModalOpen && (
        <CameraModal 
          isOpen={isCameraModalOpen} 
          onOk={handleCameraModalOk}
          deviceIndex={deviceIndex} 
          capacityIndex={capacityIndex} 
          devices={devices} 
          onCancel={handleCameraModalCancal}/>
      )}
      {isVirtualBgModalOpen && (
        <VirtualBackgroundModal
          onCancel={handleVirtualBgModalCancal}
          isHorizontal = { isHorizontal }
          enableGreenScreen = {enableGreenScreen}
          onGreenScreenCb = { handleEnableGreenScreen}
          isOpen={isVirtualBgModalOpen} />
      )}
      {isCapWinModalOpen && (
        <CaptureWinModal
          onCancel={handleCapWinModalCancel}
          onSelect={handleSelectCaptureWinSource}
          captureWinSources = {capWindowSources}
          isOpen={isCapWinModalOpen} />
      )}
       {isCapScreenModalOpen && (
        <CaptureWinModal
          onCancel={handleCapScreenModalCancel}
          onSelect={handleSelectCaptureScreenSource}
          captureWinSources = {capScreenSources}
          isOpen={isCapScreenModalOpen} />
      )}
    </div>
  )
}

export default LivePreview