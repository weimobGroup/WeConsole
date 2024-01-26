import type { RequireId } from './common';
import type { MpItemsComponentExports } from './items';
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

export type MpDataGridComponentExports<T extends RequireId = RequireId> = MpItemsComponentExports<T>;
