import type { MpNameValue } from './common';
import type { WcCustomAction } from './other';
import type { MpProduct } from './product';

export type MpProductCategoryGetter = (product: Partial<MpProduct>) => string | string[];

/** 取数据的category字段值对应的prop */
export interface MpProductCategoryMap {
    [prop: string]: string | MpProductCategoryGetter;
}

export interface MpProductCopyPolicy {
    (product: Partial<MpProduct>);
}

export interface MpUIConfig {
    /** 监控小程序API数据后，使用该选项进行该数据的分类值计算，计算后的结果显示在界面上 */
    apiCategoryGetter?: MpProductCategoryMap | MpProductCategoryGetter;
    /** 监控Console数据后，使用该选项进行该数据的分类值计算，计算后的结果显示在界面上 */
    consoleCategoryGetter?: MpProductCategoryMap | MpProductCategoryGetter;
    /** API选项卡下显示的数据分类列表，all、mark、other 分类固定存在 */
    apiCategoryList?: Array<string | MpNameValue<string>>;
    /** 复制策略，传入复制数据，可通过数据的type字段判断数据哪种类型，比如api/console */
    copyPolicy?: MpProductCopyPolicy;
    /** 定制化列表 */
    customActions?: WcCustomAction[];
    /** 默认的api分类值 */
    apiDefaultCategoryValue?: string;
    /** 默认的console分类值 */
    consoleDefaultCategoryValue?: string;
    /** 不监控这些API，也就是说这些API调用后不会在【API】选项卡中显示 */
    ignoreHookApiNames?: string[];
    /** 只监控这些API，也就是除了这些API以外的其他调用都不会在【API】选项卡中显示 */
    onlyHookApiNames?: string[];
    /** 多页面状态同步是否开启？开启后，将同步更新多个页面的weconsole组件状态（显示隐藏等），会增加性能损耗！ */
    multiplePageStateEnabled?: boolean;
    /** 全局对象，如果你的小程序存在沙盒环境，请务必传递一个可供全局存储数据的单例对象 */
    globalObject?: any;
}
