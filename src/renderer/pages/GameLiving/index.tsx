import React, { useState, useRef, useEffect } from 'react'
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  VideoSourceType,
  VideoMirrorModeType,
  RenderModeType,
  ScreenCaptureSourceType
} from 'agora-electron-sdk'
import styles from './index.scss'
import { debounce } from '../../utils'
import Config from '../../config/agora.config'
const defaultConfig= {
  appId: '0411799bd126418c9ea73cb37f2c40b4',
  userId: 1101,
  userName: '我是大主播',
  channelName: 'dmyx',
  gameScreenX: 1920,
  gameScreenY: 1080,
  gameScreenFPS: 30,
  gameBitrate: 100000,
  hostScrrenX: 320,
  hostScrrenY: 320,
  hostBitrate: 500,
  hostFPS: 15
}

const msgMock = [
  {
    userName: '王思聪',
    msg: '送出两个♥️'
  },
  {
    userName: '观众2',
    msg: '送出十个♥️'
  },
  {
    userName: '王思聪',
    msg: '送出两个♥️'
  },
  {
    userName: '观众2',
    msg: '666'
  },
  {
    userName: '王思聪',
    msg: '送出两个♥️'
  },
  {
    userName: '王思聪',
    msg: '送出两个♥️'
  },
  {
    userName: '观众2',
    msg: '666'
  },
  {
    userName: '王思聪',
    msg: '送出两个♥️'
  },
]

const personMock = [
  {userName:'观众1'},
  {userName:'观众2'},
  {userName:'观众3'},
  {userName:'观众dddd'},
  {userName:'观众etststt'},
]

