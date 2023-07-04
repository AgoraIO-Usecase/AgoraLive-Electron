import React, { useRef } from 'react'
import styles from './Capture.scss'
import { ipcRenderer } from 'electron'

const Capture: React.FC = () => {
  const container = useRef<HTMLDivElement|null>(null)
  const isDrawing = useRef(false)
  const startPos = useRef({x:0,y:0})
  const captureDiv = useRef<HTMLDivElement| null>(null)
  const buttonRef = useRef<HTMLButtonElement|null>(null)
  const rect = useRef({x: 0, y: 0,width: 0, height: 0})

  const handleMosueDown = (e) => {

    if (e.button === 2) {
      ipcRenderer.send('capture-close')
      return
    }
    if (e.target.id  === 'comfirm') {
      return
    }

    rect.current.x = 0
    rect.current.y = 0
    rect.current.width = 0
    rect.current.height = 0

    isDrawing.current = true
    startPos.current.x = e.clientX
    startPos.current.y = e.clientY
    // 创建矩形元素
    captureDiv.current = document.createElement('div');
    captureDiv.current.style.position = 'absolute';
    captureDiv.current.style.border = '2px solid #0A84FF';
    //rect.current.style.pointerEvents = 'none'; // 防止矩形内部的点击事件被触发
    container.current?.appendChild(captureDiv.current);

}

const handleOnButtonClick = (e) => {
  e.stopPropagation();
  console.log('-----on button click rect: ',rect.current)
  ipcRenderer.send('capture-complete', rect.current)
}

const handleMosueMove = (e) => {
  if (!isDrawing.current) return;
  if (e.target.id  === 'comfirm') {
    return
  }

  const currentX = e.clientX;
  const currentY = e.clientY;

  const width = currentX - startPos.current.x
  const height = currentY - startPos.current.y
  // 设置矩形的位置和尺寸
  captureDiv.current!.style.left = `${startPos.current.x}px`;
  captureDiv.current!.style.top = `${startPos.current.y}px`;
  captureDiv.current!.style.width = `${width}px`;
  captureDiv.current!.style.height = `${height}px`;
}

  const handleMouseUp = (e) => {
    if (e.target.id  === 'comfirm') {
      return
    }
    // 记录矩形的坐标和宽高
    console.log('----isDrawing: ',isDrawing.current)
    if (isDrawing.current) {
      const rectX = parseInt(captureDiv.current!.style.left, 10);
      const rectY = parseInt(captureDiv.current!.style.top, 10);
      const rectWidth = parseInt(captureDiv.current!.style.width, 10);
      const rectHeight = parseInt(captureDiv.current!.style.height, 10);
      if (typeof rectX === 'number' && typeof rectY === 'number' && typeof rectWidth === 'number' && typeof rectHeight === 'number') {
        rect.current.x = rectX
        rect.current.y = rectY
        rect.current.width = rectWidth
        rect.current.height = rectHeight
      }
      
        //创建button
      buttonRef.current = document.createElement('button')
      buttonRef.current.id = 'comfirm'
      buttonRef.current.innerText = '确定';
      buttonRef.current.style.position = 'absolute';
      buttonRef.current.style.left = '50%';
      buttonRef.current.style.top = '50%';
      buttonRef.current.style.transform = 'translate(-50%, -50%)';
      buttonRef.current.style.border = '2px solid #0A84FF';
      buttonRef.current.style.color = 'white';
      buttonRef.current.style.backgroundColor = '#0A84FF';

      // 将按钮添加到矩形元素中
      captureDiv.current?.appendChild(buttonRef.current);

      buttonRef.current?.addEventListener('click', handleOnButtonClick)
      isDrawing.current = false
    }
  }
  return (
    <div ref={container} className={styles.capture} onMouseDown={handleMosueDown} onMouseMove={handleMosueMove} onMouseUp={handleMouseUp}>
      
    </div>
  )
}

export default Capture