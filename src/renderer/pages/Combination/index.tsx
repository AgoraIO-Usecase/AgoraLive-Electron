import React, { useState, forwardRef } from 'react'
import Config from '../../config/agora.config'
import styles from './combination.scss'
import { List } from 'antd'

const data = [
  { id: 1, content: '第一个列表项' },
  { id: 2, content: '第二个列表项' },
  { id: 3, content: '第三个列表项' },
];

const Combination: React.FC = () => {
  const [listData, setListData] = useState(data)
  const InitEngine = () => {

  }
  

  return (
    <div>
      <div className={styles.display}>
        <h3 style={{textAlign:'center'}}>效果展示</h3>
        <div id='video1'></div>
      </div>
      <div className={styles.material}>
        <h3 style={{textAlign:'center'}}>素材展示</h3>
        <div id='video2'></div>
      </div>
      <div style={{ marginTop:'10px', display:'flex', justifyContent:'center' }}>
        <button>增加图片</button>
        <button>增加视频</button>
        <button>开始合成</button>
      </div>
    </div>
  )
}

export default Combination