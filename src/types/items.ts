import type { RequireId } from './common';
import type { AnyFunction } from './util';
import type { MpComponentLifeSpec, MpEvent, MpViewContext, MpWcViewContext } from './view';
import type { MpVirtualListComponent, MpVirtualListComponentMethods } from './virtual-list';

export interface MpItemsComponentData<T extends RequireId = RequireId> {
    affixList?: T[];
    scrollMarginTop?: number;
    selectedMap: { [prop: string]: 1 };
    affixIds?: string[];
}
export interface MpItemsComponent<T extends RequireId = RequireId> {
    computeSelectMapTimer?: any;
    computeAffixAllListTimer?: any;
    affixAllList?: T[];
    affixItemHeightMap?: {
        [prop: string]: number;
    };
    data: MpItemsComponentData<T>;
}

export interface MpItemsComponentExports<T extends RequireId = RequireId> {
    from?: string;
    addItem: (item: T) => any;
    replaceAllList: (list: T[]) => any;
    reloadAffixList: (allList?: T[]) => any;
    scrollTo?: (top: number) => any;
    onScroll?: (handler: AnyFunction) => any;
    onJSONReady?: (handler: AnyFunction) => any;
}
export interface MpItemsComponentMethods<C extends MpItemsComponent = MpItemsComponent> {
    triggerReady: (this: C, fireInit: boolean, exports?: Partial<MpItemsComponentExports>) => any;
    computeSelectMap: (this: C) => any;
    computeAffixList: (this: C) => any;
    fireCellEvent: (this: C, name: string, e: MpEvent) => any;
    tapRow: (this: C, e: MpEvent) => any;
    longpressRow: (this: C, e: MpEvent) => any;
}

export type MpItemsComponentContext<T extends RequireId = RequireId> = MpWcViewContext &
    MpItemsComponent<T> &
    MpItemsComponentMethods<MpItemsComponentContext<T>> &
    MpVirtualListComponent<T> &
    MpVirtualListComponentMethods<T, MpItemsComponentContext<T>> &
    MpViewContext;

export interface MpItemsComponentSpec<T extends RequireId = RequireId>
    extends MpComponentLifeSpec<MpItemsComponentContext> {
    data: MpItemsComponentData;
    methods: MpItemsComponentMethods<MpItemsComponentContext<T>>;
}
