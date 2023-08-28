import path from 'path';
import { message } from 'antd'
import { IDevice, SourceType, IDeviceCapacity } from "../types"
import {
  CameraCapturerConfiguration,
  VideoSourceType,
} from 'agora-electron-sdk'


let screenShareObj = { firstScreen: false, secondScreen: false, thirdScreen: false }
let cameraType = { firstCamera: false, secondCamera: false, thirdCamera: false }
export let transCodeSources: SourceType[] = []

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



export const getShareScreenType = () => {
  let index = -1;
  let type = -1
  if (screenShareObj["firstScreen"]) {
    if (screenShareObj["secondScreen"]) {
      index = screenShareObj["thirdScreen"] ? -1 : 3;
    } else {
      index = 2;
    }
  } else {
    index = 1;
  }
  if (index == -1) {
    message.info('最多开启3个窗口分享');
    return type;
  }

  if (index == 1) {
    type = VideoSourceType.VideoSourceScreenPrimary
  }
  else if (index == 2) {
    type = VideoSourceType.VideoSourceScreenSecondary
  }
  else {
    type = VideoSourceType.VideoSourceScreenThird
  }

  return type;
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
  //let obj = screenShareObj;
  if (type == VideoSourceType.VideoSourceCameraPrimary) {
    cameraType = { firstCamera: status, secondCamera: cameraType["secondCamera"], thirdCamera: cameraType["thirdCamera"] }
  }
  else if (type == VideoSourceType.VideoSourceCameraSecondary) {
    cameraType = { firstCamera: cameraType["firstCamera"], secondCamera: status, thirdCamera: cameraType["thirdCamera"] }
  }
  else {
    cameraType = { firstCamera: cameraType["firstCamera"], secondCamera: cameraType["secondCamera"], thirdCamera: status }
  }
}


export const resetData = () => {
  screenShareObj = { firstScreen: false, secondScreen: false, thirdScreen: false }
  cameraType = { firstCamera: false, secondCamera: false, thirdCamera: false }
  resetTransCodeSources()
}


export const resetTransCodeSources = () => {
  transCodeSources = []
}
