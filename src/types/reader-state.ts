import type { IMpProductController } from './hook';

export interface MpReaderProductIdMap {
    [prop: string]: 1;
}

export interface MpReaderState {
    productIdList: string[];
    productIdMap: Record<string, 1>;
    keepSaveMap: Record<string, 1>;
    markMap: Record<string, 1>;
    topList: string[];
    state: any;
}

export type ProductControllerGetter = () => IMpProductController | Promise<IMpProductController>;
