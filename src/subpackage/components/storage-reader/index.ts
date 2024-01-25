import type { MpComponentEvent } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { registerComponent } from '@/sub/mixins/component';
import { DataReaderMixin } from '@/sub/mixins/data-reader';
import { MpDataReaderAction } from '@/types/reader';
import { clone } from '@mpkit/util';
import {
    clearStorage,
    getStorage,
    getStorageInfo,
    getStorageInfoAndList,
    removeStorage
} from '@/sub/modules/storage-reader';
import type { MpStorageMaterial } from '@/types/product';
import { ToolMixin } from '@/sub/mixins/tool';
import type { DataGridCol, MpDataGridComponentExports } from '@/types/data-grid';
import type { JsonViewer, MpJSONViewerComponentEbusDetail } from '@/sub/components/json-viewer';

const substr = (str: string | undefined, len: number): string => {
    return typeof str === 'string' ? (str.length > len ? str.substr(0, len) + '...' : str) : 'undefined';
};

interface Data {
    detailMaterialId?: string;
    detailFrom?: string;
    categoryList: any[];
    activeCategory: string;
    materialActions: MpDataReaderAction[];
    affixIds: string[];
    currentSize: number;
    limitSize: number;
    sizeProgress: number;
    readerCols: DataGridCol[];
}

class StorageReader extends MpComponent {
    detailTarget?: any;
    detailJSONViewer?: JsonViewer;
    $DataGridMain?: MpDataGridComponentExports<MpStorageMaterial>;
    dataGridWaitMaterials?: any[];
    $mx = {
        Tool: new ToolMixin(),
        Dr: new DataReaderMixin<MpStorageMaterial>()
    };
    initData: Data = {
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
    };
    created() {
        this.replaceData();
        this.$mx.Tool.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            const currentDetailId = this.data.detailMaterialId;
            if (
                data.from === `StorageDetail_${currentDetailId}` &&
                data.viewer.selectOwnerComponent &&
                data.viewer.selectOwnerComponent() === this
            ) {
                this.detailJSONViewer = data.viewer;
                data.viewer.init().then(() => {
                    if (this.data.detailMaterialId !== currentDetailId) {
                        return;
                    }
                    if (this.detailTarget) {
                        data.viewer.setTarget(this.detailTarget);
                        data.viewer.openPath();
                    }
                });
            }
        });
    }
    reloadVlList(allList) {
        if (this.$DataGridMain) {
            this.$DataGridMain.replaceAllList(allList);
            this.$DataGridMain.reloadAffixList();
        }
    }
    filter(keyword) {
        const kd: string = typeof keyword === 'object' && 'detail' in keyword ? keyword.detail : (keyword as string);
        this.$mx.Dr.$drFilterMaterial(kd);
        this.reloadVlList(this.$mx.Dr.$drReaderShowList);
    }
    clear() {
        // 清空DataGrid操作缓存
        delete this.dataGridWaitMaterials;
        this.$mx.Dr.$drClearMaterial();
        this.syncAffixList();
        this.reloadVlList(this.$mx.Dr.$drReaderShowList);
        this.setDetailMaterial();
        clearStorage((key) => {
            return this.$mx.Dr.$drKeepSaveMaterials ? this.$mx.Dr.$drKeepSaveMaterials[key] : false;
        });
    }
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
        removeLocal(this.$mx.Dr.$drNormalMaterialCategoryMap?.all);
        this.$mx.Dr.$drFilterMaterialCategoryMap?.all && removeLocal(this.$mx.Dr.$drFilterMaterialCategoryMap.all);
        this.$mx.Dr.$drReaderShowList && removeLocal(this.$mx.Dr.$drReaderShowList);
        if (this.$mx.Dr.$drKeepSaveMaterials) {
            delete this.$mx.Dr.$drKeepSaveMaterials[id];
        }
        this.setDetailMaterial();
        this.syncAffixList();
        this.reloadVlList(this.$mx.Dr.$drReaderShowList);
        removeStorage(id)
            .then(() => {
                return getStorageInfo();
            })
            .then((info) => {
                this.$mx.Tool.$updateData({
                    currentSize: info.currentSize,
                    limitSize: info.limitSize,
                    sizeProgress: ((info.currentSize / info.limitSize) * 100).toFixed(2)
                });
            });
    }
    setDetailMaterial(id?: string, from?: string) {
        this.$mx.Tool.$updateData({
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
    }
    copyDetail() {
        if (this.data.detailMaterialId) {
            getStorage(this.data.detailMaterialId).then((res) => {
                wx.setClipboardData({
                    data: res.value
                });
            });
        }
    }
    clearDetailMaterial() {
        this.setDetailMaterial();
    }
    appendDataToGrid(material: MpStorageMaterial) {
        if (this.$DataGridMain) {
            this.$DataGridMain.addItem(material);
            return;
        }
        if (!this.dataGridWaitMaterials) {
            this.dataGridWaitMaterials = [];
        }
        this.dataGridWaitMaterials.push(material);
    }
    syncAffixList() {
        this.$mx.Tool.$updateData({
            affixIds: clone(this.$mx.Dr.$drTopMaterials || [])
        });
        this.$DataGridMain?.reloadAffixList(this.$mx.Dr.$drNormalMaterialCategoryMap?.all);
    }
    gridReady(e: MpComponentEvent<MpDataGridComponentExports>) {
        this.$DataGridMain = e.detail;
        if (this.dataGridWaitMaterials) {
            this.dataGridWaitMaterials.forEach((item) => {
                this.$DataGridMain?.addItem(item);
            });
            delete this.dataGridWaitMaterials;
        }
    }
    tapGridCell(e) {
        const { row } = e.detail;
        if (row?.key) {
            this.setDetailMaterial(row.key, 'tapCell');
        }
    }
    longpressGridRow(e) {
        const { rowId } = e.detail;
        if (rowId) {
            this.setDetailMaterial(rowId, 'longpressRow');
            this.$mx.Dr.$drShowMaterialAction(rowId).then(([action]) => {
                if (action === MpDataReaderAction.top) {
                    return this.syncAffixList();
                }
                if (action === MpDataReaderAction.copy) {
                    return this.copyDetail();
                }
            });
        }
    }
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
    }
    replaceData(): Promise<void> {
        return getStorageInfoAndList().then(([info, list]) => {
            this.$mx.Tool.$updateData({
                currentSize: info.currentSize,
                limitSize: info.limitSize,
                sizeProgress: ((info.currentSize / info.limitSize) * 100).toFixed(2)
            });
            this.$mx.Dr.$drNormalMaterialCategoryMap = {
                all: []
            };
            this.$mx.Dr.$drFilterMaterialCategoryMap = {};
            this.$mx.Dr.$drReaderShowList = [];
            list.forEach((item) => {
                item.categorys = ['all'];
                item.key = substr(item.key, 80);
                item.value = substr(item.value, 200);
                this.$mx.Dr.$drAddMaterialToCategory(item);
            });
            this.reloadVlList(this.$mx.Dr.$drReaderShowList);
        });
    }
}

registerComponent(StorageReader);
