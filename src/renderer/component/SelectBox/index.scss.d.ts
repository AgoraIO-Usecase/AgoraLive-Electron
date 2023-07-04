declare namespace IndexScssNamespace {
  export interface IIndexScss {
    "bottom-left": string;
    "bottom-right": string;
    box: string;
    content: string;
    dlgBody: string;
    resizer: string;
    "top-left": string;
    "top-right": string;
  }
}

declare const IndexScssModule: IndexScssNamespace.IIndexScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: IndexScssNamespace.IIndexScss;
};

export = IndexScssModule;
