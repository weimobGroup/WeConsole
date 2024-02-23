import type { TableCol } from './table';
export interface MpApiReaderComponentData {
    rowHeight: number;
    detailMaterialId?: string;
    detailFrom?: string;
    detailTab: number;
    readerCols: TableCol[];
    affixed: string[];
}
