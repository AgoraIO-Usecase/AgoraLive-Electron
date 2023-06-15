import React, { useState, useRef, useEffect, useContext } from "react"
import RtcEngineContext, { IAppContext } from "../../context/rtcEngineContext"
import styles from './livePreview.scss'
import { getResourcePath } from '../../utils/index'
import { DownOutlined,UpOutlined } from '@ant-design/icons'
import { message } from 'antd'
import CameraModal from '../CameraModal'
import Config from '../../config/agora.config'
import { 
  CameraCapturerConfiguration,
  VideoSourceType,
  VideoMirrorModeType, 
  RenderModeType,
  TranscodingVideoStream  
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

const LivePreview: React.FC = () => {
  console.log('----render LivePreview')
  const [isHorizontal, setIsHorizontal] = useState(true)
  const [isVertical, setIsVertical] = useState(false)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false)
  const [devices, setDevices] = useState<IDevice[]>([])
  const [sources, setSources] = useState<TranscodingVideoStream[]>([])
  const [deviceIndex, setDeviceIndex] = useState(0)
  const [capacityIndex, setCapacityIndex] = useState(0)
  const [isPreview, setPreviewState] = useState(false)
  const [isFirstCameraOpen, setFirstCameraState] = useState(false)
  const [isFirstScreenOpen, setFirstScreenState] = useState(false)
  const videoRef = useRef(null)
  const {rtcEngine, isAppIdExist, appId} = useContext(RtcEngineContext) as IAppContext

  useEffect(() => {
    if (isAppIdExist && appId.length > 0) {
      console.log('------Agora Engine init success')
      setDeviceIndex(0)
      setCapacityIndex(0)
      enumerateDevices()
    }
  },[isAppIdExist, appId])

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
      newDevices.push({
        deviceName: 'chenxmm',
        deviceId: 'chensa13ycjsajjsh',
        capacity: [
          {width: 1330, height: 900, fps: 50, modifyFps: 50},
          {width: 1980, height: 1330, fps: 150, modifyFps: 150}
        ]
      })
      console.log('----newDevices: ',newDevices)
      setDevices(newDevices)
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
    let type = isFirstCameraOpen ? VideoSourceType.VideoSourceCameraSecondary : VideoSourceType.VideoSourceCameraPrimary
    let ret = rtcEngine?.startCameraCapture(type, configuration)
    console.log('-----ret: ',ret)
    console.log('-----videoRef: ',videoRef.current)
    // try {
    //   rtcEngine?.destroyRendererByView(videoRef.current);
    // } catch (e) {
    //   console.error(e);
    // }

    if(!isFirstCameraOpen)
    {
      setFirstCameraState(type==VideoSourceType.VideoSourceCameraPrimary);
    }
      
    // let newSrc:TranscodingVideoStream[] = []
    // newSrc.push({
    //   sourceType: type,
    //   x: 0,
    //   y: 0,
    //   width: devices[selectIndex].capacity[selectCapIndex].width,
    //   height: devices[selectIndex].capacity[selectCapIndex].height,
    //   zOrder: 1,
    //   alpha: 1
    // })
    // setSources(newSrc)
    sources.push({
      sourceType: type,
      x: 0,
      y: 0,
      width: devices[selectIndex].capacity[selectCapIndex].width,
      height: devices[selectIndex].capacity[selectCapIndex].height,
      zOrder: 1,
      alpha: 1
    })

    handlePreview();
  }

  const handleAddScreen = (data) =>{

    let type = isFirstScreenOpen ? VideoSourceType.VideoSourceScreenSecondary : VideoSourceType.VideoSourceScreenPrimary
    if(data.isDisplay)
    {
      let config = {
        isCaptureWindow: false,
        displayId: data.windowId,
        ScreenCaptureParameters:{frameRate:15}
      }
      
      let ret = rtcEngine?.startScreenCaptureBySourceType(type, config);
    }
    else{
      let config = {
        isCaptureWindow: true,
        windowId: data.windowId,
        ScreenCaptureParameters:{frameRate:15}
      }

      let ret = rtcEngine?.startScreenCaptureBySourceType(type, config);
    }

    sources.push({
      sourceType: type,
      x: 0,
      y: 0,
      width: data.width,
      height: data.length,
      zOrder: 1,
      alpha: 1
    })

    handlePreview();
  }

  const handleScreenModalOk = (data) => {
    handleAddScreen(data)
    setIsScreenModalOpen(false)
  }

  const handleScreenModalCancal = () => {
    setIsScreenModalOpen(false)
  }

  const handlePreview = () =>{
    if(!isPreview)
    {
      let ret = rtcEngine?.startLocalVideoTranscoder(calcTranscoderOptions(sources));

      ret = rtcEngine?.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceTranscoded,
        view: videoRef.current,
        uid: Config.uid,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      });

      setPreviewState(true);
    }
    else{
      rtcEngine?.updateLocalTranscoderConfiguration(calcTranscoderOptions(sources));
    }
  }

  const calcTranscoderOptions = (sources) => {
    let videoInputStreams = sources.map(s => {
      return Object.assign({connectionId: 0}, s)
    }) 
    //dimensions 参数设置输出的画面横竖屏
    let videoOutputConfigurationobj = {
      dimensions: isHorizontal ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 },
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
    if (e.target.id === 'horizontal' && !isHorizontal) {
      setIsHorizontal(true)
      setIsVertical(false)
    }
    if (e.target.id === 'vertical' && !isVertical) {
      setIsHorizontal(false)
      setIsVertical(true)
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
    if (e.target.id === 'capture') {
      setIsScreenModalOpen(true)
    }
    if (e.target.id === 'media') {

    }
    if (e.target.id === 'virtual') {

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

  const renderOptListItem = (item) => {
    if (item.id === 'camera' || item.id === 'virtual') {
      return (
        <div key={item.id} id={item.id} className={styles.item} onClick={handleOptClick}>
          <img src={`file://${item.imgUrl}`} alt="" style={{pointerEvents: 'none'}}/>
          <span style={{pointerEvents: 'none'}}>{item.title}</span>
        </div>
      )
    } else {
      return (
        <div key={item.id} id={item.id} className={styles.item} onClick={handleOptClick}>
          <img src={`file://${item.imgUrl}`} alt="" style={{pointerEvents: 'none'}}/>
          <div className={styles.desc} style={{pointerEvents: 'none'}}>
            <span className={styles.title}>{item.title}</span>
            <DownOutlined className={styles.arrow}/>
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
          <div id="vertical" className={`${isVertical ? styles.active : ''} ${styles.button}`}>
            <span>竖屏</span>
          </div>
        </div>
      </div>
      <div className={isHorizontal ? styles.previewRow : styles.previewColum}>
        <div className={styles.area} id="videoWapper" ref={videoRef}></div>
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
    </div>
  )
}

export default LivePreview