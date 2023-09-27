import React, { useState, useRef, useEffect, useContext } from "react"
import { app, ipcRenderer } from 'electron'
import styles from './livePreview.scss'
import {
  getResourcePath, checkAppId, getShareScreenType, calcTranscoderOptions,
  setScreenShareObjStatus, resetData, getCameraType, setCameraTypeStatus, transVideoSourceType,
  genBaseSource, isVideoSourceTypeCamera, isVideoSourceTypeScreen
} from '../../utils/index'
import CameraModal from '../CameraModal'
import VirtualBackgroundModal from '../VirtualBackgroundModal'
import CaptureWinModal from '../CaptureWinModal'
import SelectBox from '../SelectBox/index'
import {
  CameraCapturerConfiguration,
  VideoSourceType,
  VideoMirrorModeType,
  RenderModeType,
} from 'agora-electron-sdk'
import { useEngine, useMediaPlayer, useScreen, usePreview } from "../../utils/hooks"
import { SourceType } from "../../types"
import OptionsView from "../OptionsView"
import { MIN_HEIGHT, MIN_WIDTH, MAX_HEIGHT, MAX_WIDTH } from "../../utils/constant"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "../../store"
import { setTransCodeSources, addTransCodeSource, setIsHorizontal, setIsPreview } from "../../store/reducers/global"


