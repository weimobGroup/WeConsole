import type { RequireId } from './common';

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
