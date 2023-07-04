declare namespace CaptureWinModalScssNamespace {
  export interface ICaptureWinModalScss {
    card: string;
    content: string;
  }
}

declare const CaptureWinModalScssModule: CaptureWinModalScssNamespace.ICaptureWinModalScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: CaptureWinModalScssNamespace.ICaptureWinModalScss;
};

export = CaptureWinModalScssModule;
