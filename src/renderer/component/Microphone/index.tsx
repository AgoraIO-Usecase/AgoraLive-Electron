import React from 'react'
import styles from './microphone.scss'

const Microphone: React.FC = () => {
  console.log('----render Microphone')
  return (
    <div className={styles.microphone}>
      <div className={styles.title}>麦序管理</div>
      <div className={styles.content}></div>
    </div>
  )
}

export default Microphone