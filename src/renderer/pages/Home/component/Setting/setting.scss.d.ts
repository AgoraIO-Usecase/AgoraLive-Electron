declare namespace SettingScssNamespace {
  export interface ISettingScss {
    customInput: string;
    customerSlider: string;
    divider: string;
    inputArea: string;
    microphone: string;
    setting: string;
    settingInput: string;
    tool: string;
    voice: string;
  }
}

declare const SettingScssModule: SettingScssNamespace.ISettingScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: SettingScssNamespace.ISettingScss;
};

export = SettingScssModule;
