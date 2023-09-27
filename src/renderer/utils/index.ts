import path from 'path';
import { message } from 'antd'
import { IDevice, SourceType, IDeviceCapacity } from "../types"
import {
  CameraCapturerConfiguration,
  VideoSourceType,
  TranscodingVideoStream,
} from 'agora-electron-sdk'
import { MIN_WIDTH, MIN_HEIGHT } from "./constant"

let screenShareObj = { firstScreen: false, secondScreen: false, thirdScreen: false }
let cameraType = { firstCamera: false, secondCamera: false, thirdCamera: false }

export const objToArray = (obj) =>
  Object.keys(obj).map((key) => ({ key, value: obj[key] }));

export const configMapToOptions = (obj) =>
  objToArray(obj).map(({ key, value }) => ({
    dropId: value,
    dropText: key,
  }));

export const configEnumToOptions = (enumValue) => {
  const items = Object.values(enumValue);
  const keys = items.filter((v) => typeof v === 'string') as string[];
  const values = items.filter((v) => typeof v === 'number') as number[];
  return keys.map((value, index) => ({
    dropId: values[index],
    dropText: value,
  }));
};

export const objectToItems = (object: any): Object[] => {
  return Object.keys(object).map((value) => {
    return {
      label: value,
      value: object[value],
    };
  });
};

export const arrayToItems = (array: any[]): Object[] => {
  return array.map((value) => {
    return {
      label: value.toString(),
      value: value,
    };
  });
};

export const enumToItems = (enumType: any): Object[] => {
  const items = Object.values(enumType);
  const keys = items.filter((v) => typeof v === 'string') as string[];
  const values = items.filter((v) => typeof v === 'number') as number[];
  return keys.map((value, index) => ({
    label: value,
    value: values[index],
  }));
};

export const isDebug = () => {
  return process.env.NODE_ENV === 'development';
};

export const getResourcePath = (filePath = './') => {
  let resourcePath;
  if (isDebug()) {
    resourcePath = path.resolve(
      `${__dirname}`,
      '../../../extraResources/',
      filePath
    );
  } else {
    resourcePath = path.resolve(
      `${process.resourcesPath}/extraResources`,
      filePath
    );
  }
  return resourcePath;
};

export const getRandomInt = (min = 1, max = 99999) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 函数防抖: 当事件被触发 n 秒后再执行回调，如果在 n 秒内又被触发，则重新计时。
 * @param {*} func 
 * @param {*} wait 
 * @returns { Function }
 */
export const debounce = (func, wait) => {
  let delay = wait || 500;
  let timer;
  return function (this: unknown, ...args: any[]) {
    const _this = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      func.apply(_this, args)
    }, delay)
  }
}


export const checkAppId = (appId: string) => {
  if (!appId) {
    const msg = '请输入App ID'
    message.error(msg)
  }
}


export const getShareScreenType = (): VideoSourceType | -1 => {
  if (screenShareObj["firstScreen"]) {
    if (screenShareObj["secondScreen"]) {
      if (screenShareObj["thirdScreen"]) {
        message.info('最多开启3个窗口分享');
        return -1
      } else {
        return VideoSourceType.VideoSourceScreenThird
      }
    } else {
      return VideoSourceType.VideoSourceScreenSecondary
    }
  } else {
    return VideoSourceType.VideoSourceScreenPrimary
  }
}


export const setScreenShareObjStatus = (type, status) => {
  if (type == VideoSourceType.VideoSourceScreenPrimary) {
    screenShareObj = { firstScreen: status, secondScreen: screenShareObj["secondScreen"], thirdScreen: screenShareObj["thirdScreen"] }
  }
  else if (type == VideoSourceType.VideoSourceScreenSecondary) {
    screenShareObj = { firstScreen: screenShareObj["firstScreen"], secondScreen: status, thirdScreen: screenShareObj["thirdScreen"] }
  }
  else {
    screenShareObj = { firstScreen: screenShareObj["firstScreen"], secondScreen: screenShareObj["secondScreen"], thirdScreen: status }
  }
}


