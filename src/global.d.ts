import type { MpApiVar, MpViewFactory } from '@mpkit/types';

declare global {
    let global: any;
    let getApp: (config?: any) => any;
    let getCurrentPages: () => undefined | any[];
    let wx: MpApiVar;
    let my: MpApiVar;
    let swan: MpApiVar;
    let tt: MpApiVar;
    let App: MpViewFactory;
    let Page: MpViewFactory;
    let Component: MpViewFactory;
}
