import ReactDOM from 'react-dom';
import { useEffect, useState, useRef } from 'react';

import styles from './index.scss'

interface ConfigProps {
  containerId: string,
  left: number,
  top: number,
  width: number,
  height: number
}
const SelectBox = ({containerId, left=0, top=0, width=150, height=150} : ConfigProps) => {
  const [mounted, setMounted] = useState(false);
  const parentDom = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    parentDom.current = document.getElementById(containerId)
    console.log('------ selectbox parentDom: ',parentDom)
    return () => {
      setMounted(false);
    }
  }, [containerId]);
  
  if (!mounted || !parentDom.current) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.box} style={{left:`${left}px`,top:`${top}px`, width:`${width}px`, height: `${height}px`}}>
      <div className={[styles['resizer'], styles['top-left']].join(' ')}></div>
      <div className={[styles['resizer'], styles['top-right']].join(' ')}></div>
      <div className={[styles['resizer'], styles['bottom-left']].join(' ')}></div>
      <div className={[styles['resizer'], styles['bottom-right']].join(' ')}></div>
    </div>,
    parentDom.current
  )
}

export default SelectBox