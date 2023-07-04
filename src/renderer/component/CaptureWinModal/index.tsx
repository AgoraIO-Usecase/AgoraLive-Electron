import React from 'react'
import { Divider, Image, Modal } from 'antd'
import { rgbImageBufferToBase64 } from '../../utils/base64'
import styles from './captureWinModal.scss'
import { 
  ThumbImageBuffer
} from 'agora-electron-sdk'

interface IProps {
  isOpen: boolean,
  onCancel: () => void
  onSelect: (selectedWin: CaptureWindow) => void
  captureWinSources: CaptureWindow[]
}

interface CaptureWindow {
  id: string,
  sourceName: string,
  thumbImage: ThumbImageBuffer,
}

const CaptureWinModal: React.FC<IProps> = ({isOpen, onCancel, onSelect, captureWinSources}) => {
  console.log(`------CaptureWinModal--------`)
  const handleOnSelectClick = (e) => {
    console.log('----handleOnSelectClick: ', e.target.id)
    const selectedSource = captureWinSources.find((item) => {
      return item.id == e.target.id
    })
    console.log('----selectedSource: ', selectedSource)
    if (selectedSource) {
      onSelect(selectedSource)
    }
  }
  
  return (
    <Modal
     open={isOpen}
     title='窗口列表'
     footer={null}
     width={800}
     onCancel={onCancel}
    >
      <div className={styles.content}>
       {
          captureWinSources.length <=0 ? (
            <div>暂无数据</div>
          ): (
            captureWinSources.map(item => {
              return (
                <div id={item.id} onClick={handleOnSelectClick} key={item.id} className={styles.card}>
                  <img src={rgbImageBufferToBase64(item.thumbImage)} />
                  <div>{item.sourceName}</div>
                </div>
              )
            })
          )
       }
      </div>
    </Modal>
  )
}

export default CaptureWinModal