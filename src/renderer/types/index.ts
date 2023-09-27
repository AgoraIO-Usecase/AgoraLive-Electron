import { TranscodingVideoStream, ThumbImageBuffer } from "agora-electron-sdk"


export interface IDeviceCapacity {
  width: number,
  height: number,
  fps: number,
}

export interface IDevice {
  deviceId: string,
  deviceName: string
  capacity: IDeviceCapacity[]
}



export interface SourceType {
  id: string,
  source: TranscodingVideoStream
}


// interface CaptureWindow {
//   id: string,
//   sourceName: string,
//   thumbImage: ThumbImageBuffer,
//   sourceId: item.sourceId,
//   position: item.position
// }
