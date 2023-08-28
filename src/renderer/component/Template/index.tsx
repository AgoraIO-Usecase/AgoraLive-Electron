import React from 'react'
import styles from './template.scss'

const Template: React.FC = () => {
  return (
    <div className={styles.temp}>
      <div className={styles.tempTitle}>模版</div>
      <div className={styles.tempContent}></div>
    </div>
  )
}

export default Template
