import React, { useState, useContext } from 'react'
import { Modal, Button, Switch } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { BackgroundSourceType, SegModelType, BackgroundBlurDegree } from 'agora-electron-sdk'
import { useEngine } from "../../utils/hooks"
import { getResourcePath } from '../../utils/index'
import styles from './virtualBackgroundModal.scss'

interface IProps {
  isOpen: boolean
  enableGreenScreen: boolean,
  isHorizontal: boolean,
  onGreenScreenCb: (isEnable: boolean) => void
  onCancel: () => void
}

const VirtualBackgroundModal: React.FC<IProps> = ({ isOpen, enableGreenScreen, isHorizontal, onGreenScreenCb, onCancel }) => {
  const { rtcEngine } = useEngine()
  const backgroundImg = isHorizontal ? getResourcePath('background.png') : getResourcePath('background_portrait.png')

  const enableSegModelGreen = () => {
    let segproperty = {
      modelType: SegModelType.SegModelGreen,
      greenCapacity: 0.5
    }
    let ret = rtcEngine?.enableVirtualBackground(true, {}, segproperty)
    console.log('---enableSegModelGreen ret: ', ret)
  }

  const disableSegModelGreen = () => {
    let segproperty = {
      modelType: SegModelType.SegModelGreen
    }
    let ret = rtcEngine?.enableVirtualBackground(false, {}, segproperty)
    console.log('---disableSegModelGreen ret: ', ret)
  }

  const disableVirtualBackground = () => {
    let ret = rtcEngine?.enableVirtualBackground(false, {}, {})
    console.log('---disableVirtualBackground ret: ', ret)
    onCancel()
  }

  const handelOnBackgroundBlur = () => {
    disableVirtualBackground()
    let ret = rtcEngine?.enableVirtualBackground(true, {
      background_source_type: BackgroundSourceType.BackgroundBlur,
      blur_degree: BackgroundBlurDegree.BlurDegreeHigh
    }, {})
    console.log('---handelOnBackgroundBlur ret: ', ret)
  }

  const handleOnBackgroundImg = () => {
    disableVirtualBackground()
    let ret = rtcEngine?.enableVirtualBackground(true, {
      background_source_type: BackgroundSourceType.BackgroundImg,
      source: backgroundImg
    }, {})
    console.log('---handleOnBackgroundImg ret: ', ret)
  }

  const onSegModelGreenChange = (isEnable) => {
    console.log('onGreenScreenChange value: ', isEnable)
    if (isEnable) {
      Modal.confirm({
        title: '确定开启绿幕功能吗?',
        content: '为了保证虚拟背景的效果，我们推荐您在搭设绿幕作为背景后再开启绿幕功能',
        okText: '确认开启',
        cancelText: '暂不开启',
        onOk() {
          enableSegModelGreen()
          onGreenScreenCb(isEnable)
          onCancel()
          console.log('onOk')
        }
      })
    } else {
      disableSegModelGreen()
      onGreenScreenCb(isEnable)
      onCancel()
    }
  }
  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      centered={true}
      closable={true}
      title='虚拟背景'
      footer={[
        <div key='greenScreen' className={styles.footer}>
          <div>
            <span>我有绿幕</span>
            <InfoCircleOutlined />
          </div>
          <Switch onChange={onSegModelGreenChange} checked={enableGreenScreen}></Switch>
        </div>
      ]}
    >
      <div className={styles.content}>
        <Button onClick={disableVirtualBackground} type="primary">无</Button>
        <Button onClick={handelOnBackgroundBlur} type="primary">模糊</Button>
        <Button onClick={handleOnBackgroundImg} type="primary">蜜桃</Button>
      </div>
    </Modal>
  )
}

export default VirtualBackgroundModal
