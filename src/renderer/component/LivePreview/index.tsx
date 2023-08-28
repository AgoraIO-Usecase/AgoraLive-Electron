import React, { useState, useRef, useEffect, useContext } from "react"
import { app, ipcRenderer } from 'electron'
import RtcEngineContext, { IAppContext } from "../../context/rtcEngineContext"
import styles from './livePreview.scss'
import {
  getResourcePath, checkAppId, getShareScreenType,
  setScreenShareObjStatus, resetData, getCameraType, setCameraTypeStatus,
  transCodeSources, resetTransCodeSources
} from '../../utils/index'
import { message, Dropdown, Menu } from 'antd'
import CameraModal from '../CameraModal'
import VirtualBackgroundModal from '../VirtualBackgroundModal'
import CaptureWinModal from '../CaptureWinModal'
import SelectBox from '../SelectBox/index'
import { debounce } from "lodash-es"
import {
  CameraCapturerConfiguration,
  VideoSourceType,
  VideoMirrorModeType,
  RenderModeType,
  IMediaPlayer,
  IMediaPlayerSourceObserver,
  MediaPlayerState,
  MediaPlayerError,
  ScreenCaptureSourceType
} from 'agora-electron-sdk'
import { useEngine, useMediaPlayer, useScreen } from "../../utils/hooks"
import { IDevice, SourceType, IDeviceCapacity } from "../../types"
import OptionsView from "../OptionsView"
import { MIN_HEIGHT, MIN_WIDTH, MAX_HEIGHT, MAX_WIDTH } from "../../utils/constant"


