import { registerComponent } from '@/sub/mixins/component';
import { VirtualListMixin } from '@/sub/mixins/virtual-list';
import { DataReaderMixin } from '@/sub/mixins/data-reader';
import type { MpConsoleReaderComponentData } from '@/types/console-reader';
import type { MpConsoleMaterial, MpProduct } from '@/types/product';
import type { MpEvent } from '@/types/view';
import { HookScope } from '@/types/common';
import { convertConsoleMaterial } from '@/sub/modules/reader';
import { include } from '@/sub/modules/json';
import { log } from '@/main/modules/util';
import { wcScopeSingle } from '@/main/config';
import type { ReaderStateController } from '@/main/modules/reader-state';
import { isEmptyObject } from '@mpkit/util';
import type { MpDataReaderComponentData } from '@/types/reader';
import { MpDataReaderAction } from '@/types/reader';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import type { JsonViewer, MpJSONViewerComponentEbusDetail } from '@/sub/components/json-viewer';
import type { MpVirtualListComponentData } from '@/types/virtual-list';

type Data = MpConsoleReaderComponentData &
    MpDataReaderComponentData &
    Partial<MpVirtualListComponentData<MpConsoleMaterial>>;

class ConsoleReaderComponent extends MpComponent {
    ConsoleStateController: ReaderStateController;
    localVlScrollTop?: number;
    JSONViewerMap?: Record<
        string,
        {
            target: any;
            viewer: JsonViewer;
        }
    >;
    $mx = {
        Tool: new ToolMixin(),
        Dr: new DataReaderMixin<MpConsoleMaterial>(),
        Vl: new VirtualListMixin<MpConsoleMaterial>()
    };
    initData: Data = {
        $vlPageSize: 50,
        $vlItemPrecutHeight: 40,
        activeCategory: 'all',
        itemMinHeightMap: {},
        materialActions: [
            MpDataReaderAction.copy,
            MpDataReaderAction.top,
            MpDataReaderAction.keepSave,
            MpDataReaderAction.cancelAllKeepSave,
            MpDataReaderAction.mark,
            MpDataReaderAction.cancelAllMark
        ],
        categoryList: [
            {
                name: 'All',
                value: 'all'
            },
            {
                name: 'Mark',
                value: 'mark'
            },
            {
                name: 'Log',
                value: 'log'
            },
            {
                name: 'Errors',
                value: 'error'
            },
            {
                name: 'Warnings',
                value: 'warn'
            },
            {
                name: 'Info',
                value: 'info'
            }
        ]
    };
    created() {
        this.ConsoleStateController = wcScopeSingle('ConsoleStateController') as ReaderStateController;
        this.localVlScrollTop = this.ConsoleStateController.getState('scrollTop');
        this.$mx.Tool.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (
                !data.from.startsWith('Console') ||
                !(data.viewer.selectOwnerComponent && data.viewer.selectOwnerComponent() === this)
            ) {
                return;
            }
            const arr = data.from.split('_');
            const id = arr[2];
            const index = parseInt(arr[3]);
            const product = this.$mx.Dr.$drGetProduct(id) as MpProduct;
            const request = product.request;
            if (!request || !request.length || !(index in request)) {
                return;
            }
            const target = request[index];
            const viewer = data.viewer;
            if (!this.JSONViewerMap) {
                this.JSONViewerMap = {};
            }
            if (!this.JSONViewerMap[data.from]) {
                this.JSONViewerMap[data.from] = {
                    target,
                    viewer
                };
            }
            this.JSONViewerMap[data.from].target = target;
            this.JSONViewerMap[data.from].viewer = viewer;
            const vw = this.JSONViewerMap[data.from].viewer;
            const state = this.$mx.Vl.$vlItemState ? this.$mx.Vl.$vlItemState[id] : null;
            if (state?.[`json${index}`]) {
                vw.lastPath = [...(state[`json${index}`].path || [])];
                vw.lastOpen = state[`json${index}`].open;
                if (vw.lastPath.length > 1) {
                    // debugger;
                    log('log', 'path update');
                }
            }
            vw.setTarget(target, false);
            vw.init();
        });
        this.$mx.Vl.$vlInit();
    }
    attached() {
        if (this.$mx.Tool.$wcProductController) {
            const idList = this.ConsoleStateController.getProductIdList();
            const activeCategory = this.ConsoleStateController.getState('activeCategory');
            const filterKeyWord = this.ConsoleStateController.getState('filterKeyWord');
            const selectedId = this.ConsoleStateController.getState('selectedId');
            if (filterKeyWord) {
                this.$mx.Dr.$drFilterKeyword = filterKeyWord;
            }

            const reanderData: any = {};
            if (activeCategory) {
                reanderData.activeCategory = activeCategory;
            }
            if (selectedId) {
                reanderData.detailMaterialId = selectedId;
            }
            this.$mx.Dr.$drKeepSaveMaterials = this.ConsoleStateController.keepSave().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            this.$mx.Dr.$drTopMaterials = this.ConsoleStateController.top().concat([]);
            this.$mx.Dr.$drMarkMaterials = this.ConsoleStateController.mark().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            if (!isEmptyObject(reanderData)) {
                this.$mx.Tool.$updateData({
                    reanderData
                });
            }
            const products = this.$mx.Tool.$wcProductController.getList(HookScope.Console, (item) =>
                idList.some((id) => id === item.id)
            );
            products.forEach((item) => {
                this.addMaterial(item);
            });

            if (this.localVlScrollTop) {
                // 还原上一次的滚动位置
                this.$mx.Tool.$updateData({
                    $vlScrollTop: this.localVlScrollTop
                });
                delete this.localVlScrollTop;
            }
        }
    }
    rowJSONViewerToggle(e) {
        const itemId = e.currentTarget.dataset.id as string;
        const index = parseInt(e.currentTarget.dataset.index as string);
        const vw = this.JSONViewerMap?.[`Console_${itemId}_${index}`]?.viewer;
        const path = e.detail.path || [];
        this.$mx.Vl.$vlSaveItemState(itemId, {
            [`json${index}`]: {
                open: e.detail.open,
                path: vw ? (vw.JSONViewer ? vw.JSONViewer.restoreJSONPropPath(path || []) : path) : path
            }
        });
        this.$mx.Vl.$vlComputeItemHeight(itemId);
    }
    copyMaterial(m) {
        const product = this.$mx.Dr.$drGetProduct(m.id);
        if (!product || !product.request) {
            return;
        }
        if (this.$mx.Tool.$wcUIConfig?.copyPolicy) {
            return this.$mx.Tool.$wcUIConfig.copyPolicy(product);
        }
        wx.setClipboardData({
            data: product.request.map((item) => {
                if (typeof item === 'function') {
                    return JSON.stringify(item);
                }
                if (typeof item === 'object') {
                    return JSON.stringify(item);
                }
                return String(item);
            })
        });
    }
    syncAffixList() {
        const affixList = (this.$mx.Dr.$drTopMaterials || []).map((id) => {
            return convertConsoleMaterial(this.$mx.Dr.$drGetProduct(id) as MpProduct);
        });
        this.$mx.Tool.$updateData(
            {
                affixList
            },
            () => {
                if (!this.data.affixList.length) {
                    this.$mx.Tool.$updateData({
                        scrollMarginTop: '0px'
                    });
                    return;
                }
                this.$mx.Tool.$getBoundingClientRect('.console-affixs').then((res) => {
                    this.$mx.Tool.$updateData({
                        scrollMarginTop: res.height + 'px'
                    });
                });
            }
        );
    }
    longpressRow(e) {
        const rowId = e.currentTarget.dataset.id;
        this.selectRow(rowId, 'longpressRow');
        this.$mx.Dr.$drShowMaterialAction(rowId).then(([action, oldSituation]) => {
            if (action === MpDataReaderAction.top) {
                this.ConsoleStateController.top(rowId, !oldSituation);
                return this.syncAffixList();
            }
            if (action === MpDataReaderAction.mark) {
                this.ConsoleStateController.mark(rowId, !oldSituation);
                return this.syncMarkList();
            }
            if (action === MpDataReaderAction.cancelAllMark) {
                this.ConsoleStateController.mark(undefined, false);
                return this.syncMarkList();
            }
            if (action === MpDataReaderAction.keepSave) {
                this.ConsoleStateController.keepSave(rowId, !oldSituation);
                return;
            }
            if (action === MpDataReaderAction.cancelAllKeepSave) {
                this.ConsoleStateController.keepSave(undefined, false);
            }
        });
    }
    selectRow(rowId, from?: string) {
        const id = typeof rowId === 'string' ? rowId : rowId?.currentTarget ? rowId.currentTarget.dataset.id : '';
        if (id) {
            this.ConsoleStateController.setState('selectedId', id);
        } else {
            this.ConsoleStateController.removeState('selectedId');
        }
        if (!id) {
            return this.$mx.Tool.$updateData({
                selectRowId: null,
                selectRowFrom: null
            });
        }
        return this.$mx.Tool.$updateData({
            selectRowId: id,
            selectRowFrom: from || ''
        });
    }
    materialFilterPolicy(k, item): boolean {
        const product = this.$mx.Dr.$drGetProduct(item.id);
        if (!product) {
            return false;
        }
        if (!product.request || !product.request.length) {
            return false;
        }
        return product.request.some((arg) => {
            return include(arg, k);
        });
    }
    filter(keyword) {
        const kd: string = typeof keyword === 'object' && 'detail' in keyword ? keyword.detail : (keyword as string);
        if (kd) {
            this.ConsoleStateController.setState('filterKeyWord', kd);
        } else {
            this.ConsoleStateController.removeState('filterKeyWord');
        }
        this.$mx.Dr.$drFilterMaterial(kd);
        this.reloadVlList(this.$mx.Dr.$drReaderShowList || []);
    }
    clear() {
        this.$mx.Dr.$drClearMaterial();
        this.reloadVlList(this.$mx.Dr.$drReaderShowList || []);
        this.ConsoleStateController.clearProducts();
        this.ConsoleStateController.removeState('selectedId');
    }
    addMaterial(data: MpProduct) {
        const material = convertConsoleMaterial(data);
        this.$mx.Dr.$drAddMaterialToCategory(material);
        if (this.$mx.Dr.$drReaderShowList?.indexOf(material) !== -1) {
            this.$mx.Vl.$vlAddItem(material);
        }
    }
    onCategoryChange(activeCategory: string | MpEvent) {
        const category: string =
            typeof activeCategory === 'object' && activeCategory && activeCategory.currentTarget
                ? activeCategory.detail
                : activeCategory;
        this.$mx.Dr.$drChangeCategory(category);
        this.reloadVlList(this.$mx.Dr.$drReaderShowList || []);
    }
    onWcProduct(type: string, data: MpProduct) {
        if (data.type === HookScope.Console || this.$mx.Dr.$drMaterialExist?.[data.id]) {
            if (!this.$mx.Dr.$drMaterialExist) {
                this.$mx.Dr.$drMaterialExist = {};
            }
            if (data.category) {
                this.$mx.Dr.$drMaterialExist[data.id] = data.category;
            } else if (!this.$mx.Dr.$drMaterialExist[data.id]) {
                this.$mx.Dr.$drMaterialExist[data.id] = 'other';
            }
            this.addMaterial(data);
        }
    }
    syncMarkList() {
        if (this.data.activeCategory === 'mark') {
            this.reloadVlList(this.$mx.Dr.$drReaderShowList || []);
        }
    }
    reloadVlList(allList: MpConsoleMaterial[]) {
        wx.showLoading();
        this.$mx.Vl.$vlClear().then(() => {
            this.$mx.Vl.$vlAllList = [...allList];
            this.$mx.Vl.$vlListChange();
            this.$mx.Vl.$vlReload();
            wx.nextTick(() => {
                wx.hideLoading();
            });
        });
    }
    localVlScroll(e) {
        this.$mx.Vl.$vlOnScroll(e);
        this.ConsoleStateController.setState('scrollTop', this.$mx.Vl.$vlScrollTop);
    }
}

registerComponent(ConsoleReaderComponent);
