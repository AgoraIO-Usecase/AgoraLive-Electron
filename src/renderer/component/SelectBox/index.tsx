import ReactDOM from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { Rnd } from 'react-rnd'


import styles from './index.scss'
import { Modal,Button } from 'antd';

interface ConfigProps {
  containerId: string,
  left: number,
  top: number,
  width: number,
  height: number,
  resizingCallBack? : (x: number, y: number, dw: number, dh: number,isResizing: boolean) => void,
  handleDelete?: () => void,
  handleMoveUp?: () => void,
  handleMoveDown?: () => void
}
const SelectBox = (props : ConfigProps) => {
  const [mounted, setMounted] = useState(false);
  const parentDom = useRef<any>(null);
  const [position, setPosition] = useState({x: props.left, y: props.top})
  const [ctxModalPosition, setCtxModalPosition] = useState({top:0, left: 0})
  const [size, setSize] = useState({width: props.width, height: props.height})
  const [isContextMenuDlgOpen, setContextMenuDlgOpen] = useState(false)
  console.log('------render selectBox')
  useEffect(() => {
    setMounted(true);
    setPosition({
      x: props.left,
      y: props.top
    })
    setSize({
      width: props.width,
      height: props.height
    })
    parentDom.current = document.getElementById(props.containerId)
    console.log('------ selectbox parentDom: ',parentDom)
    return () => {
      setMounted(false);
    }
  }, [props])

  const handleMouseUp = (e) => {
  }

  const handleMouseDown = (e) => {
    console.log('111111target id: ',e.target.id)
    if (e.button === 2) {
        let ctxMenuParent = document.getElementById('select-react')
        if (ctxMenuParent) {
          setContextMenuDlgOpen(true)
          let canavsMask = document.getElementById('canvas-mask')
          if (canavsMask) {
            const parentRect = canavsMask.getBoundingClientRect();
            console.log('----canavs maske rect: ',parentRect)
            /*
            setCtxModalPosition({
              left: parentRect.left + props.left + Math.floor(props.width/2),
              top: parentRect.top + props.top + Math.floor(props.height/2)
            })*/
            setCtxModalPosition((pre) => {
              return {
                ...pre,
                left: parentRect.left + position.x + Math.floor(props.width/2),
                top: parentRect.top + position.y + Math.floor(props.height/2)
              }
            })
            setContextMenuDlgOpen(true)
          }
        } else {
          setContextMenuDlgOpen(false)
        }
    }
  }

  const hanleOnMoveUp = (e) => {
    props.handleMoveUp!()
  }

  const hanleOnDelete = (e) => {
    console.log('------e: ',e)
    props.handleDelete!()
  }

  const hanleOnMoveDown = (e) => {
    props.handleMoveDown!()
  }
  
  if (!mounted || !parentDom.current) {
    return null;
  }

  const getCtxModalParent = () => {
    let canavsMaskDom = document.getElementById('canvas-mask')
    if (canavsMaskDom) {
      console.log('--------canavsMaskDom: ',canavsMaskDom)
      return canavsMaskDom
    } else {
      return document.body
    }
  }


  const handleMenuClick = (e) => {
    if (e.key === 'moveUp') {
      // 处理上移一层逻辑
    } else if (e.key === 'moveDown') {
      // 处理下移一层逻辑
    } else if (e.key === 'delete') {
      // 处理删除逻辑
    }
    setContextMenuDlgOpen(false);
  }

  return ReactDOM.createPortal(
    <Rnd 
      style={{position: 'relative',border: '1px dotted #ccc'}}
      bounds={parentDom.current}
      id = 'select-react'
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      size = {size}
      position = {position}
      onDrag = {(e,d) => {
        setPosition({x: d.x, y:d.y})
        props.resizingCallBack!(d.x, d.y, 0, 0, true)
      }}
      onDragStop={(e, d) => {
        setPosition({x: d.x, y:d.y})
        props.resizingCallBack!(d.x, d.y, 0, 0, false)
      }}
      onResize={(e, direction, ref, delta, position) => {
        setPosition({
          ...position
        })
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight
        })
        props.resizingCallBack!(position.x, position.y, delta.width, delta.height, true)
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        console.log('onResizeStop: ',ref.offsetWidth,ref.offsetHeight)
        setPosition({
          ...position
        })
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight
        })
        props.resizingCallBack!(position.x, position.y, delta.width, delta.height, false)
      }}
    >
      <div className={[styles['resizer'], styles['top-left']].join(' ')} ></div>
      <div className={[styles['resizer'], styles['top-right']].join(' ')} ></div>
      <div className={[styles['resizer'], styles['bottom-left']].join(' ')} ></div>
      <div className={[styles['resizer'], styles['bottom-right']].join(' ')} ></div>
      <Modal
        closeIcon={false}
        closable={false}
        open={isContextMenuDlgOpen}
        width={120}
        footer={null}
        getContainer={getCtxModalParent}
        style={{position: 'absolute', top: ctxModalPosition.top, left: ctxModalPosition.left,zIndex: 10000}}
        bodyStyle ={{display: 'flex', justifyContent: 'center', margin: 0, padding: 0 }}
        maskStyle={{ height: '100%' }} 
      >
        <div className={styles.content}>
          <Button id='moveUp' onClick={hanleOnMoveUp}>上移一层</Button>
          <Button id='moveDown' onClick={hanleOnMoveDown}>下移一层</Button>
          <Button id='delete' onClick={hanleOnDelete}>移除</Button>
        </div>
      </Modal>
    </Rnd>,
    parentDom.current
  )
}

export default SelectBox