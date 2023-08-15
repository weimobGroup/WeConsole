import { WeComponent } from '../mixins/component';
import { clone, isEmptyObject } from '@mpkit/util';
import { getApiCategoryList } from '../modules/category';
import { convertApiMaterial, productToString } from '../modules/reader';
import ProductControllerMixin from '../mixins/product-controller';
import DataReaderMixin from '../mixins/data-reader';
import EbusMixin from '../mixins/ebus';
import { MpApiReaderComponentData, MpApiReaderComponentSpec } from '../../types/api-reader';
import { MpApiMaterial, MpProduct } from '../../types/product';
import { HookScope } from '../../types/common';
import { computeTime, rpxToPx } from '../modules/util';
import { MpDataReaderAction, MpDataReaderComponentData } from '../../types/reader';
import { ReaderStateController } from '../modules/reader-state';
import { wcScopeSingle } from '../../modules/util';
import { WeConsoleEvents } from '../../types/scope';
import { includeString } from '../modules/json';

const Spec: MpApiReaderComponentSpec = {
    data: {
        categoryList: getApiCategoryList(),
        activeCategory: 'all',
        detailMaterialId: null,
        detailFrom: null,
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
    },
    methods: {
        addMaterial(data) {
            const material = convertApiMaterial(data, this.$wcUIConfig);
            material.categorys && this.refreshCategory(material.categorys);
            this.addMaterialToCategory(material);
            if (this.readerShowList.indexOf(material as MpApiMaterial) !== -1) {
                this.appendDataToGrid(material as MpApiMaterial);
            }
        },
        refreshCategory(categoryVals?: string[]) {
            if (!categoryVals || !categoryVals.length) {
                this.setData({
                    categoryList: getApiCategoryList(this.$wcUIConfig)
                });
                this.ApiStateController.setState('categorys', JSON.parse(JSON.stringify(this.data.categoryList)));
            } else if (this.data.categoryList.some((item) => !categoryVals.find((t) => t === item.value))) {
                const list = getApiCategoryList(this.$wcUIConfig);
                categoryVals.forEach((categoryVal) => {
                    if (list.every((item) => item.value !== categoryVal)) {
                        list.push({
                            name: categoryVal,
                            value: categoryVal
                        });
                    }
                });
                this.setData({
                    categoryList: list
                });
                this.ApiStateController.setState('categorys', JSON.parse(JSON.stringify(this.data.categoryList)));
            }
        },
        reloadVlList(allList) {
            if (this.$DataGridMain) {
                this.$DataGridMain.replaceAllList(allList);
                this.$DataGridMain.reloadAffixList();
            }
        },
        filter(keyword) {
            const kd: string =
                typeof keyword === 'object' && 'detail' in keyword ? keyword.detail : (keyword as string);
            if (kd) {
                this.ApiStateController.setState('filterKeyWord', kd);
            } else {
                this.ApiStateController.removeState('filterKeyWord');
            }
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
            this.ApiStateController.clearProducts();
            this.ApiStateController.removeState('selectedId');
        },
        setDetailMaterial(id?: string, tab?: number, from?: string) {
            this.setData({
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
        },
        clearDetailMaterial() {
            this.setDetailMaterial();
        },
        onCategoryChange(activeCategory) {
            const category: string =
                typeof activeCategory === 'object' && activeCategory && activeCategory.currentTarget
                    ? activeCategory.detail
                    : activeCategory;
            this.changeCategory(category);
            this.reloadVlList(this.readerShowList);
            this.setDetailMaterial();
            this.ApiStateController.setState('activeCategory', category);
        },
        onWcProduct(type: string, data: MpProduct) {
            if (data.type === HookScope.Api || this?.materialExist?.[data.id]) {
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
        },
        syncMarkList() {
            if (this.data.activeCategory === 'mark') {
                this.reloadVlList(this.readerShowList);
            }
        },
        syncAffixList() {
            this.setData({
                affixIds: clone(this.topMaterials || [])
            });
            this.$DataGridMain.reloadAffixList(this.NormalMaterialCategoryMap.all);
        },
        changeDetailTab(e) {
            this.setData({
                detailTab: e.detail
            });
        },
        gridReady(e) {
            this.$DataGridMain = e.detail;
            if (this.dataGridWaitMaterials) {
                this.dataGridWaitMaterials.forEach((item) => {
                    this.$DataGridMain.addItem(item);
                });
                delete this.dataGridWaitMaterials;
            }
            if (this.ApiStateController) {
                const top = this.ApiStateController.getState('scrollTop');
                if (top) {
                    this.$DataGridMain.scrollTo(top);
                }
                this.$DataGridMain.onScroll((top: number) => {
                    this.ApiStateController.setState('scrollTop', top);
                });
            }
        },
        tapGridCell(e) {
            const { rowId } = e.detail;
            if (rowId) {
                this.setDetailMaterial(
                    rowId,
                    null,
                    'tapCell'
                    // col && col.field && col.field === "initiator" ? 3 : 0
                );
            }
        },
        longpressGridRow(e) {
            const { rowId } = e.detail;
            if (rowId) {
                this.setDetailMaterial(rowId, null, 'longpressRow');
                this.showMaterialAction(rowId).then(([action, oldSituation]) => {
                    if (action === MpDataReaderAction.top) {
                        this.ApiStateController.top(rowId, !oldSituation);
                        return this.syncAffixList();
                    }
                    if (action === MpDataReaderAction.mark) {
                        this.ApiStateController.mark(rowId, !oldSituation);
                        return this.syncMarkList();
                    }
                    if (action === MpDataReaderAction.cancelAllMark) {
                        this.ApiStateController.mark(null, false);
                        return this.syncMarkList();
                    }
                    if (action === MpDataReaderAction.keepSave) {
                        this.ApiStateController.keepSave(rowId, !oldSituation);
                        return;
                    }
                    if (action === MpDataReaderAction.cancelAllKeepSave) {
                        this.ApiStateController.keepSave(null, false);
                    }
                });
            }
        },
        materialFilterPolicy(k, item): boolean {
            const product = this.getProduct(item.id);
            if (!product) {
                return false;
            }
            if (includeString(item.name, k) || includeString(item.nameDesc, k)) {
                return true;
            }
            return false;
        },
        copyMaterial(m: MpApiMaterial) {
            const product = this.getProduct(m.id);
            if (!product) {
                return;
            }
            if (this?.$wcUIConfig.copyPolicy) {
                return this.$wcUIConfig.copyPolicy(product);
            }
            wx.setClipboardData({
                data: productToString(product)
            });
        },
        syncGridPageSize() {
            const grid = this.selectComponent('.fc-reader-body');
            if (grid) {
                Promise.all([rpxToPx(40), grid.$getBoundingClientRect('.fc-datagrid-scroll')]).then(
                    ([itemHeight, { height }]) => {
                        this.setData({
                            gridPageSize: Math.ceil(height / itemHeight)
                        });
                    }
                );
            }
        }
    },
    created() {
        setTimeout(() => {
            this.refreshCategory();
        }, 400);
        this.ApiStateController = wcScopeSingle('ApiStateController') as ReaderStateController;
        this.$wcOn(WeConsoleEvents.WcMainComponentSizeChange, () => {
            this.syncGridPageSize();
        });
    },
    attached() {
        if (this.$wcProductController) {
            const idList = this.ApiStateController.getProductIdList();
            const activeCategory = this.ApiStateController.getState('activeCategory');
            // const filterKeyWord = this.ApiStateController.getState('filterKeyWord');
            const categorys = this.ApiStateController.getState('categorys');
            const selectedId = this.ApiStateController.getState('selectedId');
            const selectedIdFrom = this.ApiStateController.getState('selectedIdFrom');
            // if (filterKeyWord) {
            //     this.filterKeyword = filterKeyWord;
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
            this.keepSaveMaterials = this.ApiStateController.keepSave().reduce((sum, item) => {
                sum[item] = 1;
                return sum;
            }, {});
            this.topMaterials = this.ApiStateController.top().concat([]);
            this.markMaterials = this.ApiStateController.mark().reduce((sum, item) => {
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
            if (activeCategory) {
                setTimeout(() => {
                    this.onCategoryChange(activeCategory);
                });
            }
        }
        this.syncGridPageSize();
    }
};
WeComponent(ProductControllerMixin, EbusMixin, DataReaderMixin, Spec);
