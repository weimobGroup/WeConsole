import type { RequireId } from './common';
import type { MpItemsComponent, MpItemsComponentExports, MpItemsComponentMethods } from './items';
import type { MpJSONViewerComponentEbusDetail } from '@/sub/components/json-viewer';
import type { AnyFunction } from './util';
import type { MpComponentLifeSpec, MpComponentProperties, MpEvent, MpViewContext, MpWcViewContext } from './view';
import type { MpVirtualListComponent, MpVirtualListComponentMethods } from './virtual-list';

export interface DataGridCol {
    field: string;
    title: string;
    /** 是否显示 */
    visible?: boolean;
    /** 是否可换行 */
    wrap?: boolean;
    subTitle?: string;
    width?: number; // 只接受%单位
    json?: boolean;
}

export interface MpDataGridComponentData {
    lineLefts: string[];
    columnWidthMap: {
        [prop: string]: number;
    };
}

export interface MpDataGridComponentProps<T extends RequireId = RequireId> {
    from: string;
    outerClass: string;
    rowClass: string;
    selected: string | string[];
    vlPageSize: number;
    vlItemHeight: number;
    affixable: boolean;
    affixIds: string[];
    colMinWidth: number;
    cols: DataGridCol[];
    /** 尽量不要使用该属性进行数据更新，应该使用事件拿到本组件实例，然后手动$vlAddItem */
    data: T[];
}
export interface MpDataGridComponent<T extends RequireId = RequireId> {
    computeColWidthTimer?: any;
    data: MpDataGridComponentData & MpDataGridComponentProps<T>;
    outerScollerHandler?: AnyFunction;
    outerJSONViewerHandler?: AnyFunction;
    JSONViewerReadyList?: MpJSONViewerComponentEbusDetail[];
}
export interface MpDataGridComponentMethods<C extends MpDataGridComponent = MpDataGridComponent> {
    computeColWidth: (this: C) => void;
    tapCell: (this: C, e: MpEvent) => void;
    localOnScroll: (this: C, e: MpEvent) => void;
}

export type MpDataGridComponentExports<T extends RequireId = RequireId> = MpItemsComponentExports<T>;

export type MpDataGridComponentContext<T extends RequireId = RequireId> = MpWcViewContext &
    MpDataGridComponent<T> &
    MpDataGridComponentMethods<MpDataGridComponentContext<T>> &
    MpItemsComponent<T> &
    MpItemsComponentMethods<MpDataGridComponentContext<T>> &
    MpVirtualListComponent<T> &
    MpVirtualListComponentMethods<T, MpDataGridComponentContext<T>> &
    MpViewContext;

export interface MpDataGridComponentSpec<T extends RequireId = RequireId>
    extends MpComponentLifeSpec<MpDataGridComponentContext> {
    properties: MpComponentProperties<MpDataGridComponentContext>;
    data: MpDataGridComponentData;
    methods: MpDataGridComponentMethods<MpDataGridComponentContext<T>>;
}
