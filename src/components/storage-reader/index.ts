import { WeComponent } from '../mixins/component';
import DataReaderMixin from '../mixins/data-reader';
import { MpDataReaderAction } from '../../types/reader';
import { clone } from '@mpkit/util';
import {
    clearStorage,
    getStorage,
    getStorageInfo,
    getStorageInfoAndList,
    removeStorage
} from '../modules/storage-reader';
import EbusMixin from '../mixins/ebus';
import type { MpJSONViewerComponentEbusDetail } from '../../types/json-viewer';
import type { MpStorageMaterial } from '../../types/product';

const substr = (str: string | undefined, len: number): string => {
    return typeof str === 'string' ? (str.length > len ? str.substr(0, len) + '...' : str) : 'undefined';
};

WeComponent(DataReaderMixin as any, EbusMixin as any, {
    data: {
        detailMaterialId: null,
        detailFrom: null,
        categoryList: [
            {
                name: 'All',
                value: 'all'
            }
        ],
        activeCategory: 'all',
        materialActions: [
            MpDataReaderAction.copy,
            MpDataReaderAction.top,
            MpDataReaderAction.keepSave,
            MpDataReaderAction.cancelAllKeepSave
        ],
        affixIds: [],
        currentSize: 0,
        limitSize: 0,
        sizeProgress: 0,
        readerCols: [
            {
                field: 'key',
                title: 'Key',
                width: 30,
                wrap: false
            },
            {
                field: 'value',
                title: 'Value',
                width: 70,
                wrap: false
            }
        ]
    },
    methods: {
        reloadVlList(allList) {
            if (this.$DataGridMain) {
                this.$DataGridMain.replaceAllList(allList);
                this.$DataGridMain.reloadAffixList();
            }
        },
        filter(keyword) {
            const kd: string =
                typeof keyword === 'object' && 'detail' in keyword ? keyword.detail : (keyword as string);
            this.filterMaterial(kd);
            this.reloadVlList(this.readerShowList);
        },
        clear() {
            // 清空DataGrid操作缓存
            delete this.dataGridWaitMaterials;
            this.clearMaterial();
            this.syncAffixList();
            this.reloadVlList(this.readerShowList);
            this.setDetailMaterial();
            clearStorage((key) => {
                return this.keepSaveMaterials ? this.keepSaveMaterials[key] : false;
            });
        },
        remove() {
            if (!this.data.detailMaterialId) {
                return;
            }
            const id = this.data.detailMaterialId;
            const removeLocal = (list) => {
                const index = list.findIndex((item) => item.key === id);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            };
            removeLocal(this.NormalMaterialCategoryMap.all);
            this?.FilterMaterialCategoryMap &&
                this.FilterMaterialCategoryMap.all &&
                removeLocal(this.FilterMaterialCategoryMap.all);
            this.readerShowList && removeLocal(this.readerShowList);
            if (this.keepSaveMaterials) {
                delete this.keepSaveMaterials[id];
            }
            this.setDetailMaterial();
            this.syncAffixList();
            this.reloadVlList(this.readerShowList);
            removeStorage(id)
                .then(() => {
                    return getStorageInfo();
                })
                .then((info) => {
                    this.updateData({
                        currentSize: info.currentSize,
                        limitSize: info.limitSize,
                        sizeProgress: ((info.currentSize / info.limitSize) * 100).toFixed(2)
                    });
                });
        },
        setDetailMaterial(id?: string, from?: string) {
            this.updateData({
                detailMaterialId: typeof id === 'string' ? id : '',
                detailFrom: from || ''
            });
            if (typeof id !== 'string') {
                delete this.detailTarget;
                delete this.detailJSONViewer;
            } else if (from !== 'longpressRow') {
                getStorage(id, false).then((res) => {
                    if (this.data.detailMaterialId !== id) {
                        return;
                    }
                    this.detailTarget = res.value;
                    if (this.detailJSONViewer) {
                        this.detailJSONViewer.setTarget(this.detailTarget);
                        this.detailJSONViewer.openPath();
                    }
                });
            }
        },
        copyDetail() {
            if (this.data.detailMaterialId) {
                getStorage(this.data.detailMaterialId).then((res) => {
                    wx.setClipboardData({
                        data: res.value
                    });
                });
            }
        },
        clearDetailMaterial() {
            this.setDetailMaterial();
        },
        appendDataToGrid(material) {
            if (this.$DataGridMain) {
                this.$DataGridMain.addItem(material);
                return;
            }
            if (!this.dataGridWaitMaterials) {
                this.dataGridWaitMaterials = [];
            }
            this.dataGridWaitMaterials.push(material);
        },
        syncAffixList() {
            this.updateData({
                affixIds: clone(this.topMaterials || [])
            });
            this.$DataGridMain.reloadAffixList(this.NormalMaterialCategoryMap.all);
        },
        gridReady(e) {
            this.$DataGridMain = e.detail;
            if (this.dataGridWaitMaterials) {
                this.dataGridWaitMaterials.forEach((item) => {
                    this.$DataGridMain.addItem(item);
                });
                delete this.dataGridWaitMaterials;
            }
        },
        tapGridCell(e) {
            const { rowId } = e.detail;
            if (rowId) {
                this.setDetailMaterial(rowId, 'tapCell');
            }
        },
        longpressGridRow(e) {
            const { rowId } = e.detail;
            if (rowId) {
                this.setDetailMaterial(rowId, 'longpressRow');
                this.showMaterialAction(rowId).then(([action]) => {
                    if (action === MpDataReaderAction.top) {
                        return this.syncAffixList();
                    }
                    if (action === MpDataReaderAction.copy) {
                        return this.copyDetail();
                    }
                });
            }
        },
        materialFilterPolicy(keyword: string, item: MpStorageMaterial): boolean {
            if (item.key.indexOf(keyword) !== -1) {
                return true;
            }
            if (item.key.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
                return true;
            }
            if (item.value.indexOf(keyword) !== -1) {
                return true;
            }
            if (item.value.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
                return true;
            }
            return false;
        },
        replaceData(): Promise<void> {
            return getStorageInfoAndList().then(([info, list]) => {
                this.updateData({
                    currentSize: info.currentSize,
                    limitSize: info.limitSize,
                    sizeProgress: ((info.currentSize / info.limitSize) * 100).toFixed(2)
                });
                this.NormalMaterialCategoryMap = {
                    all: []
                };
                this.FilterMaterialCategoryMap = {};
                this.readerShowList = [];
                list.forEach((item) => {
                    item.categorys = ['all'];
                    item.key = substr(item.key, 80);
                    item.value = substr(item.value, 200);
                    this.addMaterialToCategory(item);
                });
                this.reloadVlList(this.readerShowList);
            });
        }
    },
    created() {
        (this as any).replaceData();
        this.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (
                data.from === `StorageDetail_${this.data.detailMaterialId}` &&
                data.viewer.selectOwnerComponent &&
                data.viewer.selectOwnerComponent() === this
            ) {
                (this as any).detailJSONViewer = data.viewer;
                data.viewer.init().then(() => {
                    if (data.from === `StorageDetail_${this.data.detailMaterialId}`) {
                        if ((this as any).detailTarget) {
                            data.viewer.setTarget((this as any).detailTarget);
                            data.viewer.openPath();
                        }
                    }
                });
            }
        });
    }
});
