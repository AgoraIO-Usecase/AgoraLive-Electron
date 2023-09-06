import React from 'react'
import { IRtcEngineEx } from 'agora-electron-sdk'


export interface IAppContext {
  appId: string,
  channel: string,
  uid: number,
  setChannel: (channel: string) => void
  setAppId: (appId: string) => void
  sdkLogPath: string
}

const initAppData: IAppContext = {
  uid: 0,
  appId: "",
  channel: "",
  setAppId: () => { },
  setChannel: () => { },
  sdkLogPath: ""
}


const RtcEngineContext = React.createContext<IAppContext>(initAppData)


export default RtcEngineContext
