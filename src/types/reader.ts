import type { MpMaterialCategoryMap, MpNameValue, RequireId } from './common';
import type { MpMaterial, MpProduct } from './product';
import type { MpComponentLifeSpec, MpViewContext, MpWcViewContext } from './view';

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
export interface MpDataReaderComponent<T extends MpMaterial = MpMaterial> {
    filterKeyword?: string;
    materialExist?: {
        [prop: string]: string;
    };
    NormalMaterialCategoryMap?: MpMaterialCategoryMap<T>;
    FilterMaterialCategoryMap?: MpMaterialCategoryMap<T>;
    /** 留存记录 */
    keepSaveMaterials?: {
        [prop: string]: 1;
    };
    /** 标记记录 */
    markMaterials?: {
        [prop: string]: 1;
    };
    /** 置顶记录ID */
    topMaterials?: string[];
    /** 记录分类 */
    materialClassifyMap?: {
        [prop: string]: string[];
    };
    data: MpDataReaderComponentData;
    readerShowList?: T[];
}

export interface MpDataReaderComponentMethods<
    T extends MpMaterial = MpMaterial,
    C extends MpDataReaderComponent<T> = MpDataReaderComponent<T>
> {
    pushShowItem: (this: C, item: T) => any;
    addMaterialToCategory: (this: C, material: Partial<T> & RequireId, map?: MpMaterialCategoryMap<T>) => any;
    initMaterialCategoryMap: (this: C, clear?: boolean, map?: MpMaterialCategoryMap<T>) => any;
    syncNormalMaterialToFilter: (this: C) => any;
    changeCategory: (this: C, activeCategory: string) => any;
    clearMaterial: (this: C) => any;
    filterMaterial: (this: C, keyword: string) => any;
    getProduct: (this: C, id: string) => MpProduct | undefined;
    materialFilterPolicy?: (this: C, keyword: string, item: MpMaterial) => boolean;
    copyMaterial?: (this: C, material: T) => any;
    /** 留存记录 */
    keepSaveMaterial: (this: C, id: string) => any;
    /** 取消留存记录，不传ID则代表全部取消 */
    cancelKeepSaveMaterial: (this: C, id?: string) => any;
    /** 标记记录，记录将放置在mark类型下 */
    markMaterial: (this: C, id: string) => any;
    /** 取消标记记录，不传ID则代表全部取消，取消后记录将从mark类型中移除 */
    cancelMarkMaterial: (this: C, id?: string) => any;
    /** 置顶记录，最多置顶3条记录 */
    topMaterial: (this: C, id: string) => any;
    /** 取消置顶记录，不传ID则代表全部取消 */
    cancelTopMaterial: (this: C, id?: string) => any;
    showMaterialAction: (this: C, rowId: string) => Promise<[MpDataReaderAction, any?]>;
}

export type MpDataReaderComponentContext<T extends MpMaterial = MpMaterial> = MpWcViewContext &
    MpDataReaderComponent<T> &
    MpDataReaderComponentMethods<T, MpDataReaderComponentContext<T>> &
    MpViewContext<MpDataReaderComponentData>;

export interface MpDataReaderComponentSpec<T extends MpMaterial = MpMaterial>
    extends MpComponentLifeSpec<MpDataReaderComponentContext> {
    data: MpDataReaderComponentData;
    methods: MpDataReaderComponentMethods<T, MpDataReaderComponentContext<T>>;
}
