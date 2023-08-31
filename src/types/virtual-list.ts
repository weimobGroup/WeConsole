import { RequireId } from './common';
import { AnyFunction } from './util';
import { MpEvent, MpScrollEventDetail, MpViewContext } from './view';

export interface MpVirtualListComponentData<T extends RequireId = RequireId> {
    $vlScrollTop: number;
    $vlContainerSelector: string;
    /** 显示的数据 */
    $vlShowList: T[];
    $vlItemStaticHeight?: number;
    $vlItemPrecutHeight?: number;
    $vlItemHeightMap?: {
        [prop: string]: number;
    };
    /** 起始站位高度 */
    $vlStartPlaceholderHeight: number;
    /** 尾端站位高度 */
    $vlEndPlaceholderHeight: number;
    /** 每页显示多少条数据 */
    $vlPageSize: number;
    $vlTotalCount: number;
    $vlUpdateDelay: number;
    $vlDebug?: boolean;
}

export interface MpVirtualListComponent<T extends RequireId = RequireId> {
    $vlContainerHeight?: number;
    $vlContainerHeightComputeing?: boolean;
    $vlContainerHeightComputeQueue?: AnyFunction[];
    $vlIsLock?: boolean;
    $vlHasListUpdate?: boolean;
    $vlAllList?: T[];
    $vlOldScrollTop?: number;
    $vlScrollTop?: number;
    $vlPrevScrollInfo?: [number, number];
    $vlSetDataTimer?: any;
    $vlClearing?: boolean;
    $vlComputeShowListTimer?: any;
    $vlItemClientRectQueryMap?: {
        [prop: string]: AnyFunction;
    };
    $vlItemHeightMap: {
        [prop: string]: number;
    };
    $vlStartIndex?: number;
    $vlEndIndex?: number;
    $vlItemHeightComputeMap?: {
        [prop: string]: Promise<number>;
    };
    $vlItemState?: {
        [prop: string]: any;
    };
    data: MpVirtualListComponentData<T>;
}

export interface MpVirtualListComponentMethods<
    T extends RequireId = RequireId,
    C extends MpVirtualListComponent<T> = MpVirtualListComponent<T>
> {
    /** 初始化虚拟列表 */
    $vlInit: (this: C) => any;
    /** 当滚动发生时 */
    $vlOnScroll: (this: C, e: MpEvent<MpScrollEventDetail>) => any;
    /** 向虚拟列表中添加数据 */
    $vlAddItem: (this: C, item: T) => any;
    /** 清空虚拟列表中的所有数据 */
    $vlClear: (this: C) => Promise<void>;
    /** 获取每项高度的函数，如果返回0则代表此项需要动态观察其高度 */
    $vlGetItemHeight?: (this: C, index: number) => number;
    /** 计算项目高度的函数 */
    $vlComputeItemHeight?: (this: C, id: string) => Promise<number>;
    /** 计算并生成要显示的列表数据 */
    $vlComputeShowList: (this: C) => any;
    $vlOnContainerHeightComputed?: (this: C) => any;
    /** 计算容器高度/可视区域高度 */
    $vlComputeContainerHeight: (this: C, callback?: AnyFunction) => any;
    /** 当列表发生变化时，执行该函数 */
    $vlListChange: (this: C) => any;
    /** 重新计算容器高度，并计算showList */
    $vlReload: (this: C) => any;
    /** 锁住列表更新 */
    $vlLock: (this: C) => any;
    /** 解锁列表更新 */
    $vlUnLock: (this: C) => any;
    /** 设置显示列表数据 */
    $vlSetShowList: (this: C, startIndex: number, endIndex: number) => any;
    /** 设置某项高度，并触发列表计算 */
    $vlSetItemHeight: (this: C, itemId: string, height: number) => any;
    $vlSaveItemState: (this: C, itemId: string, state: any, replace?: boolean) => any;
    $vlRestoreItemState: (this: C, itemId: string) => any;
    $vlItemRestorePolicy?: (this: C, itemId: string, state: any) => any;
    $vlGetPageSize?: (this: C) => number;
    $vlLockScrollTo: (this: C, top: number) => any;
}

export type MpVirtualListComponentContext<T extends RequireId = RequireId> = MpVirtualListComponent<T> &
    MpVirtualListComponentMethods<T, MpVirtualListComponentContext<T>> &
    MpViewContext<MpVirtualListComponentData<T>>;
export interface MpVirtualListComponentSpec<T extends RequireId = RequireId> {
    data: MpVirtualListComponentData<T>;
    methods?: MpVirtualListComponentMethods<T, MpVirtualListComponentContext<T>>;
}
