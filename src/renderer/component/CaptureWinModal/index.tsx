import { useMemo } from 'react'
import { Divider, Image, Modal } from 'antd'
import { rgbImageBufferToBase64 } from '../../utils/base64'
import styles from './captureWinModal.scss'
import { ScreenCaptureSourceInfo } from "agora-electron-sdk"
import { useScreen } from "../../utils/hooks"

interface IProps {
  isOpen: boolean,
  onCancel: () => void
  onSelect: (selectedWin: ScreenCaptureSourceInfo) => void,
  type: "window" | "screen"
}

const CaptureWinModal: React.FC<IProps> = ({ isOpen, onCancel, onSelect, type }) => {
  const { getCapWinSources, getCapScreenSources } = useScreen()
  const sources = useMemo(() => {
    if (type == 'screen') {
      return getCapScreenSources()
    } else if (type == "window") {
      return getCapWinSources()
    } else {
      return []
    }
  }, [type])

  console.log("sources", sources)

  const handleOnSelectClick = (e) => {
    const selectedSource = sources?.find((item) => {
      return item?.sourceId == e.target.id
    })
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
          sources.length ? sources.map(item => {
            return (
              <div id={item?.sourceId} onClick={handleOnSelectClick} key={item.sourceId} className={styles.card}>
                <img src={rgbImageBufferToBase64(item.thumbImage)} />
                <div>{item.sourceName}</div>
              </div>
            )
          }) :
            <div>暂无数据</div>
        }
      </div>
    </Modal>
  )
}

export default CaptureWinModal
