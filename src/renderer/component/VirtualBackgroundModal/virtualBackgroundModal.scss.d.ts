declare namespace VirtualBackgroundModalScssNamespace {
  export interface IVirtualBackgroundModalScss {
    content: string;
    footer: string;
  }
}

declare const VirtualBackgroundModalScssModule: VirtualBackgroundModalScssNamespace.IVirtualBackgroundModalScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: VirtualBackgroundModalScssNamespace.IVirtualBackgroundModalScss;
};

export = VirtualBackgroundModalScssModule;
