import { deburr, set } from 'lodash-es';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SourceType, IDevice } from "../../types"
import { getRandomInt } from "../../utils"

// TODO: init 
const deafultAppId = "d9d6367af4a04f2bb602561a30669946"
const deafultChannel = "test"


interface InitialState {
  transCodeSources: SourceType[],
  isPreview: boolean,
  isHorizontal: boolean
  appId: string,
  channel: string,
  uid: number,
  token: string,
  devices: IDevice[],
  cameraIndex: number,
  capacityIndex: number,
  frameRate: number,
}

const getInitialState = () => {
  return {
    transCodeSources: [],
    isPreview: false,
    isHorizontal: true,
    appId: deafultAppId,
    channel: deafultChannel,
    uid: getRandomInt(),
    token: "",
    devices: [],
    cameraIndex: 0,
    capacityIndex: 0,
    frameRate: 0
  } as InitialState
}

export const infoSlice = createSlice({
  name: 'global',
  initialState: getInitialState(),
  reducers: {
    setTransCodeSources(state, action: PayloadAction<SourceType[]>) {
      state.transCodeSources = action.payload
    },
    addTransCodeSource(state, action: PayloadAction<SourceType>) {
      const item = action.payload
      const exist = state.transCodeSources.find((source) => source.id === item.id)
      if (!exist) {
        state.transCodeSources.push(item)
      }
    },
    setIsPreview(state, action: PayloadAction<boolean>) {
      state.isPreview = action.payload
    },
    setIsHorizontal(state, action: PayloadAction<boolean>) {
      state.isHorizontal = action.payload
    },
    setChannel(state, action: PayloadAction<string>) {
      state.channel = action.payload
    },
    setAppId(state, action: PayloadAction<string>) {
      state.appId = action.payload
    },
    setDevices(state, action: PayloadAction<IDevice[]>) {
      state.devices = action.payload
    },
    setCameraIndex(state, action: PayloadAction<number>) {
      state.cameraIndex = action.payload
    },
    setCapacityIndex(state, action: PayloadAction<number>) {
      state.capacityIndex = action.payload
    },
    setFrameRate(state, action: PayloadAction<number>) {
      state.frameRate = action.payload
    },
    // updateDevices(state, action: PayloadAction<IDevice>) {

    // },
    reset(state) {
      Object.assign(state, getInitialState())
    }
  },
});

export const {
  reset, setTransCodeSources,
  addTransCodeSource, setIsPreview, setIsHorizontal,
  setChannel, setAppId, setDevices, setCameraIndex,
  setCapacityIndex, setFrameRate
} = infoSlice.actions;

export default infoSlice.reducer;
