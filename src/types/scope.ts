import { Hooker } from '../modules/hooker';
import { MpProductController } from '../modules/controller';
import { MpUIConfig } from './config';

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
    WcVisableChange = 'WcVisableChange',
    /** CanvasContext准备好时，CanvasContext用于JSON树组件的界面文字宽度计算 */
    WcCanvasContextReady = 'WcCanvasContextReady',
    /** CanvasContext销毁时 */
    WcCanvasContextDestory = 'WcCanvasContextDestory',
    /** 主组件的宽高发生变化时 */
    WcMainComponentSizeChange = 'WcMainComponentSizeChange'
}
export interface WeConsoleScope {
    /** 是否显示WeConsole入口 */
    visable?: boolean;
    /** UI配置 */
    UIConfig?: MpUIConfig;
    SingleMapPromise?: {
        [prop: string]: Function[];
    };
    SingleMap?: WeConsoleScopeSingleMap;
    /** 公用Canvas Context */
    CanvasContext?: any;
}