const LivePreview: React.FC = () => {
  const [isHorizontal, setIsHorizontal] = useState(true)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [isVirtualBgModalOpen, setVirtualBgModalOpen] = useState(false)
  const [isCapWinModalOpen, setCapWinModalOpen] = useState(false)
  const [isCapScreenModalOpen, setCapScreenModalOpen] = useState(false)
  // const [capScreenSources, setCapScreenSources] = useState<any>([])
  const [enableGreenScreen, setEnableGreenScreen] = useState(false)
  const [deviceIndex, setDeviceIndex] = useState(0)
  const [capacityIndex, setCapacityIndex] = useState(0)
  const [isPreview, setPreview] = useState(false)
  const [checkIndex, setCheckIndex] = useState(-1)
  const videoRef = useRef<HTMLDivElement>(null)
  const zoom = useRef(1)
  const { appId, uid } = useContext(RtcEngineContext)
  const { createMediaPlayer, mediaPlayer } = useMediaPlayer()
  const { initEngine, destoryEngine, rtcEngine, devices, updateDevices } = useEngine()
  const { getCapScreenSources, getCapWinSources } = useScreen()

  const [boxRect, setBoxRect] = useState({
    containerId: 'canvas-mask',
    top: 0,
    left: 0,
    width: MIN_WIDTH,
    height: MIN_HEIGHT
  })

  useEffect(() => {
    if (appId) {
      initEngine()
      setDeviceIndex(0)
      setCapacityIndex(0)
      createMediaPlayer()
    }

    return () => {
      destoryEngine()
    }

  }, [appId])


  useEffect(() => {
    registerIpcRenderEvent()
    window.addEventListener('mousedown', handleMouseDown)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      resetData()
    }
  }, [])

  useEffect(() => {
    if (isPreview) {
      setTimeout(() => {
        updateCanvasConfig()
      }, 2000);
    }
  }, [isPreview])

  useEffect(() => {
    handleStopPreview()
  }, [isHorizontal])


  const updateCanvasConfig = () => {
    console.log('----videoRef: ', videoRef.current)
    const canvas: any = videoRef.current?.querySelector('canvas')
    console.log('---canvas: ', canvas)
    zoom.current = Number.parseFloat(canvas?.style.zoom || '1');
    console.log('------zoom: ', zoom)
    const parentDom = videoRef.current?.querySelector('div')
    let width, height
    if (isHorizontal) {
      width = Math.floor(MAX_WIDTH * zoom.current)
      height = Math.floor(MAX_HEIGHT * zoom.current)
    } else {
      width = Math.floor(MAX_HEIGHT * zoom.current)
      height = Math.floor(MAX_WIDTH * zoom.current)
    }
    if (parentDom) {
      createCanvasMask(parentDom, width, height)
    }
  }

  const createCanvasMask = (parentDom: HTMLDivElement, width: number, height: number) => {
    const mask = document.getElementById('canvas-mask')
    if (mask) {
      //mask.removeEventListener('mousedown', handleMouseDown)
      parentDom.removeChild(mask)
    }
    console.log('----createCanvasMask width, height, parent: ', width, height, parentDom)
    const dom = document.createElement('div')
    dom.id = 'canvas-mask'
    dom.style.position = 'absolute'
    dom.style.width = width.toString() + 'px'
    dom.style.height = height.toString() + 'px'
    //dom.style.pointerEvents = 'none'

    //添加mousedown事件
    //dom.addEventListener('mousedown', handleMouseDown)
    parentDom.insertBefore(dom, parentDom.firstChild)
    console.log('mask rect: ', dom.getBoundingClientRect())
  }

  const handleMouseDown = (e) => {
    // console.log('----handleMouseDown offsetX: ', 'e.offsetY:', e.offsetY)
    // console.log('-------handleMouseDown id: ', e.target.id)
    if (e.target.id === 'canvas-mask') {
      let index = getSelectNode(e.offsetX, e.offsetY)
      console.log('----select index: ', index)
      setCheckIndex(index)
      updateSelectBoxRect(index, 0, 0, 0, 0)
      console.log('----index: ', index)
    } else {
      if (e.target.id === 'delete') {
        handleDelete()
      } else if (e.target.id === 'moveUp') {
        handleMoveUp()
      } else if (e.target.id === 'moveDown') {
        handleMoveDown()
      } else if (e.target.id !== 'select-react') {
        setCheckIndex(-1)
      }
    }
  }

  const getSelectNode = (posX, posY) => {
    let selectIndex = -1, zOrder = 0
    transCodeSources.forEach((item, index) => {
      let zoomX = Math.floor(item.source.x! * zoom.current)
      let zoomY = Math.floor(item.source.y! * zoom.current)
      let zoomW = Math.floor(item.source.width! * zoom.current)
      let zoomH = Math.floor(item.source.height! * zoom.current)
      if (posX >= zoomX && posY >= zoomY && posX <= (zoomX + zoomW) && posY <= (zoomY + zoomH)) {
        if (item.source.zOrder! >= zOrder) {
          selectIndex = index
          zOrder = item.source.zOrder!
        }
      }
    })
    return selectIndex
  }

  const updateSelectBoxRect = (selectIndex, dx = 0, dy = 0, dw = 0, dh = 0) => {
    if (selectIndex >= 0) {
      console.log('updateSelectBoxRect dx: ', Math.floor(transCodeSources[selectIndex].source.x! * zoom.current) + dx)
      console.log('updateSelectBoxRect dy: ', Math.floor(transCodeSources[selectIndex].source.y! * zoom.current) + dy)
      console.log('updateSelectBoxRect dw, dh: ', dw, dh)
      setBoxRect({
        ...boxRect,
        left: Math.floor((transCodeSources[selectIndex].source.x! + dx) * zoom.current),
        top: Math.floor((transCodeSources[selectIndex].source.y! + dy) * zoom.current),
        width: Math.floor((transCodeSources[selectIndex].source.width!) * zoom.current + dw),
        height: Math.floor((transCodeSources[selectIndex].source.height!) * zoom.current + dh)
      })
    }
  }

  const getNewSources = (selectIndex: number, x: number, y: number, dw: number, dh: number): SourceType[] => {
    let newSources: SourceType[] = transCodeSources.map((item, index) => {
      if (index === selectIndex) {
        let dx = Math.floor(x / zoom.current) - item.source.x!
        let dy = Math.floor(y / zoom.current) - item.source.y!
        console.log('----getNewSource dx, dy: ', dx, dy)
        console.log('----getNewSource dw, dh: ', dw, dh)
        return {
          id: item.id,
          source: {
            ...item.source,
            x: item.source.x! + dx,
            y: item.source.y! + dy,
            //width: item.width! + dw1,
            //height: item.height! + dh1
            width: item.source.width! + Math.floor(dw / zoom.current),
            height: item.source.height! + Math.floor(dh / zoom.current)
          }
        }
      }
      return item
    })
    console.log('-----getNewSources: ', newSources)
    return newSources
  }

  const updateSources = (index: number, x: number, y: number, dw: number, dh: number) => {
    if (index >= 0) {
      let newSources = getNewSources(index, x, y, dw, dh)
      console.log('----updateSources newSources: ', newSources)
      handlePreview(newSources)
    }
  }

  const updateResize = (x, y, dw, dh, isResizing) => {
    console.log('----updateResize x, y, dw, dh, isResizing: ', x, y, dw, dh, isResizing)
    if (isResizing) {
      updateSources(checkIndex, x, y, dw, dh)
    } else {
      let lastSources = getNewSources(checkIndex, x, y, dw, dh)
      transCodeSources = lastSources
      handlePreview()
    }
  }

  const handleMoveUp = () => {
    if (checkIndex >= 0) {
      transCodeSources[checkIndex].source.zOrder! += 1
      handlePreview()
      setCheckIndex(-1)
    }
  }

  const handleMoveDown = () => {
    console.log('------checkIndex: ', checkIndex)
    if (checkIndex >= 0 && transCodeSources[checkIndex].source.zOrder! >= 2) {
      transCodeSources[checkIndex].source.zOrder! = 1
      handlePreview()
      setCheckIndex(-1)
    }
  }

  const handleDelete = () => {
    console.log('-----handleDelete checkIndex: ', checkIndex)
    if (checkIndex >= 0) {
      if (transCodeSources[checkIndex].source.sourceType === VideoSourceType.VideoSourceMediaPlayer) {
        //destroyMediaPlayer()
        mediaPlayer?.stop()
      }
      if (transCodeSources[checkIndex].source.sourceType === VideoSourceType.VideoSourceCamera ||
        transCodeSources[checkIndex].source.sourceType === VideoSourceType.VideoSourceCameraSecondary) {
        //destroyMediaPlayer()
        //mediaPlayer.current?.stop()
        //rtcEngine?.stopPreview()
        rtcEngine?.stopCameraCapture(transCodeSources[checkIndex].source.sourceType!)
        setCameraTypeStatus(transCodeSources[checkIndex].source.sourceType, false)
      }
      if (transCodeSources[checkIndex].source.sourceType === VideoSourceType.VideoSourceScreenPrimary ||
        transCodeSources[checkIndex].source.sourceType === VideoSourceType.VideoSourceScreenSecondary ||
        transCodeSources[checkIndex].source.sourceType === VideoSourceType.VideoSourceScreenThird) {
        rtcEngine?.stopScreenCaptureBySourceType(transCodeSources[checkIndex].source.sourceType!)
        setScreenShareObjStatus(transCodeSources[checkIndex].source.sourceType, false)
      }
      let newSource = transCodeSources.filter((item, index) => {
        return index !== checkIndex
      })
      transCodeSources = newSource
      handlePreview()
      setCheckIndex(-1)
    }
  }

  const registerIpcRenderEvent = () => {
    ipcRenderer.on('get-file-path', (event, args) => {
      console.log('---------getFilePath path: ', args.filePaths[0])
      if (args.filePaths && args.filePaths.length > 0) {
        handleAddMediaSource(args.filePaths[0], args.type)
      }
    })
    ipcRenderer.on('capture-complete', (event, rect) => {
      console.log('----registerIpcRenderEvent capture-complete rect: ', rect)
      addScreenAreaSource(rect)
    })
  }


  const handleAddCamera = (selectIndex, selectCapIndex) => {
    console.log('---handleAddCamera', 'selectIndex: ', selectIndex, 'selectCapIndex: ', selectCapIndex)
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
    console.log('---configuration: ', configuration)
    let type = getCameraType()
    let ret = rtcEngine?.startCameraCapture(type, configuration)
    let existIndex = transCodeSources.findIndex((item) => {
      //return item.source.sourceType === type
      return item.id === configuration.deviceId
    })
    if (existIndex < 0) {
      transCodeSources.push({
        id: configuration.deviceId!,
        source: {
          sourceType: type,
          x: 0,
          y: 0,
          width: MIN_WIDTH,
          height: MIN_HEIGHT,
          zOrder: transCodeSources.length + 2,
          alpha: 1
        }
      })

      setCameraTypeStatus(type, true)
    }
    handlePreview()
  }

  const addScreenAreaSource = (rect) => {
    const sources = getCapScreenSources()
    let type = getShareScreenType();
    if (type == -1) {
      return
    }
    let ret = rtcEngine?.startScreenCaptureBySourceType(type, {
      isCaptureWindow: false,
      displayId: sources[0]!.sourceId,
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
    console.log('---addScreenAreaSource ret: ', ret)
    if (ret === 0) {
      let existIndex = transCodeSources.findIndex((item) => {
        //区域捕捉的窗口是全屏分享的窗口会Id一致
        return item.source.sourceType === type
        //return item.id === areaScreenSource!.sourceId
      })
      if (existIndex < 0) {
        transCodeSources.push({
          id: sources[0]!.sourceId!.sourceId,
          source: {
            sourceType: type,
            x: 0,
            y: 0,
            width: MIN_WIDTH,
            height: MIN_HEIGHT,
            zOrder: transCodeSources.length + 2,
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

  const handleAddMediaSource = (srcUrl: string, type: string) => {
    console.log('-----handleAddMediaSource srcUrl: ', srcUrl, 'type: ', type)
    let sourceType
    if (type === 'image') {
      if (srcUrl.endsWith('.png')) {
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
      let existIndex = transCodeSources.findIndex((item) => {
        //return item.source.sourceType === type
        return item.id === srcUrl
      })
      if (existIndex < 0) {
        transCodeSources.push({
          id: srcUrl,
          source: {
            sourceType,
            x: 0,
            y: 0,
            width: MIN_WIDTH,
            height: MIN_HEIGHT,
            zOrder: transCodeSources.length + 2,
            alpha: 1,
            imageUrl: srcUrl
          }
        })
      }
    } else if (type === 'video') {
      let ret = mediaPlayer?.open(srcUrl, 0)
      console.log('----mediaPlaye ret: ', ret)
      let sourceId = mediaPlayer?.getMediaPlayerId();
      console.log('-----sourceId: ', sourceId)
      let existIndex = transCodeSources.findIndex((item) => {
        //return item.source.sourceType === type
        return item.id === sourceId?.toString()
      })
      if (existIndex < 0) {
        transCodeSources.push({
          id: sourceId?.toString() || "",
          source: {
            sourceType,
            x: 0,
            y: 0,
            width: MIN_WIDTH,
            height: MIN_HEIGHT,
            zOrder: transCodeSources.length + 2,
            alpha: 1,
            mediaPlayerId: sourceId
          }
        })
      }
    }
    handlePreview()
  }

  const handleStopPreview = () => {
    if (isPreview) {
      let ret = rtcEngine?.stopLocalVideoTranscoder()
      ret = rtcEngine?.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceTranscoded,
        view: null,
        uid: uid,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      });
      resetTransCodeSources()
      setPreview(false)
      while (videoRef.current?.firstChild) {
        videoRef.current?.removeChild(videoRef.current?.firstChild);
      }
      rtcEngine?.stopPreview()
    }
  }

  const handlePreview = (newSources?: any) => {
    if (!isPreview) {
      let ret = rtcEngine?.startLocalVideoTranscoder(calcTranscoderOptions(transCodeSources));
      console.log('-------startLocalVideoTranscoder ret: ', ret)
      ret = rtcEngine?.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceTranscoded,
        view: videoRef.current,
        uid: uid,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      });
      console.log('--------setupLocalVideo ret: ', ret)
      setPreview(true)
    } else {
      let ret
      if (newSources) {
        ret = rtcEngine?.updateLocalTranscoderConfiguration(calcTranscoderOptions(newSources))
      } else {
        ret = rtcEngine?.updateLocalTranscoderConfiguration(calcTranscoderOptions(transCodeSources))
      }
      console.log('---updateLocalTranscoderConfiguration ret: ', ret)
    }
  }

  const calcTranscoderOptions = (sources: SourceType[]) => {
    let videoInputStreams = sources.map(s => {
      Object.assign({ connectionId: 0 }, s.source)
      return s.source
    })
    console.log('---videoInputStreams: ', videoInputStreams)
    //dimensions 参数设置输出的画面横竖屏
    let videoOutputConfigurationobj = {
      dimensions: isHorizontal ? { width: 1280, height: 720 } : { width: 720, height: 1280 },
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
    setDeviceIndex(data.selectedDevice)
    setCapacityIndex(data.selectCap)
    updateDevices(data)
  }

  const onLayoutClick = (e) => {
    if (e.target.id === 'horizontal') {
      setIsHorizontal(true)
    } else if (e.target.id === 'vertical') {
      setIsHorizontal(false)
    }
  }

  const handleOptClick = (e) => {
    checkAppId(appId)
    if (e.target.id === 'camera') {
      setIsCameraModalOpen(true)
    }
    if (e.target.id === 'virtual') {
      setVirtualBgModalOpen(true)
    }
  }

  const handleCameraModalOk = (data) => {
    console.log('-----handleCameraModalOk: ', data)
    updateSelectedDeviceInfo(data)
    handleAddCamera(data.selectedDevice, data.selectCap)
    setIsCameraModalOpen(false)
  }

  const handleCameraModalCancal = () => {
    setIsCameraModalOpen(false)
  }

  const handleVirtualBgModalCancal = () => {
    setVirtualBgModalOpen(false)
  }

  const handleSelectSource = (source) => {
    let type = getShareScreenType();
    if (type == -1) {
      return
    }
    let ret = rtcEngine?.startScreenCaptureBySourceType(type, {
      isCaptureWindow: true,
      windowId: source.id,
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
    console.log('------handleSelectCaptureWinSource ret: ', ret)
    if (ret == 0) {
      let newSource = {
        sourceType: type,
        x: 0,
        y: 0,
        width: MIN_WIDTH,
        height: MIN_WIDTH,
        zOrder: transCodeSources.length + 2,
        alpha: 1
      }
      let existIndex = transCodeSources.findIndex((item) => {
        return item.id === source.id
      })
      if (existIndex >= 0) {
        transCodeSources[existIndex].source = newSource
      } else {
        transCodeSources.push({
          id: source.id,
          source: newSource
        })
        setScreenShareObjStatus(type, true)
      }
      handlePreview()
    } else {
      console.error('Transcode window failed!')
    }
    setCapWinModalOpen(false)
    setCapScreenModalOpen(false)
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
        <div className={styles.area} ref={videoRef}></div>
        <OptionsView
          setCapWinModalOpen={setCapWinModalOpen}
          setCapScreenModalOpen={setCapScreenModalOpen}
          handleOptClick={handleOptClick}
          handlePreview={handlePreview}></OptionsView>
        {
          checkIndex >= 0 &&
          <SelectBox {...boxRect}
            resizingCallBack={updateResize}
            handleDelete={handleDelete}
            handleMoveDown={handleMoveDown}
            handleMoveUp={handleMoveUp} />
        }
      </div>
      {isCameraModalOpen && (
        <CameraModal
          isOpen={isCameraModalOpen}
          onOk={handleCameraModalOk}
          deviceIndex={deviceIndex}
          capacityIndex={capacityIndex}
          devices={devices}
          onCancel={handleCameraModalCancal} />
      )}
      {isVirtualBgModalOpen && (
        <VirtualBackgroundModal
          onCancel={handleVirtualBgModalCancal}
          isHorizontal={isHorizontal}
          enableGreenScreen={enableGreenScreen}
          onGreenScreenCb={isEnable => setEnableGreenScreen(isEnable)}
          isOpen={isVirtualBgModalOpen} />
      )}
      {/* 窗口分享 */}
      {isCapWinModalOpen && (
        <CaptureWinModal
          type="window"
          onCancel={() => setCapWinModalOpen(false)}
          onSelect={handleSelectSource}
          isOpen={isCapWinModalOpen} />
      )}
      {/* 整个屏幕分享 */}
      {isCapScreenModalOpen && (
        <CaptureWinModal
          type="screen"
          onCancel={() => setCapScreenModalOpen(false)}
          onSelect={handleSelectSource}
          isOpen={isCapScreenModalOpen} />
      )}
    </div>
  )
}

export default LivePreview
