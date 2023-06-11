import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react'
import { Modal, Form, Select, Input } from 'antd'
import RtcEngineContext, { IAppContext } from "../../context/rtcEngineContext"
import styles from './cameraModal.scss'

interface IProps {
  isOpen: boolean,
  devices: IDevice[],
  deviceIndex: number,
  capacityIndex: number
  onOk: (data: any) => void,
  onCancel: () => void,
  onSelectChange?: (key:string, value:any) => void
}

const getDefaultFormData = () => ({

  camera: 'demo111',
  resolution: 'demo',
  frameRate: '',
})

interface IDeviceCapacity {
  width: number,
  height: number,
  fps: number,
  modifyFps: number
}

interface IDevice {
  deviceId: string,
  deviceName: string
  capacity: IDeviceCapacity[]
}


const CameraModal: React.FC<IProps> = ({isOpen, deviceIndex, capacityIndex, devices, onOk, onCancel}) => {
  console.log('---render CameraModal','deviceIndex: ',deviceIndex, 'capacityIndex: ',capacityIndex)
  console.log('-----devices: ',devices)
  const [formData, setFormData] = useState(getDefaultFormData())
  const { rtcEngine } = useContext(RtcEngineContext) as IAppContext
  const [devIndex, setDevIndex] = useState(deviceIndex)
  const [capIndex, setCapIndex] = useState(capacityIndex)
  const [frameRate, setFrameRate] = useState<number>(devices[deviceIndex].capacity[capacityIndex].modifyFps||0)

  const formChange = (key, value) => {
    console.log('key: ',key,'value: ',value)
    if (key === 'camera') {
      setDevIndex(value)
      setCapIndex(0)
      setFrameRate(devices[value].capacity[capIndex].modifyFps)
    }
    if (key === 'resolution') {
      setCapIndex(value)
      setFrameRate(devices[devIndex].capacity[value].modifyFps)
    }
    if (key === 'frameRate') {
      setFrameRate(value)
    }
  }

  const capInfo = useMemo(()=> {
    return devices[devIndex].capacity
  },[devIndex])

  const handleAdd = () => {
    let confirmData = {
      selectdDevice: devIndex,
      selectCap: capIndex,
      fps: frameRate
    }
    onOk(confirmData)
  }


  return (
    <Modal
      title='添加摄像头'
      okText='添加'
      cancelText='取消'
      width={400}
      open= {isOpen}
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
            <Select value={devIndex} onChange={(value) => { formChange('camera', value)}}>
              {
                devices.map((item,index) => {
                  return (
                    <Select.Option key={item.deviceId} value={index}>{item.deviceName}</Select.Option>
                  )
                })
              }
            </Select>
          </Form.Item>
          <Form.Item label="分辨率">
            <Select value={capIndex} onChange={(value) => { formChange('resolution', value)}}>
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
            <Input value={frameRate} onChange={(e) => { formChange('frameRate', e.target.value)}}/>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default CameraModal