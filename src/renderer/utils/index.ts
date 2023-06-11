import path from 'path';

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
    console.log('-----isDebug mode')
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
  return function(this: unknown, ...args: any[]){
    const _this = this;
    if(timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      func.apply(_this, args)
    }, delay)
  }
}