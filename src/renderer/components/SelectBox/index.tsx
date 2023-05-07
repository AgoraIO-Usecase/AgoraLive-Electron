import ReactDOM from 'react-dom';
import { useEffect, useState, useRef } from 'react';

import styles from './index.scss'

interface ConfigProps {
  containerId: string,
  left: number,
  top: number,
  width: number,
  height: number,
  resizingCallBack? : (dw: number, dh: number, isResizing: boolean) => void
}
const SelectBox = (props : ConfigProps) => {
  const [mounted, setMounted] = useState(false);
  const parentDom = useRef<any>(null);
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState({startX:0, startY: 0})

  const handleMouseDown = (e) => {
    setIsResizing(true)
    setPosition({
      startX: e.clientX,
      startY: e.clientY
    })
  }

  const handleMosueMove = (e) => {
    if (isResizing) {
      let dw = e.clientX - position.startX
      let dh = e.clientY - position.startY 
      console.log('---handleMosueMove e.clientX, e.clientY: ',e.clientX,e.clientY)
      console.log('---handleMosueMove startX, startY: ',position.startX,position.startY)
      props.resizingCallBack!(dw,dh,true)
    }
  }

  const handleMoveUp = (e) => {
    let dw = e.clientX - position.startX
    let dh = e.clientY - position.startY 
    props.resizingCallBack!(dw,dh,false)
    setIsResizing(false)
  }

  useEffect(() => {
    setMounted(true);
    parentDom.current = document.getElementById(props.containerId)
    console.log('------ selectbox parentDom: ',parentDom)
    return () => {
      setMounted(false);
    }
  }, [props.containerId])

  
  if (!mounted || !parentDom.current) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.box} style={{left:`${props.left}px`,top:`${props.top}px`, width:`${props.width}px`, height: `${props.height}px`}}>
      <div className={[styles['resizer'], styles['top-left']].join(' ')} onMouseDown ={handleMouseDown} onMouseMove ={handleMosueMove} onMouseUp = {handleMoveUp}></div>
      <div className={[styles['resizer'], styles['top-right']].join(' ')} onMouseDown ={handleMouseDown} onMouseMove ={handleMosueMove} onMouseUp = {handleMoveUp}></div>
      <div className={[styles['resizer'], styles['bottom-left']].join(' ')} onMouseDown ={handleMouseDown} onMouseMove ={handleMosueMove} onMouseUp = {handleMoveUp}></div>
      <div className={[styles['resizer'], styles['bottom-right']].join(' ')} onMouseDown ={handleMouseDown} onMouseMove ={handleMosueMove} onMouseUp = {handleMoveUp}></div>
    </div>,
    parentDom.current
  )
}

export default SelectBox