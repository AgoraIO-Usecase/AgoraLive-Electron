declare namespace TemplateScssNamespace {
  export interface ITemplateScss {
    temp: string;
    tempContent: string;
    tempTitle: string;
  }
}

declare const TemplateScssModule: TemplateScssNamespace.ITemplateScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: TemplateScssNamespace.ITemplateScss;
};

export = TemplateScssModule;
