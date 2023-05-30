declare namespace IndexScssNamespace {
  export interface IIndexScss {
    appConfig: string;
    btnWapper: string;
    game: string;
    gameLiving: string;
    gameMessage: string;
    listContainer: string;
    livingWapper: string;
    main: string;
    mainLeft: string;
    meta: string;
    msgOpt: string;
    msgSend: string;
    msgShow: string;
    online: string;
    optBtnWapper: string;
    person: string;
    personList: string;
    playMethod: string;
    screenMain: string;
    title: string;
  }
}

declare const IndexScssModule: IndexScssNamespace.IIndexScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: IndexScssNamespace.IIndexScss;
};

export = IndexScssModule;
