declare namespace LivePreviewScssNamespace {
  export interface ILivePreviewScss {
    active: string;
    area: string;
    button: string;
    header: string;
    layoutSetting: string;
    livePreview: string;
    options: string;
    previewColum: string;
    previewRow: string;
    title: string;
  }
}

declare const LivePreviewScssModule: LivePreviewScssNamespace.ILivePreviewScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: LivePreviewScssNamespace.ILivePreviewScss;
};

export = LivePreviewScssModule;
