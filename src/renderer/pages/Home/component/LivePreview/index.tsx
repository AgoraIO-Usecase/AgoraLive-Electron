import React, { useState } from "react"
import styles from './livePreview.scss'
import { getResourcePath } from '../../../../utils/index'
import { DownOutlined,UpOutlined } from '@ant-design/icons';

const optConfig = [
  {
    id: 'camera',
    title: '摄像头',
    imgUrl: getResourcePath('camera.png')
  },
  {
    id: 'capture',
    title: '窗口捕捉',
    imgUrl: getResourcePath('capture.png')
  },
  {
    id: 'media',
    title: '多媒体',
    imgUrl: getResourcePath('media.png')
  },
  {
    id: 'virtual',
    title: '虚拟背景',
    imgUrl: getResourcePath('virtual.png')
  }
]

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

  const handleOptClick = (e) => {
    console.log(e.target.id)
  }

  const renderOptListItem = (item) => {
    if (item.id === 'camera' || item.id === 'virtual') {
      return (
        <div key={item.id} id={item.id} className={styles.item} onClick={handleOptClick}>
          <img src={`file://${item.imgUrl}`} alt="" style={{pointerEvents: 'none'}}/>
          <span style={{pointerEvents: 'none'}}>{item.title}</span>
        </div>
      )
    } else {
      return (
        <div key={item.id} id={item.id} className={styles.item} onClick={handleOptClick}>
          <img src={`file://${item.imgUrl}`} alt="" style={{pointerEvents: 'none'}}/>
          <div className={styles.desc} style={{pointerEvents: 'none'}}>
            <span className={styles.title}>{item.title}</span>
            <DownOutlined className={styles.arrow}/>
          </div>
        </div>
      )
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
        <div className={styles.options}>
          {
            optConfig.map(item => {
              return renderOptListItem(item)
            })
          }
        </div>
      </div>
    </div>
  )
}

export default LivePreview