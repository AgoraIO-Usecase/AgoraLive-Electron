declare namespace CameraModalScssNamespace {
  export interface ICameraModalScss {
    content: string;
    customerModal: string;
  }
}

declare const CameraModalScssModule: CameraModalScssNamespace.ICameraModalScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: CameraModalScssNamespace.ICameraModalScss;
};

export = CameraModalScssModule;
