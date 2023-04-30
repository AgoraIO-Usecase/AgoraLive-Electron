import React, { useState, useRef, useEffect, useMemo } from 'react'
import Config from '../../config/agora.config'
import styles from './combination.scss'
import { List } from 'antd'
import {
  createAgoraRtcEngine,
  IMediaPlayer,
  IRtcEngineEx,
  RenderModeType,
  RtcConnection,
  VideoCanvas,
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

function throttle<T extends any[]>(
  func: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: T) {
    if (timerId === null) {
      timerId = setTimeout(() => {
        func.apply(this, args);
        timerId = null;
      }, delay);
    }
  };
}

const Combination: React.FC = () => {
  const video1Ref = useRef<HTMLDivElement>(null)
  const video2Ref = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  //const [sources, setSources] = useState<TranscodingVideoStream[]>([])
  //const [selectIndex, setSelectIndex] = useState(-1)
  const sources = useRef<TranscodingVideoStream[]>([])
  const engine = useRef(createAgoraRtcEngine());
  const isMounted = useRef(false);
  const zoom = useRef(0)
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

  const getVideo1React = () => {
    let rect = video1Ref.current?.getBoundingClientRect()
    
    let canavsDom = video1Ref.current?.querySelector('canvas')
    zoom.current = canavsDom?.style.zoom
    console.log('------zoom: ',zoom)
    //let canavsDom = video1Ref.current
    console.log('----children: ', video1Ref.current?.children)
    console.log('----canvas: ',canavsDom?.style)
    console.log('----canvas top: ',canavsDom?.offsetTop)
    console.log('----canvas left: ',canavsDom?.offsetLeft)

    canavsDom?.addEventListener('mousedown', handleMouseDown)
    canavsDom?.addEventListener('mousemove', handleMouseMove)
    canavsDom?.addEventListener('mouseup', handleMouseUp)

    //let style = canavsDom.offsetLeft

    const elem = document.createElement('div');
    elem.className = 'compositeMask'
    elem.style.position = 'absolute'
    //elem.style.top = (canavsDom.offsetTop * 0.527778).toString()
    //elem.style.left = (canavsDom.offsetLeft * 0.527778).toString()
    elem.style.bottom = '0'
    elem.style.right = '0'
    elem.style.opacity = '0.3'
    elem.style.backgroundColor = '#00ffff'
    elem.style.width = '1280px'
    elem.style.height = '720px'
    //elem.style.zoom = '0.527778'
    elem.style.zIndex = '2'
    elem.addEventListener('mousedown', handleMouseDown)
    elem.addEventListener('mousemove', handleMouseMove)
    elem.addEventListener('mouseup', handleMouseUp)
    //canavsDom?.insertAdjacentElement('beforebegin', elem);
    //let attributes = children[0]?.attributes
    //let style = attributes.getNamedItem('style')
    //console.log('-----attributes: ',attributes)
    //console.log('-----style: ',style)
    console.log('-----children: ',canavsDom)
    console.log('-----rect: ',rect)
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
    console.log('-----1111111111111')
    const  width = 300,
           height = 300;
    const streams: TranscodingVideoStream[] = []
    streams.push({
      sourceType: MediaSourceType.PrimaryCameraSource
    })
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test1Url,
    });
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test2Url,
    });
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test3Url,
    });
    streams.push({
      sourceType: MediaSourceType.RtcImageJpegSource,
      imageUrl: test4Url,
    });

    streams.map((value, index) => {
      const maxNumPerRow = Math.floor(max_width / width);
      const numOfRow = Math.floor(index / maxNumPerRow);
      const numOfColumn = Math.floor(index % maxNumPerRow);
      value.x = numOfColumn * width;
      value.y = numOfRow * height;
      //value.x = 0;
      //value.y = 0;
      value.width = width;
      value.height = height;
      value.zOrder = 1;
      value.alpha = 1;
      value.mirror = true;
    });

    //setSources(streams)
    sources.current = streams
    

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
    if (selectIndex.current !== -1) {
      console.log('----handleMouseMove e: ',e)
      console.log('----mouse move lastPressPos: ',lastPressPos.current)
    }
    //let dx = Math.abs(e.offsetX - lastPressPos.current.x)
    //let dy = Math.abs(e.offsetY - lastPressPos.current.y)
    updateSources(selectIndex.current, e.offsetX, e.offsetY)
    //const throttledFunc = throttle(updateSources, 200);
    //throttledFunc(selectIndex.current, e.offsetX, e.offsetY)
    //updateSources(selectIndex.current, dx, dy)

  }

  const handleMouseUp = (e) => {
    console.log('----handleMouseUp e: ',e)
    selectIndex.current = -1
  }

  const handleOnClick = (e) => {
    console.log('eeeeee')
    let config = getLocalTransConfig()
    console.log('----config: ',config)
    engine.current.startLocalVideoTranscoder(config)
    setIsOpen(!isOpen)
  }

  const updateSources = (index: number, posX: number, posY: number) => {
    let newSources = [...sources.current]
    if (index >= 0) {
      console.log('updateSource index: ', index)
      newSources[index].x = posX
      newSources[index].y = posY
      newSources[index].zOrder = 2
      let config ={
        streamCount: newSources.length,
        VideoInputStreams: newSources,
        videoOutputConfiguration: {
          dimensions: { width: max_width, height: max_height },
        },
      }
      console.log('updateSource config: ', config)
      engine.current.updateLocalTranscoderConfiguration(config)
      //setSources(newSources)
      sources.current = newSources
    }
  }

  const getSelectNode = (posX, posY) => {
    let index = sources.current.findIndex((item) => {
      let zoomX = Math.floor(item.x!*zoom.current)
      let zoomY = Math.floor(item.y!*zoom.current)
      let zoomW = Math.floor(item.width!*zoom.current)
      let zoomH = Math.floor(item.height!*zoom.current)
      return (posX >= zoomX && posY >= zoomY && posX <= (zoomX + zoomW) && posY <= (zoomY + zoomH))
    })
    return index
  }

  const updateLocalTranscoderConfiguration = (source) => {

  }

  useEffect(() => {
    console.log('-----isOpen: ',isOpen)
    console.log('--isMount: ',isMounted.current)
    if (isMounted.current) {
      updateDisplayRender()
      setTimeout(() => {
        getVideo1React()
      },500)
      //getVideo1React()
    }
  },[isOpen])

  useEffect(() => {
    isMounted.current = true
    initEngine()
    return () => {
      console.log('unmonut component')
      isMounted.current = false
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