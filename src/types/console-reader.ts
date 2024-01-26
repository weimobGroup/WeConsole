import type { MpConsoleMaterial } from './product';
export interface MpConsoleReaderComponentData {
    itemMinHeightMap?: {
        [prop: string]: number;
    };
    affixList?: MpConsoleMaterial[];
    selectRowId?: string;
    selectRowFrom?: string;
}
