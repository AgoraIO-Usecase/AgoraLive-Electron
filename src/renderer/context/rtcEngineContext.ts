import React from 'react'
import { IRtcEngineEx } from 'agora-electron-sdk'

export interface IAppContext {
  isAppIdExist: boolean,
  appId: string
  rtcEngine: IRtcEngineEx | null,
  updateAppStatus: (isExist: boolean) => void,
  updateAppId: (appId: string) => void
}

const RtcEngineContext = React.createContext<IAppContext|null>(null)
export default RtcEngineContext