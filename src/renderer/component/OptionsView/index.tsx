import React, { useState, useRef, useEffect, useContext } from "react"
import { getResourcePath, checkAppId, getShareScreenType, setScreenShareObjStatus, transCodeSources } from '../../utils/index'
import { message, Dropdown, Menu } from 'antd'
import { useScreen } from "../../utils/hooks"
import RtcEngineContext from "../../context/rtcEngineContext"
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { app, ipcRenderer } from 'electron'
import styles from '../LivePreview/livePreview.scss'
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
import { MIN_HEIGHT, MIN_WIDTH, MAX_HEIGHT, MAX_WIDTH } from "../../utils/constant"


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


interface OptionsViewProps {
  handleOptClick: React.MouseEventHandler,
  handlePreview: () => void,
  setCapWinModalOpen: (v: boolean) => void,
  setCapScreenModalOpen: (v: boolean) => void
}


const OptionsView = ({
  handleOptClick,
  handlePreview,
  setCapWinModalOpen,
  setCapScreenModalOpen
}: OptionsViewProps) => {
  const { appId, uid, rtcEngine } = useContext(RtcEngineContext)
  const { getCapScreenSources } = useScreen()
  const [isCaptureMenuOpen, setCaptureMenuOpen] = useState(false)
  const [isMediaMenuOpen, setMediaMenuOpen] = useState(false)

  const captureMenuOpenChange = (value) => {
    setCaptureMenuOpen(value)
  }

  const mediaMenuOpenChange = (value) => {
    setMediaMenuOpen(value)
  }

  // 全屏分享
  const addFullScreenSource = () => {
    const sources = getCapScreenSources()
    if (sources.length > 1) {
      // 多全屏
      return setCapScreenModalOpen(true)
    }
    const fullScreenSource = sources[0]
    let type = getShareScreenType();
    if (type == -1) {
      return
    }
    let ret = rtcEngine?.startScreenCaptureBySourceType(type, {
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
    // /*
    // let ret = rtcEngine?.startScreenCaptureByDisplayId(
    //   fullScreenSource.sourceId,
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
    // )*/
    console.log('---startScreenCaptureByDisplayId ret: ', ret)
    if (ret === 0) {
      let existIndex = transCodeSources.findIndex((item) => {
        //return item.source.sourceType === type
        return item.id === fullScreenSource.sourceId
      })
      if (existIndex < 0) {
        transCodeSources.push({
          id: fullScreenSource.sourceId,
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
    ipcRenderer.send('area-capture', fullScreenSource?.position)
  }

  const handleCaptureMenuClick = (e) => {
    checkAppId(appId)
    setCaptureMenuOpen(false)
    if (e.key === 'fullscreen') {
      addFullScreenSource()
    } else if (e.key === 'winCapture') {
      setCapWinModalOpen(true)
    } else if (e.key === 'areaCapture') {
      addScreenArea()
    }
  }

  const addScreenArea = () => {
    const sources = getCapScreenSources()
    console.log('----handleAddScreenArea source: ', sources[0])
    ipcRenderer.send('area-capture', sources[0]?.position)
  }

  const handleMediaMenuClick = (e) => {
    checkAppId(appId)
    setMediaMenuOpen(false)
    ipcRenderer.send('open-select-file-dialog', e.key)
  }

  const captureMenu = (
    <Menu onClick={handleCaptureMenuClick} items={[
      { key: 'winCapture', label: '窗口捕获' },
      { key: 'fullscreen', label: '全屏捕获' },
      { key: 'areaCapture', label: '区域捕获' },
    ]} />
  )

  const mediaMenu = (
    <Menu onClick={handleMediaMenuClick} items={
      [
        { key: 'image', label: '静态图片(jpg/png)' },
        { key: 'gif', label: '动态图片(gif)' },
        { key: 'video', label: '视频(推荐使用声网mpk播放)' }
      ]
    } />
  )


  const renderOptListItem = (item) => {
    if (item.id === 'camera' || item.id === 'virtual') {
      return (
        <div key={item.id} id={item.id} className={styles.item} onClick={handleOptClick}>
          <img src={`file://${item.imgUrl}`} alt="" style={{ pointerEvents: 'none' }} />
          <span style={{ pointerEvents: 'none' }}>{item.title}</span>
        </div>
      )
    } else if (item.id === 'capture') {
      return (
        <div key={item.id} id={item.id} className={styles.item}>
          <img src={`file://${item.imgUrl}`} alt="" style={{ pointerEvents: 'none' }} />
          <div className={styles.desc}>
            <Dropdown
              trigger={['click']}
              onOpenChange={captureMenuOpenChange}
              overlay={captureMenu}>
              <div>
                <span className={styles.title}>{item.title}</span>
                {isCaptureMenuOpen ? <UpOutlined className={styles.arrow} /> : <DownOutlined className={styles.arrow} />}
              </div>
            </Dropdown>
          </div>
        </div>
      )
    } else if (item.id === 'media') {
      return (
        <div key={item.id} id={item.id} className={styles.item}>
          <img src={`file://${item.imgUrl}`} alt="" style={{ pointerEvents: 'none' }} />
          <div className={styles.desc}>
            <Dropdown
              trigger={['click']}
              onOpenChange={mediaMenuOpenChange}
              overlay={mediaMenu}>
              <div>
                <span className={styles.title}>{item.title}</span>
                {isMediaMenuOpen ? <UpOutlined className={styles.arrow} /> : <DownOutlined className={styles.arrow} />}
              </div>
            </Dropdown>
          </div>
        </div>
      )
    }
  }

  return <div className={styles.options}>{
    optConfig.map(item => {
      return renderOptListItem(item)
    })
  }</div>
}

export default OptionsView
