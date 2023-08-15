import { WeComponent } from '../mixins/component';
import VirtualListMixin from '../mixins/virtual-list';
import ProductControllerMixin from '../mixins/product-controller';
import DataReaderMixin from '../mixins/data-reader';
import EbusMixin from '../mixins/ebus';
import { MpConsoleReaderComponentSpec } from '../../types/console-reader';
import { MpConsoleMaterial, MpProduct } from '../../types/product';
import { MpEvent } from '../../types/view';
import { HookScope } from '../../types/common';
import { convertConsoleMaterial } from '../modules/reader';
import { MpJSONViewerComponent, MpJSONViewerComponentEbusDetail } from '../../types/json-viewer';
import { include } from '../modules/json';
import { wcScopeSingle, log } from '../../modules/util';
import { ReaderStateController } from '../modules/reader-state';
import { isEmptyObject } from '@mpkit/util';
import { MpDataReaderAction } from '../../types/reader';
const Spec: MpConsoleReaderComponentSpec = {
    data: {
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
        ],
        selectRowId: null,
        selectRowFrom: null
    },
    methods: {
        rowJSONViewerToggle(e) {
            const itemId = e.currentTarget.dataset.id as string;
            const index = parseInt(e.currentTarget.dataset.index as string);
            const vw: MpJSONViewerComponent | null =
                this.JSONViewerMap?.[`Console_${itemId}_${index}`] &&
                this.JSONViewerMap[`Console_${itemId}_${index}`].viewer
                    ? this.JSONViewerMap[`Console_${itemId}_${index}`].viewer
                    : null;
            const path = e.detail.path || [];
            this.$vlSaveItemState(itemId, {
                [`json${index}`]: {
                    open: e.detail.open,
                    path: vw ? (vw.JSONViewer ? vw.JSONViewer.restoreJSONPropPath(path || []) : path) : path
                }
            });
            this.$vlComputeItemHeight(itemId);
        },
        copyMaterial(m) {
            const product = this.getProduct(m.id);
            if (!product || !product.request) {
                return;
            }
            if (this?.$wcUIConfig && this.$wcUIConfig.copyPolicy) {
                return this.$wcUIConfig.copyPolicy(product);
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
        },
        syncAffixList() {
            const affixList = (this.topMaterials || []).map((id) => {
                return convertConsoleMaterial(this.getProduct(id));
            });
            this.setData(
                {
                    affixList
                },
                () => {
                    if (!this.data.affixList.length) {
                        this.setData({
                            scrollMarginTop: '0px'
                        });
                        return;
                    }
                    this.$getBoundingClientRect('.console-affixs').then((res) => {
                        this.setData({
                            scrollMarginTop: res.height + 'px'
                        });
                    });
                }
            );
        },
        longpressRow(e) {
            const rowId = e.currentTarget.dataset.id;
            this.selectRow(rowId, 'longpressRow');
            this.showMaterialAction(rowId).then(([action, oldSituation]) => {
                if (action === MpDataReaderAction.top) {
                    this.ConsoleStateController.top(rowId, !oldSituation);
                    return this.syncAffixList();
                }
                if (action === MpDataReaderAction.mark) {
                    this.ConsoleStateController.mark(rowId, !oldSituation);
                    return this.syncMarkList();
                }
                if (action === MpDataReaderAction.cancelAllMark) {
                    this.ConsoleStateController.mark(null, false);
                    return this.syncMarkList();
                }
                if (action === MpDataReaderAction.keepSave) {
                    this.ConsoleStateController.keepSave(rowId, !oldSituation);
                    return;
                }
                if (action === MpDataReaderAction.cancelAllKeepSave) {
                    this.ConsoleStateController.keepSave(null, false);
                }
            });
        },
        selectRow(rowId, from?: string) {
            const id = typeof rowId === 'string' ? rowId : rowId?.currentTarget ? rowId.currentTarget.dataset.id : '';
            if (id) {
                this.ConsoleStateController.setState('selectedId', id);
            } else {
                this.ConsoleStateController.removeState('selectedId');
            }
            if (!id) {
                return this.setData({
                    selectRowId: null,
                    selectRowFrom: null
                });
            }
            return this.setData({
                selectRowId: id,
                selectRowFrom: from || ''
            });
        },
        materialFilterPolicy(k, item): boolean {
            const product = this.getProduct(item.id);
            if (!product) {
                return false;
            }
            if (!product.request || !product.request.length) {
                return false;
            }
            return product.request.some((arg) => {
                return include(arg, k);
            });
        },
        filter(keyword) {
            const kd: string =
                typeof keyword === 'object' && 'detail' in keyword ? keyword.detail : (keyword as string);
            if (kd) {
                this.ConsoleStateController.setState('filterKeyWord', kd);
            } else {
                this.ConsoleStateController.removeState('filterKeyWord');
            }
            this.filterMaterial(kd);
            this.reloadVlList(this.readerShowList);
        },
        clear() {
            this.clearMaterial();
            this.reloadVlList(this.readerShowList);
            this.ConsoleStateController.clearProducts();
            this.ConsoleStateController.removeState('selectedId');
        },
        addMaterial(data: MpProduct) {
            const material = convertConsoleMaterial(data);
            this.addMaterialToCategory(material);
            if (this.readerShowList.indexOf(material as MpConsoleMaterial) !== -1) {
                this.$vlAddItem(material as MpConsoleMaterial);
            }
        },
        onCategoryChange(activeCategory: string | MpEvent) {
            const category: string =
                typeof activeCategory === 'object' && activeCategory && activeCategory.currentTarget
                    ? activeCategory.detail
                    : activeCategory;
            this.changeCategory(category);
            this.reloadVlList(this.readerShowList);
        },
        onWcProduct(type: string, data: MpProduct) {
            if (data.type === HookScope.Console || (this?.materialExist && this.materialExist[data.id])) {
                if (!this.materialExist) {
                    this.materialExist = {};
                }
                if (data.category) {
                    this.materialExist[data.id] = data.category;
                } else if (!this.materialExist[data.id]) {
                    this.materialExist[data.id] = 'other';
                }
                this.addMaterial(data as MpProduct);
            }
        },
        syncMarkList() {
            if (this.data.activeCategory === 'mark') {
                this.reloadVlList(this.readerShowList);
            }
        },
        reloadVlList(allList: MpConsoleMaterial[]) {
            wx.showLoading();
            this.$vlClear().then(() => {
                this.$vlAllList = [...allList];
                this.$vlListChange();
                this.$vlReload();
                wx.nextTick(() => {
                    wx.hideLoading();
                });
            });
        },
        localVlScroll(e) {
            this.$vlOnScroll(e);
            this.ConsoleStateController.setState('scrollTop', this.$vlScrollTop);
        }
    },
    created() {
        this.ConsoleStateController = wcScopeSingle('ConsoleStateController') as ReaderStateController;
        this.localVlScrollTop = this.ConsoleStateController.getState('scrollTop');
        this.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (
                !data.from.startsWith('Console') ||
                !(data.viewer.selectOwnerComponent && data.viewer.selectOwnerComponent() === this)
            ) {
                return;
            }
            const arr = data.from.split('_');
            const id = arr[2];
            const index = parseInt(arr[3]);
            const product = this.getProduct(id);
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
            const vw: MpJSONViewerComponent = this.JSONViewerMap[data.from].viewer;
            const state = this.$vlItemState ? this.$vlItemState[id] : null;
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
        this.$vlInit();
    },
    attached() {
        if (this.$wcProductController) {
            const idList = this.ConsoleStateController.getProductIdList();
            const activeCategory = this.ConsoleStateController.getState('activeCategory');
            const filterKeyWord = this.ConsoleStateController.getState('filterKeyWord');
            const selectedId = this.ConsoleStateController.getState('selectedId');
            if (filterKeyWord) {
                this.filterKeyword = filterKeyWord;
            }

            const reanderData: any = {};
            if (activeCategory) {
                reanderData.activeCategory = activeCategory;
            }
            if (selectedId) {
                reanderData.detailMaterialId = selectedId;
            }
            this.keepSaveMaterials = this.ConsoleStateController.keepSave().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            this.topMaterials = this.ConsoleStateController.top().concat([]);
            this.markMaterials = this.ConsoleStateController.mark().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            if (!isEmptyObject(reanderData)) {
                this.setData({
                    reanderData
                });
            }
            const products = this.$wcProductController.getList((item) => idList.some((id) => id === item.id));
            products.forEach((item) => {
                this.addMaterial(item);
            });

            if (this.localVlScrollTop) {
                // 还原上一次的滚动位置
                this.setData({
                    $vlScrollTop: this.localVlScrollTop
                });
                delete this.localVlScrollTop;
            }
        }
    }
};
WeComponent(EbusMixin, ProductControllerMixin, VirtualListMixin, DataReaderMixin, Spec);