const LivePreview: React.FC = () => {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [isVirtualBgModalOpen, setVirtualBgModalOpen] = useState(false)
  const [isCapWinModalOpen, setCapWinModalOpen] = useState(false)
  const [isCapScreenModalOpen, setCapScreenModalOpen] = useState(false)
  const [enableGreenScreen, setEnableGreenScreen] = useState(false)
  const [checkIndex, setCheckIndex] = useState(-1)
  const videoRef = useRef<HTMLDivElement>(null)
  const zoom = useRef(1)
  const { createMediaPlayer, getMediaPlayer, destroyMediaPlayer } = useMediaPlayer()
  const { initEngine, destoryEngine, rtcEngine } = useEngine()
  const { getCapScreenSources, getCapWinSources, startScreenCaptureBySourceType } = useScreen()
  const transCodeSources = useSelector((state: RootState) => state.global.transCodeSources)
  const isPreview = useSelector((state: RootState) => state.global.isPreview)
  const isHorizontal = useSelector((state: RootState) => state.global.isHorizontal)
  const appId = useSelector((state: RootState) => state.global.appId)
  const uid = useSelector((state: RootState) => state.global.uid)
  const devices = useSelector((state: RootState) => state.global.devices)
  const cameraIndex = useSelector((state: RootState) => state.global.cameraIndex)
  const capacityIndex = useSelector((state: RootState) => state.global.capacityIndex)
  const dispatch = useDispatch()
  // usePreview({
  //   videoRef
  // })

  console.log("devices", devices, typeof devices[0]?.capacity[0]?.fps)
  console.log("transCodeSources", transCodeSources)

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
      createMediaPlayer()
    }

    return () => {
      destroyMediaPlayer()
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
  }, [isPreview, isHorizontal])


  const updateCanvasConfig = () => {
    const canvas: any = videoRef.current?.querySelector('canvas')
    zoom.current = Number.parseFloat(canvas?.style.zoom || '1');
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
    const id = e.target.id
    if (id === 'canvas-mask') {
      let index = getSelectNode(e.offsetX, e.offsetY)
      console.log('handleMouseDown: ', index)
      setCheckIndex(index)
      updateSelectBoxRect(index, 0, 0, 0, 0)
    } else {
      if (id === 'delete') {
        handleDelete()
      } else if (id === 'moveUp') {
        handleMoveUp()
      } else if (id === 'moveDown') {
        handleMoveDown()
      } else if (id !== 'select-react') {
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
      const source = transCodeSources[selectIndex].source
      setBoxRect({
        ...boxRect,
        left: Math.floor((source.x! + dx) * zoom.current),
        top: Math.floor((source.y! + dy) * zoom.current),
        width: Math.floor((source.width!) * zoom.current + dw),
        height: Math.floor((source.height!) * zoom.current + dh)
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
      dispatch(setTransCodeSources(lastSources))
    }
  }

  const handleMoveUp = () => {
    if (checkIndex >= 0) {
      transCodeSources[checkIndex].source.zOrder! += 1
      dispatch(setTransCodeSources(transCodeSources))
      setCheckIndex(-1)
    }
  }

  const handleMoveDown = () => {
    console.log('------handleMoveDown: ', checkIndex)
    if (checkIndex >= 0 && transCodeSources[checkIndex].source.zOrder! >= 2) {
      transCodeSources[checkIndex].source.zOrder! = 1
      dispatch(setTransCodeSources(transCodeSources))
      setCheckIndex(-1)
    }
  }

  const handleDelete = () => {
    console.log('-----handleDelete: ', checkIndex)
    if (checkIndex >= 0) {
      const sourceType = transCodeSources[checkIndex].source.sourceType as VideoSourceType
      if (sourceType === VideoSourceType.VideoSourceMediaPlayer) {
        const mediaPlayer = getMediaPlayer()
        mediaPlayer?.stop()
      } else if (isVideoSourceTypeCamera(sourceType)) {
        rtcEngine?.stopCameraCapture(sourceType!)
        setCameraTypeStatus(sourceType, false)
      } else if (isVideoSourceTypeScreen(sourceType)) {
        rtcEngine?.stopScreenCaptureBySourceType(sourceType)
        setScreenShareObjStatus(sourceType, false)
      }
      let newSource = transCodeSources.filter((item, index) => {
        return index !== checkIndex
      })
      dispatch(setTransCodeSources(newSource))
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


  const handleAddCamera = () => {
    const camera = devices[cameraIndex]
    const capacity = camera.capacity[capacityIndex]
    let configuration: CameraCapturerConfiguration = {
      deviceId: camera.deviceId,
      format: {
        width: capacity.width,
        height: capacity.height,
        fps: capacity.fps
      }
    }
    let type = getCameraType()
    rtcEngine?.startCameraCapture(type, configuration)
    const source = genBaseSource()
    source.sourceType = type
    source.zOrder = transCodeSources.length + 2
    dispatch(addTransCodeSource({
      id: configuration.deviceId!,
      source: source
    }))
    setCameraTypeStatus(type, true)
    rtcEngine?.setupLocalVideo({
      sourceType: VideoSourceType.VideoSourceTranscoded,
      view: videoRef.current,
      uid: uid,
      mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
      renderMode: RenderModeType.RenderModeFit,
    });
    dispatch(setIsPreview(true))
  }

  const addScreenAreaSource = (rect) => {
    const sources = getCapScreenSources()
    let type = getShareScreenType();
    if (type == -1) {
      return
    }
    startScreenCaptureBySourceType(type, {
      isCaptureWindow: false,
      displayId: sources[0]!.sourceId,
      regionRect: { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
      params: {
        dimensions: { width: 1920, height: 1080 },
        bitrate: 1000,
        frameRate: 25,
        captureMouseCursor: false,
        windowFocus: false,
        excludeWindowList: [],
        excludeWindowCount: 0,
      }
    })
    let existIndex = transCodeSources.findIndex((item) => {
      //区域捕捉的窗口是全屏分享的窗口会Id一致
      return item.source.sourceType === type
      //return item.id === areaScreenSource!.sourceId
    })
    if (existIndex < 0) {
      const source = genBaseSource()
      source.sourceType = type
      source.zOrder = transCodeSources.length + 2,
        dispatch(addScreenAreaSource({
          id: sources[0]!.sourceId!.sourceId,
          source: source
        }))
      setScreenShareObjStatus(type, true)
    }
    dispatch(setIsPreview(true))
  }

  const handleAddMediaSource = (srcUrl: string, type: string) => {
    console.log('-----handleAddMediaSource srcUrl: ', srcUrl, 'type: ', type)
    let sourceType = transVideoSourceType(srcUrl, type)
    const source = genBaseSource()
    source.sourceType = sourceType
    source.zOrder = transCodeSources.length + 2
    if (type === 'image' || type === 'gif') {
      dispatch(addTransCodeSource({
        id: srcUrl,
        source: {
          ...source,
          imageUrl: srcUrl
        }
      }
      ))
    } else if (type === 'video') {
      const mediaPlayer = getMediaPlayer()
      mediaPlayer?.open(srcUrl, 0)
      let sourceId = mediaPlayer?.getMediaPlayerId();
      console.log('-----sourceId: ', sourceId)
      if (sourceId) {
        dispatch(addTransCodeSource({
          id: sourceId.toString(),
          source: {
            ...source,
            mediaPlayerId: sourceId
          }
        }))
        dispatch(setIsPreview(true))
      }
    }
  }

  // TODO: stop preview
  const stopPreview = () => {

  }

  // TODO: start preview
  const handlePreview = (newSources?: any) => {
    if (newSources) {
      dispatch(setTransCodeSources(newSources))
    }
  }


  const onLayoutClick = (e) => {
    if (e.target.id === 'horizontal') {
      dispatch(setIsHorizontal(true))
    } else if (e.target.id === 'vertical') {
      dispatch(setIsHorizontal(false))
    }
    resetData()
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

  const handleCameraModalOk = () => {
    handleAddCamera()
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
    startScreenCaptureBySourceType(type, {
      isCaptureWindow: true,
      windowId: source.id,
      params: {
        dimensions: { width: 1920, height: 1080 },
        bitrate: 1000,
        frameRate: 25,
        captureMouseCursor: false,
        windowFocus: false,
        excludeWindowList: [],
        excludeWindowCount: 0,
      }
    })
    const newSource = genBaseSource()
    newSource.sourceType = type
    newSource.zOrder = transCodeSources.length + 2
    const existIndex = transCodeSources.findIndex((item) => {
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
    dispatch(setTransCodeSources(transCodeSources))
    dispatch(setIsPreview(true))
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
