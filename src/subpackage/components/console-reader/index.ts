import { registerComponent } from '@/sub/mixins/component';
import { VlMixin } from '@/sub/mixins/vl';
import type { MpConsoleReaderComponentData } from '@/types/console-reader';
import type { MpConsoleMaterial, MpProduct } from '@/types/product';
import type { MpEvent } from '@/types/view';
import { HookScope } from '@/types/common';
import { convertConsoleMaterial } from '@/sub/modules/reader';
import { include } from '@/sub/modules/json';
import { log, rpxToPx } from '@/main/modules/util';
import { wcScopeSingle } from '@/main/config';
import type { ReaderStateController } from '@/main/modules/reader-state';
import { isEmptyObject, uuid } from '@mpkit/util';
import type { MpDataReaderComponentData } from '@/types/reader';
import { MpDataReaderAction } from '@/types/reader';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import type { JsonViewer, MpJSONViewerComponentEbusDetail } from '@/sub/components/json-viewer';
import type { MpJSONViewerComponentEventDetail } from '@/types/json-viewer';
import { DrMixin } from '@/sub/mixins/dr';
import { toJSONString } from '@/sub/modules/util';

type Data = MpConsoleReaderComponentData & MpDataReaderComponentData;

class ConsoleReaderComponent extends MpComponent<Data, NonNullable<unknown>> {
    ConsoleStateController: ReaderStateController;
    JSONViewerMap?: Record<
        string,
        {
            target: any;
            viewer: JsonViewer;
        }
    >;
    $drActions: Array<MpDataReaderAction> = [
        MpDataReaderAction.copy,
        MpDataReaderAction.top,
        MpDataReaderAction.keepSave,
        MpDataReaderAction.cancelAllKeepSave,
        MpDataReaderAction.mark,
        MpDataReaderAction.cancelAllMark
    ];
    $mx = {
        Tool: new ToolMixin<Data>(),
        Dr: new DrMixin<MpConsoleMaterial>(HookScope.Console),
        Vl: new VlMixin<MpConsoleMaterial>()
    };
    initData: Data = {
        selfHash: uuid(),
        itemMinSize: rpxToPx(44),
        affixList: [],
        selectRowId: '',
        activeCategory: 'all',
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
        this.$mx.Tool.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (!data.from.startsWith('Console') || !data.from.includes(`_${this.data.selfHash}`)) {
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
                setTimeout(() => {
                    this.$mx.Vl.$vlItemSizeChange(id);
                }, 120);
            }
            vw.setTarget(target, false);
            vw.init();
        });
    }
    attached() {
        if (this.$mx.Tool.$wcProductController) {
            const activeCategory = this.ConsoleStateController.getState('activeCategory');
            const filterKeyWord = this.ConsoleStateController.getState('filterKeyWord');
            const selectedId = this.ConsoleStateController.getState('selectedId');
            if (filterKeyWord) {
                this.$mx.Dr.$drFilterKeyword = filterKeyWord;
            }

            const renderData: Partial<Data> = {};
            if (activeCategory) {
                renderData.activeCategory = activeCategory;
            }
            if (selectedId) {
                renderData.selectRowId = selectedId;
            }
            this.$mx.Dr.$drKeepSaveMaterialId = this.ConsoleStateController.keepSave().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            this.$mx.Dr.$drTopMaterialId = this.ConsoleStateController.top().concat([]);
            this.$mx.Dr.$drMarkMaterialId = this.ConsoleStateController.mark().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            if (!isEmptyObject(renderData)) {
                this.$mx.Tool.$forceData(renderData);
            }
            const materials = this.$mx.Tool.$wcProductController.getList(HookScope.Console).map((item) => {
                return convertConsoleMaterial(item);
            });
            materials.forEach((mat) => {
                this.$mx.Dr.$drAddMaterialToActiveList(mat, false, false);
            });
            this.onSetActiveMaterialList();
        }
    }
    onSetActiveMaterialList() {
        this.$mx.Vl.$vlSetList(this.$mx.Dr.$drActiveMaterialList);
    }
    onAddActiveMaterial(material: MpConsoleMaterial) {
        this.$mx.Vl.$vlAppendItem(material);
    }
    onReplaceActiveMaterial(material: MpConsoleMaterial) {
        this.$mx.Vl.$vlReplaceItem(material.id, material);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRemoveActiveMaterial(material: MpConsoleMaterial) {}
    onItemInteractEvent(e: Required<MpEvent<{ type: string; id: string; detail?: any }>>) {
        if (e.detail.type === 'rowJSONViewerToggle') {
            this.rowJSONViewerToggle(e.detail.id, e.detail.detail.index as number, e.detail.detail);
            return;
        }
        if (e.detail.type === 'tapRow') {
            this.selectRow(e.detail.id);
            return;
        }
        if (e.detail.type === 'longpressRow') {
            this.longpressRow(e.detail.id);
            return;
        }
    }
    rowJSONViewerToggle(
        productId: string,
        consoleInnerItemIndex: number,
        jsonDetail: MpJSONViewerComponentEventDetail
    ) {
        const itemId = productId;
        const index = consoleInnerItemIndex;
        const vw = this.JSONViewerMap?.[`Console_${itemId}_${index}`]?.viewer;
        const path = jsonDetail.path || [];
        this.$mx.Vl.$vlSaveItemState(itemId, {
            [`json${index}`]: {
                open: jsonDetail.open,
                path: vw ? (vw.JSONViewer ? vw.JSONViewer.restoreJSONPropPath(path || []) : path) : path
            }
        });
        wx.nextTick(() => {
            this.$mx.Vl.$vlItemSizeChange(itemId);
        });
    }
    onCopyMaterial(m: MpConsoleMaterial) {
        const product = this.$mx.Dr.$drGetProduct(m.id);
        if (!product || !product.request) {
            return;
        }
        if (this.$mx.Tool.$wcUIConfig?.copyPolicy) {
            return this.$mx.Tool.$wcUIConfig.copyPolicy(product);
        }
        wx.setClipboardData({
            data: toJSONString(product.request)
        });
    }
    syncAffixList() {
        const affixList = (this.$mx.Dr.$drTopMaterialId || []).map((id) => {
            return this.$mx.Dr.$drExistMaterial[id];
        });
        this.$mx.Tool.$updateData({
            affixList
        });
    }
    longpressRow(productId: string) {
        const rowId = productId;
        this.selectRow(rowId);
        this.$mx.Dr.$drShowMaterialAction(rowId).then(([action, oldSituation]) => {
            if (action === MpDataReaderAction.top) {
                this.ConsoleStateController.top(rowId, !oldSituation);
                return this.syncAffixList();
            }
            if (action === MpDataReaderAction.mark) {
                this.ConsoleStateController.mark(rowId, !oldSituation);
                return;
            }
            if (action === MpDataReaderAction.cancelAllMark) {
                this.ConsoleStateController.mark(undefined, false);
                return;
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
    selectRow(rowId?: string | MpEvent) {
        let id;
        if (rowId) {
            id = typeof rowId === 'string' ? rowId : rowId.currentTarget.dataset.id;
        }
        if (id) {
            this.ConsoleStateController.setState('selectedId', id);
        } else {
            this.ConsoleStateController.removeState('selectedId');
        }
        if (!id) {
            return this.$mx.Tool.$updateData({
                selectRowId: ''
            });
        }
        return this.$mx.Tool.$updateData({
            selectRowId: id
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
    }
    clear() {
        this.$mx.Dr.$drClearMaterial();
        this.ConsoleStateController.clearProducts();
        this.ConsoleStateController.removeState('selectedId');
    }
    onCategoryChange(e: Required<MpEvent<string>>) {
        this.$mx.Dr.$drChangeCategory(e.detail);
    }
    onWcProduct(type: string, data: MpProduct) {
        if (data.type === HookScope.Console) {
            const material = convertConsoleMaterial(data);
            this.$mx.Dr.$drAddMaterialToActiveList(material);
        }
    }
}

registerComponent(ConsoleReaderComponent);
