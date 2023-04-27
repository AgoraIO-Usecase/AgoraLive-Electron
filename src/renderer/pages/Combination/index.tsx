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

const Combination: React.FC = () => {
  const video1Ref = useRef<HTMLDivElement>(null)
  const video2Ref = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [sources, setSources] = useState<TranscodingVideoStream[]>([])
  const engine = useRef(createAgoraRtcEngine());
  const isMounted = useRef(false);
  const zoom = useRef(0)
  

  const InitEngine = () => {
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
      console.warn(e);
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
    const max_width = 1280,
      max_height = 720,
      width = 300,
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

    setSources(streams)

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
    console.log('----handleMouseDown e: ',e.pageX)
  }

  const handleMouseMove = (e) => {
    console.log('----handleMouseMove e: ',e)
  }

  const handleMouseUp = (e) => {
    console.log('----handleMouseUp e: ',e)
  }

  const handleOnClick = (e) => {
    console.log('eeeeee')
    let config = getLocalTransConfig()
    console.log('----config: ',config)
    engine.current.startLocalVideoTranscoder(config)
    setIsOpen(!isOpen)
  }

  const getSelectNode = (posX, posY) => {

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
    InitEngine()
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