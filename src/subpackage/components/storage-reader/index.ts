import { MpComponent } from 'typescript-mp-component';
import { registerComponent } from '@/sub/mixins/component';
import { MpDataReaderAction } from '@/types/reader';
import {
    clearStorage,
    getStorage,
    getStorageInfo,
    getStorageInfoAndList,
    removeStorage
} from '@/sub/modules/storage-reader';
import type { MpStorageMaterial } from '@/types/product';
import { ToolMixin } from '@/sub/mixins/tool';
import type { JsonViewer, MpJSONViewerComponentEbusDetail } from '@/sub/components/json-viewer';
import { DrMixin } from '@/sub/mixins/dr';
import { VlMixin } from '@/sub/mixins/vl';
import type { MpEvent } from '@/types/view';
import { clone } from '@mpkit/util';
import type { TableCol } from '@/types/table';
import { setClipboardData, toJSONString } from '@/sub/modules/util';

const substr = (str: string | undefined, len: number): string => {
    return typeof str === 'string' ? (str.length > len ? str.substr(0, len) + '...' : str) : 'undefined';
};

interface Data {
    detailMaterialKey?: string;
    detailMaterialId?: string;
    detailFrom?: string;
    activeCategory: string;
    affixed: string[];
    currentSize: number;
    limitSize: number;
    sizeProgress: number;
    readerCols: TableCol[];
}

class StorageReader extends MpComponent {
    detailTarget?: any;
    detailJSONViewer?: JsonViewer;
    dataGridWaitMaterials?: any[];
    $drActions: MpDataReaderAction[] = [
        MpDataReaderAction.copy,
        MpDataReaderAction.top,
        MpDataReaderAction.keepSave,
        MpDataReaderAction.cancelAllKeepSave
    ];
    $mx = {
        Tool: new ToolMixin<Data>(),
        Vl: new VlMixin<MpStorageMaterial>(),
        Dr: new DrMixin<MpStorageMaterial>()
    };
    initData: Data = {
        activeCategory: 'all',
        affixed: [],
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
        this.$mx.Tool.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            const currentDetailId = this.data.detailMaterialId;
            if (data.from === `StorageDetail_${currentDetailId}`) {
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
    attached() {
        this.replaceData();
    }
    onSetActiveMaterialList() {
        this.$mx.Vl.$vlSetList(this.$mx.Dr.$drActiveMaterialList);
    }
    onAddActiveMaterial(material: MpStorageMaterial) {
        this.$mx.Vl.$vlAppendItem(material);
    }
    onReplaceActiveMaterial(material: MpStorageMaterial) {
        this.$mx.Vl.$vlReplaceItem(material.id, material);
    }
    onRemoveActiveMaterial(material: MpStorageMaterial) {
        this.$mx.Vl.$vlRemoveItem(material.id);
    }
    onItemInteractEvent(e: Required<MpEvent<{ type: string; id: string; detail?: any }>>) {
        // if (e.detail.type === 'rowJSONViewerToggle') {
        //     this.rowJSONViewerToggle(e.detail.id, e.detail.detail.index as number, e.detail.detail);
        //     return;
        // }
        if (e.detail.detail.type !== 'head') {
            if (e.detail.type === 'tapCell') {
                this.setDetailMaterial(e.detail.id, 'tapCell');
                return;
            }
            if (e.detail.type === 'longpressRow') {
                this.longpressRow(e.detail.id);
                return;
            }
        }
    }
    filter(keyword) {
        const kd: string = typeof keyword === 'object' && 'detail' in keyword ? keyword.detail : (keyword as string);
        this.$mx.Dr.$drFilterMaterial(kd);
    }
    clear() {
        this.$mx.Dr.$drClearMaterial();
        this.setDetailMaterial();
        clearStorage((key) => {
            return this.$mx.Dr.$drActiveMaterialId ? key in this.$mx.Dr.$drActiveMaterialId : false;
        });
    }
    remove() {
        if (!this.data.detailMaterialId) {
            return;
        }
        const id = this.data.detailMaterialId;
        const [row] = this.$mx.Vl.$vlFindItemByKey(id) || [];
        if (!row) {
            return;
        }
        this.$mx.Vl.$vlRemoveItem(id);
        this.setDetailMaterial();
        removeStorage(row.key)
            .then(() => {
                return getStorageInfo();
            })
            .then((info) => {
                this.$mx.Tool.$updateData({
                    currentSize: info.currentSize,
                    limitSize: info.limitSize,
                    sizeProgress: parseFloat(((info.currentSize / info.limitSize) * 100).toFixed(2))
                });
            });
    }
    setDetailMaterial(id?: string, from?: string) {
        const [row] = id ? this.$mx.Vl.$vlFindItemByKey(id) || [] : [];

        this.$mx.Tool.$updateData({
            detailMaterialId: typeof id === 'string' ? id : '',
            detailMaterialKey: id && row ? row.key : '',
            detailFrom: from || ''
        });
        if (typeof id !== 'string') {
            delete this.detailTarget;
            delete this.detailJSONViewer;
            return;
        }
        if (from !== 'longpressRow') {
            if (!row) {
                return;
            }
            getStorage(row.key, false).then((res) => {
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
            const [row] = this.$mx.Vl.$vlFindItemByKey(this.data.detailMaterialId) || [];

            row &&
                getStorage(row.key).then((res) => {
                    setClipboardData(toJSONString(res.value));
                });
        }
    }
    clearDetailMaterial() {
        this.setDetailMaterial();
    }
    syncAffixList() {
        this.$mx.Tool.$updateData({
            affixed: clone(this.$mx.Dr.$drTopMaterialId || [])
        });
    }
    longpressRow(rowId: string) {
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
                sizeProgress: parseFloat(((info.currentSize / info.limitSize) * 100).toFixed(2))
            });
            list.forEach((item) => {
                item.categorys = ['all'];
                item.value = substr(item.value, 200);
            });
            this.$mx.Vl.$vlSetList(list);
        });
    }
}

registerComponent(StorageReader);