const GameLivingPage : React.FC = () => {
  const [appConfig, setAppConfig] = useState(defaultConfig)
  const [personList, setPersonList] = useState(personMock)
  const [msgList, setMsgList] = useState(msgMock)
  const [globalDisable, setGlobalDisable] = useState(false)
  const [isGameShow, setIsGameShow] = useState(false)
  const gameRef = useRef(null)
  const metaRef = useRef(null)
  const visterRef = useRef(null)
  const engine = useRef(createAgoraRtcEngine())

  useEffect(() => {
    initEngine()
    setTimeout(() => {
      updateVideoSize(metaRef.current)
    },2500)   
    return () => {
      console.log('unmonut component')
      engine.current.release()
    }
  }, [appConfig.appId, appConfig.userId])

  const initEngine = () => {
    engine.current.initialize({
      appId: appConfig.appId,
      logConfig: { filePath: Config.SDKLogPath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    })
    engine.current.enableVideo()
    engine.current.startPreview()
    try {
      engine.current.destroyRendererByView(metaRef.current);
    } catch (e) {
      console.error(e);
    }
    let ret = engine.current.setupLocalVideo({
      sourceType: VideoSourceType.VideoSourceCameraPrimary,
      view: metaRef.current,
      uid: appConfig.userId,
      mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
      renderMode: RenderModeType.RenderModeFit,
    });
    console.log('----ret: ',ret)
    if (ret === 0) {
      setGlobalDisable(true)
    } else {
      setGlobalDisable(false)
    }
  }

  const updateGameScreenVideo = () => {
    try {
      engine.current.destroyRendererByView(gameRef.current);
    } catch (e) {
      console.error(e);
    }
    let ret = engine.current.setupLocalVideo({
      sourceType: VideoSourceType.VideoSourceScreen,
      view: gameRef.current,
      uid: appConfig.userId,
      mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
      renderMode: RenderModeType.RenderModeFit,
    });
    console.log('----ret: ',ret)
  }

  const startScreenCapture = () => {
    let sources = engine.current?.getScreenCaptureSources({width: 1920, height: 1080},{width: 64, height: 64},true)
    console.log('-----startScreenCapture sources: ',sources)
    let gameSource = sources.find((item) => {
      //return item.sourceName === 'QQ音乐'
      return item.sourceName === 'zFuse'
    })
    if (!gameSource) {
      console.error(`targetSource is invalid`);
      return
    }
    console.log('------22222 gameSource: ',gameSource)
    engine.current?.startScreenCaptureByWindowId(
      gameSource.sourceId,
      { width: 0, height: 0, x: 0, y: 0 },
      {
        dimensions: { width: appConfig.gameScreenX, height: appConfig.gameScreenY },
        bitrate: appConfig.gameBitrate,
        frameRate: appConfig.gameScreenFPS,
        captureMouseCursor: false,
        windowFocus: false,
        excludeWindowList: [],
        excludeWindowCount: 0,
      }
    )
  }

  const stopScreenCapture = () => {
    console.log('-----stopScreenCapture')
    engine.current?.stopScreenCapture()
  }

  const updateVideoSize = (parentDom) => {
    const divDom = parentDom.querySelector('div')
    if (divDom) {
      divDom.style.position = 'relative'
    }
    console.log('----updateVideoSize divDom: ',divDom)
    const canvasDom = parentDom.querySelector('canvas')
    console.log('----updateVideoSize canvasDom: ',canvasDom)
    if (canvasDom) {
      canvasDom.style.position = 'absolute';
      canvasDom.style.top = 0
      canvasDom.style.left = 0
      canvasDom.style.right = 0
      canvasDom.style.bottom = 0
      canvasDom.style.width = '100%';
      canvasDom.style.height = '100%';
    }
  }

  const handleOnInputChange = debounce((e) => {
    console.log('----event: ',e.target.value)
    console.log('----event id: ',e.target.id)
  },500)

  const handleStartClick = (e) => {
    console.log('-----handleStartClick isGameShow: ',isGameShow)
    if (!isGameShow) {
      startScreenCapture()
      updateGameScreenVideo() 
      setTimeout(() => {
        //updateVideoSize(gameRef.current)
      },2500)
    } else {
      stopScreenCapture()
    }
    setIsGameShow(!isGameShow)
  }

  const handleOnOptBtnClick = (e) => {
    console.log('-----handleOnOptBtnClick e: ',e.target.id)
  }

  const handleOptmsgInputChange = debounce((e) => {
    console.log('----event: ',e.target.value)
    console.log('-----handleOptmsgInputChange e: ',e.target.id)
  },500)

  const handleStartLiving = (e) => {
    console.log('-----handleStartLiving e: ',e)
  }

  const sendMsg = (e) => {
    console.log('-----handleStartLiving e: ',e)
  }

  const handleInputMsgChange = (e) => {
    console.log('-----handleStartLiving e: ',e.target.value)
  }

  const renderConfig = () => {
    return (
      <>
        <p style={{fontSize: '16px',paddingLeft:'4px'}}>应用配置</p>
        <div style={{display:'flex', flexDirection:'column',height:'80%'}}>
          {
            Object.keys(appConfig).map((key,index) => {
              return (
                <div key={`${key}-${index}`} style={{display:'flex',flex:'1', justifyContent:'space-between',marginTop:'6px',paddingLeft:'4px'}}>
                  <label>{key}</label>
                  <input disabled={!globalDisable} style={{width: '60%', marginRight:'4px'}} id={key} defaultValue={appConfig[key]} onChange={handleOnInputChange}/>
                </div>
              )
            })
          }
        </div>
      </>
    )
  }
  const renderPlayerMethod = () => {
    return (
      <>
        <p style={{fontSize: '16px',paddingLeft:'4px'}}>玩法</p>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span style={{marginLeft: '12px'}}>萌萌宠之战</span>
          <button style={{width: '35%',marginRight:'4px',backgroundColor:'green'}} onClick={handleStartClick}>{isGameShow ? '结束' : '开始'}</button>
        </div>
      </>
    )
  }

  const renderMsgOpt = () => {
    return (
      <>
        <div className={styles.optBtnWapper}>
          <div>
            <div className={styles.btnWapper}>
              <button id='dianzanBtn' onClick={handleOnOptBtnClick}>点赞</button>
              <span>x</span>
              <input id='dianzan' onChange={handleOptmsgInputChange} defaultValue='5' />
            </div>
          </div>
          <div style={{display: 'flex', flexDirection:'column'}}>
            <div className={styles.btnWapper}>
              <button id='roseBtn' onClick={handleOnOptBtnClick}>玫瑰10币</button>
              <span>x</span>
              <input id='rose' onChange={handleOptmsgInputChange} defaultValue='1' />
            </div>
            <div className={styles.btnWapper}>
              <button id='bombBtn' onClick={handleOnOptBtnClick}>炸弹50币</button>
              <span>x</span>
              <input id='bomb' onChange={handleOptmsgInputChange} defaultValue='1' />
            </div>
            <div className={styles.btnWapper}>
              <button id='rocketBtn' onClick={handleOnOptBtnClick}>火箭1000币</button>
              <span>x</span>
              <input id='rocket' onChange={handleOptmsgInputChange} defaultValue='1' />
            </div>
          </div>
        </div>
        <div className={styles.msgSend}>
          <input maxLength={200} onChange={handleInputMsgChange} placeholder='说点什么...' />
          <button onClick={sendMsg}>发送</button>
        </div>
      </>
    )
  }

  const renderScreenMain = () => {
    console.log('-----renderScreenMain globalDisable: ',globalDisable)
    return (
      <>
        <div className={styles.game} ref={gameRef}>{isGameShow ? '':'游戏预览'}</div>
        <div className={styles.person}>
          <div className={styles.meta} ref={metaRef}>{globalDisable ? '': '房间主播预览'}</div>
          {!globalDisable&&(<div className={styles.meta} ref={visterRef}>房间主播预览</div>)}
        </div>
        <div className={styles.livingWapper}>
          <button onClick={handleStartLiving}>开始直播</button>
        </div>
      </>
    )
  }

  const renderPersonList = () => {
    return (
      <>
        <p>在看观众</p>
        <ul className={styles.personList}>
          {
            personList.map((person,index) => {
              return (
                <li key={`${person.userName}-${index}`}>{person.userName}</li>
              )
            })
          }
        </ul>
      </>
    )
  }

  const renderMsgList = () => {
    return (
      <>
        <p className={styles.title}>互动消息</p>
        <ul className={styles.listContainer}>
          {
            msgList.map((item,index) => {
              return (
                <li key={`${item.userName}-${index}`}>{`${item.userName} ${item.msg}`}</li>
              )
            })
          }
        </ul>
      </>
    )
  }

  return (
    <div className={styles.gameLiving}>
      <div className={styles.main}>
        <div className={styles.mainLeft}>
          <div className={styles.appConfig}>
            { renderConfig() }
          </div>
          <div className={styles.playMethod}>
            { renderPlayerMethod() }
          </div>
        </div>
        <div className={styles.screenMain}>
          { renderScreenMain() }
        </div>
        <div className={styles.online}>
          { renderPersonList() }
        </div>
      </div>
      <div className={styles.gameMessage}>
        <div className={styles.msgOpt}>
          { renderMsgOpt() }
        </div>
        <div className={styles.msgShow}>
          { renderMsgList() }
        </div>
      </div>
    </div>
  )
}

export default GameLivingPage