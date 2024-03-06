import type { Hooker } from '@/main/modules/hooker';
import type { MpProductController } from '@/main/modules/controller';
import type { MpUIConfig } from './config';
import type { AnyFunction } from './util';

export interface WeConsoleScopeSingleMap {
    /** 数据监控控制器 */
    ProductController?: MpProductController;
    HookerList?: Hooker[];
    /** 小程序App/Page/Component实例 */
    MpViewInstances?: any[];
}

export const enum WeConsoleEvents {
    /** UIConfig对象发生变化时 */
    WcUIConfigChange = 'WcUIConfigChange',
    /** 入口图标显示性发生变化时 */
    WcVisibleChange = 'WcVisibleChange',
    /** CanvasContext准备好时，CanvasContext用于JSON树组件的界面文字宽度计算 */
    WcCanvasContextReady = 'WcCanvasContextReady',
    WcCanvasContextFail = 'WcCanvasContextFail',
    /** CanvasContext销毁时 */
    WcCanvasContextDestory = 'WcCanvasContextDestory',
    /** 主组件的宽高发生变化时 */
    WcMainComponentSizeChange = 'WcMainComponentSizeChange'
}
export interface WeConsoleScope {
    /** 是否显示WeConsole入口 */
    visible?: boolean;
    /** UI配置 */
    UIConfig?: MpUIConfig;
    SingleMapPromise?: {
        [prop: string]: AnyFunction[];
    };
    SingleMap?: WeConsoleScopeSingleMap;
    /** 公用Canvas Context */
    CanvasContext?: any;
    CanvasContextFail?: boolean;
    apiCallMark?: string;
}
