import React, { useState, useRef, useEffect } from 'react'
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
  ChannelProfileType
} from 'agora-electron-sdk';
import test1 from '../../assets/images/test1.jpg';
import test2 from '../../assets/images/test2.jpg';
import test3 from '../../assets/images/test3.jpg';
import test4 from '../../assets/images/test4.jpg';

const data = [
  { id: 1, content: '第一个列表项' },
  { id: 2, content: '第二个列表项' },
  { id: 3, content: '第三个列表项' },
];

const Combination: React.FC = () => {
  const [listData, setListData] = useState(data)
  const video1Ref = useRef(null)
  const video2Ref = useRef(null)

  const InitEngine = () => {
    const rtcEngine = createAgoraRtcEngine()
    rtcEngine.initialize({
      appId: Config.appId,
      logConfig: { filePath: Config.SDKLogPath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });
    rtcEngine.enableVideo();
    rtcEngine.startPreview();
    rtcEngine.setupLocalVideo({
      sourceType: VideoSourceType.VideoSourceCameraPrimary,
      view: video1Ref.current,
      mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
      renderMode: RenderModeType.RenderModeFit,
    });
    rtcEngine.setupLocalVideo({
      sourceType: VideoSourceType.VideoSourceCameraPrimary,
      view: video2Ref.current,
      mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
      renderMode: RenderModeType.RenderModeFit,
    });
  }

  useEffect(() => {
    InitEngine()
  }, [])
  

  return (
    <div>
      <h3 style={{textAlign:'center'}}>效果展示</h3>
      <div className={styles.display}>
        <div ref={video1Ref} style={{height:'100%'}}></div>
      </div>
      <h3 style={{textAlign:'center'}}>素材展示</h3>
      <div className={styles.material}>
        <div ref={video2Ref} style={{ width:'120px', height:'120px'}}></div>
        <img src={test1} style={{width: '120px',height:'120px',margin:'0 10px'}}></img>
        <img src={test2} style={{width: '120px',height:'120px',margin:'0 10px'}}></img>
        <img src={test3} style={{width: '120px',height:'120px',margin:'0 10px'}}></img>
        <img src={test4} style={{width: '120px',height:'120px',margin:'0 10px'}}></img>
      </div>
      <div style={{ marginTop:'10px', display:'flex', justifyContent:'center' }}>
        <button>开始合成</button>
      </div>
    </div>
  )
}

export default Combination