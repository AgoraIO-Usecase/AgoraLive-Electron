import React, { useState, useRef } from 'react'
import styles from './index.scss'
import { debounce } from '../../utils'
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
  const gameRef = useRef(null)
  const metaRef = useRef(null)
  const visterRef = useRef(null)

  const handleOnInputChange = debounce((e) => {
    console.log('----event: ',e.target.value)
    console.log('----event id: ',e.target.id)
  },500)

  const handleStartClick = (e) => {
    console.log('-----handleStartClick: ',e)
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
                  <input style={{width: '60%', marginRight:'4px'}} id={key} defaultValue={appConfig[key]} onChange={handleOnInputChange}/>
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
          <button style={{width: '35%',marginRight:'4px',backgroundColor:'green'}} onClick={handleStartClick}>开始</button>
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
    return (
      <>
        <div className={styles.game} ref={gameRef}>游戏预览</div>
        <div className={styles.person}>
          <div className={styles.meta} ref={metaRef}>房间主播预览</div>
          <div className={styles.meta} ref={visterRef}>房间主播预览</div>
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
            personList.map((person) => {
              return (
                <li>{person.userName}</li>
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
            msgList.map((item) => {
              return (
                <li>{`${item.userName} ${item.msg}`}</li>
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