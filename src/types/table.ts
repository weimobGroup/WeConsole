import type { MpVirtualListItemComponentProps } from '@cross-virtual-list/types';
import type { RequireId } from './common';

export interface TableCell {
    tableCell: true;
    blocks: TableCellBlock[];
}

export interface TableCellTextItem {
    type: 'text';
    content: string;
    style?: string;
}

export interface TableCellJsonItem {
    type: 'json';
}

export interface TableCellBlock {
    block: true;
    items: Array<string | TableCellTextItem | TableCellJsonItem>;
}

export interface TableCol {
    /** 列字段 */
    field: string;
    /** 列标题 */
    title: string | TableCell;
    /** 是否可换行 */
    wrap?: boolean;
    /** 列宽度，只接受%单位 */
    width?: number;
}

export interface TableComponentProps<T extends RequireId = RequireId> {
    from: string;
    /** 选中的行ID数组 */
    selected: string[];
    /** 置顶数据的行ID数组 */
    affixed: string[];
    /** 行高，rowHeightMode=dynamic时代表最小行高 */
    rowHeight: number;
    /** 行高模式：
     * regular=固定高度；
     * dynamic=动态高度；
     */
    rowHeightMode: 'regular' | 'dynamic';
    /** 列最小宽度，单位：% */
    colMinWidth: number;
    /** 列配置 */
    cols: TableCol[];
    /** 尽量不要使用该属性进行数据更新，应该使用事件拿到本组件实例，然后手动$vlAddItem */
    data?: T[];
}

export interface TableComponentData<T extends RequireId = RequireId> {
    colComputedWidth: number[];
    lines: number[];
    hasData: boolean;
    headRow: Record<string, string | TableCell>;
    affixList: T[];
}

export interface TableCellComponentProps {
    value: any;
    from: string;
}

export type TableRowComponentProps<T extends RequireId = RequireId> = MpVirtualListItemComponentProps<
    T,
    {
        rowHeight: number;
        /** 选中的行ID数组 */
        selected: string[];
        /** 列配置 */
        cols: TableCol[];
        colComputedWidth: number[];
        type?: string;
    }
>;
export interface TableRowComponentData {
    isSelected: boolean;
}
