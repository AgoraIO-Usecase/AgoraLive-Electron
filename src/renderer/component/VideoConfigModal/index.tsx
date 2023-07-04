import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react'
import { Modal, Form, Select, Input, Switch } from 'antd'
import styles from './videoConfigModal.scss'
import { VideoCodecType,EncodingPreference,VideoEncoderConfiguration } from 'agora-electron-sdk'
import { message } from 'antd'
import RtcEngineContext, { IAppContext } from "../../context/rtcEngineContext"


interface IProps {
  isOpen: boolean,
  onChange: () => void
}


const defaultConfig = {
  width: 1080,
  height: 1920,
  frameRate: 15,
  codeRate: 1461,
  encoder: VideoCodecType.VideoCodecH265,
  method: EncodingPreference.PreferHardware,
  pvc: true
}

const VideoConfigModal: React.FC<IProps> = ({isOpen, onChange}) => {
  const [videoConfig,setVideoConfig] = useState(defaultConfig)
  const { rtcEngine } = useContext(RtcEngineContext) as IAppContext

  const handleFormChange = (type, value) => {
    console.log('type: ',type,'value: ',value)
    setVideoConfig((preConfig) => {
      console.log('-----config: ',preConfig)
      return {
        ...preConfig,
        [type]: value
      }
    })
  }

  const onOkClick = () => {
    const config: VideoEncoderConfiguration = {
      dimensions: {
        width: videoConfig.width,
        height: videoConfig.height
      },
      codecType: videoConfig.encoder,
      frameRate: videoConfig.frameRate,
      bitrate: videoConfig.codeRate,
      advanceOptions: {
        encodingPreference: videoConfig.method
      }
    }
    if(videoConfig.encoder === VideoCodecType.VideoCodecH265)
    {
      //rtcEngine?.setParameters(JSON.stringify({'engine.video.enable_hw_encoder': true}));
      rtcEngine?.setParameters(JSON.stringify({'che.video.videoCodecIndex': 2}));
      //rtcEngine?.setParameters(JSON.stringify({'che.video.hw265_enc_enable': 1}));
    }


    let ret = rtcEngine?.setVideoEncoderConfiguration(config)
    console.log('----config: ',config)
    console.log('----ret: ',ret)
    if (ret === 0) {
      onChange()
    } else {
      message.info('音视频属性设置失败，请重新设置')
    }
  }

  return (
    <Modal
      title='音视频设置'
      okText='修改'
      cancelText='取消'
      width={400}
      open= {isOpen}
      onOk={onOkClick}
      onCancel={onChange}
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
          <Form.Item label="编码分辨率">
            <div className={styles.coder}>
              <Input value={videoConfig.width} onChange={(e) => { handleFormChange('width', +e.target.value)}}/>
              <span>x</span>
              <Input value={videoConfig.height} onChange={(e) => { handleFormChange('height', +e.target.value)}}/>
            </div>
          </Form.Item>
          <Form.Item label="编码帧率(fps)">
            <Input value={videoConfig.frameRate} onChange={(e) => { handleFormChange('frameRate', +e.target.value)}}/>
          </Form.Item>
          <Form.Item label="码率(kbps)">
            <Input value={videoConfig.codeRate} onChange={(e) => { handleFormChange('codeRate', +e.target.value)}}/>
          </Form.Item>
          <Form.Item label="编码器">
            <Select value={videoConfig.encoder} onChange={(value) => { handleFormChange('encoder', value)}}>
              <Select.Option  value={VideoCodecType.VideoCodecH265}>H.265</Select.Option>
              <Select.Option  value={VideoCodecType.VideoCodecH264}>H.264</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="硬编/软编">
            <Select value={videoConfig.method} onChange={(value) => { handleFormChange('method', value)}}>
              <Select.Option  value={EncodingPreference.PreferHardware}>硬编</Select.Option>
              <Select.Option  value={EncodingPreference.PreferSoftware}>软编</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="PVC">
            <Switch checked={videoConfig.pvc} onChange={(checkd) => {handleFormChange('pvc',checkd)}}></Switch>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default VideoConfigModal