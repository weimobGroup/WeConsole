import type { ReaderStateController } from '@/main//modules/reader-state';
import type { MpJSONViewerComponent } from './json-viewer';
import type { MpConsoleMaterial, MpProduct } from './product';
import type { MpDataReaderComponent, MpDataReaderComponentData, MpDataReaderComponentMethods } from './reader';
import type { MpComponentLifeSpec, MpEvent, MpViewContext, MpWcViewContext } from './view';
import type { MpVirtualListComponent, MpVirtualListComponentData, MpVirtualListComponentMethods } from './virtual-list';
export interface MpConsoleReaderComponentData {
    itemMinHeightMap?: {
        [prop: string]: number;
    };
    affixList?: MpConsoleMaterial[];
    selectRowId?: string;
    selectRowFrom?: string;
}

export interface MpConsoleReaderComponent {
    data: MpConsoleReaderComponentData;
    ConsoleStateController: ReaderStateController;
    localVlScrollTop?: number;
    JSONViewerMap?: {
        [prop: string]: {
            viewer: MpJSONViewerComponent;
            target?: any;
        };
    };
}

export interface MpConsoleReaderComponentMethods<T extends MpConsoleReaderComponent = MpConsoleReaderComponent> {
    rowJSONViewerToggle: (this: T, e: MpEvent) => any;
    copyMaterial: (this: T, c: MpConsoleMaterial) => any;
    longpressRow: (this: T, e?: MpEvent) => any;
    selectRow: (this: T, rowId?: string | MpEvent, from?: string) => any;
    clear: (this: T) => any;
    filter: (this: T, keyword: string | MpEvent) => any;
    materialFilterPolicy?: (this: T, keyword: string, item: MpConsoleMaterial) => boolean;
    addMaterial: (this: T, data: MpProduct) => any;
    onCategoryChange: (this: T, activeCategory: string | MpEvent) => any;
    onWcProduct: (this: T, type: string, data: MpProduct) => any;
    syncAffixList: (this: T) => any;
    syncMarkList: (this: T) => any;
    reloadVlList: (this: T, allList: MpConsoleMaterial[]) => any;
    localVlScroll: (this: T, e: MpEvent) => any;
}

export type MpConsoleReaderComponentContext = MpWcViewContext &
    MpConsoleReaderComponent &
    MpConsoleReaderComponentMethods<MpConsoleReaderComponentContext> &
    MpDataReaderComponent<MpConsoleMaterial> &
    MpDataReaderComponentMethods<MpConsoleMaterial, MpConsoleReaderComponentContext> &
    MpVirtualListComponent<MpConsoleMaterial> &
    MpVirtualListComponentMethods<MpConsoleMaterial, MpConsoleReaderComponentContext> &
    MpViewContext<MpDataReaderComponentData>;

export interface MpConsoleReaderComponentSpec extends MpComponentLifeSpec<MpConsoleReaderComponentContext> {
    data: MpConsoleReaderComponentData &
        Partial<MpDataReaderComponentData> &
        Partial<MpVirtualListComponentData<MpConsoleMaterial>>;
    methods: MpConsoleReaderComponentMethods<MpConsoleReaderComponentContext> &
        Partial<MpVirtualListComponentMethods<MpConsoleMaterial, MpConsoleReaderComponentContext>>;
}
