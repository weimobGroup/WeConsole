import type { RequireId } from './common';
import type { AnyFunction } from './util';
export interface MpItemsComponentData<T extends RequireId = RequireId> {
    affixList?: T[];
    scrollMarginTop?: number;
    selectedMap: { [prop: string]: 1 };
    affixIds?: string[];
    selected?: string | string[];
    from?: string;
    $vlShowList?: T[];
}

export interface MpItemsComponentExports<T extends RequireId = RequireId> {
    from?: string;
    addItem: (item: T) => any;
    replaceAllList: (list: T[]) => any;
    reloadAffixList: (allList?: T[]) => any;
    scrollTo: (top: number) => any;
    onScroll: (handler: AnyFunction) => any;
    onJSONReady: (handler: AnyFunction) => any;
}
