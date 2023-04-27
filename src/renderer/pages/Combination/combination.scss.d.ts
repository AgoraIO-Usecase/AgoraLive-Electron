declare namespace CombinationScssNamespace {
  export interface ICombinationScss {
    compositeMask: string;
    display: string;
    material: string;
  }
}

declare const CombinationScssModule: CombinationScssNamespace.ICombinationScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: CombinationScssNamespace.ICombinationScss;
};

export = CombinationScssModule;
