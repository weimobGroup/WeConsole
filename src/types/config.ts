import { MpNameValue } from './common';
import { WcCustomAction } from './other';
import { MpProduct } from './product';

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
}
