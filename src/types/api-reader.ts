import type { ReaderStateController } from '../components/modules/reader-state';
import type { DataGridCol } from './data-grid';
import type { MpItemsComponentExports } from './items';
import type { MpApiMaterial, MpProduct } from './product';
import type { MpDataReaderComponent, MpDataReaderComponentData, MpDataReaderComponentMethods } from './reader';
import type { MpComponentLifeSpec, MpEvent, MpViewContext } from './view';
export interface MpApiReaderComponentData {
    detailMaterialId: string;
    detailFrom: string;
    detailTab: number;
    readerCols: DataGridCol[];
    affixIds: string[];
    gridPageSize: number;
}

export interface MpApiReaderComponent {
    dataGridWaitMaterials?: MpApiMaterial[];
    $DataGridMain?: MpItemsComponentExports<MpApiMaterial>;
    data: MpApiReaderComponentData;
    ApiStateController?: ReaderStateController;
}
export interface MpApiReaderComponentMethods<T extends MpApiReaderComponent = MpApiReaderComponent> {
    syncGridPageSize: (this: T) => any;
    clear: (this: T) => any;
    filter: (this: T, keyword: string | MpEvent) => any;
    refreshCategory: (this: T, categoryVals?: string[]) => any;
    addMaterial: (this: T, data: MpProduct) => any;
    setDetailMaterial: (this: T, id?: string, tab?: number, from?: string) => any;
    clearDetailMaterial: (this: T) => any;
    onCategoryChange: (this: T, activeCategory: string | MpEvent) => any;
    onWcProduct: (this: T, type: string, data: MpProduct) => any;
    appendDataToGrid: (this: T, material: MpApiMaterial) => any;
    syncAffixList: (this: T) => any;
    syncMarkList: (this: T) => any;
    changeDetailTab: (this: T, e: MpEvent) => any;
    gridReady: (this: T, e: MpEvent) => any;
    tapGridCell: (this: T, e: MpEvent) => any;
    longpressGridRow: (this: T, e: MpEvent) => any;
    reloadVlList: (this: T, allList: MpApiMaterial[]) => any;
    materialFilterPolicy?: (this: T, keyword: string, item: MpApiMaterial) => boolean;
    copyMaterial: (this: T, m: MpApiMaterial) => any;
}

export type MpApiReaderComponentContext = MpApiReaderComponent &
    MpApiReaderComponentMethods<MpApiReaderComponentContext> &
    MpDataReaderComponent<MpApiMaterial> &
    MpDataReaderComponentMethods<MpApiMaterial, MpApiReaderComponentContext> &
    MpViewContext<MpDataReaderComponentData>;

export interface MpApiReaderComponentSpec extends MpComponentLifeSpec<MpApiReaderComponentContext> {
    data: MpApiReaderComponentData & Partial<MpDataReaderComponentData>;
    methods: MpApiReaderComponentMethods<MpApiReaderComponentContext>;
}
