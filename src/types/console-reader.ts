import type { MpConsoleMaterial } from './product';
export interface MpConsoleReaderComponentData {
    selfHash: string;
    itemMinSize: number;
    affixList: MpConsoleMaterial[];
    selectRowId: string;
}
