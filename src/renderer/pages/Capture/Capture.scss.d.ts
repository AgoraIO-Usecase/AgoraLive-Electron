declare namespace CaptureScssNamespace {
  export interface ICaptureScss {
    capture: string;
  }
}

declare const CaptureScssModule: CaptureScssNamespace.ICaptureScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: CaptureScssNamespace.ICaptureScss;
};

export = CaptureScssModule;
