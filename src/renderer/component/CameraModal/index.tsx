import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react'
import { Modal, Form, Select, Input } from 'antd'
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "../../store"
import { setFrameRate, setCameraIndex, setCapacityIndex } from "../../store/reducers/global"
import styles from './cameraModal.scss'

interface IProps {
  isOpen: boolean,
  onOk?: () => void,
  onCancel?: () => void,
  onSelectChange?: (key: string, value: any) => void
}

const CameraModal: React.FC<IProps> = ({ isOpen, onOk, onCancel }) => {
  const devices = useSelector((state: RootState) => state.global.devices)
  const cameraIndex = useSelector((state: RootState) => state.global.cameraIndex)
  const capacityIndex = useSelector((state: RootState) => state.global.capacityIndex)
  const frameRate = useSelector((state: RootState) => state.global.frameRate)
  const dispatch = useDispatch()

  useEffect(() => {
    const fps = devices[cameraIndex]?.capacity[capacityIndex]?.fps
    if (fps) {
      dispatch(setFrameRate(fps))
    }
  }, [cameraIndex, capacityIndex, devices])


  const formChange = (key, value) => {
    if (key === 'camera') {
      dispatch(setCameraIndex(value))
      dispatch(setCapacityIndex(0))
    } else if (key === 'resolution') {
      dispatch(setCapacityIndex(value))
    } else if (key === 'frameRate') {
      dispatch(setFrameRate(value)) 
    }
  }


  const handleAdd = () => {
    onOk?.()
  }

  const capInfo = useMemo(() => {
    return devices[cameraIndex].capacity
  }, [devices, cameraIndex])

  return (
    <Modal
      title='添加摄像头'
      okText='添加'
      cancelText='取消'
      width={400}
      open={isOpen}
      onOk={handleAdd}
      onCancel={onCancel}
      centered
      transitionName=''
      maskTransitionName=''
      className={styles.customerModal}
    >
      <div className={styles.content}>
        <Form
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          colon={false}
          labelAlign='left'
        >
          <Form.Item label="摄像头">
            <Select value={cameraIndex} onChange={(value) => { formChange('camera', value) }}>
              {
                devices.map((item, index) => {
                  return (
                    <Select.Option key={item.deviceId} value={index}>{item.deviceName}</Select.Option>
                  )
                })
              }
            </Select>
          </Form.Item>
          <Form.Item label="分辨率">
            <Select value={capacityIndex} onChange={(value) => { formChange('resolution', value) }}>
              {
                capInfo?.map((cap, index) => {
                  return (
                    <Select.Option key={`resolution-${index}`} value={index}>{`${cap.width}x${cap.height}`}</Select.Option>
                  )
                })
              }
            </Select>
          </Form.Item>
          <Form.Item label="帧率(fps)">
            <Input value={frameRate} onChange={(e) => { formChange('frameRate', e.target.value) }} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default CameraModal
