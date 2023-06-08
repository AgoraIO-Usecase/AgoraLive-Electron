declare namespace MicrophoneScssNamespace {
  export interface IMicrophoneScss {
    content: string;
    microphone: string;
    title: string;
  }
}

declare const MicrophoneScssModule: MicrophoneScssNamespace.IMicrophoneScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: MicrophoneScssNamespace.IMicrophoneScss;
};

export = MicrophoneScssModule;
