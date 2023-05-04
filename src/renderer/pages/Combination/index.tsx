import React, { useState, useRef, useEffect } from 'react'
import Config from '../../config/agora.config'
import styles from './combination.scss'
import {
  createAgoraRtcEngine,
  RenderModeType,
  VideoMirrorModeType,
  VideoSourceType,
  MediaSourceType,
  ChannelProfileType,
  TranscodingVideoStream
} from 'agora-electron-sdk';
import { getResourcePath } from '../../utils/index';
import test1 from '../../assets/images/test1.jpg';
import test2 from '../../assets/images/test2.jpg';
import test3 from '../../assets/images/test3.jpg';
import test4 from '../../assets/images/test4.jpg';

const test1Url = getResourcePath('test1.jpg')
const test2Url = getResourcePath('test2.jpg')
const test3Url = getResourcePath('test3.jpg')
const test4Url = getResourcePath('test4.jpg')
const max_width = 1280
const max_height = 720

const Combination: React.FC = () => {
  const video1Ref = useRef<HTMLDivElement>(null)
  const video2Ref = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const sources = useRef<TranscodingVideoStream[]>([])
  const engine = useRef(createAgoraRtcEngine());
  const isMounted = useRef(false);
  const zoom = useRef(1)
  const selectIndex = useRef(-1)
  const lastPressPos = useRef({x:0,y:0})
  

  const initEngine = () => {
    engine.current.initialize({
      appId: Config.appId,
      logConfig: { filePath: Config.SDKLogPath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });
    engine.current.enableVideo();
    engine.current.startPreview();
    engine.current.setupLocalVideo({
      sourceType: VideoSourceType.VideoSourceCameraPrimary,
      view: video1Ref.current,
      mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
      renderMode: RenderModeType.RenderModeFit,
    });
    engine.current.setupLocalVideo({
      sourceType: VideoSourceType.VideoSourceCameraPrimary,
      view: video2Ref.current,
      mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
      renderMode: RenderModeType.RenderModeFit,
    });
  }

  const updateCanvasConfig = () => {
    
    const canvas:any = video1Ref.current?.querySelector('canvas')
    zoom.current = Number.parseFloat(canvas?.style.zoom || '1');
    console.log('------zoom: ',zoom)

    canvas?.addEventListener('mousedown', handleMouseDown)
    canvas?.addEventListener('mousemove', handleMouseMove)
    canvas?.addEventListener('mouseup', handleMouseUp)
  }

  const updateDisplayRender = () => {
    console.log('---updateDisplayRender: ', isOpen)
    try {
      engine.current.destroyRendererByView(video1Ref.current);
    } catch (e) {
      console.error(e);
    }

    if (isOpen) {
      engine.current.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceTranscoded,
        view: video1Ref.current,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      });
    } else {
      engine.current.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceCameraPrimary,
        view: video1Ref.current,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      });
    }
  }

  const getLocalTransConfig = ()=> {
    const  width = 300,
           height = 300
    const streams: TranscodingVideoStream[] = []
    streams.push({
      sourceType: MediaSourceType.PrimaryCameraSource
    })
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test1Url,
    })
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test2Url,
    })
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test3Url,
    })
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test4Url,
    })

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

  const handleMouseDown = (e) => {
    console.log('----handleMouseDown e: ',e)
    selectIndex.current = -1
    lastPressPos.current.x = e.offsetX
    lastPressPos.current.y = e.offsetY
    let index = getSelectNode(e.offsetX, e.offsetY)
    selectIndex.current = index
    console.log('----index: ',index)
    console.log('----mouse down lastPressPos: ',lastPressPos.current)
    console.log(sources)
    //setSelectIndex(index)

  }

  const handleMouseMove = (e) => {
    if (selectIndex.current >= 0) {
      console.log('----handleMouseMove e: ',e.offsetX, e.offsetY)
      console.log('----mouse move lastPressPos: ',lastPressPos.current)
      let dx = e.offsetX - lastPressPos.current.x
      let dy = e.offsetY - lastPressPos.current.y
      updateSources(selectIndex.current, dx, dy)
    }
  }

  const handleMouseUp = (e) => {
    if (selectIndex.current >= 0) {
      console.log('----handleMouseUp e: ',e)
      let dx = e.offsetX - lastPressPos.current.x
      let dy = e.offsetY - lastPressPos.current.y
      let lastSources = getNewSources(selectIndex.current, dx, dy)
      let config = {
        streamCount: lastSources.length,
        VideoInputStreams: lastSources,
        videoOutputConfiguration: {
          dimensions: { width: max_width, height: max_height },
        },
      }
      engine.current.updateLocalTranscoderConfiguration(config)
      console.log('------mouseup event lastSources: ', lastSources)
      sources.current = lastSources
      selectIndex.current = -1
    }
  }

  const handleOnClick = (e) => {
    let config = getLocalTransConfig()
    console.log('----config: ',config)
    engine.current.startLocalVideoTranscoder(config)
    setIsOpen(!isOpen)
  }

  const updateSources = (index: number, dx: number, dy: number) => {
    if (index >= 0) {
      let newSources = getNewSources(index,dx,dy)
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

  const getNewSources = (selectIndex: number, dx: number, dy: number):TranscodingVideoStream[] => {
    let newSources = sources.current.map((item, index) => {
      if (index === selectIndex) {
        return {
          ...item,
          x: item.x! + dx,
          y: item.y! + dy
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
        if (item.zOrder! > zOrder) {
          selectIndex = index
          zOrder = item.zOrder!
        }
      }
    })
    return selectIndex
  }

  useEffect(() => {
    console.log('-----isOpen: ',isOpen)
    console.log('--isMount: ',isMounted.current)
    if (isMounted.current) {
      updateDisplayRender()
      setTimeout(() => {
        updateCanvasConfig()
      },500)
    }
  },[isOpen])

  useEffect(() => {
    isMounted.current = true
    initEngine()
    return () => {
      console.log('unmonut component')
      isMounted.current = false
      const canvas = video1Ref.current?.querySelector('canvas')
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown)
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseup', handleMouseUp)
      }
      engine.current.release()
    }
  }, [])

  return (
    <div>
      <h3 style={{textAlign:'center'}}>Function Show</h3>
      <div className={styles.display}>
        <div className='video1' ref={video1Ref} style={{height:'100%'}}></div>
      </div>
      <h3 style={{textAlign:'center'}}>Materal Show</h3>
      <div className={styles.material}>
        <div ref={video2Ref} style={{ width:'120px', height:'120px'}}></div>
        <img src={test1} style={{width: '120px',height:'120px',margin:'0 10px'}}></img>
        <img src={test2} style={{width: '120px',height:'120px',margin:'0 10px'}}></img>
        <img src={test3} style={{width: '120px',height:'120px',margin:'0 10px'}}></img>
        <img src={test4} style={{width: '120px',height:'120px',margin:'0 10px'}}></img>
      </div>
      <div style={{ marginTop:'10px', display:'flex', justifyContent:'center' }}>
        <button onClick={handleOnClick}>{isOpen ? 'Stop Composite Picture': 'Start Composite Picture'}</button>
      </div>
    </div>
  )
}

export default Combination