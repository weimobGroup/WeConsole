import { isEmptyObject } from '@mpkit/util';
import type { MpMaterial, MpProduct } from '@/types/product';
import type { MpDataReaderComponentData } from '@/types/reader';
import { MpDataReaderAction } from '@/types/reader';
import { MpComponentMixin } from 'typescript-mp-component';
import type { MpMaterialCategoryMap } from '@/types/common';
import type { IMpProductController } from '@/types/hook';
import type { MpShowActionSheetOptions } from '@/types/view';

const filterPass = <T extends MpMaterial = MpMaterial>(item: T, keyword: string, ctx: any): boolean => {
    if (ctx.materialFilterPolicy) {
        return ctx.materialFilterPolicy(keyword, item);
    }
    const filterFields: string[] = item.indexs || [];
    return filterFields.some((item) => item === keyword || item.indexOf(keyword) !== -1);
};

export class DataReaderMixin<T extends MpMaterial = MpMaterial> extends MpComponentMixin<MpDataReaderComponentData> {
    $wcProductController: IMpProductController;
    $showActionSheet: (options: MpShowActionSheetOptions) => Promise<number>;
    $showToast: (txt: string) => void;
    $updateData: (data: any, cb?: () => void) => void;
    $forceData: (data: any, cb?: () => void) => void;
    $drFilterKeyword?: string;
    $drMaterialExist?: {
        [prop: string]: string;
    };
    $drNormalMaterialCategoryMap?: MpMaterialCategoryMap<T>;
    $drFilterMaterialCategoryMap?: MpMaterialCategoryMap<T>;
    /** 留存记录 */
    $drKeepSaveMaterials?: {
        [prop: string]: 1;
    };
    /** 标记记录 */
    $drMarkMaterials?: {
        [prop: string]: 1;
    };
    /** 置顶记录ID */
    $drTopMaterials?: string[];
    /** 记录分类 */
    $drMaterialClassifyMap?: {
        [prop: string]: string[];
    };
    $drReaderShowList?: T[];
    $drShowMaterialAction(rowId: string): Promise<[MpDataReaderAction, any?]> {
        if (!this.data.materialActions || !this.data.materialActions.length) {
            return Promise.reject(new Error('请配置materialActions'));
        }
        const row = this.$drNormalMaterialCategoryMap?.all.find((item) => item.id === rowId);
        if (!row) {
            return Promise.reject(new Error(`无法找到${rowId}对应的数据`));
        }
        const isTop = this?.$drTopMaterials && this.$drTopMaterials.some((item) => item === rowId);
        const isMark = this?.$drMarkMaterials && this.$drMarkMaterials[rowId];
        const isKeppSave = this?.$drKeepSaveMaterials && this.$drKeepSaveMaterials[rowId];
        const actions: MpDataReaderAction[] = [];
        const textList = this.data.materialActions.map((item) => {
            const action = typeof item === 'object' ? item.action : item;
            const text = typeof item === 'object' ? item.text : undefined;
            actions.push(action);
            if (text) {
                return typeof text === 'function' ? text(action, rowId, row, this.$drGetProduct(rowId)) : text;
            }
            if (action === MpDataReaderAction.top) {
                return `${isTop ? '取消' : ''}置顶显示`;
            }
            if (action === MpDataReaderAction.mark) {
                return `${isMark ? '取消' : ''}标记`;
            }
            if (action === MpDataReaderAction.keepSave) {
                return `${isKeppSave ? '取消' : ''}留存`;
            }
            if (action === MpDataReaderAction.cancelAllKeepSave) {
                return '取消全部留存';
            }
            if (action === MpDataReaderAction.cancelAllMark) {
                return '取消全部标记';
            }
            if (action === MpDataReaderAction.groupTo) {
                return '分类为...';
            }
            if (action === MpDataReaderAction.copy) {
                return '复制';
            }
            return action;
        });
        return this.$showActionSheet(textList).then((res) => {
            const action = actions[res];
            if (action === MpDataReaderAction.top) {
                if (isTop) {
                    this.$drCancelTopMaterial(rowId);
                } else {
                    this.$drTopMaterial(rowId);
                }
                return [action, isTop];
            }

            if (action === MpDataReaderAction.keepSave) {
                if (isKeppSave) {
                    this.$drCancelKeepSaveMaterial(rowId);
                } else {
                    this.$drKeepSaveMaterial(rowId);
                }
                return [action, isKeppSave];
            }
            if (action === MpDataReaderAction.mark) {
                if (isMark) {
                    this.$drCancelMarkMaterial(rowId);
                } else {
                    this.$drMarkMaterial(rowId);
                }
                return [action, isMark];
            }
            if (action === MpDataReaderAction.cancelAllMark) {
                this.$drCancelMarkMaterial();
                return [action];
            }
            if (action === MpDataReaderAction.cancelAllKeepSave) {
                this.$drCancelKeepSaveMaterial();
                return [action];
            }
            if (action === MpDataReaderAction.copy) {
                (this as any).copyMaterial?.(row);
                return [action];
            }
            this.$showToast(`动作${action}功能待实现`);
            return [action];
        });
    }
    $drPushShowItem(item) {
        if (!this.$drReaderShowList) {
            this.$drReaderShowList = [];
        }
        const index = this.$drReaderShowList.findIndex((t) => t.id === item.id);
        if (index === -1) {
            this.$drReaderShowList.push(item);
        } else {
            this.$drReaderShowList[index] = item;
        }
    }
    $drAddMaterialToCategory(material: T, map?: MpMaterialCategoryMap<T>) {
        if (!this.$drReaderShowList) {
            this.$drReaderShowList = [];
        }
        if (!map) {
            this.$drInitMaterialCategoryMap();
            this.$drAddMaterialToCategory(material, this.$drNormalMaterialCategoryMap);
            const readyItem = this.$drNormalMaterialCategoryMap?.all.find((t) => t.id === material.id);
            const categorys = (material.categorys ? material.categorys : readyItem ? readyItem.categorys : []) || [];
            if (this.$drFilterKeyword) {
                if (filterPass(material, this.$drFilterKeyword, this)) {
                    this.$drAddMaterialToCategory(material, this.$drFilterMaterialCategoryMap);
                    if (categorys.indexOf(this.data.activeCategory) !== -1 || this.data.activeCategory === 'all') {
                        this.$drPushShowItem(material);
                    }
                }
                return;
            }
            delete this.$drFilterMaterialCategoryMap;
            if (categorys.indexOf(this.data.activeCategory) !== -1 || this.data.activeCategory === 'all') {
                this.$drPushShowItem(material);
            }
            return;
        }
        this.$drInitMaterialCategoryMap(false, map);

        const readyItem = map.all ? map.all.find((item) => item.id === material.id) : null;
        if (readyItem) {
            Object.assign(readyItem, material);
        } else {
            map.all.push(material);
        }
        if (material.categorys || readyItem) {
            (material.categorys || readyItem?.categorys || []).forEach((category) => {
                if (!map[category]) {
                    map[category] = [];
                }
                if (map[category].length) {
                    const typeReadyItem = map[category].find((item) => item.id === material.id);
                    if (typeReadyItem) {
                        Object.assign(typeReadyItem, material);
                    } else {
                        map[category].push(material);
                    }
                } else {
                    map[category].push(material);
                }
            });
        }
    }
    $drInitMaterialCategoryMap(clear?: boolean, map?: any) {
        if (!map) {
            if (!this.$drNormalMaterialCategoryMap) {
                this.$drNormalMaterialCategoryMap = {};
            }
            if (!this.$drFilterMaterialCategoryMap) {
                this.$drFilterMaterialCategoryMap = {};
            }
            this.$drInitMaterialCategoryMap(clear, this.$drNormalMaterialCategoryMap);
            this.$drInitMaterialCategoryMap(clear, this.$drFilterMaterialCategoryMap);
            return;
        }
        this.data.categoryList.forEach((item) => {
            if (!map[item.value] || clear) {
                map[item.value] = [];
            }
        });
    }
    $drSyncNormalMaterialToFilter() {
        if (!this.$drNormalMaterialCategoryMap) {
            return;
        }
        this.$drFilterMaterialCategoryMap = Object.keys(this.$drNormalMaterialCategoryMap).reduce((sum, category) => {
            sum[category] = this.$drNormalMaterialCategoryMap?.[category].filter((item) => {
                return filterPass(item, this.$drFilterKeyword || '', this);
            });
            return sum;
        }, {});
    }
    $drFilterMaterial(keyword: string) {
        this.$drFilterKeyword = keyword;
        this.$drInitMaterialCategoryMap();
        this.$drSyncNormalMaterialToFilter();
        if (this.$drFilterKeyword) {
            this.$drReaderShowList = this.$drFilterMaterialCategoryMap?.[this.data.activeCategory] || [];
        } else {
            this.$drReaderShowList = this.$drNormalMaterialCategoryMap?.[this.data.activeCategory] || [];
        }
    }
    $drClearMaterial() {
        // 取消全部置顶
        this.$drCancelTopMaterial();
        // 把标记清空
        this.$drCancelMarkMaterial();

        // 删除缓存中的数据
        if (this.$drReaderShowList?.length) {
            const type = this.$wcProductController.findById(this.$drReaderShowList[0].id)?.type;
            type && this.$wcProductController.clear(type, Object.keys(this.$drKeepSaveMaterials || {}));
        }

        // 将留存的id记录找出
        const keepSaveList =
            (!this.$drKeepSaveMaterials || isEmptyObject(this.$drKeepSaveMaterials)
                ? []
                : this.$drNormalMaterialCategoryMap?.all.filter((item) => this.$drKeepSaveMaterials?.[item.id])) || [];
        // 清空本地map
        this.$drInitMaterialCategoryMap(true);
        // 清空item state
        const itemState = (this as any).$vlItemState;
        delete (this as any).$vlItemState;
        // 将留存的记录重新插入本地map
        keepSaveList.forEach((item) => {
            if (itemState?.[item.id] && (this as any).$vlSaveItemState) {
                (this as any).$vlSaveItemState(item.id, itemState[item.id]);
            }
            (this as any).$drAddMaterialToCategory(item);
        });
        if (this.$drFilterKeyword) {
            this.$drReaderShowList = this.$drFilterMaterialCategoryMap?.[this.data.activeCategory] || [];
        } else {
            this.$drReaderShowList = this.$drNormalMaterialCategoryMap?.[this.data.activeCategory] || [];
        }
    }
    $drChangeCategory(activeCategory) {
        this.$drInitMaterialCategoryMap();
        if (this.data.activeCategory !== activeCategory) {
            this.$updateData({
                activeCategory
            });
        }
        let list: T[];
        if (this.$drFilterKeyword) {
            list = this.$drFilterMaterialCategoryMap?.[activeCategory] || [];
        } else {
            list = this.$drNormalMaterialCategoryMap?.[activeCategory] || [];
        }

        if (activeCategory === 'mark' && this.$drMarkMaterials) {
            list = [];
            Object.keys(this.$drMarkMaterials).forEach((id) => {
                const item = this.$drNormalMaterialCategoryMap?.all.find((it) => it.id === id);
                if (item) {
                    list.push(item);
                }
            });
        }
        this.$drReaderShowList = list;
    }
    $drKeepSaveMaterial(id: string) {
        if (!this.$drKeepSaveMaterials) {
            this.$drKeepSaveMaterials = {};
        }
        this.$drKeepSaveMaterials[id] = 1;
    }
    $drCancelKeepSaveMaterial(id?: string) {
        if (this.$drKeepSaveMaterials) {
            if (id) {
                delete this.$drKeepSaveMaterials[id];
            } else {
                delete this.$drKeepSaveMaterials;
            }
        }
    }
    $drMarkMaterial(id: string) {
        if (!this.$drMarkMaterials) {
            this.$drMarkMaterials = {};
        }
        this.$drMarkMaterials[id] = 1;
        if (this.data.activeCategory === 'mark') {
            this.$drChangeCategory('mark');
        }
    }
    $drCancelMarkMaterial(id?: string) {
        if (this.$drMarkMaterials) {
            if (id) {
                delete this.$drMarkMaterials[id];
            } else {
                delete this.$drMarkMaterials;
            }
            if (this.data.activeCategory === 'mark') {
                this.$drChangeCategory('mark');
            }
        }
    }
    $drTopMaterial(id: string) {
        if (!this.$drTopMaterials) {
            this.$drTopMaterials = [];
        }
        this.$drTopMaterials.unshift(id);
        // 最多置顶3条
        if (this.$drTopMaterials.length > 3) {
            this.$drTopMaterials.length = 3;
        }
    }
    $drCancelTopMaterial(id?: string) {
        if (this.$drTopMaterials) {
            if (id) {
                const index = this.$drTopMaterials.indexOf(id);
                if (index !== -1) {
                    this.$drTopMaterials.splice(index, 1);
                }
            } else {
                delete this.$drTopMaterials;
            }
        }
    }
    $drGetProduct(id: string): MpProduct | undefined {
        return this.$wcProductController.findById(id);
    }
}
