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
import SelectBox from '../../components/SelectBox'

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
  const [checkIndex, setCheckIndex] = useState(-1)
  const sources = useRef<TranscodingVideoStream[]>([])
  const engine = useRef(createAgoraRtcEngine());
  const zoom = useRef(1)
  const selectIndex = useRef(-1)
  const lastPressPos = useRef({x:0,y:0})
  const [boxRect, setBoxRect] = useState({
    containerId: 'canvas-mask',
    top: 0,
    left: 0,
    width: 150,
    height: 150
  })
  

  const initEngine = () => {
    engine.current.initialize({
      appId: Config.appId,
      logConfig: { filePath: Config.SDKLogPath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });
    engine.current.enableVideo();
    engine.current.startPreview();
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
    canvas?.addEventListener('mousedown', handleMouseDown)
    canvas?.addEventListener('mousemove', handleMouseMove)
    canvas?.addEventListener('mouseup', handleMouseUp)
  }

  const createCanvasMask = (parentDom: HTMLDivElement,width: number,height: number) => {
    const mask = document.getElementById('canvas-mask')
    if (mask) {
      parentDom.removeChild(mask)
    }
    console.log('----createCanvasMask width, height, parent: ',width,height,parentDom)
    const dom = document.createElement('div')
    dom.id = 'canvas-mask'
    dom.style.position = 'absolute'
    dom.style.width = width.toString()+'px'
    dom.style.height = height.toString() + 'px'
    dom.style.pointerEvents = 'none'
    parentDom.insertBefore(dom, parentDom.firstChild)
    console.log('mask rect: ',dom.getBoundingClientRect())
  }

  const updateSelectBoxRect = (selectIndex, dx=0, dy=0) => {
    if (selectIndex >= 0) {
      console.log('updateSelectBoxRect dx: ',Math.floor(sources.current[selectIndex].x! * zoom.current)+dx)
      console.log('updateSelectBoxRect dy: ',Math.floor(sources.current[selectIndex].y! * zoom.current)+dy)
      setBoxRect({
        containerId: 'canvas-mask',
        left:  Math.floor((sources.current[selectIndex].x! + dx) * zoom.current),
        top: Math.floor((sources.current[selectIndex].y!+dy) * zoom.current),
        width: Math.floor(sources.current[selectIndex].width! * zoom.current),
        height: Math.floor(sources.current[selectIndex].height! * zoom.current)
      })
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
    setCheckIndex(index)
    updateSelectBoxRect(index,0,0)
    selectIndex.current = index
    console.log('----index: ',index)
    console.log(sources)
    //setSelectIndex(index)

  }

  const handleMouseMove = (e) => {
    if (selectIndex.current >= 0) {
      console.log('----handleMouseMove e: ',e.offsetX, e.offsetY)
      console.log('----mouse move lastPressPos: ',lastPressPos.current)
      let dx = e.offsetX - lastPressPos.current.x
      let dy = e.offsetY - lastPressPos.current.y
      updateSelectBoxRect(selectIndex.current, dx, dy)
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
      updateSelectBoxRect(selectIndex.current, dx, dy)
      console.log('------mouseup event lastSources: ', lastSources)
      sources.current = lastSources
      selectIndex.current = -1
    }
  }

  const handleOnClick = (e) => {
    setIsOpen(!isOpen)
  }

  const updateSources = (index: number, dx: number, dy: number) => {
    if (index >= 0) {
      let newSources = getNewSources(index,dx,dy)
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
      engine.current.setupLocalVideo({
        sourceType: VideoSourceType.VideoSourceCameraPrimary,
        view: video2Ref.current,
        mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
        renderMode: RenderModeType.RenderModeFit,
      });
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
    initEngine()
    return () => {
      console.log('unmonut component')
      setIsOpen(false)
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
        {
          (checkIndex>=0)&&<SelectBox {...boxRect}/>
        }
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