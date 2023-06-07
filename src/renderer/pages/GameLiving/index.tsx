import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  VideoSourceType,
  VideoMirrorModeType,
  RenderModeType,
  ScreenCaptureSourceType,
  ClientRoleType,
  RtcConnection,
  RtcStats,
  UserOfflineReasonType
} from 'agora-electron-sdk'
import styles from './index.scss'
import { debounce, generateRandomNumber } from '../../utils'
import RtmClient from '../../utils/rtm-client'
import { checkAppInstall, startApp, checkAppInfoEvent, startAppInfoEvent} from '../../utils/ipcRenderEvent'
import Config from '../../config/agora.config'
import apiClient from '../../utils/request'

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
interface ScreenCaptureParameters {
  width?: number,
  height?: number,
  bitrate?: number,
  frameRate?: number
}

const GameLivingPage : React.FC = () => {
  const [appConfig, setAppConfig] = useState(defaultConfig)
  const [personList, setPersonList] = useState<any>([])
  const [msgList, setMsgList] = useState<any[]>([])
  const [globalDisable, setGlobalDisable] = useState(true)
  const [isGameShow, setIsGameShow] = useState(false)
  const [startLiving, setStartLiving] = useState(false)
  const [awardInfo, setAwardInfo] = useState({ dianzan: 5,rose: 1,bomb: 1,rocket: 1 })
  const [inputMsg, setInputMsg] = useState<string>('')
  const [isAppExist, setIsAppExist] = useState(false)
  const isAppStart = useRef(false)
  const gameRef = useRef(null)
  const metaRef = useRef(null)
  const visterRef = useRef(null)
  const msgListRef = useRef<any>(null)
  const visitor = useRef(undefined)
  const engine = useRef(createAgoraRtcEngine())
  const RTM = useRef(new RtmClient())
  const appName = 'QQ'

  useEffect(() => {
    initEngine()
    initRtm()
    registerIpcEvent()
    checkAppInstall(appName)
    /*
    setTimeout(() => {
      updateVideoSize(metaRef.current)
    },2500)
    */   
    return () => {
      console.log('unmonut component')
      engine.current.release()
    }
  }, [appConfig.appId, appConfig.userId, appConfig.channelName])

  useEffect(() => {
    scrollToBottom()
  }, [msgList])

  useEffect(() => {
    updateRemoteScreenVideo()
  }, [personList])

  const initRtm = async () => {
    try {
      RTM.current.init(appConfig.appId)
      registerRtmEvent()
      await RTM.current.login(appConfig.userId.toString(), '')
    } catch(e) {
      console.error('init rtm failed. error: ',e)
    }
  }

  const initEngine = () => {
    engine.current.initialize({
      appId: appConfig.appId,
      logConfig: { filePath: Config.SDKLogPath },
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    })
    engine.current.enableVideo()
    engine.current.startPreview()
    registerChannelEvent()
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
      cropArea: {
        width: appConfig.hostScrrenX,
        height: appConfig.hostScrrenY
      }
    });
    console.log('----ret: ',ret)
    if (ret === 0) {
      setGlobalDisable(false)
    } else {
      setGlobalDisable(true)
    }
  }

  const registerRtmEvent = () => {
    RTM.current.on('ChannelMessage', async ({ channelName, args }) => {
      const [message, memberId] = args
      console.log('channel: ', channelName, ', messsage: ', message.text, ', memberId: ', memberId)
      console.log('------old msgList:',msgList)
      let newMsgList = [...msgList,{
        userName: +memberId,
        msg: message.text
      }]
      console.log('------new msgList:',newMsgList)
      setMsgList((prevMsgList) => {
        return [
          ...prevMsgList,
          {
            userName: +memberId,
            msg: message.text
          }
        ]
      })
    })
  }

  const registerIpcEvent = () => {
    checkAppInfoEvent(checkAppInstallCallBack)
    startAppInfoEvent(startAppCallBack)
  }

  const checkAppInstallCallBack = (eventInfo) => {
    console.log('-----checkAppInstallCallBack: ', eventInfo)
    if (eventInfo === true) {
      setIsAppExist(true)
    } else {
      setIsAppExist(false)
    }
  }

  const startAppCallBack = (eventInfo) => {
    console.log('-----startAppCallBack: ', eventInfo)
    if (eventInfo === 'success') {
      isAppStart.current = true
      if (startScreenCapture()) {
        console.log('----startAppCallBack')
        updateGameScreenVideo() 
      } else {
        setTimeout(() => {
          startScreenCapture()
          updateGameScreenVideo() 
        }, 2000)
      }
    } else {
      isAppStart.current = false
    }
  }

  const updateRemoteScreenVideo = () => {
    if (personList.length > 0) {
      if (visitor.current === undefined) {

        let first = personList[0]
        let connection = {
          channelId: appConfig.channelName,
          localUid: +appConfig.userId
        }
        visitor.current = first.id
        console.log('-----first: ',first)
        try {
          engine.current.destroyRendererByView(visterRef.current);
        } catch (e) {
          console.error(e);
        }
        let ret = engine.current.setupRemoteVideoEx({
          sourceType: VideoSourceType.VideoSourceRemote,
          view: visterRef.current,
          uid: +first.id,
          mirrorMode: VideoMirrorModeType.VideoMirrorModeDisabled,
          renderMode: RenderModeType.RenderModeFit,
        }, connection);
        console.log('----ret: ',ret)
      }
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
      //return item.sourceName === 'zFuse'
      return item.sourceName === 'QQ'
    })
    if (!gameSource) {
      console.error(`targetSource is invalid`);
      return false
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
    return true
  }

  const updateGameCaptureParameters = (parms: ScreenCaptureParameters) => {
    console.log('------updateGameCaptureParameters parms: ',parms)
    let ret = engine.current.updateScreenCaptureParameters({
      dimensions: { width: parms.width, height: parms.height },
      bitrate: parms.bitrate,
      frameRate: parms.frameRate,
      captureMouseCursor: false
    })
    console.log('---update ret: ',ret)
  }

  const stopScreenCapture = () => {
    console.log('-----stopScreenCapture')
    engine.current?.stopScreenCapture()
  }

  const registerChannelEvent = () => {
    engine.current.addListener(
      'onJoinChannelSuccess',
      (connection: RtcConnection, elapsed: number) => {
        console.log('onJoinChannelSuccess','connection',connection,'elapsed',elapsed)
        setStartLiving(true)
      }
    )
    engine.current.addListener(
      'onLeaveChannel',
      (connection: RtcConnection, stats: RtcStats) => {
        console.log('onLeaveChannel','connection',connection,'stats',stats)
        setStartLiving(false)
        setPersonList([])
        visitor.current = undefined
      }
    )
    engine.current.addListener(
      'onUserJoined',
      (connection: RtcConnection, remoteUid: number, elapsed: number) => {
        console.log('onUserJoined','connection',connection,'remoteUid',remoteUid,'elapsed', elapsed)
        let userInfo = {
          id: remoteUid,
          userName: `观众-${remoteUid}`
        }
        console.log('------personList: ',personList)
        //let newPersonList = [...personList, userInfo]
        //console.log('-----newPersonList: ',newPersonList)
        setPersonList((prevData) => [...prevData,userInfo])
      }
    )
    engine.current.addListener(
      'onUserOffline',
      (connection: RtcConnection, remoteUid: number, reason: UserOfflineReasonType) => {
        console.log('onUserOffline','connection',connection,'remoteUid',remoteUid,'reason', reason)
        let newPersonList = personList.filter((item) => {
          return item.id !== remoteUid
        })
        if (visitor.current === remoteUid) {
          visitor.current = undefined
        }
        setPersonList((prevList => {
          return prevList.filter((item) => {
            return item.id !== remoteUid
          })
        }))
      }
    )
  }

  const joinRtmChannel = async () => {
    if (!appConfig.channelName) {
      console.error('channelId is invalid');
      return
    }
    try {
      await RTM.current.joinChannel(appConfig.channelName)
      RTM.current.setJoinChannelState(appConfig.channelName,true)
    } catch(error) {
      console.log('join rtm channel fialed! error is: ',error)
    }
  }

  const leaveRtmChannel = async () => {
    if (!appConfig.channelName) {
      console.error('channelId is invalid');
      return
    }
    try {
      await RTM.current.leaveChannel(appConfig.channelName)
      RTM.current.setJoinChannelState(appConfig.channelName,false)
    } catch(error) {
      console.log('join rtm channel fialed! error is: ',error)
    }
  }

  const joinChannel = () => {
    if (!appConfig.channelName) {
      console.error('channelId is invalid');
      return
    }
    if (appConfig.userId < 0) {
      console.error('uid is invalid');
      return
    }
    let token = ''
    console.log('------join channel')
    // start joining channel
    // 1. Users can only see each other after they join the
    // same channel successfully using the same app id.
    // 2. If app certificate is turned on at dashboard, token is needed
    // when joining channel. The channel name and uid used to calculate
    // the token has to match the ones used for channel join
    engine.current.joinChannel(token, appConfig.channelName, appConfig.userId, {
      // Make myself as the broadcaster to send stream to remote
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      publishMicrophoneTrack: false,
      publishCameraTrack: false,
      publishScreenTrack: true,
    })
  }

  const leaveChannel = () => {
    console.log('------leaveChannel')
    engine.current.leaveChannel()
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
      canvasDom.style.position = 'absolute'
      canvasDom.style.top = 0
      canvasDom.style.left = 0
      canvasDom.style.right = 0
      canvasDom.style.bottom = 0
      canvasDom.style.width = '100%'
      canvasDom.style.height = '100%'
    }
  }

  const handleOnInputChange = debounce((id, value) => {
    console.log('----event: ',value)
    console.log('----event id: ',id)
    switch (id) {
      case 'gameScreenX':
      case 'gameScreenY':
      case 'gameScreenFPS':
      case 'gameBitrate':
        {
          let newAppConfig = {
            ...appConfig,
            [id]: +value
          }
          console.log('----newAppConfig: ',newAppConfig)
          if (isGameShow) {
            let gameCapture:ScreenCaptureParameters = {
              width: newAppConfig.gameScreenX,
              height: newAppConfig.gameScreenY,
              bitrate: newAppConfig.gameBitrate,
              frameRate: newAppConfig.gameScreenFPS
            }
            updateGameCaptureParameters(gameCapture)
          }
          setAppConfig(newAppConfig)
        }
        break
      case 'appId':
      case 'userName':
      case 'channelName':
      case 'userId':
        {
          let newAppConfig = {
            ...appConfig,
            [id]: id === 'userId'? (+value) : value
          }
          setAppConfig(newAppConfig)
        }
        break
    }
  },100)

  const handleMethodClick = (e) => {
    console.log('-----handleStartClick isGameShow: ',isGameShow)
    if (!isGameShow) {
      if (!isAppStart.current) {
        startApp('QQ')
      } else {
        let isCapture = startScreenCapture()
        if (isCapture) {
          updateGameScreenVideo() 
        } else {
          startApp('QQ')
        }
      }
    } else {
      stopScreenCapture()
    }
    setIsGameShow((preState) => !preState)
  }
  
  const scrollToBottom = () => {
    if (msgListRef.current) {
      msgListRef.current.scrollTop = msgListRef.current.scrollHeight;
    }
  }

  const handleOnOptBtnClick = (e) => {
    console.log('-----handleOnOptBtnClick e: ',e.target.id)
    let msg = '', msg_type = '', giftid = '',giftvalue = 0
    let messageId = generateRandomNumber()
    let baseConfig = {
      msgid: messageId,
      userid: appConfig.userId,
      avatarurl: 'test url',
      nickname: appConfig.userName
    }
    let reqConfig
    switch (e.target.id) {
      case 'dianzanBtn': {
        msg = `${awardInfo.dianzan}个点赞`
        reqConfig = {
          ...baseConfig,
          likenum: awardInfo.dianzan,
          msg_type: 'live_like'
        }
        break
      }
      case 'roseBtn': {
        msg = `${awardInfo.rose}个玫瑰10币`
        reqConfig = {
          ...baseConfig,
          msg_type: 'live_gift',
          giftnum: awardInfo.rose,
          giftid: '1001',
          giftvalue: 10
        }
        break
      }
      case 'bombBtn': {
        msg = `${awardInfo.bomb}个炸弹50币`
        reqConfig = {
          ...baseConfig,
          msg_type: 'live_gift',
          giftnum: awardInfo.bomb,
          giftid: '1002',
          giftvalue: 50
        }
        break
      }
      case 'rocketBtn': {
        msg = `${awardInfo.rocket}个火箭1000币`
        reqConfig = {
          ...baseConfig,
          msg_type: 'live_gift',
          giftnum: awardInfo.rocket,
          giftid: '1003',
          giftvalue: 1000
        }
        break
      }
    }
    console.log('----request config: ', reqConfig)
    apiClient.post('live_data/living/message', reqConfig).then(response => {
      console.log(response.data)
    }).catch(err => {
      console.error(err)
    })

    
    let newMsgList = [...msgList,{
      userName: appConfig.userName,
      msg
    }]
    sendRtmMessage(msg)
    setMsgList(newMsgList)
    setAwardInfo({
      dianzan: 5,
      rose: 1,
      bomb: 1,
      rocket: 1
    })
  }

  const handleOptmsgInputChange = debounce((id, value) => {
    console.log('----event: ',value)
    console.log('-----handleOptmsgInputChange e: ',id)
    let newAward = {
      ...awardInfo,
      [id]: +value
    }
    console.log('-----newAward:',newAward)
    setAwardInfo(newAward)
  },100)

  const handleLivingClick = (e) => {
    console.log('-----handleStartLiving startLiving: ',startLiving)
    if (!startLiving) {
      joinChannel()
      joinRtmChannel()
    } else {
      leaveRtmChannel()
      leaveChannel()
    }
  }

  const sendRtmMessage = async (msg) => {
    await RTM.current.sendChannelMessage(msg, appConfig.channelName)
  }

  const sendMsg = (e) => {
    if (inputMsg.trim() !== '') {
      console.log('----sendMsg: ',inputMsg)
      let reqConfig = {
        msgid: generateRandomNumber(),
        userid: appConfig.userId,
        avatarurl: 'test url',
        nickname: appConfig.userName,
        msg_type: 'live_comment',
        content: inputMsg
      }
      console.log('----request config: ', reqConfig)
      apiClient.post('live_data/living/message', reqConfig).then(response => {
        console.log(response.data)
      }).catch(err => {
        console.error(err)
      })
      sendRtmMessage(inputMsg)
      let newMsgList = [...msgList,{
        userName: appConfig.userName,
        msg: inputMsg
      }]
      setMsgList(newMsgList)
      scrollToBottom()
      setInputMsg('')
    }
  }

  const handleInputMsgChange = (e) => {
    setInputMsg(e.target.value)
    //inputMsg.current = e.target.value
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
                  <input disabled={globalDisable} style={{width: '60%', marginRight:'4px'}} id={key} value={appConfig[key]} onChange={(e) => handleOnInputChange(e.target.id, e.target.value)}/>
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
          <button disabled={!isAppExist} style={{width: '35%',marginRight:'4px'}} onClick={handleMethodClick}>{isGameShow ? '结束' : '开始'}</button>
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
              <button disabled={!startLiving} id='dianzanBtn' onClick={handleOnOptBtnClick}>点赞</button>
              <span>x</span>
              <input disabled={!startLiving} id='dianzan' onChange={(e) => handleOptmsgInputChange(e.target.id, e.target.value)} value={awardInfo.dianzan} />
            </div>
          </div>
          <div style={{display: 'flex', flexDirection:'column'}}>
            <div className={styles.btnWapper}>
              <button disabled={!startLiving} id='roseBtn' onClick={handleOnOptBtnClick}>玫瑰10币</button>
              <span>x</span>
              <input disabled={!startLiving} id='rose' onChange={(e) => handleOptmsgInputChange(e.target.id, e.target.value)} value={awardInfo.rose} />
            </div>
            <div className={styles.btnWapper}>
              <button disabled={!startLiving} id='bombBtn' onClick={handleOnOptBtnClick}>炸弹50币</button>
              <span>x</span>
              <input disabled={!startLiving} id='bomb' onChange={(e) => handleOptmsgInputChange(e.target.id, e.target.value)} value={awardInfo.bomb} />
            </div>
            <div className={styles.btnWapper}>
              <button disabled={!startLiving} id='rocketBtn' onClick={handleOnOptBtnClick}>火箭1000币</button>
              <span>x</span>
              <input disabled={!startLiving} id='rocket' onChange={(e) => handleOptmsgInputChange(e.target.id, e.target.value)} value={awardInfo.rocket} />
            </div>
          </div>
        </div>
        <div className={styles.msgSend}>
          <input disabled={!startLiving} type="text" maxLength={200} onChange={handleInputMsgChange} placeholder='说点什么...' value={inputMsg}/>
          <button disabled={!startLiving} onClick={sendMsg}>发送</button>
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
          <div className={styles.meta} ref={metaRef}>{!globalDisable ? '': '房间主播预览'}</div>
          {(globalDisable || personList.length>0)&&(<div className={styles.meta} ref={visterRef}>{personList.length>0 ? '':'房间主播预览'}</div>)}
        </div>
        <div className={styles.livingWapper}>
          <button onClick={handleLivingClick}>{startLiving? '结束直播':'开始直播'}</button>
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
        <ul className={styles.listContainer} ref={msgListRef}>
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