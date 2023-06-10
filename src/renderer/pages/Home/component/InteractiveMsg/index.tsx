import React from 'react'
import styles from './interactiveMsg.scss'


const InteractiveMsg: React.FC = () => {
  console.log('-----InteractiveMsg')
  return (
    <div className={styles.interactiveMsg}>
      <div className={styles.title}>互动消息</div>
      <div className={styles.content}></div>
    </div>
  )
}

export default InteractiveMsg