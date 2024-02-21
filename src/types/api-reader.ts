import type { DataGridCol } from './data-grid';
export interface MpApiReaderComponentData {
    detailMaterialId?: string;
    detailFrom?: string;
    detailTab: number;
    readerCols: DataGridCol[];
    affixed: string[];
}
