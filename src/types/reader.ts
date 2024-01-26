import type { MpNameValue } from './common';
import type { MpMaterial, MpProduct } from './product';

export const enum MpDataReaderAction {
    /** 留存 */
    keepSave = 1,
    /** 置顶 */
    top = 2,
    /** 标记 */
    mark = 4,
    /** 取消全部标记 */
    cancelAllMark = 6,
    /** 取消全部留存 */
    cancelAllKeepSave = 7,
    /** 分类为... */
    groupTo = 8,
    /** 复制，内容按reader的实现 */
    copy = 9
}

export type MpDataReaderActionTextGetter<T extends MpMaterial = MpMaterial> = (
    action: MpDataReaderAction,
    id: string,
    material?: T,
    product?: MpProduct
) => string;

export interface MpDataReaderActionInfo {
    action: MpDataReaderAction;
    text?: string | MpDataReaderActionTextGetter;
}
export interface MpDataReaderComponentData {
    categoryList?: MpNameValue<string>[];
    activeCategory?: string;
    materialActions?: Array<MpDataReaderActionInfo | MpDataReaderAction>;
}
