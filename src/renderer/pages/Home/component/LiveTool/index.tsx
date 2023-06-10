import React from 'react'
import styles from './liveTool.scss'

const LiveTool: React.FC = () => {
  console.log('----render LiveTool')
  return (
    <div className={styles.liveTool}>
      <div className={styles.title}>直播工具</div>
      <div className={styles.content}></div>
    </div>
  )
}

export default LiveTool