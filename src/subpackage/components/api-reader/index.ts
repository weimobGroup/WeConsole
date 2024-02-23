import { registerComponent } from '@/sub/mixins/component';
import { DrMixin } from '@/sub/mixins/dr';

import { clone, isEmptyObject } from '@mpkit/util';
import { getApiCategoryList } from '@/sub/modules/category';
import { convertApiMaterial, productToString } from '@/sub/modules/reader';
import type { MpApiReaderComponentData } from '@/types/api-reader';
import type { MpApiMaterial, MpProduct } from '@/types/product';
import { HookScope } from '@/types/common';
import type { MpDataReaderComponentData } from '@/types/reader';
import { MpDataReaderAction } from '@/types/reader';
import { includeString } from '@/sub/modules/json';
import { ApiStateController } from '@/main/modules/state-controller';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import type { ReaderStateController } from '@/main/modules/reader-state';
import { VlMixin } from '@/sub/mixins/vl';
import type { MpEvent } from '@/types/view';
import { computeTime, setClipboardData } from '@/sub/modules/util';
import { getUIConfig } from '@/main/config';
import { rpxToPx } from '@/main/modules/util';

type Data = MpApiReaderComponentData & MpDataReaderComponentData;

class ApiReaderComponent extends MpComponent<Data, NonNullable<unknown>> {
    ApiStateController: ReaderStateController;
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
        Vl: new VlMixin<MpApiMaterial>(),
        Dr: new DrMixin<MpApiMaterial>(HookScope.Api)
    };
    initData: Data = {
        rowHeight: rpxToPx(80),
        categoryList: getApiCategoryList(),
        activeCategory: 'all',
        affixed: [],
        detailTab: 0,
        readerCols: [
            {
                field: 'name',
                title: 'Name',
                width: 47.5,
                wrap: false
            },
            {
                field: 'status',
                title: 'Status',
                width: 20,
                wrap: false
            },
            {
                field: 'category',
                title: 'Type',
                width: 15,
                wrap: false
            },
            // {
            //     field: "initiator",
            //     title: "Initiator",
            //     width: 17.5,
            //     wrap: false,
            // },
            {
                field: 'time',
                title: 'Time',
                width: 17.5,
                wrap: false
            }
        ]
    };
    created() {
        this.ApiStateController = ApiStateController;
    }
    attached() {
        this.refreshCategory();
        if (this.$mx.Tool.$wcProductController) {
            const categorys = this.ApiStateController.getState('categorys');
            const selectedId = this.ApiStateController.getState('selectedId');
            const selectedIdFrom = this.ApiStateController.getState('selectedIdFrom');
            const renderData: Partial<Data> = {};
            if (categorys?.length) {
                renderData.categoryList = categorys;
            }
            if (selectedId) {
                renderData.detailMaterialId = selectedId;
            }
            if (selectedIdFrom) {
                renderData.detailFrom = selectedIdFrom;
            }
            this.$mx.Dr.$drKeepSaveMaterialId = this.ApiStateController.keepSave().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            this.$mx.Dr.$drTopMaterialId = this.ApiStateController.top().concat([]);
            this.$mx.Dr.$drMarkMaterialId = this.ApiStateController.mark().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            if (!isEmptyObject(renderData)) {
                this.$mx.Tool.$updateData(renderData);
            }
            const materials = this.$mx.Tool.$wcProductController.getList(HookScope.Api).map((item) => {
                return convertApiMaterial(item, getUIConfig());
            });
            materials.forEach((mat) => {
                this.$mx.Dr.$drAddMaterialToActiveList(mat as MpApiMaterial, false, false);
            });
            this.onSetActiveMaterialList();
        }
    }
    onSetActiveMaterialList() {
        this.$mx.Vl.$vlSetList(this.$mx.Dr.$drActiveMaterialList);
    }
    onAddActiveMaterial(material: MpApiMaterial) {
        this.$mx.Vl.$vlAppendItem(material);
    }
    onReplaceActiveMaterial(material: MpApiMaterial) {
        if (material.endTime && material.startTime) {
            material.time = computeTime(material.endTime - material.startTime);
        }
        this.$mx.Vl.$vlReplaceItem(material.id, material);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRemoveActiveMaterial(material: MpApiMaterial) {}
    onItemInteractEvent(e: Required<MpEvent<{ type: string; id: string; detail?: any }>>) {
        if (e.detail.detail.type !== 'head') {
            if (e.detail.type === 'tapCell') {
                this.setDetailMaterial(e.detail.id, undefined, 'tapCell');
                return;
            }
            if (e.detail.type === 'longpressRow') {
                this.longpressRow(e.detail.id);
                return;
            }
        }
    }
    onWcProduct(type: string, data: MpProduct) {
        if (data.type === HookScope.Api) {
            const material = convertApiMaterial(data, getUIConfig()) as MpApiMaterial;
            this.$mx.Dr.$drAddMaterialToActiveList(material);
        }
    }
    refreshCategory(categoryVals?: string[]) {
        if (!categoryVals || !categoryVals.length) {
            this.$mx.Tool.$updateData({
                categoryList: getApiCategoryList(this.$mx.Tool.$wcUIConfig)
            });
            this.ApiStateController.setState('categorys', JSON.parse(JSON.stringify(this.data.categoryList)));
            return;
        }
        if (this.data.categoryList.some((item) => !categoryVals.find((t) => t === item.value))) {
            const list = getApiCategoryList(this.$mx.Tool.$wcUIConfig);
            categoryVals.forEach((categoryVal) => {
                if (list.every((item) => item.value !== categoryVal)) {
                    list.push({
                        name: categoryVal,
                        value: categoryVal
                    });
                }
            });
            this.$mx.Tool.$updateData({
                categoryList: list
            });
            this.ApiStateController.setState('categorys', JSON.parse(JSON.stringify(this.data.categoryList)));
        }
    }
    filter(keyword) {
        const kd: string = typeof keyword === 'object' && 'detail' in keyword ? keyword.detail : (keyword as string);
        if (kd) {
            this.ApiStateController.setState('filterKeyWord', kd);
        } else {
            this.ApiStateController.removeState('filterKeyWord');
        }
        this.$mx.Dr.$drFilterMaterial(kd);
    }
    clear() {
        this.$mx.Dr.$drClearMaterial();
        this.setDetailMaterial();
        this.ApiStateController.clearProducts();
        this.ApiStateController.removeState('selectedId');
    }
    setDetailMaterial(id?: string, tab?: number, from?: string) {
        this.$mx.Tool.$updateData({
            detailMaterialId: id || '',
            detailTab: tab || 0,
            detailFrom: from || ''
        });
        if (from) {
            this.ApiStateController.setState('selectedIdFrom', from);
        } else {
            this.ApiStateController.removeState('selectedIdFrom');
        }
        if (id) {
            this.ApiStateController.setState('selectedId', id);
        } else {
            this.ApiStateController.removeState('selectedId');
        }
    }
    clearDetailMaterial() {
        this.setDetailMaterial();
    }
    onCategoryChange(e: Required<MpEvent<string>>) {
        this.$mx.Dr.$drChangeCategory(e.detail);
        this.ApiStateController.setState('activeCategory', e.detail);
    }
    syncAffixList() {
        this.$mx.Tool.$updateData({
            affixed: clone(this.$mx.Dr.$drTopMaterialId || [])
        });
    }
    changeDetailTab(e) {
        this.$mx.Tool.$updateData({
            detailTab: e.detail
        });
    }
    longpressRow(rowId: string) {
        this.setDetailMaterial(rowId, undefined, 'longpressRow');
        this.$mx.Dr.$drShowMaterialAction(rowId).then(([action, oldSituation]) => {
            if (action === MpDataReaderAction.top) {
                this.ApiStateController.top(rowId, !oldSituation);
                return this.syncAffixList();
            }
            if (action === MpDataReaderAction.mark) {
                this.ApiStateController.mark(rowId, !oldSituation);
                return;
            }
            if (action === MpDataReaderAction.cancelAllMark) {
                this.ApiStateController.mark(undefined, false);
                return;
            }
            if (action === MpDataReaderAction.keepSave) {
                this.ApiStateController.keepSave(rowId, !oldSituation);
                return;
            }
            if (action === MpDataReaderAction.cancelAllKeepSave) {
                this.ApiStateController.keepSave(undefined, false);
            }
        });
    }
    materialFilterPolicy(k, item): boolean {
        const product = this.$mx.Dr.$drGetProduct(item.id);
        if (!product) {
            return false;
        }
        if (includeString(item.name, k) || includeString(item.nameDesc, k)) {
            return true;
        }
        return false;
    }
    onCopyMaterial(m: MpApiMaterial) {
        const product = this.$mx.Dr.$drGetProduct(m.id);
        if (!product) {
            return;
        }
        if (this.$mx.Tool.$wcUIConfig.copyPolicy) {
            return this.$mx.Tool.$wcUIConfig.copyPolicy(product);
        }
        setClipboardData(productToString(product));
    }
}

registerComponent(ApiReaderComponent);
