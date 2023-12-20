import type { IMpProductController } from './hook';

export interface MpReaderProductIdMap {
    [prop: string]: 1;
}

export interface MpReaderState {
    productIdList: string[];
    productIdMap: MpReaderProductIdMap;
    keepSaveMap: MpReaderProductIdMap;
    markMap: MpReaderProductIdMap;
    topList: string[];
    state: any;
}

export type ProductControllerGetter = () => IMpProductController | Promise<IMpProductController>;
