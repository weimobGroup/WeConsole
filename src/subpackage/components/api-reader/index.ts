import { registerComponent } from '@/sub/mixins/component';
import { VirtualListMixin } from '@/sub/mixins/virtual-list';
import { DataReaderMixin } from '@/sub/mixins/data-reader';

import { clone, isEmptyObject } from '@mpkit/util';
import { getApiCategoryList } from '@/sub/modules/category';
import { convertApiMaterial, productToString } from '@/sub/modules/reader';
import type { MpApiReaderComponentData } from '@/types/api-reader';
import type { MpApiMaterial, MpProduct } from '@/types/product';
import { HookScope } from '@/types/common';
import { computeTime, rpxToPx } from '@/sub/modules/util';
import type { MpDataReaderComponentData } from '@/types/reader';
import { MpDataReaderAction } from '@/types/reader';
import { WeConsoleEvents } from '@/types/scope';
import { includeString } from '@/sub/modules/json';
import { ApiStateController } from '@/main/modules/state-controller';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import type { ReaderStateController } from '@/main/modules/reader-state';
import type { MpDataGridComponentExports } from '@/types/data-grid';
import type { DataGrid } from '@/sub/components/data-grid/index';

type Data = MpApiReaderComponentData & Partial<MpDataReaderComponentData>;

class ApiReaderComponent extends MpComponent {
    ApiStateController: ReaderStateController;
    $DataGridMain?: MpDataGridComponentExports<MpApiMaterial>;
    dataGridWaitMaterials?: MpApiMaterial[];
    $mx = {
        Tool: new ToolMixin(),
        Dr: new DataReaderMixin<MpApiMaterial>(),
        Vl: new VirtualListMixin<MpApiMaterial>()
    };
    initData: Data = {
        categoryList: getApiCategoryList(),
        activeCategory: 'all',
        materialActions: [
            MpDataReaderAction.copy,
            MpDataReaderAction.top,
            MpDataReaderAction.keepSave,
            MpDataReaderAction.cancelAllKeepSave,
            MpDataReaderAction.mark,
            MpDataReaderAction.cancelAllMark
        ],
        affixIds: [],
        gridPageSize: 20,
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
                field: 'categorys',
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
        setTimeout(() => {
            this.refreshCategory();
        }, 400);
        this.ApiStateController = ApiStateController;
        this.$mx.Tool.$wcOn(WeConsoleEvents.WcMainComponentSizeChange, () => {
            this.syncGridPageSize();
        });
    }
    attached() {
        if (this.$mx.Tool.$wcProductController) {
            const idList = this.ApiStateController.getProductIdList();
            const activeCategory = this.ApiStateController.getState('activeCategory');
            // const filterKeyWord = this.ApiStateController.getState('filterKeyWord');
            const categorys = this.ApiStateController.getState('categorys');
            const selectedId = this.ApiStateController.getState('selectedId');
            const selectedIdFrom = this.ApiStateController.getState('selectedIdFrom');
            // if (filterKeyWord) {
            //     this.$mx.Dr.$drFilterKeyword = filterKeyWord;
            // }

            const reanderData: Partial<MpApiReaderComponentData & MpDataReaderComponentData> = {};
            if (categorys?.length) {
                reanderData.categoryList = categorys;
            }
            if (selectedId) {
                reanderData.detailMaterialId = selectedId;
            }
            if (selectedIdFrom) {
                reanderData.detailFrom = selectedIdFrom;
            }
            this.$mx.Dr.$drKeepSaveMaterials = this.ApiStateController.keepSave().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            this.$mx.Dr.$drTopMaterials = this.ApiStateController.top().concat([]);
            this.$mx.Dr.$drMarkMaterials = this.ApiStateController.mark().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            if (!isEmptyObject(reanderData)) {
                this.$mx.Tool.$updateData({
                    reanderData
                });
            }
            const products = this.$mx.Tool.$wcProductController.getList(HookScope.Api, (item) =>
                idList.some((id) => id === item.id)
            );
            products.forEach((item) => {
                this.addMaterial(item);
            });
            if (activeCategory) {
                setTimeout(() => {
                    this.onCategoryChange(activeCategory);
                });
            }
        }
        this.syncGridPageSize();
    }

