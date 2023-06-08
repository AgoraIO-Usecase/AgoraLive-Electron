import React, { useState } from "react"
import styles from './livePreview.scss'
import { Checkbox, Radio } from 'antd'


const LivePreview: React.FC = () => {
  const [isHorizontal, setIsHorizontal] = useState(true)
  const [isVertical, setIsVertical] = useState(false)
  const onLayoutClick = (e) => {
    if (e.target.id === 'horizontal' && !isHorizontal) {
      setIsHorizontal(true)
      setIsVertical(false)
    }
    if (e.target.id === 'vertical' && !isVertical) {
      setIsHorizontal(false)
      setIsVertical(true)
    }
  }
  return (
    <div className={styles.livePreview}>
      <div className={styles.header}>
        <div className={styles.title}>直播预览</div>
        <div className={styles.layoutSetting} onClick={onLayoutClick}>
          <div id="horizontal" className={`${isHorizontal ? styles.active : ''} ${styles.button}`}>
            <span>横屏</span>
          </div>
          <div id="vertical" className={`${isVertical ? styles.active : ''} ${styles.button}`}>
            <span>竖屏</span>
          </div>
        </div>
      </div>
      <div className={isHorizontal ? styles.previewRow : styles.previewColum}>
        <div className={styles.area} id="videoWapper">预览区域</div>
        <div className={styles.options}>操作</div>
      </div>
    </div>
  )
}

export default LivePreview