import React from "react"
import styles from './setting.scss'
import { Divider, Slider, Input, Button } from 'antd'
import { getResourcePath } from '../../../../utils/index'
const voiceIcon = getResourcePath('voice.png')
const voiceDisableIcon = getResourcePath('voiceDisable.png')
const microIcon = getResourcePath('microphone.png')
const microDisableIcon = getResourcePath('microDisable.png')
const settingIcon = getResourcePath('appSetting.png')

const Setting: React.FC = () => {
  console.log('----render setting')
  return (
    <div className={styles.setting}>
      <div className={styles.tool}>
        <img src={`file://${settingIcon}`} alt="" />
        <div className={styles.voice}>
          <img src={`file://${voiceIcon}`} alt="" />
          <Slider
            className={styles.customerSlider} 
            tooltip={{open: false}}
            min={0}
            max={100}
          />
        </div>
        <div className={styles.microphone}>
          <img src={`file://${microIcon}`} alt="" />
          <Slider 
            className={styles.customerSlider}
            tooltip={{open: false}}
            min={0}
            max={100}
          />
        </div>
      </div>
      <Divider className={styles.divider} />
      <div className={styles.settingInput}>
        <div className={styles.inputArea}>
         <Input className={styles.customInput} placeholder="App ID"/>
         <Input className={styles.customInput} placeholder="频道号"/>
        </div>
        <div>
          <Button type="primary">立即开播</Button>
        </div>
      </div>
    </div>
  )
}

export default Setting