    addMaterial(data) {
        const material = convertApiMaterial(data, this.$mx.Tool.$wcUIConfig) as MpApiMaterial;
        material.categorys && this.refreshCategory(material.categorys);
        this.$mx.Dr.$drAddMaterialToCategory(material);
        if (this.$mx.Dr.$drReaderShowList?.includes(material)) {
            this.appendDataToGrid(material);
        }
    }
    refreshCategory(categoryVals?: string[]) {
        if (!categoryVals || !categoryVals.length) {
            this.$mx.Tool.$updateData({
                categoryList: getApiCategoryList(this.$mx.Tool.$wcUIConfig)
            });
            this.ApiStateController.setState('categorys', JSON.parse(JSON.stringify(this.data.categoryList)));
        } else if (this.data.categoryList.some((item) => !categoryVals.find((t) => t === item.value))) {
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
    reloadVlList(allList) {
        if (this.$DataGridMain) {
            this.$DataGridMain.replaceAllList(allList);
            this.$DataGridMain.reloadAffixList();
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
        this.reloadVlList(this.$mx.Dr.$drReaderShowList);
    }
    clear() {
        // 清空DataGrid操作缓存
        delete this.dataGridWaitMaterials;
        this.$mx.Dr.$drClearMaterial();
        this.syncAffixList();
        this.reloadVlList(this.$mx.Dr.$drReaderShowList);
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
    onCategoryChange(activeCategory) {
        const category: string =
            typeof activeCategory === 'object' && activeCategory && activeCategory.currentTarget
                ? activeCategory.detail
                : activeCategory;
        this.$mx.Dr.$drChangeCategory(category);
        this.reloadVlList(this.$mx.Dr.$drReaderShowList);
        this.setDetailMaterial();
        this.ApiStateController.setState('activeCategory', category);
    }
    onWcProduct(type: string, data: MpProduct) {
        if (data.type === HookScope.Api || this.$mx.Dr.$drMaterialExist?.[data.id]) {
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
    appendDataToGrid(material) {
        if (material.endTime && material.startTime) {
            material.time = computeTime(material.endTime - material.startTime);
        }
        if (this.$DataGridMain) {
            this.$DataGridMain.addItem(material);
            return;
        }
        if (!this.dataGridWaitMaterials) {
            this.dataGridWaitMaterials = [];
        }
        this.dataGridWaitMaterials.push(material);
    }
    syncMarkList() {
        if (this.data.activeCategory === 'mark') {
            this.reloadVlList(this.$mx.Dr.$drReaderShowList);
        }
    }
    syncAffixList() {
        this.$mx.Tool.$updateData({
            affixIds: clone(this.$mx.Dr.$drTopMaterials || [])
        });
        this.$DataGridMain?.reloadAffixList(this.$mx.Dr.$drNormalMaterialCategoryMap?.all);
    }
    changeDetailTab(e) {
        this.$mx.Tool.$updateData({
            detailTab: e.detail
        });
    }
    gridReady(e) {
        this.$DataGridMain = e.detail;
        if (this.dataGridWaitMaterials) {
            this.dataGridWaitMaterials.forEach((item) => {
                this.$DataGridMain?.addItem(item);
            });
            delete this.dataGridWaitMaterials;
        }
        if (this.ApiStateController) {
            const top = this.ApiStateController.getState('scrollTop');
            if (top) {
                this.$DataGridMain?.scrollTo?.(top);
            }
            this.$DataGridMain?.onScroll?.((top: number) => {
                this.ApiStateController.setState('scrollTop', top);
            });
        }
    }
    tapGridCell(e) {
        const { rowId } = e.detail;
        if (rowId) {
            this.setDetailMaterial(
                rowId,
                undefined,
                'tapCell'
                // col && col.field && col.field === "initiator" ? 3 : 0
            );
        }
    }
    longpressGridRow(e) {
        const { rowId } = e.detail;
        if (rowId) {
            this.setDetailMaterial(rowId, undefined, 'longpressRow');
            this.$mx.Dr.$drShowMaterialAction(rowId).then(([action, oldSituation]) => {
                if (action === MpDataReaderAction.top) {
                    this.ApiStateController.top(rowId, !oldSituation);
                    return this.syncAffixList();
                }
                if (action === MpDataReaderAction.mark) {
                    this.ApiStateController.mark(rowId, !oldSituation);
                    return this.syncMarkList();
                }
                if (action === MpDataReaderAction.cancelAllMark) {
                    this.ApiStateController.mark(undefined, false);
                    return this.syncMarkList();
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
    copyMaterial(m: MpApiMaterial) {
        const product = this.$mx.Dr.$drGetProduct(m.id);
        if (!product) {
            return;
        }
        if (this.$mx.Tool.$wcUIConfig.copyPolicy) {
            return this.$mx.Tool.$wcUIConfig.copyPolicy(product);
        }
        wx.setClipboardData({
            data: productToString(product)
        });
    }
    syncGridPageSize() {
        const grid = this.selectComponent('.fc-reader-body') as DataGrid;
        if (grid) {
            Promise.all([rpxToPx(40), grid.$mx.Tool.$getBoundingClientRect('.fc-datagrid-scroll')]).then(
                ([itemHeight, { height }]) => {
                    this.$mx.Tool.$updateData({
                        gridPageSize: Math.ceil(height / itemHeight)
                    });
                }
            );
        }
    }
}

registerComponent(ApiReaderComponent);
