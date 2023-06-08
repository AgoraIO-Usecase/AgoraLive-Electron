declare namespace LiveToolScssNamespace {
  export interface ILiveToolScss {
    content: string;
    liveTool: string;
    title: string;
  }
}

declare const LiveToolScssModule: LiveToolScssNamespace.ILiveToolScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: LiveToolScssNamespace.ILiveToolScss;
};

export = LiveToolScssModule;