export const getCameraType = () => {
  let index = -1;
  let type = -1
  if (cameraType["firstCamera"]) {
    if (cameraType["secondCamera"]) {
      index = cameraType["thirdCamera"] ? -1 : 3;
    }
    else {
      index = 2;
    }
  }
  else {
    index = 1;
  }
  if (index == -1) {
    message.info('最多开启3个摄像头');
    return type;
  }

  if (index == 1) {
    type = VideoSourceType.VideoSourceCameraPrimary
  }
  else if (index == 2) {
    type = VideoSourceType.VideoSourceCameraSecondary
  }
  else {
    type = VideoSourceType.VideoSourceCameraThird
  }

  return type;
}


export const setCameraTypeStatus = (type, status) => {
  switch (type) {
    case VideoSourceType.VideoSourceCameraPrimary:
      cameraType = { firstCamera: status, secondCamera: cameraType["secondCamera"], thirdCamera: cameraType["thirdCamera"] }
      break;
    case VideoSourceType.VideoSourceCameraSecondary:
      cameraType = { firstCamera: cameraType["firstCamera"], secondCamera: status, thirdCamera: cameraType["thirdCamera"] }
      break;
    case VideoSourceType.VideoSourceCameraThird:
      cameraType = { firstCamera: cameraType["firstCamera"], secondCamera: cameraType["secondCamera"], thirdCamera: status }
      break;
  }
}


export const resetData = () => {
  screenShareObj = { firstScreen: false, secondScreen: false, thirdScreen: false }
  cameraType = { firstCamera: false, secondCamera: false, thirdCamera: false }
}


export const calcTranscoderOptions = (sources: SourceType[], isHorizontal: boolean) => {
  let videoInputStreams = sources.map(s => {
    Object.assign({ connectionId: 0 }, s.source)
    return s.source
  })
  //dimensions 参数设置输出的画面横竖屏
  let videoOutputConfigurationobj = {
    dimensions: isHorizontal ? { width: 1280, height: 720 } : { width: 720, height: 1280 },
    frameRate: 25,
    bitrate: 0,
    minBitrate: -1,
    orientationMode: 0,
    degradationPreference: 0,
    mirrorMode: 0
  }
  return {
    streamCount: sources.length,
    videoInputStreams: videoInputStreams,
    videoOutputConfiguration: videoOutputConfigurationobj
  }
}


export const transVideoSourceType = (srcUrl: string, type: string) => {
  if (type === 'image') {
    if (srcUrl.endsWith('.png')) {
      return VideoSourceType.VideoSourceRtcImagePng
    } else {
      return VideoSourceType.VideoSourceRtcImageJpeg
    }
  } else if (type === 'gif') {
    return VideoSourceType.VideoSourceRtcImageGif
  } else if (type === 'video') {
    return VideoSourceType.VideoSourceMediaPlayer
  }
}


export const genBaseSource = (): TranscodingVideoStream => {
  return {
    x: 0,
    y: 0,
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
    zOrder: 0,
    alpha: 1,
  } as TranscodingVideoStream
}


// VideoSourceType
// VideoSourceCamera
export const isVideoSourceTypeCamera = (sourceType: VideoSourceType | undefined): boolean => {
  return sourceType === VideoSourceType.VideoSourceCamera ||
    sourceType === VideoSourceType.VideoSourceCameraSecondary ||
    sourceType === VideoSourceType.VideoSourceCameraThird
}



export const isVideoSourceTypeScreen = (sourceType: VideoSourceType | undefined): boolean => {
  return sourceType === VideoSourceType.VideoSourceScreenPrimary ||
    sourceType === VideoSourceType.VideoSourceScreenSecondary ||
    sourceType === VideoSourceType.VideoSourceScreenThird
}
