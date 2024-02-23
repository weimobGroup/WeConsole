import type { MpApiVar, MpViewFactory } from '@mpkit/types';

declare global {
    let global: any;
    let getApp: (config?: any) => any;
    let getCurrentPages: () => undefined | any[];
    let wx: MpApiVar;
    let my: MpApiVar;
    let swan: MpApiVar;
    let tt: MpApiVar;
    let xhs: MpApiVar;
    let qq: MpApiVar;
    let ks: MpApiVar;
    let App: MpViewFactory;
    let Page: MpViewFactory;
    let Component: MpViewFactory;
    /** 编译目标 */
    let BUILD_TARGET: 'wx' | 'my' | 'swan' | 'qq' | 'tt' | 'ks' | 'xhs';
    let __wxConfig: any;
    let __qqConfig: any;
    let __appxStartupParams: any;
}
