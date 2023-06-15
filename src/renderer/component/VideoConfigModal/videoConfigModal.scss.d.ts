declare namespace VideoConfigModalScssNamespace {
  export interface IVideoConfigModalScss {
    coder: string;
    content: string;
    customerModal: string;
  }
}

declare const VideoConfigModalScssModule: VideoConfigModalScssNamespace.IVideoConfigModalScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: VideoConfigModalScssNamespace.IVideoConfigModalScss;
};

export = VideoConfigModalScssModule;
